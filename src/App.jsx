import React, { useState, useEffect, useRef } from "react";
import { T, S, mkBtn } from "./core/theme.js";
import { MODULES, FB_CONFIGURED, ROLES } from "./core/config.js";
import { dbRead, dbWrite, dbListen } from "./core/firebase.js";
import { authRefreshToken } from "./core/firebase.js";
import { obj2arr, genId } from "./core/helpers.js";
import AuthScreen  from "./auth/AuthScreen.jsx";
import OnboardingWizard from "./onboarding/OnboardingWizard.jsx";
import AdminPanel  from "./admin/AdminPanel.jsx";
import OrgPanel    from "./admin/OrgPanel.jsx";
import FieldLogModule   from "./modules/fieldlog/index.jsx";
import ServiceLogModule from "./modules/serviceLog/index.jsx";
import AgriScaleModule  from "./modules/agriScale/index.jsx";
import AgriPlanModule  from "./modules/agriPlan/index.jsx";

// ── Farm colors ───────────────────────────────────────────────────
const FARM_COLORS = [
  "#4A7535","#C07010","#1E5FA8","#C0392B",
  "#7B3F9E","#0E7C7B","#8B5E3C","#2C3E7A",
];
const DEFAULT_FARM = { id:"default", name:"Default Farm", color:FARM_COLORS[0] };

// ── Session helpers ───────────────────────────────────────────────
const SESSION_KEY = "al_session";
const saveSession = (d) => { try { localStorage.setItem(SESSION_KEY,JSON.stringify(d)); } catch(_){} };
const loadSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch(_){ return null; } };

const ADMIN_UID = (typeof window !== "undefined" && window.__ADMIN_UID__) || "";

