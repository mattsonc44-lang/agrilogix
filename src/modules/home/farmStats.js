// ── Shared per-farm data fetch + stat computation ───────────────────────────
// Extracted from HomeModule so the same math can also power a side-by-side
// multi-farm view (modules/multiFarm) without drifting out of sync. Deliberately
// does NOT reimplement AgriPlan's expense-rate engine (crop defaults + field
// overrides) — that math lives in one place (agriPlan/index.jsx). Revenue/
// guarantee here are the same simple per-field formulas AgriPlan itself uses
// (bushels × price × acres), so they stay correct with zero duplication of the
// expense table.
import { dbRead } from "../../core/firebase.js";
import { obj2arr } from "../../core/helpers.js";
import { sumLoadsBushels, buildGuaranteeProgress, buildBinSummary, contractDeliveryStatus } from "../../core/agriscale.js";
import { findDueReminders } from "../../core/maintenance.js";
import { findActivePlantbackRestrictions } from "../../core/fieldlog.js";

export const PRI_ORDER = { high: 0, medium: 1, low: 2 };

// Same "default farm uses the unscoped legacy path" convention every module
// already follows (apBase/flBase in AgriPlan, BASE in FieldLog) — ServiceLog
// is tenant-wide, not per-farm. AgriScale is ALSO tenant-wide despite having
// its own multi-farm support: unlike the others it never splits its Firebase
// path by farm (its own BASE is unconditionally tenants/{tid}/agriScale —
// see agriScale/index.jsx), separating farms client-side instead by filtering
// each field/bin/contract record's own `farmId` property. Using the
// farm-segmented URL formula for agriScale here would silently return
// nothing for any non-default farm, so it's called out as its own case
// rather than falling into the generic branch below.
export function moduleBase(mod, tenantId, farmId) {
  if (mod === "serviceLog" || mod === "agriScale") return `tenants/${tenantId}/${mod}`;
  return (!farmId || farmId === "default")
    ? `tenants/${tenantId}/${mod}`
    : `tenants/${tenantId}/farms/${farmId}/${mod}`;
}

// AgriScale field/bin/contract records carry their own `farmId` and are
// filtered client-side, mirroring the exact predicates agriScale/index.jsx
// itself uses for each record type (bins allow a "shared" farmId visible
// everywhere; fields/contracts require an exact match or unset+"default").
function inFarm(farmId) {
  const isDefault = !farmId || farmId === "default";
  return {
    field: f => isDefault ? (!f.farmId || f.farmId === "default") : f.farmId === farmId,
    bin: b => isDefault ? (!b.farmId || b.farmId === "default" || b.farmId === "shared") : (b.farmId === farmId || b.farmId === "shared"),
  };
}

