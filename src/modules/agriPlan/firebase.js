// src/modules/agriPlan/firebase.js
// Tenant-isolated REST implementation — no window.firebase SDK needed.
// Inside Agri Logix (tenantId provided): stores at tenants/{tenantId}/agriPlan/ in Agri Logix Firebase
// Standalone (no tenantId): uses original agriplan-49d52 Firebase

const AGRILOGIX_URL = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
const STANDALONE_URL = "https://agriplan-49d52-default-rtdb.firebaseio.com";

let _tenantId = null;
let _token    = null;
let _farmId   = null;

export function initAgriPlan(tenantId, token, farmId) {
  _tenantId = tenantId || null;
  _token    = token    || null;
  _farmId   = farmId   || null;
}

function baseUrl() { return _tenantId ? AGRILOGIX_URL : STANDALONE_URL; }
function authSuffix() { return _token ? `?auth=${_token}` : ""; }

function path(key, yr) {
  const yearKeyed = key === "fields" || key === "contracts";
  if (_tenantId) {
    // "default" farm (or no farm at all) keeps the original unscoped path for
    // backward compatibility; any other farm gets its own subtree so multiple
    // farming entities under one tenant don't share AgriPlan data.
    const seg = (_farmId && _farmId !== "default") ? `farms/${_farmId}/` : "";
    const base = `tenants/${_tenantId}/${seg}agriPlan`;
    return yearKeyed ? `${base}/${key}/${yr}` : `${base}/${key}`;
  }
  return yearKeyed ? `agriplan/${key}/${yr}` : `agriplan/${key}`;
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

function sortFields(data) {
  return Object.values(data).sort((a, b) => (a.excelRow || 0) - (b.excelRow || 0));
}

export async function fbSaveYears(years)             { await dbPut(path("years"), years); }
export async function fbSaveHistRevenue(data)         { await dbPut(path("histRevenue"), data); }
export async function fbSaveVersion(v)               { await dbPut(path("dataVersion"), v); }
export async function fbSaveRotationRules(rules)     { await dbPut(path("rotationRules"), rules); }
export async function fbSaveFields(year, fields) {
  const obj = {};
  fields.forEach((f, i) => { obj[String(f.excelRow || i)] = f; });
  await dbPut(path("fields", year), obj);
}
export async function fbLoadYears()          { return dbGet(path("years")); }
export async function fbLoadVersion()        { return dbGet(path("dataVersion")); }
export async function fbLoadRotationRules()  { return dbGet(path("rotationRules")); }
export async function fbLoadHistRevenue()    { return dbGet(path("histRevenue")).then(d => d || {}); }
export async function fbLoadFields(year) {
  const data = await dbGet(path("fields", year));
  return data ? sortFields(data) : null;
}

export function fbWatchFields(year, callback) {
  const url = `${baseUrl()}/${path("fields", year)}.json${authSuffix()}`;
  const sse = new EventSource(url);
  sse.addEventListener("put", (e) => {
    try {
      const { data } = JSON.parse(e.data);
      // Always call callback — pass [] when null so dbLoaded still gets set
      callback(data ? sortFields(data) : []);
    } catch (_) {}
  });
  // Unblock on SSE error too
  sse.onerror = () => { try { callback([]); } catch(_) {} };
  return () => sse.close();
}

// fieldHistory used to be fetch-once, so a write from another module (e.g.
// AgriScale pushing actual harvest data in) never showed up here without a
// manual page reload. Same live-update pattern as fbWatchFields above.
export function fbWatchFieldHistory(callback) {
  const url = `${baseUrl()}/${path("fieldHistory")}.json${authSuffix()}`;
  const sse = new EventSource(url);
  sse.addEventListener("put", (e) => {
    try {
      const { data } = JSON.parse(e.data);
      callback(data && typeof data === "object" ? data : {});
    } catch (_) {}
  });
  sse.onerror = () => {};
  return () => sse.close();
}

// Grain marketing contracts live in AgriScale (crop, buyer, bushels, price,
// delivery — see agriScale/index.jsx's ContractForm); this just watches the
// crop-level revenue summary AgriScale mirrors over per year, the same
// live-update pattern as fbWatchFieldHistory above, so a contract added in
// AgriScale shows up in AgriPlan's reports without a reload. Contracted
// revenue is a forward commitment, not realized production — kept separate
// from fieldHistory's actual/realized bushels rather than merged into it.
export function fbWatchContracts(year, callback) {
  const url = `${baseUrl()}/${path("contracts", year)}.json${authSuffix()}`;
  const sse = new EventSource(url);
  sse.addEventListener("put", (e) => {
    try {
      const { data } = JSON.parse(e.data);
      callback(data && typeof data === "object" ? data : {});
    } catch (_) {}
  });
  sse.onerror = () => {};
  return () => sse.close();
}
