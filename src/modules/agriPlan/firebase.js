// src/modules/agriPlan/firebase.js
// Pure REST API implementation — no window.firebase SDK needed.
// Connects directly to the AgriPlan Firebase project via fetch.

const DB_URL = "https://agriplan-49d52-default-rtdb.firebaseio.com";

// ── REST helpers ──────────────────────────────────────────────────────────────
async function dbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function dbPut(path, value) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
  return res.json();
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const P = {
  years:   () => "agriplan/years",
  fields:  (yr) => `agriplan/fields/${yr}`,
  histRev: () => "agriplan/histRevenue",
  version: () => "agriplan/dataVersion",
  rules:   () => "agriplan/rotationRules",
};

// ── Exported functions ────────────────────────────────────────────────────────
export async function fbSaveYears(years) {
  await dbPut(P.years(), years);
}

export async function fbSaveFields(year, fields) {
  const obj = {};
  fields.forEach((f, i) => { obj[String(f.excelRow || i)] = f; });
  await dbPut(P.fields(year), obj);
}

export async function fbSaveHistRevenue(data) {
  await dbPut(P.histRev(), data);
}

export async function fbSaveVersion(v) {
  await dbPut(P.version(), v);
}

export async function fbLoadYears() {
  const data = await dbGet(P.years());
  return data || null;
}

export async function fbLoadFields(year) {
  const data = await dbGet(P.fields(year));
  if (!data) return null;
  return Object.values(data).sort((a, b) => (a.excelRow || 0) - (b.excelRow || 0));
}

export async function fbLoadHistRevenue() {
  const data = await dbGet(P.histRev());
  return data || {};
}

export async function fbLoadVersion() {
  const data = await dbGet(P.version());
  return data || null;
}

export async function fbSaveRotationRules(rules) {
  await dbPut(P.rules(), rules);
}

export async function fbLoadRotationRules() {
  const data = await dbGet(P.rules());
  return data || null;
}

// SSE-based live watcher (mirrors how FieldLog does it)
export function fbWatchFields(year, callback) {
  const url = `${DB_URL}/${P.fields(year)}.json`;
  const sse = new EventSource(url);
  sse.addEventListener("put", (e) => {
    try {
      const { data } = JSON.parse(e.data);
      if (data) {
        const fields = Object.values(data)
          .sort((a, b) => (a.excelRow || 0) - (b.excelRow || 0));
        callback(fields);
      }
    } catch (_) {}
  });
  return () => sse.close();
}
