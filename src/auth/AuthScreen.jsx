import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { authSignIn, authSignUp, authResetPassword } from "../core/firebase.js";
import { readInvite, markInviteUsed } from "../core/invites.js";
import { dbWrite } from "../core/firebase.js";
import { MODULES } from "../core/config.js";

const getInviteToken = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("invite")) return params.get("invite");
  const hash = window.location.hash.replace("#","");
  if (hash.startsWith("invite=")) return hash.slice(7);
  return null;
};

export default function AuthScreen({ onAuth }) {
  const [mode,   setMode]  = useState("login");
  const [email,  setEmail] = useState("");
  const [pass,   setPass]  = useState("");
  const [name,   setName]  = useState("");
  const [org,    setOrg]   = useState("");
  const [busy,   setBusy]  = useState(false);
  const [err,    setErr]   = useState("");
  const [msg,    setMsg]   = useState("");
  const [invite, setInvite]= useState(null);
  const [inviteLoading,setInviteLoading]=useState(false);

  const inviteToken = getInviteToken();

  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    readInvite(inviteToken)
      .then(inv => { setInvite(inv); setEmail(inv.email); setMode("signup"); })
      .catch(e  => setErr(e.message))
      .finally(() => setInviteLoading(false));
  }, [inviteToken]);

  const handle = async () => {
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "reset") {
        await authResetPassword(email);
        setMsg("Password reset email sent — check your inbox.");
        setMode("login"); return;
      }
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        const data = await authSignUp(email, pass);
        if (invite) {
          const userProfile = { uid:data.localId, name:name.trim(), email:data.email, tenantId:invite.tenantId, role:invite.role, createdAt:new Date().toISOString() };
          await dbWrite(`users/${data.localId}`, userProfile, data.idToken);
          await dbWrite(`tenants/${invite.tenantId}/users/${data.localId}`, userProfile, data.idToken);
          await markInviteUsed(inviteToken, data.localId, data.idToken);
          window.history.replaceState({}, "", "/");
          onAuth(data, { isNewOrg:false }); return;
        }
        if (!org.trim()) throw new Error("Please enter your organization name.");
        onAuth(data, { isNewOrg:true, name:name.trim(), orgName:org.trim() }); return;
      }
      const data = await authSignIn(email, pass);
      onAuth(data, { isNewOrg:false });
    } catch(e) {
      setErr(e.message.replace("EMAIL_EXISTS","This email is already registered.").replace("INVALID_LOGIN_CREDENTIALS","Invalid email or password.").replace("WEAK_PASSWORD","Password must be at least 6 characters.").replace("INVALID_EMAIL","Please enter a valid email address."));
    } finally { setBusy(false); }
  };

  if (inviteLoading) return (
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh"}}>
      <div style={{textAlign:"center",color:T.muted}}><div style={{fontSize:"32px",marginBottom:"8px"}}>🌾</div>Loading your invitation…</div>
    </div>
  );

  return (
    <div style={{...S.app,display:"flex",flexDirection:"column",minHeight:"100vh"}}>
      <div style={{background:T.brand,padding:"14px 24px",display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{width:"36px",height:"36px",background:"rgba(255,255,255,0.2)",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>🌾</div>
        <div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",color:"#FFFFFF",fontWeight:700}}>Agri Logix</div>
          <div style={{fontSize:"10px",color:"rgba(255,255,255,0.7)",textTransform:"uppercase",letterSpacing:"1.2px"}}>Farm Management Platform</div>
        </div>
      </div>

      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px"}}>
        <div style={{width:"100%",maxWidth:"420px"}}>

          {invite&&(
            <div style={{background:"#F0F8F0",border:`1px solid #A0C8A0`,borderRadius:"10px",padding:"16px",marginBottom:"20px",textAlign:"center"}}>
              <div style={{fontSize:"28px",marginBottom:"6px"}}>🌾</div>
              <p style={{fontWeight:700,fontSize:"15px",marginBottom:"4px"}}>You've been invited!</p>
              <p style={{color:T.muted,fontSize:"13px"}}>Join <strong>{invite.tenantName}</strong> on Agri Logix as <strong style={{color:T.brand,textTransform:"capitalize"}}>{invite.role}</strong></p>
            </div>
          )}

          {mode==="login"&&!invite&&(
            <div style={{marginBottom:"24px",textAlign:"center"}}>
              <p style={{color:T.muted,fontSize:"13px",marginBottom:"12px"}}>Manage your entire farming operation in one place</p>
              <div style={{display:"flex",gap:"8px",justifyContent:"center"}}>
                {Object.values(MODULES).map(m=>(
                  <div key={m.id} style={{padding:"8px 12px",borderRadius:"8px",background:T.card,border:`1px solid ${T.border}`,textAlign:"center"}}>
                    <div style={{fontSize:"20px",marginBottom:"2px"}}>{m.icon}</div>
                    <div style={{fontWeight:600,color:m.color,fontSize:"11px"}}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{...S.card,padding:"28px"}}>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"22px",color:T.text,margin:"0 0 20px"}}>
              {mode==="login"?"Sign in":mode==="signup"?invite?"Create your account":"Create account":"Reset password"}
            </h2>

            {msg&&<div style={{background:"#F0F8F0",border:`1px solid #A0C8A0`,borderRadius:"6px",padding:"10px 12px",marginBottom:"14px",fontSize:"13px",color:"#2A5020"}}>{msg}</div>}

            {mode==="signup"&&<div style={S.row}><label style={S.label}>Your Name</label><input style={S.input} type="text" placeholder="First and last name" value={name} onChange={e=>setName(e.target.value)}/></div>}
            {mode==="signup"&&!invite&&<div style={S.row}><label style={S.label}>Organization Name</label><input style={S.input} type="text" placeholder="e.g. Mattson Bros Inc." value={org} onChange={e=>setOrg(e.target.value)}/></div>}

            <div style={S.row}>
              <label style={S.label}>Email</label>
              <input style={{...S.input,background:invite?"#F5F5F5":"#FFFFFF"}} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} readOnly={!!invite} onKeyDown={e=>e.key==="Enter"&&handle()}/>
            </div>

            {mode!=="reset"&&<div style={S.row}><label style={S.label}>Password</label><input style={S.input} type="password" placeholder={mode==="signup"?"Min. 6 characters":"••••••••"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/></div>}

            {err&&<p style={{color:T.danger,fontSize:"13px",margin:"0 0 12px"}}>{err}</p>}

            <button style={{...mkBtn("primary",T.brand),width:"100%",justifyContent:"center",padding:"11px",fontSize:"15px"}} onClick={handle} disabled={busy}>
              {busy?"Please wait…":mode==="login"?"Sign In":mode==="signup"?"Create Account":"Send Reset Email"}
            </button>

            {!invite&&<div style={{marginTop:"16px",textAlign:"center",fontSize:"13px",color:T.muted}}>
              {mode==="login"&&<><span>Don't have an account? </span><button style={{background:"none",border:"none",color:T.brand,fontWeight:600,cursor:"pointer",fontSize:"13px"}} onClick={()=>{setMode("signup");setErr("");}}>Sign up</button><div style={{marginTop:"8px"}}><button style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:"12px"}} onClick={()=>{setMode("reset");setErr("");}}>Forgot password?</button></div></>}
              {mode==="signup"&&<><span>Already have an account? </span><button style={{background:"none",border:"none",color:T.brand,fontWeight:600,cursor:"pointer",fontSize:"13px"}} onClick={()=>{setMode("login");setErr("");}}>Sign in</button></>}
              {mode==="reset"&&<button style={{background:"none",border:"none",color:T.brand,fontWeight:600,cursor:"pointer",fontSize:"13px"}} onClick={()=>{setMode("login");setErr("");}}>← Back to sign in</button>}
            </div>}
          </div>

          {mode==="signup"&&!invite&&<p style={{textAlign:"center",fontSize:"11px",color:T.faint,marginTop:"12px"}}>Free 14-day trial · No credit card required · $150/module/year after trial</p>}
        </div>
      </div>
    </div>
  );
}
