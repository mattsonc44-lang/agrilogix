// netlify/functions/auth-check.js
// Two-layer auth for all Netlify functions:
//   1. Verify the Firebase ID token is valid
//   2. Confirm that user exists in the Agri Logix user database
//      (i.e. you actually set them up — not just any Firebase account)

// Reuses FIREBASE_API_KEY (already provisioned in Netlify and confirmed working —
// it's the same var netlify.toml injects into the client bundle) instead of a
// separate FIREBASE_WEB_API_KEY, which was never actually set and caused every
// function behind checkAuth to reject valid tokens as "Unauthorized."
const FIREBASE_API_KEY  = process.env.FIREBASE_API_KEY;   // Firebase web API key
const AGRILOGIX_DB_URL  = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";

function deny(msg, status = 401) {
  return {
    error: {
      statusCode: status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: msg }),
    },
  };
}

async function checkAuth(event) {
  // ── Layer 0: require Authorization header ─────────────────────────────────
  const authHeader =
    event.headers["authorization"] || event.headers["Authorization"] || "";
  if (!authHeader.startsWith("Bearer ")) return deny("Unauthorized — no auth token");

  const idToken = authHeader.slice(7).trim();
  if (!idToken) return deny("Unauthorized — empty token");

  if (!FIREBASE_API_KEY) {
    console.error("FIREBASE_API_KEY not set — denying all requests");
    return deny("Auth service misconfigured", 503);
  }

  // ── Layer 1: verify the token is a real Firebase token ───────────────────
  let uid, email;
  try {
    const resp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    const data = await resp.json();
    if (data.error || !data.users?.[0]) return deny("Unauthorized — invalid or expired token");
    uid   = data.users[0].localId;
    email = data.users[0].email;
  } catch (e) {
    return deny("Unauthorized — token verification failed");
  }

  // ── Layer 2: confirm this user exists in the Agri Logix database ──────────
  // Only users you've explicitly set up have a record at users/{uid}
  try {
    const resp = await fetch(
      `${AGRILOGIX_DB_URL}/users/${uid}.json?shallow=true`,
    );
    const data = await resp.json();
    if (!data) {
      console.warn(`[AUTH DENIED] uid=${uid} email=${email} — not in Agri Logix user database`);
      return deny("Unauthorized — not a registered Agri Logix user");
    }
  } catch (e) {
    return deny("Unauthorized — user verification failed");
  }

  return { uid, email };
}

module.exports = { checkAuth };
