import { dbRead, dbWrite } from "./firebase.js";

// Generate a cryptographically random invite token
export const generateToken = () => {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2,"0")).join("");
};

// Create an invite record in Firebase
export const createInvite = async (token, { tenantId, tenantName, email, role, createdBy }, token_auth) => {
  const invite = {
    token,
    tenantId,
    tenantName,
    email:      email.trim().toLowerCase(),
    role,
    createdBy,
    createdAt:  new Date().toISOString(),
    expiresAt:  new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    used:       false,
  };
  await dbWrite(`invites/${token}`, invite, token_auth);
  return invite;
};

// Read and validate an invite token
export const readInvite = async (token) => {
  const invite = await dbRead(`invites/${token}`);
  if (!invite)           throw new Error("Invite not found. It may have expired or already been used.");
  if (invite.used)       throw new Error("This invite has already been used.");
  if (new Date(invite.expiresAt) < new Date()) throw new Error("This invite has expired. Please request a new one.");
  return invite;
};

// Mark invite as used
export const markInviteUsed = async (token, uid, token_auth) => {
  await dbWrite(`invites/${token}/used`,   true,                   token_auth);
  await dbWrite(`invites/${token}/usedBy`, uid,                    token_auth);
  await dbWrite(`invites/${token}/usedAt`, new Date().toISOString(), token_auth);
};

// Send invite email via Netlify function (SMTP through Network Solutions)
export const sendInviteEmail = async ({ toEmail, toName, tenantName, role, inviteUrl, token_auth }) => {
  try {
    const headers = { "Content-Type": "application/json" };
    if (token_auth) headers["Authorization"] = `Bearer ${token_auth}`;
    const res = await fetch("/.netlify/functions/send-invite", {
      method:  "POST",
      headers,
      body: JSON.stringify({ toEmail, toName, tenantName, role, inviteUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Email failed (${res.status})`);
    }

    return { ok: true };
  } catch (e) {
    console.warn("Email send failed:", e.message);
    return { warning: e.message || "Email could not be sent" };
  }
};
