import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { dbRead, dbWrite } from "../core/firebase.js";
import { MODULES, ROLES } from "../core/config.js";
import { genId, fmtDate, slugify } from "../core/helpers.js";

export default function AdminPanel({ user, token, onBack }) {
  const [tenants, setTenants] = useState({});
  const [view,    setView]    = useState("tenants"); // "tenants" | "tenant"
  const [selTenant, setSelTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  // New tenant form
  const [newName, setNewName] = useState("");
  const [newEmail,setNewEmail]= useState("");
  const [newModules,setNewModules]=useState({fieldlog:true,agriScale:false,serviceLog:false});
  const [newPlan,  setNewPlan] =useState("trial");
  const [saving,   setSaving]  =useState(false);
  const [err,      setErr]     =useState("");

  useEffect(() => {
    dbRead("tenants", token).then(data => {
      setTenants(data || {});
    }).catch(() => setTenants({})).finally(() => setLoading(false));
  }, [token]);

  const createTenant = async () => {
    if (!newName.trim()) { setErr("Organization name required."); return; }
    setSaving(true); setErr("");
    try {
      const id = slugify(newName.trim()) + "-" + Date.now().toString(36);
      const tenant = {
        id,
        name:      newName.trim(),
        ownerEmail:newEmail.trim(),
        plan:      newPlan,
        modules:   Object.entries(newModules).filter(([,v])=>v).map(([k])=>k),
        createdAt: new Date().toISOString(),
        trialEnds: new Date(Date.now() + 14*24*60*60*1000).toISOString(),
        active:    true,
      };
      await dbWrite(`tenants/${id}/profile`, tenant, token);
      setTenants(t => ({ ...t, [id]: { profile: tenant } }));
      setShowNew(false);
      setNewName(""); setNewEmail(""); setNewModules({fieldlog:true,agriScale:false,serviceLog:false});
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggleModule = async (tenantId, moduleId) => {
    const profile = tenants[tenantId]?.profile;
    if (!profile) return;
    const mods = profile.modules || [];
    const updated = mods.includes(moduleId) ? mods.filter(m=>m!==moduleId) : [...mods, moduleId];
    const newProfile = { ...profile, modules: updated };
    await dbWrite(`tenants/${tenantId}/profile`, newProfile, token);
    setTenants(t => ({ ...t, [tenantId]: { ...t[tenantId], profile: newProfile } }));
  };

  const toggleActive = async (tenantId) => {
    const profile = tenants[tenantId]?.profile;
    if (!profile) return;
    const newProfile = { ...profile, active: !profile.active };
    await dbWrite(`tenants/${tenantId}/profile`, newProfile, token);
    setTenants(t => ({ ...t, [tenantId]: { ...t[tenantId], profile: newProfile } }));
  };

  const tenantList = Object.values(tenants).filter(t=>t.profile).sort((a,b)=>a.profile.name?.localeCompare(b.profile.name));

  const Switch = ({ on, onChange }) => (
    <div onClick={onChange} style={{ width:"40px", height:"22px", borderRadius:"11px", cursor:"pointer", background:on?T.brand:"#C8C0B8", position:"relative", transition:"background .2s", flexShrink:0 }}>
      <div style={{ position:"absolute", top:"3px", left:on?"21px":"3px", width:"16px", height:"16px", borderRadius:"50%", background:"#FFFFFF", transition:"left .2s" }}/>
    </div>
  );

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={{ background:"#1A3A1A", padding:"12px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", color:"#FFFFFF" }}>🌾 Agri Logix</div>
        <div style={{ background:"rgba(255,255,255,0.15)", color:"#AAFFAA", fontSize:"11px", padding:"2px 8px", borderRadius:"4px", fontWeight:700 }}>ADMIN</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"8px", alignItems:"center" }}>
          <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>{user.email}</span>
          <button style={{ ...mkBtn("ghost"), padding:"4px 10px", fontSize:"12px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={onBack}>← Back to App</button>
        </div>
      </div>

      <div style={S.content}>
        {/* Stats bar */}
        <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
          {[
            { label:"Total Orgs",    value:tenantList.length },
            { label:"Active",        value:tenantList.filter(t=>t.profile.active).length },
            { label:"On Trial",      value:tenantList.filter(t=>t.profile.plan==="trial").length },
            { label:"Paying",        value:tenantList.filter(t=>t.profile.plan==="paid").length },
          ].map(s => (
            <div key={s.label} style={{ flex:"1 1 120px", ...S.card, padding:"14px", textAlign:"center", marginBottom:0 }}>
              <div style={{ fontSize:"28px", fontWeight:700, color:T.brand }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:T.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", margin:0 }}>Organizations</h2>
          <button style={mkBtn("primary", T.brand)} onClick={()=>setShowNew(true)}>+ Add Organization</button>
        </div>

        {/* New tenant form */}
        {showNew && (
          <div style={{ ...S.card, background:"#F0F8F0", border:`1px solid #A0C8A0`, marginBottom:"16px" }}>
            <h3 style={{ ...S.sh, color:T.brand }}>New Organization</h3>
            <div style={S.g2}>
              <div style={S.row}>
                <label style={S.label}>Organization Name *</label>
                <input style={S.input} type="text" placeholder="e.g. Mattson Bros Inc." value={newName} onChange={e=>setNewName(e.target.value)}/>
              </div>
              <div style={S.row}>
                <label style={S.label}>Owner Email</label>
                <input style={S.input} type="email" placeholder="owner@example.com" value={newEmail} onChange={e=>setNewEmail(e.target.value)}/>
              </div>
            </div>
            <div style={S.row}>
              <label style={S.label}>Modules</label>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {Object.values(MODULES).map(m => (
                  <label key={m.id} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 12px", borderRadius:"6px", background:newModules[m.id]?m.color+"15":"transparent", border:`1px solid ${newModules[m.id]?m.color:T.border}`, cursor:"pointer", fontSize:"13px" }}>
                    <input type="checkbox" checked={!!newModules[m.id]} onChange={()=>setNewModules(p=>({...p,[m.id]:!p[m.id]}))} style={{ accentColor:m.color }}/>
                    {m.icon} {m.label} — ${m.price}/yr
                  </label>
                ))}
              </div>
            </div>
            <div style={{ ...S.row, display:"flex", gap:"8px", alignItems:"center" }}>
              <label style={{ ...S.label, margin:0 }}>Plan:</label>
              {["trial","paid","comp"].map(p => (
                <button key={p} style={{ ...mkBtn("ghost"), padding:"5px 12px", fontSize:"12px", background:newPlan===p?T.brand:"transparent", color:newPlan===p?"#FFFFFF":T.muted, border:`1px solid ${newPlan===p?T.brand:T.border}` }} onClick={()=>setNewPlan(p)}>
                  {p==="trial"?"14-day Trial":p==="paid"?"Paid":p==="comp"?"Complimentary":""}
                </button>
              ))}
            </div>
            {err && <p style={{ color:T.danger, fontSize:"13px", margin:"0 0 10px" }}>{err}</p>}
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={mkBtn("ghost")} onClick={()=>{setShowNew(false);setErr("");}}>Cancel</button>
              <button style={mkBtn("primary", T.brand)} onClick={createTenant} disabled={saving}>{saving?"Creating…":"Create Organization"}</button>
            </div>
          </div>
        )}

        {/* Tenant list */}
        {loading && <p style={{ color:T.muted, textAlign:"center", padding:"32px" }}>Loading organizations…</p>}
        {!loading && tenantList.length === 0 && (
          <div style={{ ...S.card, textAlign:"center", padding:"48px", color:T.faint }}>
            No organizations yet. Click "+ Add Organization" to create the first one.
          </div>
        )}
        {tenantList.map(({ profile:p }) => (
          <div key={p.id} style={{ ...S.card, opacity:p.active?1:0.6 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
                  <span style={{ fontWeight:700, fontSize:"16px" }}>{p.name}</span>
                  <span style={{ fontSize:"11px", padding:"2px 7px", borderRadius:"10px", background:p.plan==="paid"?T.brand+"20":p.plan==="trial"?"#C07010"+"20":"#888820", color:p.plan==="paid"?T.brand:p.plan==="trial"?T.gold:"#888820", fontWeight:700 }}>
                    {p.plan==="trial"?"TRIAL":p.plan==="paid"?"PAID":"COMP"}
                  </span>
                  {!p.active && <span style={{ fontSize:"11px", padding:"2px 7px", borderRadius:"10px", background:"#F0E8E8", color:T.danger, fontWeight:700 }}>SUSPENDED</span>}
                </div>
                {p.ownerEmail && <div style={{ fontSize:"12px", color:T.muted, marginBottom:"6px" }}>{p.ownerEmail}</div>}
                {/* Module badges */}
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {Object.values(MODULES).map(m => {
                    const has = (p.modules||[]).includes(m.id);
                    return (
                      <button key={m.id} onClick={()=>toggleModule(p.id,m.id)} style={{ padding:"3px 9px", borderRadius:"10px", fontSize:"11px", fontWeight:600, cursor:"pointer", border:`1px solid ${has?m.color:T.border}`, background:has?m.color+"20":"transparent", color:has?m.color:T.faint }}>
                        {m.icon} {m.label} {has?"✓":"+ Add"}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"11px", color:T.muted }}>Active</div>
                  <Switch on={p.active} onChange={()=>toggleActive(p.id)}/>
                </div>
              </div>
            </div>
            {p.plan==="trial" && p.trialEnds && (
              <p style={{ margin:"8px 0 0", fontSize:"11px", color:T.muted }}>Trial ends: {new Date(p.trialEnds).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
