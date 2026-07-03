// netlify/functions/label-lookup.js
// Looks up herbicide/pesticide label data using Claude AI

const CROPS = ["Wheat","Durum","Barley","Oats","Canola","Flax","Peas","Lentils","Chickpeas","Mustard","Corn","Soybeans","Sunflowers","Alfalfa","Hay"];

const { checkAuth } = require("./auth-check");
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
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


  let chemicalName;
  try {
    ({ chemicalName } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!chemicalName?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "chemicalName is required" }) };
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };
  }

  const prompt = `You are an expert in Canadian and US Prairie crop protection product labels (herbicides, fungicides, insecticides, adjuvants).

Look up the registered label information for the agricultural product: "${chemicalName.trim()}"

Return ONLY valid JSON — no markdown fences, no explanation — using this exact structure:
{
  "found": true,
  "type": "Herbicide",
  "activeIngredient": "glyphosate",
  "labeledCrops": ["Wheat","Barley","Oats"],
  "plantback": [
    {"crop": "Canola", "days": 30},
    {"crop": "Flax",   "days": 30}
  ],
  "defaultRate": "1.2",
  "unit": "L/ac",
  "notes": "Group 2 ALS inhibitor. Avoid use in high-pH soils due to extended residual."
}

Rules:
- "found": true if you recognize this product; false if unknown
- "labeledCrops": only include crops from this exact list: ${CROPS.join(", ")}
- "plantback": crops from the same list that have a rotational restriction — include the minimum days
- "type": one of Herbicide, Fungicide, Insecticide, Adjuvant, Fertilizer, Other
- "defaultRate": typical label rate as a number string
- "unit": typical rate unit (L/ac, oz/ac, ml/ac, fl oz/ac, lbs/ac, g/ac, pt/ac)
- "notes": one sentence about mode of action, resistance group, or key label cautions
- If the product is a Canadian prairie market product (e.g. Lontrel 360, Muster 75DF, Refine M, Ally XP, Glean, Edge, Infinity, Odyssey, Axial, Puma Super, Buctril M, Centurion, Tundra, Varro, Prestige, Engage, etc.) use Canadian label data
- Be accurate — if truly unknown return {"found": false}`;

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
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await resp.json();
    const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ found: false, error: "Could not parse response" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Lookup failed: " + err.message }),
    };
  }
};
