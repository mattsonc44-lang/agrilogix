import React, { useState, useEffect, useRef } from "react";
import { T, S, mkBtn } from "./core/theme.js";
import { MODULES, FB_CONFIGURED, ROLES } from "./core/config.js";
import { dbRead, dbWrite, dbListen } from "./core/firebase.js";
import { authRefreshToken } from "./core/firebase.js";
import { obj2arr, genId, nowLocal, fmtDate } from "./core/helpers.js";
import AuthScreen  from "./auth/AuthScreen.jsx";
import AdminPanel  from "./admin/AdminPanel.jsx";

// ── Lazy module imports ───────────────────────────────────────────
// (Each module is a separate file, loaded as needed)
import FieldLogModule  from "./modules/fieldlog/index.jsx";

// Placeholder components for modules not yet built
const ComingSoon = ({ module }) => (
  <div style={{ ...S.content, textAlign:"center", paddingTop:"60px" }}>
    <div style={{ fontSize:"48px", marginBottom:"16px" }}>{module.icon}</div>
    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"24px", color:module.color, marginBottom:"8px" }}>{module.label}</h2>
    <p style={{ color:T.muted }}>This module is coming soon. Stay tuned.</p>
  </div>
);

// ── Session storage key ───────────────────────────────────────────
const SESSION_KEY = "al_session";

const saveSession = (data) => {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch(_) {}
};
const loadSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(_) { return null; }
};
const clearSession = () => {
  try { localStorage.removeItem(SESSION_KEY); } catch(_) {}
};

// ── ADMIN UID — your Firebase UID goes here ───────────────────────
const ADMIN_UID = "YOUR-ADMIN-UID";

