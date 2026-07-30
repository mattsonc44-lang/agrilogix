// src/core/authGuard.js
// Every direct browser → Firebase RTDB read/write across AgriPlan, FieldLog, AgriScale, and
// ServiceLog goes out as a plain fetch() with the user's Firebase ID token in the `auth=` query
// string (see core/firebase.js's dbRead/dbWrite, plus the hundreds of inline fetch() calls
// scattered through each module — this app doesn't route everything through those helpers).
//
// Those tokens are only good for ~1 hour. App.jsx also runs a preemptive refresh timer (fires
// 5 minutes before expiry), but that's a setTimeout — browsers throttle/delay timers in
// backgrounded tabs, so a long session left in the background can miss its refresh window
// entirely. When that happens, every single Firebase write in the app starts failing with a
// silent 401 until the user manually logs out and back in (see: APH import "Firebase save
// failed: 401", 2026-07-29 — turned out to be exactly this).
//
// Fix: patch window.fetch ONCE, globally. Any 401 coming back from the RTDB host triggers a
// single silent token refresh + one retry, transparent to every existing fetch() call site —
// no changes needed anywhere else in AgriPlan/FieldLog/AgriScale/ServiceLog. If the refresh
// itself fails too (e.g. the refresh token is also dead), the original 401 is returned
// untouched, so existing error handling (e.g. "Firebase save failed: 401") still fires and the
// user still gets a clear signal to log back in — this just eliminates the common case.
//
// Deliberately scoped to fetch() calls to the RTDB host with `auth=` in the URL — sign-in/
// refresh calls to identitytoolkit/securetoken don't match, so there's no risk of recursively
// refreshing while refreshing. Live-update listeners (core/firebase.js's dbListen, EventSource-
// based) aren't covered by this — they aren't user-blocking writes, and already self-heal once
// the preemptive timer (still running as a backup) eventually lands a fresh token and the
// module re-renders with it.

import { FIREBASE_URL } from "./config.js";
import { authRefreshToken } from "./firebase.js";

const SESSION_KEY = "al_session";
let installed = false;
let refreshInFlight = null;
const listeners = new Set();

// Let App.jsx keep its in-memory session (and the preemptive refresh timer chain) in sync
// whenever this guard silently refreshes the token out from under it.
export function onSessionRefreshed(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch (_) { return null; }
}
function saveSession(s) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch (_) {}
}

function isFirebaseAuthedUrl(url) {
  return typeof url === "string" && url.startsWith(FIREBASE_URL) && /[?&]auth=/.test(url);
}

function withNewToken(url, newToken) {
  return url.replace(/([?&]auth=)[^&]*/, `$1${encodeURIComponent(newToken)}`);
}

// Concurrent 401s (e.g. several fields autosaving at once) share a single in-flight refresh
// instead of each firing their own — Firebase's refresh-token endpoint doesn't need to be hit
// more than once for the whole burst.
async function refreshOnce() {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const session = loadSession();
    if (!session?.refreshToken) throw new Error("No refresh token available");
    const d = await authRefreshToken(session.refreshToken);
    const updated = {
      ...session,
      idToken: d.id_token,
      refreshToken: d.refresh_token || session.refreshToken,
      expiresIn: d.expires_in || "3600",
    };
    saveSession(updated);
    listeners.forEach(cb => { try { cb(updated); } catch (_) {} });
    return updated;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export function installAuthGuard() {
  if (installed || typeof window === "undefined" || !window.fetch) return;
  installed = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input?.url || "");
    const res = await originalFetch(input, init);
    if (res.status !== 401 || !isFirebaseAuthedUrl(url)) return res;
    try {
      const updated = await refreshOnce();
      return await originalFetch(withNewToken(url, updated.idToken), init);
    } catch (_) {
      return res; // refresh failed too (e.g. refresh token itself is dead) — surface the original 401
    }
  };
}
