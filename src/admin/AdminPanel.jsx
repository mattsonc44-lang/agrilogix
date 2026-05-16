import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { dbRead, dbWrite } from "../core/firebase.js";
import { MODULES, ROLES } from "../core/config.js";
import { genId, slugify } from "../core/helpers.js";
import { obj2arr } from "../core/helpers.js";
import InviteModal from "./InviteModal.jsx";

const ROLE_COLOR = { owner:"#C07010", manager:"#2563EB", operator:"#16A34A" };

export default function AdminPanel({ user, token, onBack }) {
  const [tenants,      setTenants]      = useState({});
  const [loading,      setLoading]      = useState(true);
  const [showNew,      setShowNew]      = useState(false);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [expandedOrg,  setExpandedOrg]  = useState(null);
  const [orgUsers,     setOrgUsers]     = useState({});
  const [usersLoading, setUsersLoading] = useState({});
  const [err,          setErr]          = useState("");
  const [newName,      setNewName]      = useState("");
  const [newEmail,     setNewEmail]     = useState("");
  const [newModules,   setNewModules]   = useState({fieldlog:true,agriScale:false,serviceLog:false});
  const [newPlan,      setNewPlan]      = useState("trial");
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    dbRead("tenants", token)
      .then(data => setTenants(data || {}))
      .catch(() => setTenants({}))
      .finally(() => setLoading(false));
  }, [token]);

  const loadUsers = async (tenantId) => {
    if (orgUsers[tenantId]) return;
    setUsersLoading(p => ({ ...p, [tenantId]: true }));
    try {
      const data = await dbRead(`tenants/${tenantId}/users`, token);
      setOrgUsers(p => ({ ...p, [tenantId]: obj2arr(data || {}).filter(Boolean) }));
    } catch(e) {
      setOrgUsers(p => ({ ...p, [tenantId]: [] }));
    } finally {
      setUsersLoading(p => ({ ...p, [tenantId]: false }));
    }
  };

  const toggleExpand = async (tenantId) => {
    if (expandedOrg === tenantId) { setExpandedOrg(null); return; }
    setExpandedOrg(tenantId);
    await loadUsers(tenantId);
  };

  const changeUserRole = async (tenantId, uid, newRole) => {
    try {
      await dbWrite(`tenants/${tenantId}/users/${uid}/role`, newRole, token);
      await dbWrite(`users/${uid}/role`, newRole, token);
      setOrgUsers(p => ({ ...p, [tenantId]: (p[tenantId]||[]).map(u => u.uid===uid ? {...u,role:newRole} : u) }));
    } catch(e) { setErr(e.message); }
  };

  const toggleUserModule = async (tenantId, uid, moduleId, tenantModules) => {
    const u = (orgUsers[tenantId]||[]).find(u => u.uid === uid); if (!u) return;
    const current = u.modules != null ? u.modules : [...tenantModules];
    const next = current.includes(moduleId) ? current.filter(m=>m!==moduleId) : [...current, moduleId];
    try {
      await dbWrite(`users/${uid}/modules`, next, token);
      await dbWrite(`tenants/${tenantId}/users/${uid}/modules`, next, token);
      setOrgUsers(p => ({ ...p, [tenantId]: (p[tenantId]||[]).map(u => u.uid===uid ? {...u,modules:next} : u) }));
    } catch(e) { setErr(e.message); }
  };

  const grantAllModules = async (tenantId, uid) => {
    try {
      await dbWrite(`users/${uid}/modules`, null, token);
      await dbWrite(`tenants/${tenantId}/users/${uid}/modules`, null, token);
      setOrgUsers(p => ({ ...p, [tenantId]: (p[tenantId]||[]).map(u => u.uid===uid ? {...u,modules:null} : u) }));
    } catch(e) { setErr(e.message); }
  };

  const setUserActive = async (tenantId, uid, active) => {
    if (!active && !confirm("Deactivate this user?")) return;
    try {
      await dbWrite(`tenants/${tenantId}/users/${uid}/active`, active, token);
      await dbWrite(`users/${uid}/active`, active, token);
      setOrgUsers(p => ({ ...p, [tenantId]: (p[tenantId]||[]).map(u => u.uid===uid ? {...u,active} : u) }));
    } catch(e) { setErr(e.message); }
  };

  const createTenant = async () => {
    if (!newName.trim()) { setErr("Organization name required."); return; }
    setSaving(true); setErr("");
    try {
      const id = slugify(newName.trim()) + "-" + Date.now().toString(36);
      const tenant = { id, name:newName.trim(), ownerEmail:newEmail.trim(), plan:newPlan,
        modules:Object.entries(newModules).filter(([,v])=>v).map(([k])=>k),
        createdAt:new Date().toISOString(), trialEnds:new Date(Date.now()+14*24*60*60*1000).toISOString(), active:true };
      await dbWrite(`tenants/${id}/profile`, tenant, token);
      setTenants(t => ({ ...t, [id]: { profile: tenant } }));
      setShowNew(false); setNewName(""); setNewEmail(""); setNewModules({fieldlog:true,agriScale:false,serviceLog:false});
    } catch(e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const toggleModule = async (tenantId, moduleId) => {
    const profile = tenants[tenantId]?.profile; if (!profile) return;
    const mods = profile.modules || [];
    const updated = mods.includes(moduleId) ? mods.filter(m=>m!==moduleId) : [...mods, moduleId];
    const newProfile = { ...profile, modules: updated };
    await dbWrite(`tenants/${tenantId}/profile`, newProfile, token);
    setTenants(t => ({ ...t, [tenantId]: { ...t[tenantId], profile: newProfile } }));
  };

  const toggleActive = async (tenantId) => {
    const profile = tenants[tenantId]?.profile; if (!profile) return;
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
      <div style={{ background:"#1A3A1A", padding:"12px 20px", display:"flex", alignItems:"center", gap:"12px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"18px", color:"#FFFFFF" }}>🌾 Agri Logix</div>
        <div style={{ background:"rgba(255,255,255,0.15)", color:"#AAFFAA", fontSize:"11px", padding:"2px 8px", borderRadius:"4px", fontWeight:700 }}>ADMIN</div>
        <div style={{ marginLeft:"auto", display:"flex", gap:"8px", alignItems:"center" }}>
          <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)" }}>{user.email}</span>
          <button style={{ ...mkBtn("ghost"), padding:"4px 10px", fontSize:"12px", borderColor:"rgba(255,255,255,0.3)", color:"rgba(255,255,255,0.7)" }} onClick={onBack}>← Back to App</button>
        </div>
      </div>

      <div style={S.content}>
        {/* Stats */}
        <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
          {[
            { label:"Total Orgs", value:tenantList.length },
            { label:"Active",     value:tenantList.filter(t=>t.profile.active).length },
            { label:"On Trial",   value:tenantList.filter(t=>t.profile.plan==="trial").length },
            { label:"Paying",     value:tenantList.filter(t=>t.profile.plan==="paid").length },
          ].map(s => (
            <div key={s.label} style={{ flex:"1 1 120px", ...S.card, padding:"14px", textAlign:"center", marginBottom:0 }}>
              <div style={{ fontSize:"28px", fontWeight:700, color:T.brand }}>{s.value}</div>
              <div style={{ fontSize:"12px", color:T.muted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {err && <p style={{ color:T.danger, fontSize:"13px", marginBottom:"12px", padding:"8px 12px", background:"#FDF0EE", borderRadius:"6px", border:"1px solid rgba(132,26,24,.2)" }}>{err}</p>}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", margin:0 }}>Organizations</h2>
          <button style={mkBtn("primary", T.brand)} onClick={()=>setShowNew(true)}>+ Add Organization</button>
        </div>

        {showNew && (
          <div style={{ ...S.card, background:"#F0F8F0", border:`1px solid #A0C8A0`, marginBottom:"16px" }}>
            <h3 style={{ ...S.sh, color:T.brand }}>New Organization</h3>
            <div style={S.g2}>
              <div style={S.row}><label style={S.label}>Organization Name *</label><input style={S.input} value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. Mattson Bros Inc."/></div>
              <div style={S.row}><label style={S.label}>Owner Email</label><input style={S.input} type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="owner@example.com"/></div>
            </div>
            <div style={S.row}>
              <label style={S.label}>Modules</label>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
                {Object.values(MODULES).map(m => (
                  <label key={m.id} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"7px 12px", borderRadius:"6px", background:newModules[m.id]?m.color+"15":"transparent", border:`1px solid ${newModules[m.id]?m.color:T.border}`, cursor:"pointer", fontSize:"13px" }}>
                    <input type="checkbox" checked={!!newModules[m.id]} onChange={()=>setNewModules(p=>({...p,[m.id]:!p[m.id]}))} style={{ accentColor:m.color }}/>{m.icon} {m.label} — ${m.price}/yr
                  </label>
                ))}
              </div>
            </div>
            <div style={{ ...S.row, display:"flex", gap:"8px", alignItems:"center" }}>
              <label style={{ ...S.label, margin:0 }}>Plan:</label>
              {["trial","paid","comp"].map(pl => (
                <button key={pl} style={{ ...mkBtn("ghost"), padding:"5px 12px", fontSize:"12px", background:newPlan===pl?T.brand:"transparent", color:newPlan===pl?"#FFFFFF":T.muted, border:`1px solid ${newPlan===pl?T.brand:T.border}` }} onClick={()=>setNewPlan(pl)}>
                  {pl==="trial"?"14-day Trial":pl==="paid"?"Paid":"Complimentary"}
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button style={mkBtn("ghost")} onClick={()=>{setShowNew(false);setErr("");}}>Cancel</button>
              <button style={mkBtn("primary", T.brand)} onClick={createTenant} disabled={saving}>{saving?"Creating…":"Create Organization"}</button>
            </div>
          </div>
        )}

        {loading && <p style={{ color:T.muted, textAlign:"center", padding:"32px" }}>Loading organizations…</p>}

        {tenantList.map(({ profile:p }) => {
          const isExpanded = expandedOrg === p.id;
          const users = orgUsers[p.id] || [];
          const isLoadingUsers = usersLoading[p.id];
          const tenantModules = p.modules || [];

          return (
            <div key={p.id} style={{ ...S.card, opacity:p.active?1:0.65, marginBottom:"12px", padding:0, overflow:"hidden" }}>

              {/* Org header row */}
              <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px", flexWrap:"wrap" }}>
                    <span style={{ fontWeight:700, fontSize:"16px" }}>{p.name}</span>
                    <span style={{ fontSize:"11px", padding:"2px 7px", borderRadius:"10px", fontWeight:700,
                      background:p.plan==="paid"?T.brand+"20":p.plan==="trial"?"#C07010"+"20":"#44882020",
                      color:p.plan==="paid"?T.brand:p.plan==="trial"?T.gold:"#448820" }}>
                      {p.plan==="trial"?"TRIAL":p.plan==="paid"?"PAID":"COMP"}
                    </span>
                    {!p.active && <span style={{ fontSize:"11px", padding:"2px 7px", borderRadius:"10px", background:"#F0E8E8", color:T.danger, fontWeight:700 }}>SUSPENDED</span>}
                  </div>
                  {p.ownerEmail && <div style={{ fontSize:"12px", color:T.muted, marginBottom:"6px" }}>{p.ownerEmail}</div>}
                  <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                    {Object.values(MODULES).map(m => {
                      const has = tenantModules.includes(m.id);
                      return (
                        <button key={m.id} onClick={()=>toggleModule(p.id,m.id)} style={{ padding:"3px 9px", borderRadius:"10px", fontSize:"11px", fontWeight:600, cursor:"pointer", border:`1px solid ${has?m.color:T.border}`, background:has?m.color+"20":"transparent", color:has?m.color:T.faint }}>
                          {m.icon} {m.label} {has?"✓":"+ Add"}
                        </button>
                      );
                    })}
                  </div>
                  {p.plan==="trial" && p.trialEnds && (
                    <p style={{ margin:"6px 0 0", fontSize:"11px", color:T.muted }}>Trial ends: {new Date(p.trialEnds).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>
                  )}
                </div>

                <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0, flexWrap:"wrap" }}>
                  <button onClick={()=>toggleExpand(p.id)}
                    style={{ ...mkBtn("ghost"), padding:"6px 12px", fontSize:"12px", color:isExpanded?"#2563EB":T.muted, borderColor:isExpanded?"rgba(37,99,235,.4)":T.border, background:isExpanded?"rgba(37,99,235,.06)":"transparent" }}>
                    👥 Users {isExpanded?"▲":"▼"}
                  </button>
                  <button onClick={()=>setInviteTarget({tenantId:p.id,tenantName:p.name})}
                    style={{ ...mkBtn("ghost"), padding:"6px 12px", fontSize:"12px", color:T.brand, borderColor:T.brand+"40" }}>
                    + Invite
                  </button>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"10px", color:T.muted, marginBottom:"2px" }}>Active</div>
                    <Switch on={p.active} onChange={()=>toggleActive(p.id)}/>
                  </div>
                </div>
              </div>

              {/* Users panel */}
              {isExpanded && (
                <div style={{ borderTop:`1px solid ${T.border}`, background:"#FDFAF4" }}>
                  {isLoadingUsers && <p style={{ color:T.muted, fontSize:"13px", padding:"14px 20px" }}>Loading users…</p>}
                  {!isLoadingUsers && users.length === 0 && (
                    <p style={{ color:T.faint, fontSize:"13px", padding:"16px 20px", textAlign:"center" }}>No users in this organization yet.</p>
                  )}
                  {!isLoadingUsers && users.length > 0 && (
                    <div>
                      {/* Table header */}
                      <div style={{ display:"grid", gridTemplateColumns:"220px 110px 1fr 100px", gap:"8px", padding:"8px 20px", borderBottom:`1px solid ${T.border}`, fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", color:T.faint, fontWeight:700 }}>
                        <span>User</span><span>Role</span><span>Module Access</span><span></span>
                      </div>

                      {[...users].sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(u => {
                        const userMods = u.modules != null ? u.modules : [...tenantModules];
                        const hasAll = u.modules == null;
                        return (
                          <div key={u.uid} style={{ display:"grid", gridTemplateColumns:"220px 110px 1fr 100px", gap:"8px", alignItems:"center", padding:"10px 20px", borderBottom:`1px solid ${T.border}50`, opacity:u.active===false?0.5:1 }}>

                            {/* User info */}
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
                                {u.name||"—"}
                                {u.active===false && <span style={{ fontSize:"9px", padding:"1px 5px", borderRadius:"3px", background:"#F0E8E8", color:T.danger }}>inactive</span>}
                              </div>
                              <div style={{ fontSize:"11px", color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                              <div style={{ fontSize:"9px", color:T.faint, marginTop:"1px", fontFamily:"monospace" }}>uid: {u.uid?.slice(0,14)}…</div>
                            </div>

                            {/* Role */}
                            <select value={u.role||"operator"} onChange={e=>changeUserRole(p.id,u.uid,e.target.value)}
                              style={{ ...S.input, padding:"4px 6px", fontSize:"12px", fontWeight:700, color:ROLE_COLOR[u.role||"operator"]||T.text, border:`1px solid ${ROLE_COLOR[u.role||"operator"]||T.border}40`, background:`${ROLE_COLOR[u.role||"operator"]||"#888"}10` }}>
                              {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
                            </select>

                            {/* Module access */}
                            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", alignItems:"center" }}>
                              {tenantModules.length === 0 && <span style={{ fontSize:"11px", color:T.faint, fontStyle:"italic" }}>No modules on plan</span>}
                              {tenantModules.map(mid => {
                                const m = MODULES[mid]; if(!m) return null;
                                const has = userMods.includes(mid);
                                return (
                                  <button key={mid} onClick={()=>toggleUserModule(p.id,u.uid,mid,tenantModules)}
                                    title={has?"Revoke access to "+m.label:"Grant access to "+m.label}
                                    style={{ padding:"3px 8px", borderRadius:"8px", fontSize:"10px", fontWeight:700, cursor:"pointer", border:`1px solid ${has?m.color+"60":T.border}`, background:has?m.color+"15":"transparent", color:has?m.color:T.faint, transition:"all .15s" }}>
                                    {has?"✓":"○"} {m.icon} {m.label}
                                  </button>
                                );
                              })}
                              {!hasAll && tenantModules.length > 0 && (
                                <button onClick={()=>grantAllModules(p.id,u.uid)}
                                  style={{ fontSize:"10px", color:T.muted, cursor:"pointer", background:"none", border:"none", textDecoration:"underline", padding:"0 2px" }}>
                                  All
                                </button>
                              )}
                              {hasAll && tenantModules.length > 0 && (
                                <span style={{ fontSize:"10px", color:T.faint, fontStyle:"italic" }}>full access</span>
                              )}
                            </div>

                            {/* Actions */}
                            <div>
                              {u.active !== false
                                ? <button onClick={()=>setUserActive(p.id,u.uid,false)} style={{ ...mkBtn("ghost"), padding:"3px 8px", fontSize:"10px", color:T.danger, borderColor:T.danger+"30" }}>Deactivate</button>
                                : <button onClick={()=>setUserActive(p.id,u.uid,true)} style={{ ...mkBtn("ghost"), padding:"3px 8px", fontSize:"10px", color:T.brand, borderColor:T.brand+"30" }}>Reactivate</button>
                              }
                            </div>
                          </div>
                        );
                      })}

                      <div style={{ padding:"10px 20px", display:"flex", justifyContent:"flex-end" }}>
                        <button onClick={()=>setInviteTarget({tenantId:p.id,tenantName:p.name})}
                          style={{ ...mkBtn("ghost"), padding:"5px 10px", fontSize:"11px", color:T.brand, borderColor:T.brand+"40" }}>
                          + Invite Another User
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {inviteTarget && (
        <InviteModal
          tenantId={inviteTarget.tenantId}
          tenantName={inviteTarget.tenantName}
          sentBy={user.localId}
          token_auth={token}
          onClose={()=>setInviteTarget(null)}
        />
      )}
    </div>
  );
}
