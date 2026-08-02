// Pure helpers for FieldLog's spraying records — extracted so the tank-mix
// math is covered by a regression test and shared between the live spraying
// form (a heads-up "how much do I need to bring/mix" calculator) and the
// printable spray record report (a retrospective "how much did I actually
// apply" total), instead of two copies of the same arithmetic drifting apart.

// A tank-mix entry's rate lives in `oz` (a generic numeric field despite the
// name — could be oz, fl oz, mL, L, lbs, pt, or qt depending on `unit`) and
// its unit in `unit`, one of two families:
//   "<unit>/ac"       — dosed per acre of field, e.g. "16 oz/ac"
//   "<unit>/100 gal"  — dosed per 100 gal of spray water (mostly adjuvants),
//                       e.g. "1 qt/100 gal"
// Everything else (missing rate, missing unit, or an acreage/water volume of
// 0) is left as "can't total this yet" rather than guessed.
//
// Optical spot-spray systems (WeedIt, GreenSeeker/WeedSeeker, See & Spray,
// etc.) only trigger a nozzle when it senses green, so they cover a fraction
// of the field, not all of it — acres * gal/ac wildly overstates what was
// actually used. For those passes, `actualWaterGal` (read straight off the
// system's own display, since that's the only real source of truth for it)
// is passed in and used as totalWaterGal directly instead of being derived.
// Per-acre chemical rates still need *some* acreage to scale against, so we
// back-calculate an "effective acres" from that actual volume at the same
// carrier rate (gal/ac) the sprayer was calibrated to lay down on ground it
// did hit — this is the acreage-equivalent of what was actually treated.
const PER_ACRE_SUFFIX = "/ac";
const PER_100GAL_SUFFIX = "/100 gal";

export function calcTankMixTotals(tankMix, acres, waterVolGalAc, actualWaterGal) {
  const ac = parseFloat(acres) || 0;
  const galAc = parseFloat(waterVolGalAc) || 0;
  const override = parseFloat(actualWaterGal);
  const hasOverride = actualWaterGal !== undefined && actualWaterGal !== null && actualWaterGal !== "" && !isNaN(override) && override >= 0;

  const totalWaterGal = hasOverride ? override : (ac > 0 && galAc > 0 ? ac * galAc : null);
  const effectiveAcres = hasOverride
    ? (galAc > 0 ? override / galAc : null)
    : (ac > 0 ? ac : null);

  const items = (tankMix || []).map(c => {
    const rate = parseFloat(c.oz);
    const unit = c.unit || "";
    const name = c.chemical === "Other" ? (c.chemicalName || "Unnamed") : c.chemical;
    let total = null, totalUnit = null;
    if (name && rate > 0 && unit) {
      if (unit.endsWith(PER_ACRE_SUFFIX) && effectiveAcres != null && effectiveAcres > 0) {
        total = rate * effectiveAcres;
        totalUnit = unit.slice(0, -PER_ACRE_SUFFIX.length);
      } else if (unit.endsWith(PER_100GAL_SUFFIX) && totalWaterGal != null) {
        total = rate * (totalWaterGal / 100);
        totalUnit = unit.slice(0, -PER_100GAL_SUFFIX.length);
      }
    }
    return { id: c.id, name, rate: c.oz, unit, total, totalUnit };
  });

  return { totalWaterGal, effectiveAcres, items };
}