export default function App() {
  const [session,    setSession]    = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [profile,    setProfile]    = useState(null);
  const [tenant,     setTenant]     = useState(null);
  const [module,     setModule]     = useState(()=>window.location.hash.slice(1)||null);
  const [loading,    setLoading]    = useState(true);
  const [authErr,    setAuthErr]    = useState("");
  const [showAdmin,  setShowAdmin]  = useState(false);
  const [showOrg,    setShowOrg]    = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [farms,      setFarms]      = useState([]);
  const [activeFarm, setActiveFarm] = useState(DEFAULT_FARM);
  const [farmModal,  setFarmModal]  = useState(null); // null | "new" | {id,name,color}
  const [adminViewTenantId,   setAdminViewTenantId]   = useState(null); // admin impersonation
  const [adminViewTenantName, setAdminViewTenantName] = useState("");
  const refreshTimer = useRef(null);
  const isAdmin = session?.localId === ADMIN_UID;
  // When admin is viewing a tenant, use that tenantId instead of their own
  const effectiveTenantId = adminViewTenantId || profile?.tenantId;

  // ── Bootstrap — always refresh token on load so it never expires silently ────
  useEffect(() => {
    const boot = async () => {
      const saved = loadSession();
      if (!saved?.idToken || !saved?.localId) { setLoading(false); return; }
      let sess = saved;
      if (saved.refreshToken) {
        try {
          const d = await authRefreshToken(saved.refreshToken);
          if (d?.id_token) {
            sess = { ...saved, idToken: d.id_token, refreshToken: d.refresh_token || saved.refreshToken, expiresIn: d.expires_in || "3600" };
            saveSession(sess);
          }
        } catch(e) { console.warn("Token refresh on boot failed:", e.message); }
      }
      setSession(sess);
      loadUserProfile(sess);
    };
    boot();
  }, []);

  // ── Token refresh ─────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.refreshToken) return;
    const ms = ((parseInt(session.expiresIn)||3600) - 300) * 1000;
    refreshTimer.current = setTimeout(async () => {
      try {
        const d = await authRefreshToken(session.refreshToken);
        const updated = { ...session, idToken:d.id_token, refreshToken:d.refresh_token, expiresIn:d.expires_in };
        setSession(updated); saveSession(updated);
      } catch(_) {}
    }, Math.max(ms, 30000));
    return () => clearTimeout(refreshTimer.current);
  }, [session]);

  // ── Onboarding wizard trigger ────────────────────────────────────
  useEffect(()=>{
    if(!profile?.tenantId||!session?.idToken) return;
    if(profile.role!=="owner") return;
    fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${profile.tenantId}/setup.json?auth=${session.idToken}`)
      .then(r=>r.json()).then(d=>{ if(!d?.completed) setShowWizard(true); }).catch(()=>{});
  },[profile?.tenantId,profile?.role,session?.idToken]);

  // ── Live tenant profile listener ─────────────────────────────────
  useEffect(() => {
    if (!profile?.tenantId || !session?.idToken) return;
    return dbListen(`tenants/${profile.tenantId}/profile`, session.idToken, ({ data }) => {
      if (!data) return;
      setTenant(t => ({ ...t, profile: data }));
    });
  }, [profile?.tenantId, session?.idToken]);

  // ── Background prefetch: cache all module data while online ────────
  useEffect(() => {
    if (!session?.idToken || !profile?.tenantId) return;
    if (!navigator.onLine) return;
    const tid = profile.tenantId;
    const tok = session.idToken;
    const bases = [
      { key: `sl_cache_${tid}`,  path: `tenants/${tid}/serviceLog`  },
      { key: `as_cache_${tid}`,  path: `tenants/${tid}/agriScale`   },
      { key: `fl_cache_${tid}_default`, path: `tenants/${tid}/fieldlog` },
    ];
    bases.forEach(({ key, path }) => {
      dbRead(path, tok)
        .then(d => { if(d) try{ localStorage.setItem(key, JSON.stringify({...d,_at:Date.now()})); }catch(e){} })
        .catch(() => {}); // silent — prefetch only, no impact on UI
    });
  }, [profile?.tenantId, session?.idToken]);

  // ── Safety net: set module if not set after loading ───────────────
  useEffect(() => {
    if (!loading && session && profile?.tenantId && !module) {
      const mods = tenant?.profile?.modules || [];
      const allowlist = profile?.modules;
      const available = (allowlist != null && allowlist.length > 0) ? mods.filter(m => allowlist.includes(m)) : mods;
      if (available.length > 0) {
        const hash = window.location.hash.slice(1);
        const target = hash && available.includes(hash) ? hash : available[0];
        window.location.hash = target;
        setModule(target);
      }
    }
  }, [loading, tenant, profile, session, module]);

  // ── Load farms ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile?.tenantId || !session?.idToken) return;
    dbRead(`tenants/${profile.tenantId}/farms`, session.idToken)
      .then(data => {
        const list = obj2arr(data || {}).map(f => f?.profile).filter(Boolean);
        setFarms(list);
      })
      .catch(() => setFarms([]));
  }, [profile?.tenantId, session?.idToken]);

  // ── Restore active farm from localStorage ────────────────────────
  useEffect(() => {
    if (!profile?.tenantId) return;
    const saved = localStorage.getItem(`al_farm_${profile.tenantId}`);
    if (saved === "default") { setActiveFarm(DEFAULT_FARM); return; }
    if (saved) {
      const f = farms.find(f => f.id === saved);
      if (f) setActiveFarm(f);
    }
  }, [profile?.tenantId, farms]);

  // ── Persist active farm ───────────────────────────────────────────
  useEffect(() => {
    if (profile?.tenantId) localStorage.setItem(`al_farm_${profile.tenantId}`, activeFarm.id);
  }, [activeFarm.id, profile?.tenantId]);

  const loadUserProfile = async (sess) => {
    setLoading(true);
    try {
      const userProfile = await dbRead(`users/${sess.localId}`, sess.idToken);
      if (userProfile?.tenantId) {
        const tenantProfile = await dbRead(`tenants/${userProfile.tenantId}/profile`, sess.idToken);
        const tenantMods = tenantProfile?.modules || [];
        const userAllowlist = userProfile.modules;
        const mods = (userAllowlist != null && userAllowlist.length > 0)
          ? tenantMods.filter(m => userAllowlist.includes(m)) : tenantMods;
        setProfile(userProfile);
        setTenant({ profile: tenantProfile });
        if (mods.length) {
          const hash = window.location.hash.slice(1);
          const target = hash && mods.includes(hash) ? hash : mods[0];
          window.location.hash = target;
          setModule(target);
        }
      } else {
        setProfile({ email: sess.email, pendingSetup: true });
      }
    } catch(e) {
      setAuthErr("Could not load your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (authData) => { saveSession(authData); window.location.reload(); };
  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(`al_farm_${profile?.tenantId}`);
    window.location.reload();
  };

  const persist = (status) => { setSyncStatus(status); if (status !== "saving") setTimeout(() => setSyncStatus("idle"), 2000); };

  // ── Farm management ───────────────────────────────────────────────
  const saveFarm = async (name, color, editId) => {
    const tenantId = profile.tenantId;
    if (editId && editId !== "default") {
      // Edit existing
      const updated = { ...farms.find(f=>f.id===editId), name, color };
      await dbWrite(`tenants/${tenantId}/farms/${editId}/profile`, updated, session.idToken);
      setFarms(f => f.map(x => x.id===editId ? updated : x));
      if (activeFarm.id === editId) setActiveFarm(updated);
    } else if (!editId) {
      // Create new
      const id = genId();
      const farm = { id, name, color, createdAt: new Date().toISOString() };
      await dbWrite(`tenants/${tenantId}/farms/${id}/profile`, farm, session.idToken);
      setFarms(f => [...f, farm]);
      setActiveFarm(farm);
    }
    setFarmModal(null);
  };

  const deleteFarm = async (farmId) => {
    if (!confirm(`Delete "${farms.find(f=>f.id===farmId)?.name}"? All data in this farm will be lost.`)) return;
    if (!confirm("Second confirmation — this cannot be undone.")) return;
    await dbWrite(`tenants/${profile.tenantId}/farms/${farmId}`, null, session.idToken);
    setFarms(f => f.filter(x => x.id !== farmId));
    if (activeFarm.id === farmId) setActiveFarm(DEFAULT_FARM);
    setFarmModal(null);
  };

  // ── Loading / Auth screens ────────────────────────────────────────
  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:T.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"40px", marginBottom:"12px" }}>🌾</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", color:T.brand }}>Loading…</div>
      </div>
    </div>
  );
  if (!session) return <AuthScreen onAuth={handleAuth}/>;

  if (showAdmin && isAdmin) return <AdminPanel user={session} token={session.idToken} onBack={()=>setShowAdmin(false)} onViewTenant={(id, name)=>{setAdminViewTenantId(id);setAdminViewTenantName(name||id);setShowAdmin(false);}} adminViewTenantId={adminViewTenantId}/>;

  const tenantProfile  = tenant?.profile || {};
  const tenantModules  = tenantProfile.modules || [];
  const userAllowlist  = profile?.modules;
  const enabledModules = (userAllowlist != null && userAllowlist.length > 0)
    ? tenantModules.filter(m => userAllowlist.includes(m)) : tenantModules;
  const syncDot = { idle:"#D8CEBC", saving:T.gold, saved:T.green, error:T.danger }[syncStatus];
  const showFarmPicker = ["fieldlog","agriScale"].includes(module);
  const allFarms = [DEFAULT_FARM, ...farms];

  return (
    <div style={S.app}>
      {/* ── Top Nav ── */}
      <div style={{ background:T.brand, padding:"0 16px", display:"flex", alignItems:"center", gap:"0", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px 10px 0", marginRight:"8px" }}>
          <div style={{ width:"30px", height:"30px", background:"rgba(255,255,255,0.2)", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🌾</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", color:"#FFFFFF", fontWeight:700, whiteSpace:"nowrap" }}>Agri Logix</div>
        </div>
        <div style={{ display:"flex", flex:1, overflowX:"auto" }}>
          {enabledModules.map(mid => {
            const m = MODULES[mid]; if (!m) return null;
            const active = module === mid;
            return (
              <button key={mid} onClick={()=>{ window.location.hash = mid; setModule(mid); }} style={{
                display:"flex", alignItems:"center", gap:"6px", padding:"14px 16px",
                border:"none", cursor:"pointer",
                background: active ? "rgba(255,255,255,0.15)" : "transparent",
                color: active ? "#FFFFFF" : "rgba(255,255,255,0.65)",
                fontSize:"13px", fontWeight: active ? 700 : 400,
                borderBottom: active ? "2px solid #FFFFFF" : "2px solid transparent",
                fontFamily:"'Barlow',sans-serif", whiteSpace:"nowrap", transition:"all .15s",
              }}>
                <span>{m.icon}</span><span>{m.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0, paddingLeft:"8px" }}>
          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:syncDot }}/>
          {tenantProfile.plan==="trial" && (
            <span style={{ fontSize:"10px", background:"rgba(255,200,0,0.3)", color:"#FFE080", padding:"2px 6px", borderRadius:"4px", fontWeight:700 }}>TRIAL</span>
          )}
          {isAdmin && (
            <button style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:"11px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={()=>setShowAdmin(true)}>Admin</button>
          )}
          {(profile?.role==="owner"||profile?.role==="manager") && (
            <button style={{ ...mkBtn("ghost"), padding:"4px 8px", fontSize:"11px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={()=>setShowOrg(true)}>⚙️ Org</button>
          )}
          <button style={{ ...mkBtn("ghost"), padding:"4px 10px", fontSize:"12px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={signOut}>Sign out</button>
        </div>
      </div>

      {/* ── Farm Picker ── */}
      {showFarmPicker && (
        <div style={{ background:"#F0EBE0", borderBottom:`1px solid ${T.border}`, padding:"6px 16px", display:"flex", alignItems:"center", gap:"6px", overflowX:"auto" }}>
          {allFarms.map(f => {
            const active = activeFarm.id === f.id;
            return (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:"0", flexShrink:0 }}>
                <button onClick={()=>setActiveFarm(f)} style={{
                  display:"flex", alignItems:"center", gap:"7px", padding:"5px 12px",
                  borderRadius: f.id !== "default" ? "6px 0 0 6px" : "6px",
                  border:`1px solid ${active ? f.color : T.border}`,
                  borderRight: f.id !== "default" ? "none" : undefined,
                  background: active ? f.color : "#FDFAF4",
                  color: active ? "#FFFFFF" : T.text,
                  cursor:"pointer", fontSize:"12px", fontWeight: active ? 700 : 400,
                  transition:"all .15s",
                }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background: active ? "rgba(255,255,255,0.8)" : f.color, flexShrink:0 }}/>
                  {f.name}
                </button>
                {f.id !== "default" && (
                  <button onClick={()=>setFarmModal({id:f.id, name:f.name, color:f.color})} style={{
                    padding:"5px 7px", borderRadius:"0 6px 6px 0",
                    border:`1px solid ${active ? f.color : T.border}`,
                    background: active ? f.color+"CC" : "#F0EBE0",
                    color: active ? "#FFFFFF" : T.muted,
                    cursor:"pointer", fontSize:"11px", lineHeight:1,
                  }}>✏️</button>
                )}
              </div>
            );
          })}
          <button onClick={()=>setFarmModal("new")} style={{
            ...mkBtn("ghost"), padding:"5px 10px", fontSize:"12px", flexShrink:0,
            color:T.brand, borderColor:T.brand+"60",
          }}>+ Farm</button>
        </div>
      )}

      {/* ── Warnings ── */}
      {!FB_CONFIGURED && (
        <div style={{ background:"#FDF6EC", borderBottom:`1px solid #D4A840`, padding:"8px 20px", fontSize:"12px", color:"#7A5008" }}>
          ⚠️ Firebase not configured
        </div>
      )}

      {showWizard&&profile?.role==="owner"&&<OnboardingWizard
        tenantId={effectiveTenantId}
        token={session?.idToken}
        profile={profile}
        tenant={tenant}
        onComplete={()=>setShowWizard(false)}/>}
      {showOrg && <OrgPanel session={session} profile={profile} tenant={tenant} onClose={()=>setShowOrg(false)}/>}

      {/* ── Admin view banner ── */}
      {adminViewTenantId && (
        <div style={{ background:"#C05000", color:"#fff", padding:"8px 20px", fontSize:13,
          display:"flex", alignItems:"center", justifyContent:"space-between", fontFamily:"'Barlow',sans-serif" }}>
          <span>👁 <strong>Admin View: {adminViewTenantName}</strong> — you are seeing their data. Your own data is not affected.</span>
          <button onClick={()=>setAdminViewTenantId(null)}
            style={{ background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.4)",
              borderRadius:5, color:"#fff", padding:"3px 14px", cursor:"pointer", fontSize:12, fontFamily:"inherit" }}>
            ✕ Exit Admin View
          </button>
        </div>
      )}

      {/* ── Modules ── */}
      <div>
        {module === "fieldlog"   && <FieldLogModule   key={`fl-${activeFarm.id}`}  farmId={activeFarm.id}  tenantId={effectiveTenantId} token={session.idToken} userProfile={{...profile, role: profile.moduleRoles?.fieldlog   || profile.role}} persist={persist}/>}
        {module === "agriScale"  && <AgriScaleModule  key={`as-${activeFarm.id}`}  farmId={activeFarm.id}  tenantId={effectiveTenantId} token={session.idToken} userProfile={{...profile, role: profile.moduleRoles?.agriScale   || profile.role}} persist={persist}/>}
        {module === "serviceLog" && <ServiceLogModule tenantId={effectiveTenantId} token={session.idToken} userProfile={{...profile, role: profile.moduleRoles?.serviceLog  || profile.role}} persist={persist}/>}
        {module === "agriPlan"   && <AgriPlanModule  tenantId={effectiveTenantId} token={session.idToken} userProfile={{...profile, role: profile.moduleRoles?.agriPlan   || profile.role}} persist={persist}/>}
        {!module && enabledModules.length === 0 && (
          <div style={{ ...S.content, textAlign:"center", paddingTop:"60px" }}>
            <div style={{ fontSize:"48px", marginBottom:"16px" }}>🌾</div>
            <p style={{ color:T.muted }}>No modules enabled. Contact your administrator.</p>
          </div>
        )}
      </div>

      {/* ── Farm Modal ── */}
      {farmModal && <FarmModal
        initial={farmModal === "new" ? null : farmModal}
        onSave={saveFarm}
        onDelete={farmModal !== "new" ? ()=>deleteFarm(farmModal.id) : null}
        onClose={()=>setFarmModal(null)}
      />}
    </div>
  );
}

