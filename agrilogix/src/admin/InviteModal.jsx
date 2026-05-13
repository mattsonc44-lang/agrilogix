import React, { useState } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { generateToken, createInvite, sendInviteEmail } from "../core/invites.js";
import { ROLES } from "../core/config.js";

const APP_URL = window.location.origin;

export default function InviteModal({ tenantId, tenantName, sentBy, token_auth, onClose }) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("operator");
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(null);  // { inviteUrl, warning? }
  const [err,   setErr]   = useState("");

  const send = async () => {
    if (!email.trim()) { setErr("Email is required."); return; }
    setErr(""); setBusy(true);
    try {
      const token     = generateToken();
      const inviteUrl = `${APP_URL}?invite=${token}`;
      await createInvite(token, { tenantId, tenantName, email:email.trim(), role, createdBy:sentBy }, token_auth);
      const result = await sendInviteEmail({ toEmail:email.trim(), toName:"", tenantName, role, inviteUrl });
      setDone({ inviteUrl, warning: result.warning });
    } catch(e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{...S.card,maxWidth:"460px",width:"100%",padding:"28px"}}>

        {!done ? <>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",color:T.brand,margin:"0 0 18px"}}>
            Invite User to {tenantName}
          </h3>

          <div style={S.row}>
            <label style={S.label}>Email Address</label>
            <input style={S.input} type="email" placeholder="user@example.com"
              value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}/>
          </div>

          <div style={S.row}>
            <label style={S.label}>Role</label>
            <div style={{display:"flex",gap:"6px"}}>
              {Object.entries(ROLES).map(([key,r])=>(
                <button key={key} onClick={()=>setRole(key)} style={{
                  flex:1, padding:"10px 8px", borderRadius:"6px", cursor:"pointer",
                  border:`1px solid ${role===key?T.brand:T.border}`,
                  background:role===key?T.brand+"15":"transparent",
                  fontFamily:"'Barlow',sans-serif", fontSize:"13px", fontWeight:role===key?700:400,
                  color:role===key?T.brand:T.muted,
                }}>
                  <div style={{fontSize:"18px",marginBottom:"3px"}}>{key==="owner"?"👑":key==="manager"?"📋":"🚜"}</div>
                  <div>{r.label}</div>
                </button>
              ))}
            </div>
            <p style={{margin:"6px 0 0",fontSize:"11px",color:T.muted}}>
              {role==="owner"   && "Full access — can invite users and manage org settings"}
              {role==="manager" && "Can log activities and view all records, cannot manage users"}
              {role==="operator"&& "Can log their own activities only"}
            </p>
          </div>

          {err && <p style={{color:T.danger,fontSize:"13px",margin:"0 0 12px"}}>{err}</p>}

          <div style={{display:"flex",gap:"8px",justifyContent:"flex-end"}}>
            <button style={mkBtn("ghost")} onClick={onClose}>Cancel</button>
            <button style={mkBtn("primary",T.brand)} onClick={send} disabled={busy}>
              {busy?"Sending…":"Send Invite"}
            </button>
          </div>
        </> : <>
          {/* Success state */}
          <div style={{textAlign:"center",padding:"8px 0 16px"}}>
            <div style={{fontSize:"40px",marginBottom:"10px"}}>✅</div>
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",marginBottom:"8px"}}>Invite sent!</h3>
            <p style={{color:T.muted,fontSize:"13px",marginBottom:"16px"}}>
              {done.warning
                ? "Email not sent — EmailJS not configured. Share this link manually:"
                : `An invitation has been sent to ${email}.`}
            </p>
            {/* Always show the link so admin can copy it */}
            <div style={{background:"#F5F0E8",border:`1px solid ${T.border}`,borderRadius:"6px",padding:"10px 12px",fontSize:"12px",wordBreak:"break-all",textAlign:"left",marginBottom:"16px"}}>
              <div style={{fontSize:"11px",color:T.muted,marginBottom:"4px",fontWeight:700}}>INVITE LINK</div>
              <a href={done.inviteUrl} style={{color:T.brand}}>{done.inviteUrl}</a>
            </div>
            <p style={{fontSize:"11px",color:T.faint}}>Link expires in 7 days.</p>
          </div>
          <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
            <button style={mkBtn("ghost")} onClick={()=>{setDone(null);setEmail("");setRole("operator");}}>Send Another</button>
            <button style={mkBtn("primary",T.brand)} onClick={onClose}>Done</button>
          </div>
        </>}
      </div>
    </div>
  );
}
