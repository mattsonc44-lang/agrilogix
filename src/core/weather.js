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
