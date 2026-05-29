exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { toEmail, toName, tenantName, role, inviteUrl } = body;
  if (!toEmail || !inviteUrl) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing required fields" }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY not set" }) };
  }

  const roleName = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Team Member";
  const FROM_EMAIL = "info@agrilogixsolutions.com";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4EFE6;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#FDFAF4;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:#1A3A1A;padding:28px 36px;">
      <div style="font-size:22px;color:#F4EFE6;font-weight:700;letter-spacing:0.04em;">Agri<span style="color:#C07010;">Logix</span> Solutions</div>
      <div style="font-size:11px;color:rgba(244,239,230,0.5);letter-spacing:0.15em;text-transform:uppercase;margin-top:4px;">Farm Management Platform</div>
    </div>
    <div style="padding:36px;">
      <h1 style="font-size:24px;color:#1A3A1A;margin:0 0 12px;font-weight:700;">You've been invited!</h1>
      <p style="font-size:15px;color:#5A4A3A;line-height:1.65;margin:0 0 20px;">
        ${toName ? `Hi ${toName},` : "Hi,"}<br><br>
        You've been invited to join <strong>${tenantName}</strong> on Agri Logix Solutions as a <strong>${roleName}</strong>.
      </p>
      <p style="font-size:14px;color:#7A6A58;line-height:1.65;margin:0 0 28px;">
        Click the button below to create your account. This invitation expires in <strong>7 days</strong>.
      </p>
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${inviteUrl}" style="display:inline-block;background:#C07010;color:#FDFAF4;text-decoration:none;padding:14px 36px;border-radius:5px;font-size:15px;font-weight:600;letter-spacing:0.04em;">Accept Invitation →</a>
      </div>
      <div style="background:#F0EBE0;border-radius:6px;padding:14px 18px;margin-bottom:24px;">
        <div style="font-size:11px;color:#7A6A58;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Or copy this link:</div>
        <div style="font-size:12px;color:#C07010;word-break:break-all;font-family:monospace;">${inviteUrl}</div>
      </div>
      <p style="font-size:12px;color:#9A8A78;line-height:1.6;margin:0;">
        If you weren't expecting this invitation, you can safely ignore this email.<br>
        This invite was sent on behalf of <strong>${tenantName}</strong>.
      </p>
    </div>
    <div style="background:#E8E0D0;padding:18px 36px;border-top:1px solid #D8CEC0;">
      <p style="font-size:11px;color:#9A8A78;margin:0;text-align:center;">
        1836 Laird Rd, Chester, MT 59522<br/>Agri Logix Solutions · Built for the Hi-Line<br>
        <a href="https://agrilogixsolutions.com" style="color:#C07010;text-decoration:none;">agrilogixsolutions.com</a>
      </p>
    </div>
  </div>
</body></html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Agri Logix Solutions <${FROM_EMAIL}>`,
        to: [toEmail],
        subject: `You've been invited to join ${tenantName} on Agri Logix`,
        html,
        text: `You've been invited to join ${tenantName} on Agri Logix Solutions as a ${roleName}.\n\nAccept your invitation: ${inviteUrl}\n\nThis link expires in 7 days.`,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return { statusCode: 500, body: JSON.stringify({ error: data.message || "Email failed" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, id: data.id }) };
  } catch (err) {
    console.error("Resend fetch error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
