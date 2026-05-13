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

// Send invite email via EmailJS
export const sendInviteEmail = async ({ toEmail, toName, tenantName, role, inviteUrl }) => {
  const SERVICE_ID  = (typeof window !== "undefined" && window.__EMAILJS_SERVICE__)  || "";
  const TEMPLATE_ID = (typeof window !== "undefined" && window.__EMAILJS_TEMPLATE__) || "";
  const PUBLIC_KEY  = (typeof window !== "undefined" && window.__EMAILJS_KEY__)      || "";

  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn("EmailJS not configured — invite URL:", inviteUrl);
    return { warning: "Email not sent — EmailJS not configured. Share this link manually: " + inviteUrl };
  }

  const params = {
    to_email:    toEmail,
    to_name:     toName || toEmail,
    org_name:    tenantName,
    role:        role.charAt(0).toUpperCase() + role.slice(1),
    invite_url:  inviteUrl,
    expires_in:  "7 days",
  };

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:  SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id:     PUBLIC_KEY,
      template_params: params,
    }),
  });

  if (!res.ok) throw new Error("Email failed to send — check your EmailJS config.");
  return { ok: true };
};
