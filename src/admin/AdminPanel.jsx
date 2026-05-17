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
  const [orgFilter,    setOrgFilter]    = useState("active"); // "active" | "suspended" | "all"
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
      // Load from tenant users (roles/modules) and root users (name/email)
      const [tenantData, rootData] = await Promise.all([
        dbRead(`tenants/${tenantId}/users`, token).catch(()=>({})),
        dbRead(`users`, token).catch(()=>({})),
      ]);
      const tenantUsers = obj2arr(tenantData || {}).filter(Boolean);
      const tenantUserIds = new Set(tenantUsers.map(u => u.uid));
      // Also grab any users in root that belong to this tenant but missing from tenant node
      const rootUsersForTenant = obj2arr(rootData || {}).filter(u => u && u.tenantId === tenantId && !tenantUserIds.has(u.uid));
      // Merge name/email from root users profile
      const merged = [...tenantUsers, ...rootUsersForTenant].map(u => {
        const root = rootData?.[u.uid] || {};
        return { ...root, ...u, name: u.name||root.name||"", email: u.email||root.email||"" };
      });
      setOrgUsers(p => ({ ...p, [tenantId]: merged }));
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

  const changeUserModuleRole = async (tenantId, uid, moduleId, newRole) => {
    const u = (orgUsers[tenantId]||[]).find(u=>u.uid===uid); if(!u) return;
    const current = u.moduleRoles || {};
    const next = newRole ? {...current,[moduleId]:newRole} : {...current,[moduleId]:undefined};
    // Remove undefined keys
    const cleaned = Object.fromEntries(Object.entries(next).filter(([,v])=>v));
    try {
      await dbWrite(`tenants/${tenantId}/users/${uid}/moduleRoles`, cleaned, token);
      await dbWrite(`users/${uid}/moduleRoles`, cleaned, token);
      setOrgUsers(p => ({ ...p, [tenantId]: (p[tenantId]||[]).map(u => u.uid===uid ? {...u,moduleRoles:cleaned} : u) }));
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

  const deleteOrg = async (tenantId, name) => {
    if (!confirm(`Permanently delete "${name}" and all its data?\n\nThis cannot be undone.`)) return;
    if (!confirm(`Second confirmation: delete "${name}"?`)) return;
    try {
      await dbWrite(`tenants/${tenantId}`, null, token);
      setTenants(t => { const n = {...t}; delete n[tenantId]; return n; });
      if (expandedOrg === tenantId) setExpandedOrg(null);
    } catch(e) { setErr(e.message); }
  };

  const tenantList = Object.entries(tenants).map(([id, t]) => ({
    ...t,
    profile: t.profile || { id, name: id, active: true, modules: [], plan: "trial" },
  })).filter(t => {
    if (orgFilter === "active")    return t.profile.active !== false;
    if (orgFilter === "suspended") return t.profile.active === false;
    return true;
  }).sort((a,b) => (a.profile.name||"").localeCompare(b.profile.name||""));

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

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"22px", margin:0 }}>Organizations</h2>
          <button style={mkBtn("primary", T.brand)} onClick={()=>setShowNew(true)}>+ Add Organization</button>
        </div>

        {/* Filter tabs */}
        {(() => {
          const all = Object.entries(tenants).map(([id,t])=>({...t,profile:t.profile||{id,name:id,active:true,modules:[],plan:"trial"}}));
          const activeCnt    = all.filter(t=>t.profile.active!==false).length;
          const suspendedCnt = all.filter(t=>t.profile.active===false).length;
          return (
            <div style={{ display:"flex", gap:"4px", marginBottom:"16px", borderBottom:`1px solid ${T.border}`, paddingBottom:"0" }}>
              {[
                { id:"active",    label:`Active (${activeCnt})` },
                { id:"suspended", label:`Suspended (${suspendedCnt})` },
                { id:"all",       label:`All (${all.length})` },
              ].map(f => (
                <button key={f.id} onClick={()=>setOrgFilter(f.id)}
                  style={{ padding:"8px 16px", background:"none", border:"none", borderBottom:`2px solid ${orgFilter===f.id?T.brand:"transparent"}`, color:orgFilter===f.id?T.brand:T.muted, fontWeight:orgFilter===f.id?700:400, cursor:"pointer", fontSize:"13px", marginBottom:"-1px", transition:"color .15s" }}>
                  {f.label}
                </button>
              ))}
            </div>
          );
        })()}

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
        {!loading && tenantList.length === 0 && (
          <div style={{ ...S.card, textAlign:"center", padding:"48px", color:T.faint }}>
            {orgFilter==="suspended" ? "No suspended organizations." : orgFilter==="active" ? "No active organizations." : "No organizations yet."}
          </div>
        )}

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
                    <div style={{ fontSize:"10px", color:T.muted, marginBottom:"2px" }}>{p.active===false?"Suspended":"Active"}</div>
                    <Switch on={p.active!==false} onChange={()=>toggleActive(p.id)}/>
                  </div>
                  <button onClick={()=>deleteOrg(p.id, p.name)}
                    style={{ ...mkBtn("ghost"), padding:"6px 10px", fontSize:"12px", color:T.danger, borderColor:T.danger+"30" }}
                    title="Permanently delete this organization">
                    🗑
                  </button>
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
                      <div style={{ display:"grid", gridTemplateColumns:"200px 100px 1fr 90px", gap:"8px", padding:"8px 20px", borderBottom:`1px solid ${T.border}`, fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase", color:T.faint, fontWeight:700 }}>
                        <span>User</span><span>Default Role</span><span>Role per Module</span><span></span>
                      </div>

                      {[...users].sort((a,b)=>(a.name||"").localeCompare(b.name||"")).map(u => {
                        return (
                          <div key={u.uid} style={{ display:"grid", gridTemplateColumns:"200px 100px 1fr 90px", gap:"8px", alignItems:"start", padding:"12px 20px", borderBottom:`1px solid ${T.border}50`, opacity:u.active===false?0.5:1 }}>

                            {/* User info */}
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontWeight:600, fontSize:"13px", display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
                                {u.name||"—"}
                                {u.active===false && <span style={{ fontSize:"9px", padding:"1px 5px", borderRadius:"3px", background:"#F0E8E8", color:T.danger }}>inactive</span>}
                              </div>
                              <div style={{ fontSize:"11px", color:T.muted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
                              <div style={{ fontSize:"9px", color:T.faint, marginTop:"1px", fontFamily:"monospace" }}>uid: {u.uid?.slice(0,14)}…</div>
                            </div>

                            {/* Default role */}
                            <div>
                              <div style={{ fontSize:"9px", color:T.faint, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"3px" }}>Default</div>
                              <select value={u.role||"operator"} onChange={e=>changeUserRole(p.id,u.uid,e.target.value)}
                                style={{ ...S.input, padding:"4px 6px", fontSize:"12px", fontWeight:700, color:ROLE_COLOR[u.role||"operator"]||T.text, border:`1px solid ${ROLE_COLOR[u.role||"operator"]||T.border}40`, background:`${ROLE_COLOR[u.role||"operator"]||"#888"}10` }}>
                                {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
                              </select>
                            </div>

                            {/* Per-module roles */}
                            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"flex-start" }}>
                              {tenantModules.map(mid => {
                                const m = MODULES[mid]; if(!m) return null;
                                const hasAccess = (u.modules==null) || (u.modules||[]).includes(mid);
                                if(!hasAccess) return null;
                                const moduleRole = (u.moduleRoles||{})[mid] || u.role || "operator";
                                return (
                                  <div key={mid} style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                                    <div style={{ fontSize:"9px", color:m.color, letterSpacing:"1px", textTransform:"uppercase", fontWeight:700 }}>{m.icon} {m.label}</div>
                                    <select value={moduleRole} onChange={e=>changeUserModuleRole(p.id,u.uid,mid,e.target.value)}
                                      style={{ ...S.input, padding:"3px 6px", fontSize:"11px", fontWeight:700, color:ROLE_COLOR[moduleRole]||T.text, border:`1px solid ${ROLE_COLOR[moduleRole]||T.border}40`, background:`${ROLE_COLOR[moduleRole]||"#888"}10`, minWidth:"90px" }}>
                                      {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
                                    </select>
                                  </div>
                                );
                              })}
                              {tenantModules.length===0 && <span style={{ fontSize:"11px", color:T.faint, fontStyle:"italic" }}>No modules on plan</span>}
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
