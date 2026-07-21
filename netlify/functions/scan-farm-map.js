// netlify/functions/scan-farm-map.js
// Scans a photo of a USDA FSA farm map using Claude and extracts field boundaries.
// Accepts: { image: "<base64 JPEG string>" }
// Returns: { fields: [{ name, acres, legalDesc, boundary: [[lat,lng],...] }], notes }

const { checkAuth } = require("./auth-check");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  // ── Auth check — reject unauthenticated requests ──────────────────────────
  const auth = await checkAuth(event);
  if (auth.error) {
    // Log rejected requests too
    const ip = event.headers["x-forwarded-for"] || "unknown";
    console.warn(`[REJECTED ${new Date().toISOString()}] from ${ip}`);
    return auth.error;
  }
  // Log every invocation — visible in Netlify function logs
  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
  const ua = event.headers["user-agent"] || "unknown";
  console.log(`[${new Date().toISOString()}] ${event.httpMethod} from ${ip} | ${ua.slice(0,80)}`);

  let image;
  try { ({ image } = JSON.parse(event.body || "{}")); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) }; }

  if (!image) return { statusCode: 400, body: JSON.stringify({ error: "image (base64 JPEG) required" }) };

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };

  const prompt = `This is a USDA FSA farm map from Montana.

Step 1 — Read every field label: tract numbers, field numbers, legal descriptions (Section-Township-Range), and acreages.

Step 2 — For each field, calculate four corner GPS coordinates using the Montana PLSS system:
- Montana Principal Meridian: 45.7764°N, 111.0667°W
- Townships go north (N) from baseline, each 6 miles (0.08682° lat)
- Ranges go east (E) or west (W) from meridian, each 6 miles
- Sections are 1×1 mile, numbered 1-36 (row 1 north: 6,5,4,3,2,1 west to east; row 2: 7,8,9,10,11,12 west to east; etc.)
- Quarter sections (NW/NE/SW/SE) are 0.5×0.5 mile (160 ac)

Reply ONLY with valid JSON, no markdown fences:
{"fields":[{"name":"Tract 1 Field 1","acres":160,"legalDesc":"NW Sec 12 T34N R15E","boundary":[[lat,lng],[lat,lng],[lat,lng],[lat,lng]]}],"notes":"accuracy note"}`;

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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    if (!resp.ok) {
      const body = await resp.text();
      return { statusCode: resp.status, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ error: `API ${resp.status}: ${body.slice(0,300)}` }) };
    }

    const data = await resp.json();
    const txt = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("").trim();
    if (!txt) return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ error: "Empty response — check API key and credits at console.anthropic.com" }) };

    const match = txt.match(/\{[\s\S]*\}/);
    if (!match) return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ error: "Response wasn't JSON", raw: txt.slice(0, 300) }) };

    let parsed;
    try { parsed = JSON.parse(match[0]); }
    catch { return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ error: "Could not parse response", raw: txt.slice(0, 500) }) }; }

    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(parsed) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Scan failed: " + err.message }) };
  }
};