export default function App() {
  const [session,  setSession]  = useState(null);     // { idToken, localId, email, refreshToken }
  const [profile,  setProfile]  = useState(null);     // { name, tenantId, role }
  const [tenant,   setTenant]   = useState(null);     // { profile: { name, modules, plan, ... } }
  const [module,   setModule]   = useState(null);     // active module id
  const [loading,  setLoading]  = useState(true);
  const [authErr,  setAuthErr]  = useState("");
  const [showAdmin,setShowAdmin]= useState(false);
  const [syncStatus,setSyncStatus]=useState("idle");
  const refreshTimer = useRef(null);

  const isAdmin = session?.localId === ADMIN_UID;

  // ── Bootstrap: restore session ───────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved?.idToken && saved?.localId) {
      setSession(saved);
      loadUserProfile(saved);
    } else {
      setLoading(false);
    }
  }, []);

  // ── Token auto-refresh ────────────────────────────────────────────
  useEffect(() => {
    if (!session?.refreshToken) return;
    // Refresh 5 minutes before expiry (tokens expire in 1 hour)
    const ms = ((parseInt(session.expiresIn)||3600) - 300) * 1000;
    refreshTimer.current = setTimeout(async () => {
      try {
        const data = await authRefreshToken(session.refreshToken);
        const updated = { ...session, idToken: data.id_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
        setSession(updated);
        saveSession(updated);
      } catch(_) {}
    }, Math.max(ms, 30000));
    return () => clearTimeout(refreshTimer.current);
  }, [session]);

  const loadUserProfile = async (sess) => {
    setLoading(true);
    try {
      // Load user profile from db
      const userProfile = await dbRead(`users/${sess.localId}`, sess.idToken);
      if (userProfile?.tenantId) {
        setProfile(userProfile);
        const tenantData = await dbRead(`tenants/${userProfile.tenantId}`, sess.idToken);
        setTenant(tenantData);
        // Default to first available module
        const mods = tenantData?.profile?.modules || [];
        if (mods.length) setModule(mods[0]);
      } else {
        // New user — no tenant assigned yet (pending admin setup)
        setProfile({ email: sess.email, pendingSetup: true });
      }
    } catch(e) {
      setAuthErr("Could not load your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (authData, extra) => {
    setLoading(true);
    setAuthErr("");
    try {
      saveSession(authData);
      setSession(authData);

      if (extra.isNewOrg) {
        // Create tenant + user profile for self-signup
        const tenantId = authData.localId + "_org";
        const tenantProfile = {
          id: tenantId, name: extra.orgName,
          ownerEmail: authData.email,
          plan: "trial",
          modules: ["fieldlog"],
          createdAt: new Date().toISOString(),
          trialEnds: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
          active: true,
        };
        await dbWrite(`tenants/${tenantId}/profile`, tenantProfile, authData.idToken);

        const userProfile = {
          uid: authData.localId, name: extra.name,
          email: authData.email, tenantId,
          role: "owner", createdAt: new Date().toISOString(),
        };
        await dbWrite(`users/${authData.localId}`, userProfile, authData.idToken);
        setProfile(userProfile);
        setTenant({ profile: tenantProfile });
        setModule("fieldlog");
      } else {
        await loadUserProfile(authData);
      }
    } catch(e) {
      setAuthErr(e.message);
      setLoading(false);
    }
  };

  const signOut = () => {
    clearSession();
    setSession(null); setProfile(null); setTenant(null); setModule(null);
  };

  // ── Tenant data persistence ───────────────────────────────────────
  const tenantPath = profile?.tenantId ? `tenants/${profile.tenantId}` : null;
  const token = session?.idToken;

  const persist = async (subPath, data) => {
    if (!tenantPath || !token) return;
    setSyncStatus("saving");
    try {
      await dbWrite(`${tenantPath}/${subPath}`, data, token);
      setSyncStatus("saved");
    } catch { setSyncStatus("error"); }
    finally { setTimeout(() => setSyncStatus("idle"), 1500); }
  };

  // ── Render guards ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"16px", minHeight:"100vh" }}>
      <div style={{ fontSize:"40px" }}>🌾</div>
      <p style={{ color:T.muted }}>Loading Agri Logix…</p>
    </div>
  );

  if (!session) return <AuthScreen onAuth={handleAuth} />;

  if (profile?.pendingSetup) return (
    <div style={{ ...S.app, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
      <div style={{ ...S.card, maxWidth:"400px", padding:"32px", textAlign:"center" }}>
        <div style={{ fontSize:"40px", marginBottom:"12px" }}>⏳</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", marginBottom:"8px" }}>Account pending setup</h2>
        <p style={{ color:T.muted, marginBottom:"16px" }}>Your account has been created. An administrator will grant you access shortly.</p>
        <button style={mkBtn("ghost")} onClick={signOut}>Sign out</button>
      </div>
    </div>
  );

  if (showAdmin && isAdmin) return <AdminPanel user={session} token={token} onBack={()=>setShowAdmin(false)}/>;

  const tenantProfile = tenant?.profile || {};
  const enabledModules = tenantProfile.modules || [];
  const syncDot = { idle:"#D8CEBC", saving:T.gold, saved:T.green, error:T.danger }[syncStatus];

  return (
    <div style={S.app}>
      {/* ── Top Nav ── */}
      <div style={{ background:T.brand, padding:"0 16px", display:"flex", alignItems:"center", gap:"0", position:"sticky", top:0, zIndex:50 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px 10px 0", marginRight:"8px" }}>
          <div style={{ width:"30px", height:"30px", background:"rgba(255,255,255,0.2)", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🌾</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", color:"#FFFFFF", fontWeight:700, whiteSpace:"nowrap" }}>Agri Logix</div>
        </div>

        {/* Module tabs */}
        <div style={{ display:"flex", flex:1, overflowX:"auto" }}>
          {enabledModules.map(mid => {
            const m = MODULES[mid];
            if (!m) return null;
            const active = module === mid;
            return (
              <button key={mid} onClick={()=>setModule(mid)} style={{
                display:"flex", alignItems:"center", gap:"6px",
                padding:"14px 16px", border:"none", cursor:"pointer",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                fontSize:"13px", fontWeight: active ? 700 : 400,
                borderBottom: active ? "2px solid #FFFFFF" : "2px solid transparent",
                fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap",
                transition:"all .15s",
              }}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, paddingLeft:"8px" }}>
          {/* Sync dot */}
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:syncDot }}/>
          {/* Org name */}
          <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", display:"none" }}>{tenantProfile.name}</span>
          {/* Plan badge */}
          {tenantProfile.plan==="trial" && (
            <span style={{ fontSize:"10px", background:"rgba(255,200,0,0.3)", color:"#FFE080", padding:"2px 6px", borderRadius:"4px", fontWeight:700 }}>TRIAL</span>
          )}
          {/* Admin link */}
          {isAdmin && (
            <button style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:"11px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={()=>setShowAdmin(true)}>Admin</button>
          )}
          {/* User menu */}
          <button style={{ ...mkBtn("ghost"), padding:"4px 10px", fontSize:"12px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* ── Not configured warning ── */}
      {!FB_CONFIGURED && (
        <div style={{ background:"#FDF6EC", borderBottom:`1px solid #D4A840`, padding:"8px 20px", fontSize:"12px", color:"#7A5008", display:"flex", gap:"8px", alignItems:"center" }}>
          ⚠️ Firebase not configured — update <code style={{ background:"#F0E4C8", padding:"1px 4px", borderRadius:"3px" }}>FIREBASE_URL</code> in <code style={{ background:"#F0E4C8", padding:"1px 4px", borderRadius:"3px" }}>src/core/config.js</code>
        </div>
      )}

      {/* ── Module content ── */}
      <div>
        {module === "fieldlog"   && <FieldLogModule  tenantId={profile.tenantId} token={token} userProfile={profile} persist={persist}/>}
        {module === "agriScale"  && <ComingSoon module={MODULES.agriScale}/>}
        {module === "serviceLog" && <ComingSoon module={MODULES.serviceLog}/>}
        {!module && enabledModules.length === 0 && (
          <div style={{ ...S.content, textAlign:"center", paddingTop:"60px" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>🌾</div>
            <p style={{ color:T.muted }}>No modules enabled for your account. Contact your administrator.</p>
          </div>
        )}
      </div>
    </div>
  );
}