// ── Farm Create/Edit Modal ────────────────────────────────────────────
function FarmModal({ initial, onSave, onDelete, onClose }) {
  const [name,  setName]  = useState(initial?.name  || "");
  const [color, setColor] = useState(initial?.color || FARM_COLORS[0]);
  const [busy,  setBusy]  = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onSave(name.trim(), color, initial?.id || null);
    setBusy(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:T.cardBg, borderRadius:"10px", padding:"28px", width:"100%", maxWidth:"380px", boxShadow:"0 8px 40px rgba(0,0,0,0.25)" }}>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"20px", margin:"0 0 20px", color:T.text }}>
          {initial ? "Edit Farm" : "New Farm"}
        </h2>

        <label style={S.label}>Farm Name</label>
        <input style={{ ...S.input, marginBottom:"16px" }} placeholder="e.g. North Quarter" value={name} onChange={e=>setName(e.target.value)} autoFocus/>

        <label style={S.label}>Color</label>
        <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"20px" }}>
          {FARM_COLORS.map(c => (
            <button key={c} onClick={()=>setColor(c)} style={{
              width:"30px", height:"30px", borderRadius:"50%", background:c, border:`3px solid ${color===c?"#FFFFFF":c}`,
              outline: color===c ? `2px solid ${c}` : "none", cursor:"pointer", transition:"all .1s",
            }}/>
          ))}
        </div>

        {/* Preview */}
        <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", borderRadius:"6px", background:color+"15", border:`1px solid ${color}40`, marginBottom:"20px" }}>
          <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:color }}/>
          <span style={{ fontSize:"13px", fontWeight:600, color:T.text }}>{name || "Farm Name"}</span>
        </div>

        <div style={{ display:"flex", gap:"8px", justifyContent:"space-between" }}>
          <div style={{ display:"flex", gap:"8px" }}>
            {onDelete && (
              <button style={{ ...mkBtn("ghost"), padding:"8px 14px", fontSize:"12px", color:T.danger, borderColor:T.danger+"40" }} onClick={onDelete}>Delete Farm</button>
            )}
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            <button style={{ ...mkBtn("ghost"), padding:"8px 14px", fontSize:"13px" }} onClick={onClose}>Cancel</button>
            <button style={{ ...mkBtn("primary", color), padding:"8px 18px", fontSize:"13px" }} onClick={save} disabled={busy||!name.trim()}>
              {busy ? "Saving…" : initial ? "Save Changes" : "Create Farm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
