// Pure helpers for turning AgriScale weigh-ticket loads into bushel totals —
// extracted so the AgriScale → AgriPlan/FieldLog harvest export math is
// covered by a regression test instead of only living inline in a modal.
//
// A load's weight lives in `net` (lbs) and its bushel weight in
// `grainBushelLbs` — NOT `lbs`/`grain.lbsPerBu`, which don't exist on these
// objects and previously made every export silently compute 0 bushels.

export function sumLoadsBushels(loads) {
  return (loads || []).reduce(
    (s, l) => s + (parseFloat(l?.net) || 0) / (parseFloat(l?.grainBushelLbs) || 60),
    0
  );
}

export function sumLoadsLbs(loads) {
  return (loads || []).reduce((s, l) => s + (parseFloat(l?.net) || 0), 0);
}

// Loads carry a real timestamp (`ts`, ms since epoch) alongside a
// display-only `date` string like "Wed, Jul 29" (no year — not safe to sort
// or parse). This returns the most recent load's date as an ISO yyyy-mm-dd,
// or today if there are no loads/timestamps.
export function lastLoadDateISO(loads) {
  const timestamps = (loads || []).map(l => l?.ts || 0).filter(Boolean);
  const lastTs = timestamps.length ? Math.max(...timestamps) : 0;
  return lastTs ? new Date(lastTs).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

// ── Guarantee progress by Insurance Unit — bushels logged so far vs. each
// unit's guarantee bushels (a field's Guaranteed Yield bu/ac × that unit's
// acres, both entered on the field in AgriScale's Edit Field modal). Shared
// between AgriScale's own Report tab and Home's summary card (home/farmStats.js)
// so the two never drift apart.
//
// This is a plain arithmetic comparison against what's been typed into Agri
// Logix — it does NOT know a policy's full terms, its actual unit structure
// at the insurer, or adjuster-verified yields, and it is never a stand-in for
// a real claim determination. Any UI built on this MUST say so prominently,
// not just in a tooltip. Units with no Guaranteed Yield entered on any of
// their fields are left out entirely rather than shown as a fabricated 0%.
export function buildGuaranteeProgress(fields) {
  const units = {};
  (fields || []).forEach(field => {
    const guarYield = parseFloat(field.insGuaranteedYield) || 0;
    (field.insuranceUnits || []).forEach(u => {
      if (typeof u === "string" || !u?.name) return;
      const acres = parseFloat(u.acres) || 0;
      if (acres <= 0) return;
      if (!units[u.name]) units[u.name] = { unit: u.name, guaranteeBu: 0, hasGuarantee: false, harvestedBu: 0 };
      units[u.name].guaranteeBu += acres * guarYield;
      if (guarYield > 0) units[u.name].hasGuarantee = true;
    });
  });
  (fields || []).forEach(field => {
    (field.loads || []).filter(Boolean).forEach(load => {
      const unit = (load.insuranceUnit && load.insuranceUnit !== "none") ? load.insuranceUnit : null;
      if (!unit || !units[unit]) return;
      units[unit].harvestedBu += (parseFloat(load.net) || 0) / (parseFloat(load.grainBushelLbs) || 60);
    });
  });
  return Object.values(units)
    .filter(u => u.hasGuarantee && u.guaranteeBu > 0)
    .map(u => ({ ...u, pct: (u.harvestedBu / u.guaranteeBu) * 100 }))
    .sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true, sensitivity: "base" }));
}
