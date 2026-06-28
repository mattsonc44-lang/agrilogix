// src/modules/agriPlan/firebase.js
// Tenant-isolated REST implementation.
// When running inside Agri Logix (tenantId provided):
//   → stores data at tenants/{tenantId}/agriPlan/ in the Agri Logix Firebase
//   → uses the Agri Logix idToken for authenticated writes
// When running standalone (no tenantId):
//   → falls back to the original agriplan-49d52 Firebase (unauthenticated)

const AGRILOGIX_URL = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
const STANDALONE_URL = "https://agriplan-49d52-default-rtdb.firebaseio.com";

let _tenantId = null;
let _token    = null;

// Call once at module mount to configure the tenant context
export function initAgriPlan(tenantId, token) {
  _tenantId = tenantId || null;
  _token    = token    || null;
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function baseUrl() {
  return _tenantId ? AGRILOGIX_URL : STANDALONE_URL;
}
function authSuffix() {
  return _token ? `?auth=${_token}` : "";
}
function path(key, yr) {
  if (_tenantId) {
    const base = `tenants/${_tenantId}/agriPlan`;
    if (key === "fields") return `${base}/fields/${yr}`;
    return `${base}/${key}`;
  } else {
    if (key === "fields") return `agriplan/fields/${yr}`;
    return `agriplan/${key}`;
  }
}
async function dbGet(p) {
  const res = await fetch(`${baseUrl()}/${p}.json${authSuffix()}`);
  if (!res.ok) throw new Error(`GET ${p}: ${res.status}`);
  return res.json();
}
async function dbPut(p, value) {
  const res = await fetch(`${baseUrl()}/${p}.json${authSuffix()}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`PUT ${p}: ${res.status}`);
  return res.json();
}

// ── Exports ───────────────────────────────────────────────────────────────────
export async function fbSaveYears(years) {
  await dbPut(path("years"), years);
}
export async function fbSaveFields(year, fields) {
  const obj = {};
  fields.forEach((f, i) => { obj[String(f.excelRow || i)] = f; });
  await dbPut(path("fields", year), obj);
}
export async function fbSaveHistRevenue(data) {
  await dbPut(path("histRevenue"), data);
}
export async function fbSaveVersion(v) {
  await dbPut(path("dataVersion"), v);
}
export async function fbLoadYears() {
  return dbGet(path("years"));
}
export async function fbLoadFields(year) {
  const data = await dbGet(path("fields", year));
  if (!data) return null;
  return Object.values(data).sort((a, b) => (a.excelRow || 0) - (b.excelRow || 0));
}
export async function fbLoadHistRevenue() {
  const data = await dbGet(path("histRevenue"));
  return data || {};
}
export async function fbLoadVersion() {
  return dbGet(path("dataVersion"));
}
export async function fbSaveRotationRules(rules) {
  await dbPut(path("rotationRules"), rules);
}
export async function fbLoadRotationRules() {
  return dbGet(path("rotationRules"));
}
export function fbWatchFields(year, callback) {
  const url = `${baseUrl()}/${path("fields", year)}.json${authSuffix()}`;
  const sse = new EventSource(url);
  sse.addEventListener("put", (e) => {
    try {
      const { data } = JSON.parse(e.data);
      if (data) callback(Object.values(data).sort((a, b) => (a.excelRow || 0) - (b.excelRow || 0)));
    } catch (_) {}
  });
  return () => sse.close();
}
