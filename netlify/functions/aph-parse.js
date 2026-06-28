// netlify/functions/aph-parse.js
// Parses an APH (Actual Production History) PDF using Claude
// Accepts: { pdf: "<base64 string>" }
// Returns: { insured, county, units: [{ fieldName, legal, crop, years: [{year, acres, yield, production}], aphYield, aphYears }] }

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  let pdf;
  try { ({ pdf } = JSON.parse(event.body || "{}")); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) }; }

  if (!pdf) return { statusCode: 400, body: JSON.stringify({ error: "pdf (base64) required" }) };

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
      "aphYears": 10
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
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf } },
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
