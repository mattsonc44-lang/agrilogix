// netlify/functions/aph-parse-background.js
// Background version of aph-parse: parses one batch of APH page images using Claude.
// Netlify Background Functions (name must end in "-background") get a 15-minute execution
// budget instead of the ~26s synchronous limit, and always return 202 immediately to the
// caller — the handler keeps running after that response is sent.
//
// IMPORTANT: background function invocations have a ~256KB request payload limit (much
// smaller than the ~6MB limit for regular synchronous functions), so the page images can't
// be sent directly in this request. Instead: the client PUTs the batch's images to Firebase
// first, then invokes this function with just a small pointer ({tenantId, jobId, batchIndex}).
// This function reads the images back out of Firebase, calls Claude, and writes its result
// to Firebase — the client polls there for completion.
//
// Accepts (POST body): { tenantId, jobId, batchIndex }
// Requires: Authorization: Bearer <firebase ID token>  (same as the old sync function)
//
// Reads images from:  tenants/{tenantId}/aphJobs/{jobId}/batches/{batchIndex}/input
// Writes result to:   tenants/{tenantId}/aphJobs/{jobId}/batches/{batchIndex}/result
//   on success: { status: "done", data: { insured, county, units: [...] }, updatedAt }
//   on failure: { status: "error", error: "<message>", updatedAt }

const { checkAuth } = require("./auth-check");

const AGRILOGIX_DB_URL = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";

async function writeResult(dbUrl, tenantId, jobId, batchIndex, idToken, payload) {
  const url = `${dbUrl}/tenants/${tenantId}/aphJobs/${jobId}/batches/${batchIndex}/result.json?auth=${idToken}`;
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

  let tenantId, jobId, batchIndex;
  try { ({ tenantId, jobId, batchIndex } = JSON.parse(event.body || "{}")); }
  catch { console.error("[aph-parse-background] invalid request body"); return { statusCode: 200, body: "" }; }

  if (!tenantId || !jobId || batchIndex === undefined || batchIndex === null) {
    console.error("[aph-parse-background] missing tenantId/jobId/batchIndex");
    return { statusCode: 200, body: "" };
  }

  // Pull the batch's page images back out of Firebase — they were too big to send
  // in this request directly (background invocations cap out around 256KB).
  let images;
  try {
    const inputUrl = `${AGRILOGIX_DB_URL}/tenants/${tenantId}/aphJobs/${jobId}/batches/${batchIndex}/input.json?auth=${idToken}`;
    const inputResp = await fetch(inputUrl);
    images = await inputResp.json();
  } catch (e) {
    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "error", error: "Could not read batch images from Firebase: " + e.message,
    });
    return { statusCode: 200, body: "" };
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
      status: "error", error: "images (array of base64 JPEGs) required — none found in Firebase for this batch",
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
      "crop": "<crop name, read directly and only from what is printed on THIS page — see rules below>",
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

DO NOT GUESS OR INVENT DATA. This is the most important rule — accuracy for crop insurance and
yield-history data matters far more than completeness. For every field, unit, crop, legal
description, and year: only include it if you can read it directly and confidently from the
image in front of you. If any single value on a unit — especially the crop — is blurry, cut
off, ambiguous, or you find yourself inferring rather than reading, DROP THAT ENTIRE UNIT from
your output rather than guess at it. A missing unit can be caught and re-scanned; a fabricated
one silently corrupts the farm's real records. The standardized crop names below (and the
"e.g." examples elsewhere in this prompt) are ONLY there to tell you how to spell/format a crop
name you already read on the page — never treat them as a menu of things to pick from when
you're unsure what a unit's actual crop is.

Rules:
- Include every unit and every year shown — don't skip any rows you can actually read
- yield = bushels per acre (bu/ac). If not shown, calculate as production / acres.
- production = total bushels harvested. If blank or zero, use 0.
- Include years with zero production (crop failure, prevented planting) — set production: 0
- aphYield = the calculated or shown APH guarantee yield for this unit/crop
- aphYears = number of years in the APH database for this unit
- priceElection = the crop insurance price election shown on the document ($/bu). If not shown use 0
- If multiple crops on one unit (e.g. wheat and lentils on same ground), create separate unit entries
- fieldName should be the most descriptive identifier available (common name, legal desc, or both)
- Once you've read a crop directly off the page, spell/format it using one of these standardized
  names if it matches: "Spring Wheat", "Winter Wheat", "CC WW", "Barley", "Durum", "Lentils",
  "Chickpeas", "Green Peas", "Yellow Peas", "Austrians", "Mustard", "Canola", "Flax". If it
  doesn't match any of these, use the crop name exactly as printed instead of forcing it into
  this list.

WHEAT TYPE CODES — read these literally from each unit's "Type" field (a short code shown near Practice/Legal Description on the MPCI Acreage and Production Reporting pages). Do NOT infer wheat class from context, farm name, or nearby units — every unit's Type code must be read independently, even if two units share the same Farm Description or legal description:
- Type "W" = Winter Wheat
- Type "S" = Spring Wheat
- Type "DS" = Spring Wheat (Dark Northern Spring — still label as "Spring Wheat")
- Type "DUR" = Durum
If the same farm/field has both a Winter Wheat unit and a Spring Wheat unit (very common — same ground rotates between them across years), these are two DIFFERENT crop entries in your output, each with its own "crop" value and its own "years" array. Never combine their production history together, and never let one unit's label overwrite the other's — a farm can correctly show Winter Wheat acres in some years and Spring Wheat acres in other years, but not both from a single merged unit.

IMPORTANT: Some pages in a multi-page document are boilerplate — legal definitions, terms and conditions, blank forms — with no APH data at all. If that's what you're looking at, you MUST still respond with ONLY the JSON object below and absolutely nothing else — no explanation of why the page has no data, no commentary, not even a single sentence before or after the JSON. Any text outside the JSON breaks the automated pipeline reading your response:
{"insured":"","county":"","policyNumber":"","units":[]}`;

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
        max_tokens: 32000, // Sonnet supports up to 128k on the standard API — a dense multi-unit page's JSON can easily exceed the old 8000 cap
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
      // Fallback: Claude occasionally wraps the JSON in explanatory prose despite instructions
      // not to (e.g. explaining that a boilerplate/no-data page has nothing to extract). Try to
      // pull just the {...} object out of the response before giving up entirely.
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        try { parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1)); }
        catch { /* fall through to error below */ }
      }
      if (!parsed) {
        await writeResult(AGRILOGIX_DB_URL, tenantId, jobId, batchIndex, idToken, {
          status: "error", error: "Could not parse response", raw: text.slice(0, 4000) || "(empty response)",
        });
        return { statusCode: 200, body: "" };
      }
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