export function fetchFarmSnapshot(tenantId, token, farmId, enabledModules, year) {
  const has = m => enabledModules.includes(m);
  return Promise.all([
    has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fields/${year}`, token).catch(() => null)      : Promise.resolve(null),
    has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fieldHistory`, token).catch(() => null)        : Promise.resolve(null),
    has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/budgetAlerts/${year}`, token).catch(() => null): Promise.resolve(null),
    has("fieldlog")   ? dbRead(moduleBase("fieldlog", tenantId, farmId), token).catch(() => null)                          : Promise.resolve(null),
    has("agriScale")  ? dbRead(moduleBase("agriScale", tenantId, farmId), token).catch(() => null)                         : Promise.resolve(null),
    has("serviceLog") ? dbRead(moduleBase("serviceLog", tenantId, farmId), token).catch(() => null)                        : Promise.resolve(null),
    // fieldRestrictions is tenant-wide (no farm segment at all — see the
    // comment on writeChemRestrictions in fieldlog/index.jsx), so it's read
    // unconditionally regardless of enabled modules being fieldlog-specific;
    // gate on fieldlog being enabled anyway since it's meaningless without it.
    has("fieldlog")   ? dbRead(`tenants/${tenantId}/fieldRestrictions`, token).catch(() => null)                           : Promise.resolve(null),
  ]).then(([apFields, apHistory, apBudgetAlerts, flData, asData, slData, fieldRestrictions]) =>
    ({ apFields, apHistory, apBudgetAlerts, flData, asData, slData, fieldRestrictions }));
}

export function computeFarmStats(d, year, farmId) {
  const { field: fieldInFarm, bin: binInFarm } = inFarm(farmId);
  const apFieldsArr = obj2arr(d.apFields);
  const apAcres = apFieldsArr.reduce((s, f) => s + (parseFloat(f.acres) || 0), 0);
  const revenueProjected = apFieldsArr.reduce((s, f) => s + ((f.income?.bushelProjection || 0) * (f.income?.currentPrice || 0) * (parseFloat(f.acres) || 0)), 0);
  const guarantee = apFieldsArr.reduce((s, f) => s + ((f.income?.bushelGuarantee || 0) * (f.income?.priceGuarantee || 0) * (parseFloat(f.acres) || 0)), 0);
  let actualBushels = 0, actualRevenue = 0, fieldsWithActuals = 0;
  apFieldsArr.forEach(f => {
    const act = (d.apHistory || {})[f.common]?.[year];
    const bu = parseFloat(act?.bushels) || 0;
    if (bu > 0) {
      actualBushels += bu;
      fieldsWithActuals++;
      if (f.income?.currentPrice) actualRevenue += bu * f.income.currentPrice;
    }
  });

  // Real $ actually spent this year, by field (field.actualExpenses — see
  // agriPlan/index.jsx calcActual). Lets Home show actual NET (not just
  // projected) once both sides have real numbers entered.
  let actualExpensesTotal = 0, fieldsWithActualExpenses = 0;
  apFieldsArr.forEach(f => {
    const ae = f.actualExpenses;
    if (!ae || typeof ae !== "object") return;
    const entries = Object.values(ae).filter(v => v !== undefined && v !== null && v !== "" && !isNaN(v));
    if (entries.length === 0) return;
    actualExpensesTotal += entries.reduce((s, v) => s + (+v || 0), 0);
    fieldsWithActualExpenses++;
  });
  const actualNet = (fieldsWithActuals > 0 && fieldsWithActualExpenses > 0) ? (actualRevenue - actualExpensesTotal) : null;

  // Chemicals at or below their reorder point (set in FieldLog's Products
  // Library, decremented automatically as spray activities get logged) —
  // read straight off the same flData snapshot fetched above, since
  // products lives under FieldLog's own module base, no separate mirror needed.
  const lowStockChems = obj2arr(d.flData?.products?.chemicals)
    .filter(c => c.onHand !== "" && c.onHand != null && c.reorderPoint !== "" && c.reorderPoint != null && Number(c.onHand) <= Number(c.reorderPoint));

  const flFields = obj2arr(d.flData?.fields);
  const flActivities = obj2arr(d.flData?.activities).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentActs = flActivities.slice(0, 6);
  const activitiesThisWeek = flActivities.filter(a => a.date && (Date.now() - new Date(a.date).getTime()) < 7 * 86400000).length;
  const flAcres = flFields.reduce((s, f) => s + (parseFloat(f.acres) || 0), 0);

  // AgriScale never splits its Firebase path by farm (see moduleBase's
  // comment above) — fields/bins/contracts all come back from one shared
  // node and get filtered here by each record's own farmId, the same
  // predicates agriScale/index.jsx itself applies. Grains (commodity
  // definitions) aren't farm-scoped anywhere in the app, so they're used as-is.
  const asFieldsArr = obj2arr(d.asData?.fields).filter(fieldInFarm);
  const asBinsArr = obj2arr(d.asData?.bins).filter(binInFarm);
  const asContractsArr = obj2arr(d.asData?.contracts).filter(fieldInFarm);
  const asGrainsArr = obj2arr(d.asData?.grains);
  const seasonBushels = asFieldsArr.reduce((s, f) => s + sumLoadsBushels(f.loads || []), 0);
  const loadsThisWeek = asFieldsArr.reduce((s, f) => s + (f.loads || []).filter(l => l?.ts && (Date.now() - l.ts) < 7 * 86400000).length, 0);

  // Bushels logged so far vs. guarantee bushels, by insurance unit — same
  // shared calc AgriScale's own Report tab uses (core/agriscale.js), so the
  // numbers never drift between the two screens. Home only needs the count
  // and the "any unit behind pace" flag for its summary card; the full
  // per-unit breakdown (with the required disclaimer) lives in AgriScale.
  const guaranteeProgress = buildGuaranteeProgress(asFieldsArr);

  // Live per-bin fullness — same shared calc AgriScale's printable bin report
  // uses (core/agriscale.js), so a bin flagged here matches what you'd see if
  // you opened AgriScale and looked. Thresholds are Home-feed-specific (not
  // asserted anywhere else in the app): 95%+ is flagged red (at/near capacity,
  // worth planning a haul-off before the next load), 80-94% amber (filling up).
  const binsNearFull = buildBinSummary(asFieldsArr, asBinsArr, asGrainsArr)
    .filter(b => b.pctFull >= 80)
    .sort((a, b) => b.pctFull - a.pctFull);

  // Grain marketing contracts with a delivery window inside 14 days or
  // already past it — same shared calc AgriScale's MARKET tab uses
  // (core/agriscale.js), so the pill you'd see there matches this feed.
  const contractsDue = asContractsArr
    .map(c => ({ c, ds: contractDeliveryStatus(c.delivery) }))
    .filter(({ ds }) => ds.status === "overdue" || ds.status === "soon");

  // Chemical plantback restrictions still in effect right now, on any field —
  // see core/fieldlog.js for why this differs from AgriPlan's own
  // getPlantbackWarnings (which needs a specific candidate crop; this doesn't).
  const activePlantback = findActivePlantbackRestrictions(d.fieldRestrictions);

  // Farm-wide budget-overrun summary, mirrored over by AgriPlan itself (see
  // agriPlan/index.jsx's overBudgetAll) since the underlying expense-rate
  // engine (crop defaults, tenant overrides) only fully exists there —
  // duplicating it here would drift. `null` until AgriPlan has mirrored at
  // least once (e.g. brand-new tenant, or AgriPlan never opened this year).
  const budgetAlerts = d.apBudgetAlerts || null;

  const slVehicles = obj2arr(d.slData?.vehicles);
  const openTodos = slVehicles
    .flatMap(v => (v.todos || []).filter(t => !t.done).map(t => ({ ...t, vehicleName: v.name })))
    .sort((a, b) => (PRI_ORDER[a.priority || "medium"] ?? 1) - (PRI_ORDER[b.priority || "medium"] ?? 1));
  const partsNeeded = obj2arr(d.slData?.partsToOrder).filter(p => !p.ordered && !p.received).length;

  // Parts Inventory items the user opted into low-stock alerts for (see
  // serviceLog/index.jsx's "stock it? notify me?" prompt), currently at or
  // below their set threshold.
  const lowStockItems = obj2arr(d.slData?.partsInventory)
    .filter(p => p.notifyLowStock && p.qty !== "" && p.minQty !== "" && Number(p.qty) <= Number(p.minQty));

  // Optional, self-configured per-vehicle maintenance reminders (interval
  // hours and/or months, set on the vehicle in ServiceLog) — same shared
  // due-check core/agriscale.js's other Home cards use, so this never drifts
  // from what ServiceLog's own fleet view shows.
  const dueMaintenance = findDueReminders(slVehicles);

  // ── Unified needs-attention feed — every alert type above, in one list,
  // so nothing requires knowing which module to go check. Two severities
  // only (matching what each source already used on its own screen): danger
  // for things that are already overdue/over/short, warning for things
  // approaching that threshold. Sorted danger-first, feed callers can slice.
  const needsAttention = [
    ...openTodos.map(t => ({
      id: `todo-${t.id}`, icon: "☑️", title: t.text, sub: `ServiceLog · ${t.vehicleName}`,
      severity: t.priority === "high" ? "danger" : t.priority === "low" ? "ok" : "warning",
      module: "serviceLog", tab: "todos",
    })),
    ...dueMaintenance.map(m => ({
      id: `maint-${m.vehicleId}-${m.reminder.id}`, icon: "🔧",
      title: `${m.vehicleName} — ${m.reminder.label || "service"} due`, sub: "ServiceLog · Fleet",
      severity: "danger", module: "serviceLog", tab: "fleet",
    })),
    ...lowStockItems.map(p => ({
      id: `stock-${p.id}`, icon: "🔩", title: `${p.name} — low stock (${p.qty} left)`, sub: "ServiceLog · Parts",
      severity: "danger", module: "serviceLog", tab: "parts",
    })),
    ...contractsDue.map(({ c, ds }) => ({
      id: `contract-${c.id}`, icon: "📄",
      title: `${c.crop} contract — ${c.buyer || "buyer"} ${ds.status === "overdue" ? `${Math.abs(ds.daysUntil)}d overdue` : ds.daysUntil === 0 ? "due today" : `${ds.daysUntil}d left`}`,
      sub: "AgriScale · Contracts", severity: ds.status === "overdue" ? "danger" : "warning",
      module: "agriScale", tab: "MARKET",
    })),
    ...binsNearFull.map(b => ({
      id: `bin-${b.id}`, icon: "🏗️", title: `${b.name} — ${Math.round(b.pctFull)}% full`, sub: "AgriScale · Bins",
      severity: b.pctFull >= 95 ? "danger" : "warning", module: "agriScale", tab: "BINS",
    })),
    ...activePlantback.map((r, i) => ({
      id: `plantback-${i}`, icon: "💧",
      title: `${r.chemName} applied ${r.fieldName ? `on ${r.fieldName}` : ""} — ${r.crop} restricted ${r.daysRemaining}d more`,
      sub: "FieldLog · Plantback", severity: "warning", module: "fieldlog", tab: null,
    })),
    ...lowStockChems.map(c => ({
      id: `chem-stock-${c.id}`, icon: "🧪", title: `${c.name || "Chemical"} — low stock (${c.onHand}${c.invUnit ? ` ${c.invUnit}` : ""} left)`,
      sub: "FieldLog · Products", severity: "danger", module: "fieldlog", tab: null,
    })),
    ...(budgetAlerts && budgetAlerts.count > 0 ? [{
      id: "budget-overrun", icon: "📊",
      title: `${budgetAlerts.count} field${budgetAlerts.count !== 1 ? "s" : ""} over budget${budgetAlerts.top?.[0]?.common ? ` — ${budgetAlerts.top[0].common}${budgetAlerts.count > 1 ? " + more" : ""}` : ""}`,
      sub: "AgriPlan · Expenses", severity: "danger", module: "agriPlan", tab: "expenses",
    }] : []),
  ].sort((a, b) => (a.severity === "danger" ? 0 : 1) - (b.severity === "danger" ? 0 : 1));

  return {
    apFieldsArr, apAcres, revenueProjected, guarantee, actualBushels, actualRevenue, fieldsWithActuals,
    actualExpensesTotal, fieldsWithActualExpenses, actualNet, budgetAlerts,
    flFields, flActivities, recentActs, activitiesThisWeek, flAcres,
    asFieldsArr, asBinsArr, asContractsArr, seasonBushels, loadsThisWeek, guaranteeProgress, binsNearFull, contractsDue, activePlantback,
    slVehicles, openTodos, partsNeeded, lowStockItems, lowStockChems, dueMaintenance, needsAttention,
    acres: apAcres || flAcres,
    fieldCount: apFieldsArr.length || flFields.length,
  };
}
