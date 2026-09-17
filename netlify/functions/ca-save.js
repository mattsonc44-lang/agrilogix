// netlify/functions/ca-save.js
// Direct-save endpoint for CA users.
//
// The balance_sheets table has RLS locking every row to its owning lender's
// user_id, so a CA session can't UPDATE the lender's row directly. This
// function accepts the CA's auth token + the sheet payload, verifies via
// ca_shares that this CA has an active share for that sheet_key, then uses
// SUPABASE_SERVICE_ROLE_KEY to write the update as the lender.
//
// ESM (repo package.json has "type": "module").

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const jsonHeaders = { 'Content-Type': 'application/json' };
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-fbmt-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors, body: '' };
  if (event.httpMethod !== 'POST')   return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'Server not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)' }) };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Missing auth token' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid JSON body' }) }; }
  const { sheet_key, sheet_data } = payload;
  if (!sheet_key || !sheet_data || typeof sheet_data !== 'object') {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'sheet_key and sheet_data are required' }) };
  }

  try {
    // 1. Confirm the caller is a real user via /auth/v1/user (their JWT).
    const meResp = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { 'Authorization': authHeader, 'apikey': SERVICE_ROLE },
    });
    if (!meResp.ok) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'Invalid session' }) };
    const me = await meResp.json();
    const caUserId = me?.id;
    if (!caUserId) return { statusCode: 401, headers: cors, body: JSON.stringify({ error: 'No user id on session' }) };

    // 2. Verify the CA has an active share for that sheet_key — this is what
    //    authorizes them to write the lender's row.
    const shareResp = await fetch(
      SUPABASE_URL + '/rest/v1/ca_shares?ca_user_id=eq.' + encodeURIComponent(caUserId)
        + '&sheet_key=eq.' + encodeURIComponent(sheet_key)
        + '&select=lender_user_id,client_name',
      { headers: { 'apikey': SERVICE_ROLE, 'Authorization': 'Bearer ' + SERVICE_ROLE } }
    );
    const shares = await shareResp.json();
    if (!Array.isArray(shares) || !shares.length) {
      return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'No active share found for this sheet' }) };
    }
    const share = shares[0];
    const lenderUserId = share.lender_user_id;
    const clientName   = sheet_data.clientName || share.client_name;
    const asOfDate     = sheet_data.asOfDate;
    if (!lenderUserId || !clientName || !asOfDate) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing lender_user_id, clientName, or asOfDate' }) };
    }

    // 3. Upsert the balance_sheets row for the LENDER, using service role.
    //    Uniqueness is (user_id, client_name, as_of_date).
    const savePayload = { ...sheet_data, _savedAt: new Date().toISOString(), _lastCAEdit: new Date().toISOString(), _lastCAEditor: caUserId };
    const row = {
      user_id: lenderUserId,
      client_name: clientName,
      as_of_date: asOfDate,
      data: savePayload,
    };
    const upsertResp = await fetch(
      SUPABASE_URL + '/rest/v1/balance_sheets?on_conflict=user_id,client_name,as_of_date',
      {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          'apikey': SERVICE_ROLE,
          'Authorization': 'Bearer ' + SERVICE_ROLE,
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify(row),
      }
    );
    if (!upsertResp.ok) {
      const err = await upsertResp.text();
      return { statusCode: upsertResp.status, headers: cors, body: JSON.stringify({ error: err }) };
    }

    return { statusCode: 200, headers: { ...cors, ...jsonHeaders }, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
