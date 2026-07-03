// netlify/functions/label-lookup.js
// Looks up herbicide/pesticide label data using Claude AI
// Results cached in Firebase — same chemical never calls Claude twice

const CROPS = ["Wheat","Durum","Barley","Oats","Canola","Flax","Peas","Lentils","Chickpeas","Mustard","Corn","Soybeans","Sunflowers","Alfalfa","Hay"];
const DB    = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
const CACHE_TTL_DAYS = 60; // re-fetch label data after 60 days

const { checkAuth } = require("./auth-check");

// ── Per-user rate limiting (in-memory, resets on cold start) ─────────────────
// Max 20 label lookups per user per hour
const rateLimitMap = {};
function checkRateLimit(uid) {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  const limit  = 20;
  if (!rateLimitMap[uid]) rateLimitMap[uid] = [];
  rateLimitMap[uid] = rateLimitMap[uid].filter(t => now - t < window);
  if (rateLimitMap[uid].length >= limit) return false;
  rateLimitMap[uid].push(now);
  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const auth = await checkAuth(event);
  if (auth.error) {
    const ip = event.headers["x-forwarded-for"] || "unknown";
    console.warn(`[REJECTED ${new Date().toISOString()}] from ${ip}`);
    return auth.error;
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (!checkRateLimit(auth.uid)) {
    console.warn(`[RATE LIMITED] uid=${auth.uid}`);
    return { statusCode: 429, body: JSON.stringify({ error: "Too many requests — limit 20 label lookups per hour" }) };
  }

  const ip = event.headers["x-forwarded-for"] || "unknown";
  console.log(`[${new Date().toISOString()}] uid=${auth.uid} from ${ip}`);

  let chemicalName;
  try {
    ({ chemicalName } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }
  if (!chemicalName?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "chemicalName is required" }) };
  }

  const name = chemicalName.trim();
  const cacheKey = name.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 80);
  const cachePath = `${DB}/chemLabelCache/${cacheKey}.json`;

  // ── Check Firebase cache first ─────────────────────────────────────────────
  try {
    const cached = await fetch(cachePath).then(r => r.json());
    if (cached?.result && cached?.cachedAt) {
      const ageDays = (Date.now() - new Date(cached.cachedAt).getTime()) / 86400000;
      if (ageDays < CACHE_TTL_DAYS) {
        console.log(`[CACHE HIT] ${name} (${Math.floor(ageDays)}d old)`);
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(cached.result) };
      }
      console.log(`[CACHE STALE] ${name} — refreshing`);
    }
  } catch { /* no cache — proceed to Claude */ }

  // ── Call Claude ───────────────────────────────────────────────────────────
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };

  const prompt = `You are an expert in Canadian and US Prairie crop protection product labels.

Look up registered label information for: "${name}"

Return ONLY valid JSON — no markdown, no explanation:
{
  "found": true,
  "productName": "exact registered name",
  "activeIngredient": "active ingredient(s)",
  "group": "herbicide group e.g. Group 2",
  "type": "herbicide|fungicide|insecticide|adjuvant",
  "registeredCrops": ["Wheat","Canola"],
  "plantback": {"Lentils": 670, "Canola": 365},
  "applicationRate": "rate per acre",
  "notes": "brief key notes"
}
If not found: {"found": false}
Crops to check for plantback: ${CROPS.join(", ")}`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);

    // ── Save to Firebase cache ──────────────────────────────────────────────
    try {
      await fetch(cachePath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, cachedAt: new Date().toISOString(), chemicalName: name }),
      });
      console.log(`[CACHED] ${name}`);
    } catch (e) { console.warn("Cache write failed:", e.message); }

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Lookup failed: " + err.message }) };
  }
};
