// netlify/functions/aph-parse.js
// Parses an APH (Actual Production History) document using Claude
// Accepts: { images: ["<base64 JPEG>", ...] } — one image per page, rendered client-side
// Returns: { insured, county, units: [{ fieldName, legal, crop, years: [{year, acres, yield, production}], aphYield, aphYears }] }

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


  let images;
  try { ({ images } = JSON.parse(event.body || "{}")); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) }; }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "images (array of base64 JPEGs) required" }) };
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return { statusCode: 500, body: JSON.stringify({ error: "API key not configured" }) };

  const prompt = `Extract ALL Actual Production History (APH) data from this crop insurance document.

Return ONLY valid JSON — no markdown, no explanation — using this exact structure:
{
  "insured": "insured person or entity name",
  "county": "County, State",
  "policyNumber": "optional policy number",
  "units": [
    {
      "unitNumber": "unit number if shown",
      "fieldName": "field or unit descriptive name",
      "legal": "legal description e.g. 16-31N-5E or Section 16, T31N R5E",
      "crop": "crop name e.g. Spring Wheat, Winter Wheat, Lentils, Chickpeas",
      "practice": "irrigated or dryland if specified",
      "years": [
        { "year": 2015, "acres": 314.0, "production": 18000, "yield": 57.3 }
      ],
      "aphYield": 28.4,
      "aphYears": 10,
      "priceElection": 5.80
    }
  ]
}

Rules:
- Include every unit and every year shown — don't skip any rows
- yield = bushels per acre (bu/ac). If not shown, calculate as production / acres.
- production = total bushels harvested. If blank or zero, use 0.
- Include years with zero production (crop failure, prevented planting) — set production: 0
- aphYield = the calculated or shown APH guarantee yield for this unit/crop
- aphYears = number of years in the APH database for this unit
- priceElection = the crop insurance price election shown on the document ($/bu). If not shown use 0
- If multiple crops on one unit (e.g. wheat and lentils on same ground), create separate unit entries
- fieldName should be the most descriptive identifier available (common name, legal desc, or both)
- crop names: use "Spring Wheat", "Winter Wheat", "CC WW", "Barley", "Durum", "Lentils", "Chickpeas", "Green Peas", "Yellow Peas", "Austrians", "Mustard", "Canola", "Flax" where possible`;

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            ...images.map(img => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: img } })),
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    const data = await resp.json();
    const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch { return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify({ error: "Could not parse response", raw: text.slice(0, 500) }) }; }

    return { statusCode: 200, headers: {"Content-Type":"application/json"}, body: JSON.stringify(parsed) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "Parse failed: " + err.message }) };
  }
};
