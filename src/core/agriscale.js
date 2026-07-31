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
