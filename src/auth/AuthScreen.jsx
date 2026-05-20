import React, { useState, useEffect } from "react";
import { authSignIn, authSignUp, authResetPassword, dbWrite, dbRead } from "../core/firebase.js";
import { readInvite, markInviteUsed } from "../core/invites.js";
import { MODULES } from "../core/config.js";

const getInviteToken = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get("invite")) return params.get("invite");
  const hash = window.location.hash.replace("#","");
  if (hash.startsWith("invite=")) return hash.slice(7);
  return null;
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Barlow:wght@300;400;500;600&family=Share+Tech+Mono&display=swap');

  .land-root { margin:0; padding:0; min-height:100vh; display:flex; flex-direction:column; font-family:'Barlow',sans-serif; background:#F4EFE6; color:#2C1810; }

  /* ── HEADER ── */
  .land-header { background:#1A3A1A; padding:14px 32px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .land-logo { display:flex; align-items:baseline; gap:10px; }
  .land-logo-text { font-family:'Playfair Display',serif; font-size:22px; color:#F4EFE6; letter-spacing:0.04em; }
  .land-logo-text span { color:#C07010; }
  .land-logo-tag { font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(244,239,230,0.5); letter-spacing:0.15em; text-transform:uppercase; }
  .land-header-actions { display:flex; align-items:center; gap:12px; }
  .land-nav-link { font-size:13px; color:rgba(244,239,230,0.65); cursor:pointer; transition:color .15s; background:none; border:none; }
  .land-nav-link:hover { color:#C07010; }
  .land-cta-btn { background:#C07010; color:#F4EFE6; border:none; padding:8px 20px; border-radius:4px; font-family:'Barlow',sans-serif; font-size:13px; font-weight:600; cursor:pointer; letter-spacing:0.04em; transition:background .15s; }
  .land-cta-btn:hover { background:#A05A0A; }

  /* ── HERO ── */
  .land-hero { background:#1A3A1A; padding:64px 32px 80px; position:relative; overflow:hidden; }
  .land-hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30Z' fill='none' stroke='rgba(192,112,16,0.06)' stroke-width='1'/%3E%3C/svg%3E"); }
  .land-hero-inner { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:1fr 420px; gap:60px; align-items:center; position:relative; }
  .land-hero-eyebrow { font-family:'Share Tech Mono',monospace; font-size:11px; color:#C07010; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:16px; }
  .land-hero-h1 { font-family:'Playfair Display',serif; font-size:52px; font-weight:900; color:#F4EFE6; line-height:1.08; margin:0 0 20px; }
  .land-hero-h1 em { color:#C07010; font-style:normal; }
  .land-hero-sub { font-size:17px; color:rgba(244,239,230,0.7); line-height:1.65; margin:0 0 32px; font-weight:300; max-width:480px; }
  .land-hero-stats { display:flex; gap:32px; margin-top:8px; }
  .land-hero-stat-n { font-family:'Playfair Display',serif; font-size:32px; font-weight:700; color:#C07010; line-height:1; }
  .land-hero-stat-l { font-size:12px; color:rgba(244,239,230,0.5); letter-spacing:0.08em; text-transform:uppercase; margin-top:4px; }

  /* ── LOGIN CARD ── */
  .land-auth-card { background:#FDFAF4; border-radius:8px; padding:32px; box-shadow:0 8px 40px rgba(0,0,0,0.25); }
  .land-auth-card h2 { font-family:'Playfair Display',serif; font-size:22px; color:#1A3A1A; margin:0 0 6px; }
  .land-auth-card .land-auth-sub { font-size:13px; color:#7A6A58; margin:0 0 24px; }
  .land-auth-input { width:100%; padding:10px 12px; border:1px solid #C8C0B0; border-radius:4px; font-family:'Barlow',sans-serif; font-size:14px; color:#2C1810; background:#FDFAF4; outline:none; transition:border-color .15s; box-sizing:border-box; margin-bottom:12px; }
  .land-auth-input:focus { border-color:#C07010; }
  .land-auth-btn { width:100%; padding:11px; background:#1A3A1A; color:#F4EFE6; border:none; border-radius:4px; font-family:'Barlow',sans-serif; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:0.04em; transition:background .15s; }
  .land-auth-btn:hover:not(:disabled) { background:#C07010; }
  .land-auth-btn:disabled { opacity:0.6; cursor:not-allowed; }
  .land-auth-err { font-size:12px; color:#841A18; background:#FDF0EE; border:1px solid rgba(132,26,24,.2); border-radius:4px; padding:8px 10px; margin-bottom:12px; }
  .land-auth-msg { font-size:12px; color:#2A5E2A; background:#EFF8EC; border:1px solid rgba(42,94,42,.2); border-radius:4px; padding:8px 10px; margin-bottom:12px; }
  .land-auth-link { background:none; border:none; color:#C07010; font-size:12px; cursor:pointer; padding:0; text-decoration:underline; }
  .land-auth-toggle { text-align:center; margin-top:16px; font-size:13px; color:#7A6A58; }
  .land-auth-divider { height:1px; background:#E8E0D4; margin:16px 0; }

  /* ── MODULES ── */
  .land-modules { padding:80px 32px; max-width:1100px; margin:0 auto; }
  .land-section-tag { font-family:'Share Tech Mono',monospace; font-size:11px; color:#C07010; letter-spacing:0.2em; text-transform:uppercase; margin-bottom:10px; }
  .land-section-h2 { font-family:'Playfair Display',serif; font-size:38px; font-weight:700; color:#1A3A1A; margin:0 0 12px; line-height:1.15; }
  .land-section-sub { font-size:16px; color:#7A6A58; margin:0 0 56px; max-width:560px; font-weight:300; }
  .land-module-row { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-bottom:60px; align-items:center; }
  .land-module-row.reverse { direction:rtl; }
  .land-module-row.reverse > * { direction:ltr; }
  .land-module-badge { display:inline-flex; align-items:center; gap:7px; background:#E8E2D4; border-radius:20px; padding:5px 12px; font-family:'Share Tech Mono',monospace; font-size:11px; color:#5A4A3A; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px; }
  .land-module-h3 { font-family:'Playfair Display',serif; font-size:28px; font-weight:700; color:#1A3A1A; margin:0 0 12px; line-height:1.2; }
  .land-module-desc { font-size:15px; color:#5A4A3A; line-height:1.7; margin:0 0 20px; font-weight:300; }
  .land-module-features { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
  .land-module-features li { display:flex; align-items:flex-start; gap:8px; font-size:14px; color:#5A4A3A; }
  .land-module-features li::before { content:'✓'; color:#C07010; font-weight:700; flex-shrink:0; margin-top:1px; }

  /* ── MODULE MOCKUPS ── */
  .land-mockup { background:#1A2818; border-radius:8px; overflow:hidden; box-shadow:0 12px 40px rgba(0,0,0,0.2); border:1px solid #2C4A2C; }
  .land-mockup-bar { background:#142012; padding:8px 14px; display:flex; align-items:center; gap:8px; border-bottom:1px solid #2C4A2C; }
  .land-mockup-dot { width:9px; height:9px; border-radius:50%; }
  .land-mockup-title { font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(244,239,230,0.4); letter-spacing:0.12em; text-transform:uppercase; margin-left:6px; }
  .land-mockup-body { padding:16px; }

  /* FieldLog mockup */
  .fl-map { background:#1E3020; border-radius:5px; height:130px; position:relative; overflow:hidden; margin-bottom:10px; }
  .fl-map-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(192,112,16,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(192,112,16,0.07) 1px, transparent 1px); background-size:20px 20px; }
  .fl-map-field { position:absolute; top:20px; left:30px; width:120px; height:80px; background:rgba(74,117,53,0.5); border:2px solid #4a7535; clip-path:polygon(10% 0%, 90% 5%, 100% 70%, 80% 100%, 5% 85%); }
  .fl-map-label { position:absolute; top:50px; left:65px; font-family:'Share Tech Mono',monospace; font-size:9px; color:#b0c8a0; letter-spacing:0.08em; }
  .fl-map-pin { position:absolute; top:35px; left:170px; width:8px; height:8px; background:#C07010; border-radius:50%; box-shadow:0 0 8px rgba(192,112,16,0.6); }
  .fl-act { display:flex; align-items:center; gap:8px; padding:5px 7px; background:rgba(255,255,255,0.04); border-radius:4px; margin-bottom:5px; }
  .fl-act-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
  .fl-act-text { font-family:'Barlow',sans-serif; font-size:11px; color:rgba(244,239,230,0.7); flex:1; }
  .fl-act-date { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(244,239,230,0.3); }

  /* AgriScale mockup */
  .as-bins { display:flex; gap:10px; margin-bottom:10px; }
  .as-bin { flex:1; background:rgba(255,255,255,0.04); border:1px solid rgba(192,112,16,0.2); border-radius:4px; padding:8px; }
  .as-bin-name { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(244,239,230,0.4); letter-spacing:0.1em; margin-bottom:6px; text-transform:uppercase; }
  .as-bin-bar-bg { background:rgba(255,255,255,0.06); border-radius:2px; height:60px; position:relative; overflow:hidden; }
  .as-bin-fill { position:absolute; bottom:0; left:0; right:0; background:rgba(74,117,53,0.6); border-top:1px solid #4a7535; transition:height 1s; }
  .as-bin-pct { font-family:'Share Tech Mono',monospace; font-size:11px; color:#b0c8a0; text-align:center; margin-top:4px; }
  .as-weight { text-align:center; background:rgba(255,255,255,0.04); border:1px solid rgba(192,112,16,0.2); border-radius:4px; padding:10px; margin-bottom:8px; }
  .as-weight-label { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(244,239,230,0.35); letter-spacing:0.15em; text-transform:uppercase; }
  .as-weight-val { font-family:'Share Tech Mono',monospace; font-size:32px; font-weight:700; color:#4a5568; text-shadow:0 0 12px #4a5568; line-height:1.1; }
  .as-weight-unit { font-family:'Share Tech Mono',monospace; font-size:12px; color:rgba(244,239,230,0.4); }
  .as-numpad { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; }
  .as-numpad-key { background:rgba(255,255,255,0.06); border:none; border-radius:3px; color:rgba(244,239,230,0.7); font-family:'Share Tech Mono',monospace; font-size:12px; padding:5px; text-align:center; }

  /* ServiceLog mockup */
  .sl-vehicles { margin-bottom:8px; }
  .sl-vehicle { display:flex; align-items:center; gap:8px; padding:6px 8px; background:rgba(255,255,255,0.04); border-radius:4px; margin-bottom:4px; border-left:3px solid transparent; }
  .sl-vehicle.active { border-left-color:#C07010; background:rgba(192,112,16,0.08); }
  .sl-vehicle-icon { font-size:14px; }
  .sl-vehicle-name { font-family:'Barlow',sans-serif; font-size:12px; color:rgba(244,239,230,0.8); font-weight:500; flex:1; }
  .sl-vehicle-badge { font-family:'Share Tech Mono',monospace; font-size:9px; color:rgba(192,112,16,0.8); background:rgba(192,112,16,0.12); padding:2px 6px; border-radius:3px; }
  .sl-record { background:rgba(255,255,255,0.04); border-radius:4px; padding:8px 10px; border-left:3px solid #C07010; }
  .sl-record-type { font-family:'Barlow',sans-serif; font-size:12px; font-weight:600; color:rgba(244,239,230,0.9); margin-bottom:3px; }
  .sl-record-meta { font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(244,239,230,0.35); }
  .sl-record-cost { font-family:'Share Tech Mono',monospace; font-size:13px; color:#4a9a4a; float:right; }

  /* ── PRICING ── */
  .land-pricing { padding:80px 32px; background:#1A2818; }
  .land-pricing-inner { max-width:1000px; margin:0 auto; }
  .land-pricing .land-section-tag { color:#b0c8a0; }
  .land-pricing .land-section-h2 { color:#F4EFE6; }
  .land-pricing .land-section-sub { color:rgba(244,239,230,0.6); margin-bottom:48px; }
  .land-pricing-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1.2fr; gap:16px; align-items:stretch; }
  .land-price-card { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:28px 24px; display:flex; flex-direction:column; }
  .land-price-card.bundle { background:rgba(192,112,16,0.12); border:1px solid rgba(192,112,16,0.4); position:relative; overflow:hidden; }
  .land-price-card.bundle::before { content:'BEST VALUE'; position:absolute; top:14px; right:-22px; background:#C07010; color:#F4EFE6; font-family:'Share Tech Mono',monospace; font-size:9px; letter-spacing:0.15em; padding:4px 28px; transform:rotate(35deg); }
  .land-price-icon { font-size:28px; margin-bottom:12px; }
  .land-price-name { font-family:'Playfair Display',serif; font-size:20px; color:#F4EFE6; margin-bottom:6px; }
  .land-price-desc { font-size:13px; color:rgba(244,239,230,0.5); line-height:1.5; margin-bottom:20px; flex:1; }
  .land-price-amount { font-family:'Share Tech Mono',monospace; font-size:36px; color:#C07010; line-height:1; }
  .land-price-amount span { font-size:14px; color:rgba(244,239,230,0.4); font-family:'Barlow',sans-serif; }
  .land-price-save { font-family:'Share Tech Mono',monospace; font-size:11px; color:#b0c8a0; letter-spacing:0.1em; margin-top:4px; margin-bottom:20px; }
  .land-price-features { list-style:none; padding:0; margin:0 0 24px; display:flex; flex-direction:column; gap:7px; }
  .land-price-features li { font-size:13px; color:rgba(244,239,230,0.6); display:flex; gap:7px; align-items:flex-start; }
  .land-price-features li::before { content:'✓'; color:#C07010; flex-shrink:0; }
  .land-price-btn { background:transparent; color:#C07010; border:1px solid rgba(192,112,16,0.5); border-radius:4px; padding:10px; font-family:'Barlow',sans-serif; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:0.04em; transition:all .15s; }
  .land-price-btn:hover { background:#C07010; color:#F4EFE6; }
  .land-price-card.bundle .land-price-btn { background:#C07010; color:#F4EFE6; border-color:#C07010; }
  .land-price-card.bundle .land-price-btn:hover { background:#A05A0A; }
  .land-price-note { text-align:center; font-size:12px; color:rgba(244,239,230,0.35); margin-top:24px; font-family:'Share Tech Mono',monospace; letter-spacing:0.06em; }
  @media(max-width:768px){ .land-pricing-grid{ grid-template-columns:1fr 1fr; } .land-pricing{ padding:48px 20px; } }
  @media(max-width:480px){ .land-pricing-grid{ grid-template-columns:1fr; } }

  /* ── CTA ── */
  .land-cta-band { background:#1A3A1A; padding:64px 32px; text-align:center; }
  .land-cta-band h2 { font-family:'Playfair Display',serif; font-size:36px; font-weight:700; color:#F4EFE6; margin:0 0 12px; }
  .land-cta-band p { font-size:16px; color:rgba(244,239,230,0.65); margin:0 0 28px; font-weight:300; }
  .land-cta-big { background:#C07010; color:#F4EFE6; border:none; padding:14px 40px; border-radius:4px; font-family:'Barlow',sans-serif; font-size:16px; font-weight:600; cursor:pointer; letter-spacing:0.05em; transition:background .15s; }
  .land-cta-big:hover { background:#A05A0A; }

  /* ── FOOTER ── */
  .land-footer { background:#0D1E0D; padding:32px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; }
  .land-footer-logo { font-family:'Playfair Display',serif; font-size:16px; color:rgba(244,239,230,0.6); }
  .land-footer-logo span { color:#C07010; }
  .land-footer-copy { font-size:12px; color:rgba(244,239,230,0.3); font-family:'Share Tech Mono',monospace; letter-spacing:0.05em; }

  @media (max-width:768px) {
    .land-hero-inner { grid-template-columns:1fr; }
    .land-hero-h1 { font-size:36px; }
    .land-module-row, .land-module-row.reverse { grid-template-columns:1fr; direction:ltr; }
    .land-modules { padding:48px 20px; }
    .land-hero { padding:40px 20px 56px; }
  }
`;

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
  const [showLogin, setShowLogin] = useState(false);

  const inviteToken = getInviteToken();

  useEffect(() => {
    if (!inviteToken) return;
    setShowLogin(true);
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
        setMsg("Check your inbox for a reset link.");
        setBusy(false); return;
      }
      const data = await (mode === "login" ? authSignIn(email, pass) : authSignUp(email, pass));
      if (mode === "signup") {
        if (invite) {
          const userProfile = { uid:data.localId, name:name.trim(), email:data.email, tenantId:invite.tenantId, role:invite.role, createdAt:new Date().toISOString() };
          await dbWrite(`users/${data.localId}`, userProfile, data.idToken);
          await dbWrite(`tenants/${invite.tenantId}/users/${data.localId}`, userProfile, data.idToken);
          await markInviteUsed(inviteToken, data.localId, data.idToken);
        } else {
          const id = `${data.localId}_org`;
          // Check if tenant already exists — don't overwrite modules/plan if it does
          const existing = await dbRead(`tenants/${id}/profile`, data.idToken).catch(()=>null);
          if (!existing) {
            const tenant = { id, name:org.trim()||"My Farm", ownerEmail:data.email, plan:"trial", modules:["fieldlog"], createdAt:new Date().toISOString(), trialEnds:new Date(Date.now()+14*24*60*60*1000).toISOString(), active:true };
            await dbWrite(`tenants/${id}/profile`, tenant, data.idToken);
          }
          const userProfile = { uid:data.localId, name:name.trim(), email:data.email, tenantId:id, role:"owner", createdAt:new Date().toISOString() };
          await dbWrite(`users/${data.localId}`, userProfile, data.idToken);
          await dbWrite(`tenants/${id}/users/${data.localId}`, userProfile, data.idToken);
        }
      }
      onAuth({ localId:data.localId, email:data.email, idToken:data.idToken, refreshToken:data.refreshToken });
    } catch(e) {
      setErr(e.message || "Something went wrong.");
      setBusy(false);
    }
  };

  const authCard = (
    <div className="land-auth-card">
      {inviteLoading ? (
        <p style={{textAlign:"center",color:"#7A6A58",fontFamily:"'Share Tech Mono',monospace",fontSize:"13px"}}>Loading invite...</p>
      ) : (
        <>
          <h2>{mode==="login"?"Sign In":mode==="signup"?"Create Account":"Reset Password"}</h2>
          <p className="land-auth-sub">
            {mode==="login"?"Welcome back to Agri Logix":mode==="signup"?invite?`Joining ${invite.tenantName}`:"Start your 14-day trial":"Enter your email to reset your password"}
          </p>
          {err && <div className="land-auth-err">{err}</div>}
          {msg && <div className="land-auth-msg">{msg}</div>}
          {mode==="signup" && <input className="land-auth-input" placeholder="Your full name" value={name} onChange={e=>setName(e.target.value)}/>}
          {mode==="signup" && !invite && <input className="land-auth-input" placeholder="Farm / organization name" value={org} onChange={e=>setOrg(e.target.value)}/>}
          <input className="land-auth-input" placeholder="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>
          {mode!=="reset" && <input className="land-auth-input" placeholder="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()}/>}
          <button className="land-auth-btn" onClick={handle} disabled={busy}>{busy?"Please wait…":mode==="login"?"Sign In":mode==="signup"?"Create Account":"Send Reset Link"}</button>
          {mode==="login" && (
            <div style={{textAlign:"center",marginTop:"10px"}}>
              <button className="land-auth-link" onClick={()=>{setMode("reset");setErr("");setMsg("");}}>Forgot password?</button>
            </div>
          )}
          <div className="land-auth-toggle">
            {mode==="login" ? <>No account? <button className="land-auth-link" onClick={()=>{setMode("signup");setErr("");setMsg("");}}>Sign up</button></>
             : <><button className="land-auth-link" onClick={()=>{setMode("login");setErr("");setMsg("");}}>Back to sign in</button></>}
          </div>
        </>
      )}
    </div>
  );

  const ctaCard = (
    <div className="land-auth-card">
      <h2>Ready to get started?</h2>
      <p className="land-auth-sub">Join farms across the Hi-Line already using Agri Logix Solutions.</p>
      <button className="land-auth-btn" style={{marginBottom:"10px"}} onClick={()=>{setMode("signup");setShowLogin(true);}}>Start 14-Day Free Trial</button>
      <div className="land-auth-divider"/>
      <button className="land-auth-btn" style={{background:"transparent",color:"#1A3A1A",border:"1px solid #1A3A1A"}} onClick={()=>{setMode("login");setShowLogin(true);}}>Sign In to Your Account</button>
    </div>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="land-root">

        {/* Header */}
        <header className="land-header">
          <div className="land-logo">
            <span className="land-logo-text">Agri<span>Logix</span></span>
            <span className="land-logo-tag">Solutions</span>
          </div>
          <div className="land-header-actions">
            <button className="land-nav-link" onClick={()=>setShowLogin(!showLogin)}>Sign In</button>
            <button className="land-cta-btn" onClick={()=>{setMode("signup");setShowLogin(true);}}>Start Free Trial</button>
          </div>
        </header>

        {/* Hero */}
        <section className="land-hero">
          <div className="land-hero-inner">
            <div>
              <div className="land-hero-eyebrow">Farm Management Platform</div>
              <h1 className="land-hero-h1">Your whole operation,<br/><em>one platform.</em></h1>
              <p className="land-hero-sub">FieldLog, AgriScale, and ServiceLog — purpose-built for modern farm operations. Pick the module you need, or bundle all three and save 20%.</p>
              <div className="land-hero-stats">
                <div><div className="land-hero-stat-n">3</div><div className="land-hero-stat-l">Modules</div></div>
                <div><div className="land-hero-stat-n">∞</div><div className="land-hero-stat-l">Fields</div></div>
                <div><div className="land-hero-stat-n">24/7</div><div className="land-hero-stat-l">Offline sync</div></div>
              </div>
            </div>
            <div>
              {showLogin ? authCard : ctaCard}
            </div>
          </div>
        </section>

        {/* Modules */}
        <div className="land-modules">
          <div className="land-section-tag">What's included</div>
          <h2 className="land-section-h2">Three tools.<br/>Every season.</h2>
          <p className="land-section-sub">Each module is purpose-built for a specific part of your operation — no bloat, no learning curve.</p>

          {/* FieldLog */}
          <div className="land-module-row">
            <div className="land-mockup">
              <div className="land-mockup-bar">
                <div className="land-mockup-dot" style={{background:"#FF5F57"}}/>
                <div className="land-mockup-dot" style={{background:"#FFBD2E"}}/>
                <div className="land-mockup-dot" style={{background:"#28CA42"}}/>
                <span className="land-mockup-title">FieldLog — North Quarter</span>
              </div>
              <div className="land-mockup-body">
                <div className="fl-map">
                  <div className="fl-map-grid"/>
                  <div className="fl-map-field"/>
                  <div className="fl-map-label">N. QUARTER</div>
                  <div className="fl-map-pin"/>
                </div>
                <div className="fl-act"><div className="fl-act-dot" style={{background:"#FFB938"}}/><span className="fl-act-text">Canola seeding — 12.5 lbs/ac</span><span className="fl-act-date">MAY 14</span></div>
                <div className="fl-act"><div className="fl-act-dot" style={{background:"#4a9a4a"}}/><span className="fl-act-text">Herbicide application — Liberty</span><span className="fl-act-date">JUN 02</span></div>
                <div className="fl-act"><div className="fl-act-dot" style={{background:"#C07010"}}/><span className="fl-act-text">Harvest — 42.8 bu/ac</span><span className="fl-act-date">AUG 28</span></div>
              </div>
            </div>
            <div>
              <div className="land-module-badge">🌾 FieldLog</div>
              <h3 className="land-module-h3">Map-based field activity tracking</h3>
              <p className="land-module-desc">Log every activity on every field with GPS boundary mapping, crop rotation tracking, and comprehensive reports — from seeding through harvest.</p>
              <ul className="land-module-features">
                <li>Draw and store field boundaries on satellite maps</li>
                <li>Log seeding, spraying, scouting, harvest and more</li>
                <li>Crop rotation rules and history by field</li>
                <li>AI-assisted FSA map scanning for fast setup</li>
                <li>Works offline — syncs when back in range</li>
              </ul>
            </div>
          </div>

          {/* AgriScale */}
          <div className="land-module-row reverse">
            <div>
              <div className="land-module-badge">⚙️ AgriScale</div>
              <h3 className="land-module-h3">Grain cart & harvest tracking</h3>
              <p className="land-module-desc">Real-time harvest tracking with grain cart scale integration, live bin gauges, multi-field load logging, and complete harvest reports by field and commodity.</p>
              <ul className="land-module-features">
                <li>Live bin fill gauges with remaining capacity</li>
                <li>Per-field load logging with truck and grain tracking</li>
                <li>Multiple commodities with custom lbs/bushel</li>
                <li>Yield and revenue calculations per field</li>
                <li>Multi-device sync with offline queue</li>
              </ul>
            </div>
            <div className="land-mockup">
              <div className="land-mockup-bar">
                <div className="land-mockup-dot" style={{background:"#FF5F57"}}/>
                <div className="land-mockup-dot" style={{background:"#FFBD2E"}}/>
                <div className="land-mockup-dot" style={{background:"#28CA42"}}/>
                <span className="land-mockup-title">AgriScale — Harvest</span>
              </div>
              <div className="land-mockup-body">
                <div className="as-bins">
                  <div className="as-bin"><div className="as-bin-name">Bin 1</div><div className="as-bin-bar-bg"><div className="as-bin-fill" style={{height:"72%"}}/></div><div className="as-bin-pct">72%</div></div>
                  <div className="as-bin"><div className="as-bin-name">Bin 2</div><div className="as-bin-bar-bg"><div className="as-bin-fill" style={{height:"34%"}}/></div><div className="as-bin-pct">34%</div></div>
                  <div className="as-bin"><div className="as-bin-name">Bin 3</div><div className="as-bin-bar-bg"><div className="as-bin-fill" style={{height:"91%",background:"rgba(220,38,38,0.5)",borderTopColor:"#dc2626"}}/></div><div className="as-bin-pct" style={{color:"#dc6060"}}>91%</div></div>
                </div>
                <div className="as-weight"><div className="as-weight-label">Net Weight</div><div className="as-weight-val">47,320</div><div className="as-weight-unit">LBS</div></div>
                <div className="as-numpad">{["7","8","9","4","5","6","1","2","3","⌫","0","✓"].map(k=><div key={k} className="as-numpad-key" style={{background:k==="✓"?"rgba(74,117,53,0.4)":undefined,color:k==="✓"?"#b0c8a0":undefined}}>{k}</div>)}</div>
              </div>
            </div>
          </div>

          {/* ServiceLog */}
          <div className="land-module-row">
            <div className="land-mockup">
              <div className="land-mockup-bar">
                <div className="land-mockup-dot" style={{background:"#FF5F57"}}/>
                <div className="land-mockup-dot" style={{background:"#FFBD2E"}}/>
                <div className="land-mockup-dot" style={{background:"#28CA42"}}/>
                <span className="land-mockup-title">ServiceLog — Fleet</span>
              </div>
              <div className="land-mockup-body">
                <div className="sl-vehicles">
                  <div className="sl-vehicle active"><span className="sl-vehicle-icon">🚜</span><span className="sl-vehicle-name">JD 9620R</span><span className="sl-vehicle-badge">7,842 hrs</span></div>
                  <div className="sl-vehicle"><span className="sl-vehicle-icon">🌾</span><span className="sl-vehicle-name">JD S780 Combine</span><span className="sl-vehicle-badge">3,241 hrs</span></div>
                  <div className="sl-vehicle"><span className="sl-vehicle-icon">🚛</span><span className="sl-vehicle-name">2018 Peterbilt 389</span><span className="sl-vehicle-badge">412,000 mi</span></div>
                </div>
                <div className="sl-record">
                  <span className="sl-record-cost">$847</span>
                  <div className="sl-record-type">Hydraulic Service — Filter change</div>
                  <div className="sl-record-meta">MAY 12 · 7,841 HRS · J. MATTSON</div>
                </div>
              </div>
            </div>
            <div>
              <div className="land-module-badge">🔧 ServiceLog</div>
              <h3 className="land-module-h3">Fleet & equipment maintenance</h3>
              <p className="land-module-desc">Keep your equipment running with complete service history, parts ordering, vendor tracking, invoicing, and cost analysis for your entire fleet.</p>
              <ul className="land-module-features">
                <li>Full service history per vehicle with cost tracking</li>
                <li>Parts ordering with receive tracking and price lookup</li>
                <li>Parts inventory with low-stock alerts</li>
                <li>Customer invoicing for service work</li>
                <li>Cost analysis by equipment, type, and year</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="land-pricing">
          <div className="land-pricing-inner">
            <div className="land-section-tag">Simple pricing</div>
            <h2 className="land-section-h2">Pick what you need.<br/>Bundle and save.</h2>
            <p className="land-section-sub">Start with one module or go all-in. Every plan includes a 14-day free trial, offline sync, and multi-device access.</p>
            <div className="land-pricing-grid">
              {/* FieldLog */}
              <div className="land-price-card">
                <div className="land-price-icon">🌾</div>
                <div className="land-price-name">FieldLog</div>
                <div className="land-price-desc">Field activity tracking, GPS boundaries, crop rotation, and harvest reports.</div>
                <div className="land-price-amount">$150<span>/yr</span></div>
                <div className="land-price-save">&nbsp;</div>
                <ul className="land-price-features">
                  <li>Unlimited fields &amp; boundaries</li>
                  <li>Activity logging</li>
                  <li>Crop rotation tracking</li>
                  <li>AI-assisted FSA map scan</li>
                </ul>
                <button className="land-price-btn" onClick={()=>{setMode("signup");setShowLogin(true);window.scrollTo({top:0,behavior:"smooth"});}}>Start Free Trial</button>
              </div>
              {/* AgriScale */}
              <div className="land-price-card">
                <div className="land-price-icon">⚙️</div>
                <div className="land-price-name">AgriScale</div>
                <div className="land-price-desc">Grain cart tracking, live bin gauges, multi-field load logging, and harvest reports.</div>
                <div className="land-price-amount">$150<span>/yr</span></div>
                <div className="land-price-save">&nbsp;</div>
                <ul className="land-price-features">
                  <li>Unlimited bins &amp; fields</li>
                  <li>Live bin fill gauges</li>
                  <li>Per-field yield tracking</li>
                  <li>Multi-device sync</li>
                </ul>
                <button className="land-price-btn" onClick={()=>{setMode("signup");setShowLogin(true);window.scrollTo({top:0,behavior:"smooth"});}}>Start Free Trial</button>
              </div>
              {/* ServiceLog */}
              <div className="land-price-card">
                <div className="land-price-icon">🔧</div>
                <div className="land-price-name">ServiceLog</div>
                <div className="land-price-desc">Fleet maintenance, parts ordering, vendor tracking, invoicing, and cost analysis.</div>
                <div className="land-price-amount">$150<span>/yr</span></div>
                <div className="land-price-save">&nbsp;</div>
                <ul className="land-price-features">
                  <li>Unlimited equipment</li>
                  <li>Full service history</li>
                  <li>Parts &amp; inventory tracking</li>
                  <li>Customer invoicing</li>
                </ul>
                <button className="land-price-btn" onClick={()=>{setMode("signup");setShowLogin(true);window.scrollTo({top:0,behavior:"smooth"});}}>Start Free Trial</button>
              </div>
              {/* Bundle */}
              <div className="land-price-card bundle">
                <div className="land-price-icon">🌾⚙️🔧</div>
                <div className="land-price-name">Full Bundle</div>
                <div className="land-price-desc">All three modules. The complete picture of your farm operation — fields, harvest, and equipment.</div>
                <div className="land-price-amount">$360<span>/yr</span></div>
                <div className="land-price-save">↓ SAVE $90 vs. buying separately</div>
                <ul className="land-price-features">
                  <li>Everything in all 3 modules</li>
                  <li>Cross-module reporting</li>
                  <li>AgriScale + FieldLog sync</li>
                  <li>Unlimited users</li>
                </ul>
                <button className="land-price-btn" onClick={()=>{setMode("signup");setShowLogin(true);window.scrollTo({top:0,behavior:"smooth"});}}>Start Free Trial</button>
              </div>
            </div>
            <div className="land-price-note">All prices in USD · Annual billing · No credit card required for trial</div>
          </div>
        </div>

        {/* CTA band */}
        <div className="land-cta-band">
          <h2>Ready to bring it all together?</h2>
          <p>Start your free 14-day trial — no credit card required.</p>
          <button className="land-cta-big" onClick={()=>{setMode("signup");setShowLogin(true);window.scrollTo({top:0,behavior:"smooth"});}}>Get Started Free</button>
        </div>

        {/* Footer */}
        <footer className="land-footer">
          <div className="land-footer-logo">Agri<span>Logix</span> Solutions</div>
          <div className="land-footer-copy">© {new Date().getFullYear()} · Built for the Hi-Line</div>
        </footer>

      </div>
    </>
  );
}
