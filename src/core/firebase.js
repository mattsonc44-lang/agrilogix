import { FIREBASE_URL } from "./config.js";

// ── Realtime Database REST helpers ────────────────────────────────
const dbUrl = (path) => `${FIREBASE_URL}/${path}.json`;

export const dbRead  = async (path, token) => {
  const url = token ? `${dbUrl(path)}?auth=${token}` : dbUrl(path);
  const r = await fetch(url);
  if (!r.ok) throw new Error(`DB read failed: ${r.status}`);
  return r.json();
};

export const dbWrite = async (path, data, token) => {
  const url = token ? `${dbUrl(path)}?auth=${token}` : dbUrl(path);
  const r = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`DB write failed: ${r.status}`);
  return r.json();
};

// ── Safe write: validates payload, backs up, checks for data loss ─
const countRecords = (data) => {
  if (!data || typeof data !== "object") return 0;
  return Object.values(data)
    .filter(v => v && typeof v === "object")
    .reduce((s, v) => s + (typeof v === "object" ? Object.keys(v).length : 0), 0);
};

export const dbSafeWrite = async (path, data, token) => {
  // 1. Reject non-object payloads immediately
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(`BLOCKED: payload is not an object (got ${typeof data})`);
  }
  // 2. Reject if payload looks like a JWT token (string starting with "ey")
  const asStr = JSON.stringify(data);
  if (asStr.startsWith('"ey')) {
    throw new Error("BLOCKED: payload looks like an auth token, not data");
  }

  // 3. Read current Firebase data and compare record counts
  let current = null;
  try { current = await dbRead(path, token); } catch(e) { /* ignore read errors */ }

  if (current && typeof current === "object") {
    const currentCount = countRecords(current);
    const newCount     = countRecords(data);
    // Block if new payload would delete more than 50% of existing records
    if (currentCount > 5 && newCount < currentCount * 0.5) {
      throw new Error(`BLOCKED: write would reduce records from ${currentCount} to ${newCount} — possible data loss`);
    }
  }

  // 4. Take a timestamped backup before writing
  const backupKey = `backup_${new Date().toISOString().slice(0,16).replace(/:/g,"-")}`;
  try {
    if (current) {
      await dbWrite(`${path}_backups/${backupKey}`, current, token);
    }
  } catch(e) { /* backup failure is non-fatal */ }

  // 5. Write the actual data
  return dbWrite(path, data, token);
};

export const dbPush = async (path, data, token) => {
  const url = token ? `${dbUrl(path)}?auth=${token}` : dbUrl(path);
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`DB push failed: ${r.status}`);
  return r.json();
};

export const dbDelete = async (path, token) => {
  const url = token ? `${dbUrl(path)}?auth=${token}` : dbUrl(path);
  await fetch(url, { method: "DELETE" });
};

export const dbListen = (path, token, onChange) => {
  const url = token
    ? `${FIREBASE_URL}/${path}.json?auth=${token}`
    : `${FIREBASE_URL}/${path}.json`;
  try {
    const es = new EventSource(url);
    es.addEventListener("put",   (e) => { try { onChange(JSON.parse(e.data)); } catch(_){} });
    es.addEventListener("patch", (e) => { try { onChange(JSON.parse(e.data)); } catch(_){} });
    es.onerror = () => {};
    return () => es.close();
  } catch(_) { return () => {}; }
};

// ── Firebase Auth REST ────────────────────────────────────────────
const AUTH_BASE = "https://identitytoolkit.googleapis.com/v1/accounts";

const WEB_API_KEY = (typeof window !== "undefined" && window.__FIREBASE_API_KEY__) || "";

export const authSignIn = async (email, password) => {
  const r = await fetch(`${AUTH_BASE}:signInWithPassword?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Sign in failed");
  return data; // { idToken, localId, email, refreshToken, expiresIn }
};

export const authSignUp = async (email, password) => {
  const r = await fetch(`${AUTH_BASE}:signUp?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Sign up failed");
  return data;
};

export const authResetPassword = async (email) => {
  const r = await fetch(`${AUTH_BASE}:sendOobCode?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Reset failed");
  return data;
};

export const authRefreshToken = async (refreshToken) => {
  const r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Token refresh failed");
  return data; // { id_token, refresh_token, expires_in }
};
