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

// Liquid-volume units convert cleanly to gallons — handy since a total like
// "1280 fl oz" means a lot less at the shop than "10 gal". Plain "oz" is
// genuinely ambiguous in this app's own chemical database: liquid products
// (Roundup, 2,4-D, Spartan 4F) use it to mean fluid ounces, but true WDG/
// dry-flowable products (Ally XP, Glean, Finesse) use it to mean dry-weight
// ounces, where a gallons figure would be meaningless. We still compute a
// gallons equivalent for "oz" (assuming fluid ounces) so growers can opt
// into it, but flag it `totalGalAmbiguous` so the UI can default those
// specifically to the native unit and only convert on request — unlike
// fl oz/pt/qt/L/mL, which are unambiguous and default to gallons already.
// True dry-weight units ("lbs", "g") never get a gallons figure at all.
const GAL_PER_UNIT = {
  "fl oz": 1 / 128,
  "oz": 1 / 128,
  "pt": 1 / 8,
  "qt": 1 / 4,
  "gal": 1,
  "L": 0.264172,
  "ml": 0.264172 / 1000,
};
const AMBIGUOUS_UNITS = new Set(["oz"]);

export function toGallons(amount, unit) {
  const factor = GAL_PER_UNIT[unit];
  if (factor == null || amount == null || isNaN(amount)) return null;
  return amount * factor;
}

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
    const totalGal = total != null ? toGallons(total, totalUnit) : null;
    const totalGalAmbiguous = totalUnit != null && AMBIGUOUS_UNITS.has(totalUnit);
    return { id: c.id, name, rate: c.oz, unit, total, totalUnit, totalGal, totalGalAmbiguous };
  });

  return { totalWaterGal, effectiveAcres, items };
}

// ── Active plantback restrictions, for a "does anything need attention right
// now" view (Home's needs-attention feed) — deliberately different from
// AgriPlan's getPlantbackWarnings (agriPlan/index.jsx), which needs a
// specific candidate crop ("if I plant Canola here, is anything still
// restricting me"). This instead answers "what's currently restricted on
// this field, across every crop the chemical restricts" with no target crop
// in mind, by walking every crop key in each chemical's plantback map
// instead of looking up just one.
//
// `fieldRestrictions` is the raw tenant-wide Firebase node FieldLog writes to
// (tenants/{tenantId}/fieldRestrictions/{safeKey}), shaped:
//   { fieldName, chemicals: { [chemName]: { date, plantback: {crop:days} } } }
export function findActivePlantbackRestrictions(fieldRestrictions, today = new Date()) {
  const out = [];
  const t = today.getTime();
  Object.values(fieldRestrictions || {}).forEach(fieldData => {
    if (!fieldData?.chemicals) return;
    Object.entries(fieldData.chemicals).forEach(([chemName, entry]) => {
      const appliedTs = new Date(entry?.date).getTime();
      if (isNaN(appliedTs)) return;
      const daysAgo = Math.floor((t - appliedTs) / 86400000);
      Object.entries(entry.plantback || {}).forEach(([crop, days]) => {
        const daysRemaining = (Number(days) || 0) - daysAgo;
        if (daysRemaining > 0) {
          out.push({ fieldName: fieldData.fieldName, chemName, crop, daysRemaining, appliedDate: entry.date });
        }
      });
    });
  });
  return out.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
