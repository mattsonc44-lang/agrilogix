// src/core/weather.js
// Small pure helpers for the FieldLog "get current weather" activity-log
// feature. Pulled out into their own module so they're unit testable
// without loading the whole FieldLog component file.

// 16-point compass from a wind-direction degree (0/360 = N, 90 = E, etc.)
export const degToCompass = (deg) => {
  if (deg == null || isNaN(deg)) return "";
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
};

export const fmtWeather = (w) => {
  if (!w) return "";
  const parts = [];
  if (w.tempF != null && w.tempF !== "") parts.push(`${w.tempF}°F`);
  if (w.windMph != null && w.windMph !== "") parts.push(`Wind ${w.windDir ? w.windDir + " " : ""}${w.windMph}mph`);
  if (w.humidity != null && w.humidity !== "") parts.push(`${w.humidity}% RH`);
  return parts.join(" · ");
};

// ── Spray-window advisory ────────────────────────────────────────────────
// Flags GENERAL, widely-cited cautions from a short-term hourly forecast —
// high wind, very light wind (a common signal of a temperature inversion,
// which raises drift risk even in calm air), and rain in the window. This is
// NOT a product-specific determination: actual wind limits and rainfast
// windows vary by chemical and are set by the product's own label, which is
// the real legal requirement. Callers must present these as general caution
// flags alongside the raw forecast numbers, never as a pass/fail safety
// check or a claim that conditions are/aren't compliant.
export const HIGH_WIND_MPH = 10; // commonly cited ceiling across ground-boom product labels
export const LOW_WIND_MPH = 3;   // below this, extension guidance commonly flags inversion risk
export const RAIN_PROB_PCT = 50; // precipitation-probability threshold worth flagging

export function evaluateSprayWindow(hours) {
  const list = hours || [];
  const flags = [];
  const highWind = list.filter(h => h.windMph != null && h.windMph > HIGH_WIND_MPH);
  const lightWind = list.filter(h => h.windMph != null && h.windMph < LOW_WIND_MPH);
  const rain = list.filter(h => (h.precipProb != null && h.precipProb >= RAIN_PROB_PCT) || (h.precipIn != null && h.precipIn > 0));
  if (highWind.length > 0) {
    flags.push({ msg: `Wind above ${HIGH_WIND_MPH} mph in ${highWind.length} of the next ${list.length} hours — many labels restrict application above this. Check your product's label.` });
  }
  if (lightWind.length > 0) {
    flags.push({ msg: `Very light wind (under ${LOW_WIND_MPH} mph) in ${lightWind.length} of the next ${list.length} hours — this can signal a temperature inversion, which raises drift risk even in calm air.` });
  }
  if (rain.length > 0) {
    flags.push({ msg: `Rain is in the forecast within this window — check your product's rainfast time before spraying.` });
  }
  return flags;
}
