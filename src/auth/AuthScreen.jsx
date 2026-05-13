import React, { useState } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { authSignIn, authSignUp, authResetPassword } from "../core/firebase.js";
import { MODULES } from "../core/config.js";

export default function AuthScreen({ onAuth }) {
  const [mode,  setMode]  = useState("login");  // "login" | "signup" | "reset"
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [name,  setName]  = useState("");
  const [org,   setOrg]   = useState("");
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");
  const [msg,   setMsg]   = useState("");

  const handle = async () => {
    setErr(""); setMsg(""); setBusy(true);
    try {
      if (mode === "reset") {
        await authResetPassword(email);
        setMsg("Password reset email sent — check your inbox.");
        setMode("login");
        return;
      }
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Please enter your name.");
        if (!org.trim())  throw new Error("Please enter your organization name.");
        const data = await authSignUp(email, pass);
        onAuth(data, { name: name.trim(), orgName: org.trim(), isNewOrg: true });
        return;
      }
      // login
      const data = await authSignIn(email, pass);
      onAuth(data, { isNewOrg: false });
    } catch(e) {
      const msg = e.message
        .replace("EMAIL_EXISTS",    "This email is already registered.")
        .replace("INVALID_LOGIN_CREDENTIALS", "Invalid email or password.")
        .replace("WEAK_PASSWORD",   "Password must be at least 6 characters.")
        .replace("INVALID_EMAIL",   "Please enter a valid email address.");
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  const moduleList = Object.values(MODULES);

  return (
    <div style={{ ...S.app, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ background:T.brand, padding:"14px 24px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ width:"36px", height:"36px", background:"rgba(255,255,255,0.2)", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🌾</div>
        <div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", color:"#FFFFFF", fontWeight:700 }}>Agri Logix</div>
          <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.7)", textTransform:"uppercase", letterSpacing:"1.2px" }}>Farm Management Platform</div>
        </div>
      </div>

      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px" }}>
        <div style={{ width:"100%", maxWidth:"420px" }}>

          {/* Module showcase — only on login */}
          {mode === "login" && (
            <div style={{ marginBottom:"24px", textAlign:"center" }}>
              <p style={{ color:T.muted, fontSize:"13px", marginBottom:"12px" }}>Manage your entire farming operation in one place</p>
              <div style={{ display:"flex", gap:"8px", justifyContent:"center" }}>
                {moduleList.map(m => (
                  <div key={m.id} style={{ padding:"8px 12px", borderRadius:"8px", background:T.card, border:`1px solid ${T.border}`, fontSize:"12px", color:T.muted, textAlign:"center" }}>
                    <div style={{ fontSize:"20px", marginBottom:"2px" }}>{m.icon}</div>
                    <div style={{ fontWeight:600, color:m.color, fontSize:"11px" }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auth card */}
          <div style={{ ...S.card, padding:"28px" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", color:T.text, margin:"0 0 20px" }}>
              {mode === "login"  ? "Sign in"          : ""}
              {mode === "signup" ? "Create account"   : ""}
              {mode === "reset"  ? "Reset password"   : ""}
            </h2>

            {msg && <div style={{ background:"#F0F8F0", border:`1px solid #A0C8A0`, borderRadius:"6px", padding:"10px 12px", marginBottom:"14px", fontSize:"13px", color:"#2A5020" }}>{msg}</div>}

            {/* Signup extras */}
            {mode === "signup" && <>
              <div style={S.row}>
                <label style={S.label}>Your Name</label>
                <input style={S.input} type="text" placeholder="First and last name" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div style={S.row}>
                <label style={S.label}>Organization Name</label>
                <input style={S.input} type="text" placeholder="e.g. Mattson Bros Inc." value={org} onChange={e=>setOrg(e.target.value)}/>
              </div>
            </>}

            <div style={S.row}>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handle()}/>
            </div>

            {mode !== "reset" && (
              <div style={S.row}>
                <label style={S.label}>Password</label>
                <input style={S.input} type="password" placeholder={mode==="signup"?"Min. 6 characters":"••••••••"} value={pass} onChange={e=>setPass(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handle()}/>
              </div>
            )}

            {err && <p style={{ color:T.danger, fontSize:"13px", margin:"0 0 12px" }}>{err}</p>}

            <button style={{ ...mkBtn("primary", T.brand), width:"100%", justifyContent:"center", padding:"11px", fontSize:"15px" }}
              onClick={handle} disabled={busy}>
              {busy ? "Please wait…" : mode==="login" ? "Sign In" : mode==="signup" ? "Create Account" : "Send Reset Email"}
            </button>

            {/* Mode switchers */}
            <div style={{ marginTop:"16px", textAlign:"center", fontSize:"13px", color:T.muted }}>
              {mode === "login" && <>
                <span>Don't have an account? </span>
                <button style={{ background:"none", border:"none", color:T.brand, fontWeight:600, cursor:"pointer", fontSize:"13px" }} onClick={()=>{setMode("signup");setErr("");}}>Sign up</button>
                <div style={{ marginTop:"8px" }}>
                  <button style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:"12px" }} onClick={()=>{setMode("reset");setErr("");}}>Forgot password?</button>
                </div>
              </>}
              {mode === "signup" && <>
                <span>Already have an account? </span>
                <button style={{ background:"none", border:"none", color:T.brand, fontWeight:600, cursor:"pointer", fontSize:"13px" }} onClick={()=>{setMode("login");setErr("");}}>Sign in</button>
              </>}
              {mode === "reset" && (
                <button style={{ background:"none", border:"none", color:T.brand, fontWeight:600, cursor:"pointer", fontSize:"13px" }} onClick={()=>{setMode("login");setErr("");}}>← Back to sign in</button>
              )}
            </div>
          </div>

          {mode === "signup" && (
            <p style={{ textAlign:"center", fontSize:"11px", color:T.faint, marginTop:"12px" }}>
              Free 14-day trial · No credit card required · $150/module/year after trial
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
