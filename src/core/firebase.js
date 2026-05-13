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

// You'll need your Firebase Web API key here
const WEB_API_KEY = "AIzaSyArEJgWVoLCfrEj0qvAK704NIl9U5o7qLA";

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
