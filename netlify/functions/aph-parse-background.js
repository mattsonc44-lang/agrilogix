// netlify/functions/aph-parse-background.js
// Background version of aph-parse: parses one batch of APH page images using Claude.
// Netlify Background Functions (name must end in "-background") get a 15-minute execution
// budget instead of the ~26s synchronous limit, and always return 202 immediately to the
// caller — the handler keeps running after that response is sent. Because the caller can't
// get a real response back, this function writes its result to Firebase instead, and the
// client polls for it.
//
// Accepts (POST body): { images: ["<base64 JPEG>", ...], tenantId, jobId, batchIndex }
// Requires: Authorization: Bearer <firebase ID token>  (same as the old sync function)
//
// Writes result to: tenants/{tenantId}/aphJobs/{jobId}/batches/{batchIndex}
//   on success: { status: "done", data: { insured, county, units: [...] }, updatedAt }
//   on failure: { status: "error", error: "<message>", updatedAt }

const { checkAuth } = require("./auth-check");

const AGRILOGIX_DB_URL = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";

async function writeResult(dbUrl, tenantId, jobId, batchIndex, idToken, payload) {
  const url = `${dbUrl}/tenants/${tenantId}/aphJobs/${jobId}/batches/${batchIndex}.json?auth=${idToken}`;
  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, updatedAt: Date.now() }),
    });
  } catch (e) {
    console.error(`[aph-parse-background] failed to write result for job=${jobId} batch=${batchIndex}:`, e.message);
  }
}

exports.handler = async (event) => {
  // Background functions always return 202 to the caller regardless of what we return here,
  // but we still validate the request shape up front before doing any real work.
  if (event.httpMethod !== "POST") return { statusCode: 200, body: "" };

  const authHeader = event.headers["authorization"] || event.headers["Authorization"] || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  // ── Auth check — same two-layer check as every other function ─────────────
  const auth = await checkAuth(event);
  if (auth.error) {
    const ip = event.headers["x-forwarded-for"] || "unknown";
    console.warn(`[REJECTED ${new Date().toISOString()}] from ${ip}`);
    // Can't write a per-batch error without a tenantId/jobId we trust, and an
    // unauthenticated caller shouldn't get one anyway — just log and stop.
    return { statusCode: 200, body: "" };
  }

  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown";
  const ua = event.headers["user-agent"] || "unknown";
  console.log(`[${new Date().toISOString()}] ${event.httpMethod} from ${ip} | ${ua.slice(0,80)}`);

  let images, tenantId, jobId, batchIndex;
  try { ({ images, tenantId, jobId, batchIndex } = JSON.parse(event.body || "{}")); }
  catch { console.error("[aph-parse-background] invalid request body"); return { statusCode: 200, body: "" }; }

  if (!tenantId || !jobId || batchIndex === undefined || batchIndex === null) {
    console.error("[aph-parse-background] missing tenantId/jobId/batchIndex");
    return { statusCode: 200, body: "" };
  }
  if (!images || !Array.isArray(images) || images.length === 0) {
    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "error", error: "images (array of base64 JPEGs) required",
    });
    return { statusCode: 200, body: "" };
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) {
    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "error", error: "API key not configured",
    });
    return { statusCode: 200, body: "" };
  }

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

    if (!resp.ok) {
      const errBody = await resp.text();
      await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
        status: "error", error: `Anthropic API error (${resp.status}): ${errBody.slice(0,400)}`,
      });
      return { statusCode: 200, body: "" };
    }

    const data = await resp.json();
    if (data.error) {
      await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
        status: "error", error: `Anthropic API error: ${data.error.message || JSON.stringify(data.error)}`,
      });
      return { statusCode: 200, body: "" };
    }
    if (data.stop_reason === "max_tokens") {
      await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
        status: "error", error: "Response was cut off (hit the token limit) — try fewer pages per batch.",
      });
      return { statusCode: 200, body: "" };
    }
    const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    let parsed;
    try { parsed = JSON.parse(text); }
    catch {
      await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
        status: "error", error: "Could not parse response", raw: text.slice(0, 500) || "(empty response)",
      });
      return { statusCode: 200, body: "" };
    }

    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "done", data: parsed,
    });
    return { statusCode: 200, body: "" };

  } catch (err) {
    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "error", error: "Parse failed: " + err.message,
    });
    return { statusCode: 200, body: "" };
  }
};
