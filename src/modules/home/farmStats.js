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
import { sumLoadsBushels, buildGuaranteeProgress } from "../../core/agriscale.js";

export const PRI_ORDER = { high: 0, medium: 1, low: 2 };

// Same "default farm uses the unscoped legacy path" convention every module
// already follows (apBase/flBase in AgriPlan, FIELD_BASE in AgriScale, BASE in
// FieldLog) — ServiceLog is the one exception, it's tenant-wide, not per-farm.
export function moduleBase(mod, tenantId, farmId) {
  if (mod === "serviceLog") return `tenants/${tenantId}/serviceLog`;
  return (!farmId || farmId === "default")
    ? `tenants/${tenantId}/${mod}`
    : `tenants/${tenantId}/farms/${farmId}/${mod}`;
}

export function fetchFarmSnapshot(tenantId, token, farmId, enabledModules, year) {
  const has = m => enabledModules.includes(m);
  return Promise.all([
    has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fields/${year}`, token).catch(() => null)      : Promise.resolve(null),
    has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fieldHistory`, token).catch(() => null)        : Promise.resolve(null),
    has("fieldlog")   ? dbRead(moduleBase("fieldlog", tenantId, farmId), token).catch(() => null)                          : Promise.resolve(null),
    has("agriScale")  ? dbRead(`${moduleBase("agriScale", tenantId, farmId)}/fields`, token).catch(() => null)             : Promise.resolve(null),
    has("serviceLog") ? dbRead(moduleBase("serviceLog", tenantId, farmId), token).catch(() => null)                        : Promise.resolve(null),
  ]).then(([apFields, apHistory, flData, asFields, slData]) => ({ apFields, apHistory, flData, asFields, slData }));
}

export function computeFarmStats(d, year) {
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

  const flFields = obj2arr(d.flData?.fields);
  const flActivities = obj2arr(d.flData?.activities).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentActs = flActivities.slice(0, 6);
  const activitiesThisWeek = flActivities.filter(a => a.date && (Date.now() - new Date(a.date).getTime()) < 7 * 86400000).length;
  const flAcres = flFields.reduce((s, f) => s + (parseFloat(f.acres) || 0), 0);

  const asFieldsArr = obj2arr(d.asFields);
  const seasonBushels = asFieldsArr.reduce((s, f) => s + sumLoadsBushels(f.loads || []), 0);
  const loadsThisWeek = asFieldsArr.reduce((s, f) => s + (f.loads || []).filter(l => l?.ts && (Date.now() - l.ts) < 7 * 86400000).length, 0);

  // Bushels logged so far vs. guarantee bushels, by insurance unit — same
  // shared calc AgriScale's own Report tab uses (core/agriscale.js), so the
  // numbers never drift between the two screens. Home only needs the count
  // and the "any unit behind pace" flag for its summary card; the full
  // per-unit breakdown (with the required disclaimer) lives in AgriScale.
  const guaranteeProgress = buildGuaranteeProgress(asFieldsArr);

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

  return {
    apFieldsArr, apAcres, revenueProjected, guarantee, actualBushels, actualRevenue, fieldsWithActuals,
    actualExpensesTotal, fieldsWithActualExpenses, actualNet,
    flFields, flActivities, recentActs, activitiesThisWeek, flAcres,
    asFieldsArr, seasonBushels, loadsThisWeek, guaranteeProgress,
    slVehicles, openTodos, partsNeeded, lowStockItems,
    acres: apAcres || flAcres,
    fieldCount: apFieldsArr.length || flFields.length,
  };
}
