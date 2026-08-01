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

// ── Crop-mismatch check — a bin should hold one grain at a time. Given a
// target bin and the grain about to be recorded into it, checks what's
// actually already been recorded into that bin (same load-history signal
// buildBinSummary's crop label is derived from) and flags a mismatch rather
// than silently mixing grains together. Falls back to the bin's assigned
// grain only when there's no load history yet but the bin already shows
// stored weight (e.g. grain that predates AgriScale tracking) — a bin with
// no history and no stored weight never flags a mismatch.
//
// `excludeLoadId` leaves a load's own prior entry out of the "already in the
// bin" set — used when editing an existing load so correcting the only load
// in a bin (e.g. fixing a typo'd grain) doesn't flag itself as a mismatch.
export function detectCropMismatch(fields, bins, binId, newGrainName, excludeLoadId = null) {
  const bin = (bins || []).find(b => b.id === binId);
  if (!bin) return null;
  // Track whether the bin has ANY tracked load history separately from the
  // (possibly exclusion-filtered) `existing` set — a bin with exactly one
  // load, which is the one being edited right now, still counts as "has
  // history" and must NOT fall through to the stale bin.grainName fallback
  // just because excluding it leaves nothing to compare against.
  let hasAnyLoadHistory = false;
  const existing = new Set();
  (fields || []).forEach(f => (f.loads || []).forEach(l => {
    if (l.binId !== binId || !l.grainName) return;
    hasAnyLoadHistory = true;
    if (l.id !== excludeLoadId) existing.add(l.grainName);
  }));
  if (!hasAnyLoadHistory && bin.storedLbs > 0 && bin.grainName) existing.add(bin.grainName);
  if (existing.size > 0 && !existing.has(newGrainName)) return { binName: bin.name, existing: [...existing].join(", ") };
  return null;
}

// ── Bin summary for the Report tab / printable report — grouped by which
// bin each load's binId points to. The displayed crop is derived from the
// grain(s) actually recorded into the bin, NOT bin.grainName: that field is
// only set once, when a bin is created or hand-edited in Edit Bin, and
// recording a load never touches it — so it silently goes stale the moment
// a different crop gets dumped into a bin that was last labeled for
// something else. A bin with loads of more than one grain in it shows both
// (joined with " + ") rather than picking one and hiding the mix.
export function buildBinSummary(fields, bins, grains) {
  const grainFor = (name) => (grains || []).find(g => g.name === name) || { name: "WHEAT", bushel_lbs: 60 };
  const buOf = (load) => (parseFloat(load.net) || 0) / (grainFor(load.grainName).bushel_lbs || 60);
  return (bins || []).map(bin => {
    const loadsInBin = [];
    (fields || []).forEach(field => (field.loads || []).filter(Boolean).forEach(load => {
      if (load.binId === bin.id) loadsInBin.push({ ...load, fieldName: field.name });
    }));
    const totLbs = loadsInBin.reduce((s, l) => s + (parseFloat(l.net) || 0), 0);
    const totBu = loadsInBin.reduce((s, l) => s + buOf(l), 0);
    const grainTotals = {};
    loadsInBin.forEach(l => { const g = l.grainName || "Unknown"; grainTotals[g] = (grainTotals[g] || 0) + buOf(l); });
    const grainsPresent = Object.entries(grainTotals).sort((a, b) => b[1] - a[1]).map(([name]) => name);
    // Empty bin, nothing recorded yet — nothing to derive from, so fall
    // back to whatever grain it was assigned when set up.
    const cropLabel = grainsPresent.length === 0 ? bin.grainName
      : grainsPresent.length === 1 ? grainsPresent[0]
      : grainsPresent.join(" + ");
    const grain = grainFor(grainsPresent[0] || bin.grainName);
    const storedBu = (parseFloat(bin.storedLbs) || 0) / (grain.bushel_lbs || 60);
    const pctFull = bin.capacityBu > 0 ? Math.min(100, storedBu / bin.capacityBu * 100) : 0;
    const fieldTotals = {};
    loadsInBin.forEach(l => { fieldTotals[l.fieldName] = (fieldTotals[l.fieldName] || 0) + buOf(l); });
    const fieldList = Object.entries(fieldTotals).sort((a, b) => b[1] - a[1]).map(([name, bu]) => ({ name, bu }));
    return {
      id: bin.id, name: bin.name, crop: cropLabel,
      capacityBu: bin.capacityBu, storedBu, pctFull,
      loads: loadsInBin.length, totLbs, totBu, fields: fieldList,
    };
  });
}
