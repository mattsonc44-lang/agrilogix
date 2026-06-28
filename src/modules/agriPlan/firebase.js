// src/firebase.js — loads Firebase from CDN globals (no npm needed)
// Firebase is loaded via <script> tags in build.mjs HTML template

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDThGeZqwonU7UK_avW9K3z25f7FdT1IpA",
  authDomain: "agriplan-49d52.firebaseapp.com",
  databaseURL: "https://agriplan-49d52-default-rtdb.firebaseio.com",
  projectId: "agriplan-49d52",
  storageBucket: "agriplan-49d52.firebasestorage.app",
  messagingSenderId: "1020207778734",
  appId: "1:1020207778734:web:ead9005503056c9cd6d63f",
};

let _db = null;

function getDb() {
  if (_db) return _db;
  // Firebase loaded via CDN script tags as window.firebase
  const fb = window.firebase;
  if (!fb) throw new Error("Firebase SDK not loaded");
  // Named app avoids conflict with Agri Logix default Firebase
  const existing = fb.apps ? fb.apps.find(a => a.name === 'agriplan') : null;
  const _app = existing || fb.initializeApp(FIREBASE_CONFIG, 'agriplan');
  _db = _app.database();
  return _db;
}

function dbRef(path) {
  return getDb().ref(path);
}

// ── Paths ─────────────────────────────────────────────────────────────────────
const P = {
  years:       () => "agriplan/years",
  fields: (yr) => `agriplan/fields/${yr}`,
  histRev:     () => "agriplan/histRevenue",
  version:     () => "agriplan/dataVersion",
};

export async function fbSaveYears(years) {
  await dbRef(P.years()).set(years);
}

export async function fbSaveFields(year, fields) {
  const obj = {};
  fields.forEach((f, i) => { obj[String(f.excelRow || i)] = f; });
  await dbRef(P.fields(year)).set(obj);
}

export async function fbSaveHistRevenue(data) {
  await dbRef(P.histRev()).set(data);
}

export async function fbSaveVersion(v) {
  await dbRef(P.version()).set(v);
}

export async function fbLoadYears() {
  const snap = await dbRef(P.years()).once("value");
  return snap.exists() ? snap.val() : null;
}

export async function fbLoadFields(year) {
  const snap = await dbRef(P.fields(year)).once("value");
  if (!snap.exists()) return null;
  const obj = snap.val();
  return Object.values(obj).sort((a, b) => (a.excelRow||0) - (b.excelRow||0));
}

export async function fbLoadHistRevenue() {
  const snap = await dbRef(P.histRev()).once("value");
  return snap.exists() ? snap.val() : {};
}

export async function fbLoadVersion() {
  const snap = await dbRef(P.version()).once("value");
  return snap.exists() ? snap.val() : null;
}

export async function fbSaveRotationRules(rules) {
  await dbRef("agriplan/rotationRules").set(rules);
}
export async function fbLoadRotationRules() {
  const snap = await dbRef("agriplan/rotationRules").once("value");
  return snap.exists() ? snap.val() : null;
}

export function fbWatchFields(year, callback) {
  const r = dbRef(P.fields(year));
  r.on("value", (snap) => {
    if (snap.exists()) {
      const fields = Object.values(snap.val())
        .sort((a, b) => (a.excelRow||0) - (b.excelRow||0));
      callback(fields);
    }
  });
  return () => r.off("value");
}
