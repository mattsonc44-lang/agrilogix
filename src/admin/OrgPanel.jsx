import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { dbRead, dbWrite } from "../core/firebase.js";
import { MODULES, ROLES } from "../core/config.js";
import { obj2arr } from "../core/helpers.js";
import InviteModal from "./InviteModal.jsx";

export default function OrgPanel({ session, profile, tenant, onClose }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [err,        setErr]        = useState("");

  const tenantProfile = tenant?.profile || {};
  const token = session?.idToken;
  const enabledModules = tenantProfile.modules || [];

  useEffect(() => {
    if (!profile?.tenantId) return;
    dbRead(`tenants/${profile.tenantId}/users`, token)
      .then(data => setUsers(obj2arr(data || {})))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [profile?.tenantId, token]);

  const changeRole = async (uid, newRole) => {
    try {
      await dbWrite(`tenants/${profile.tenantId}/users/${uid}/role`, newRole, token);
      await dbWrite(`users/${uid}/role`, newRole, token);
      setUsers(u => u.map(u2 => u2.uid===uid ? {...u2, role:newRole} : u2));
    } catch(e) { setErr(e.message); }
  };

  const deactivateUser = async (uid) => {
    try {
      await dbWrite(`tenants/${profile.tenantId}/users/${uid}/active`, false, token);
      setUsers(u => u.map(u2 => u2.uid===uid ? {...u2, active:false} : u2));
    } catch(e) { setErr(e.message); }
  };

  // Toggle a module on/off for a specific user
  const toggleUserModule = async (uid, moduleId) => {
    const user = users.find(u => u.uid === uid);
    if (!user) return;
    // null/undefined means "all modules" — expand to full list first
    const current = user.modules != null ? user.modules : [...enabledModules];
    const next = current.includes(moduleId)
      ? current.filter(m => m !== moduleId)
      : [...current, moduleId];
    try {
      await dbWrite(`users/${uid}/modules`, next, token);
      await dbWrite(`tenants/${profile.tenantId}/users/${uid}/modules`, next, token);
      setUsers(u => u.map(u2 => u2.uid===uid ? {...u2, modules:next} : u2));
    } catch(e) { setErr(e.message); }
  };

  // Grant all tenant modules to a user
  const grantAllModules = async (uid) => {
    try {
      await dbWrite(`users/${uid}/modules`, null, token);
      await dbWrite(`tenants/${profile.tenantId}/users/${uid}/modules`, null, token);
      setUsers(u => u.map(u2 => u2.uid===uid ? {...u2, modules:null} : u2));
    } catch(e) { setErr(e.message); }
  };

  const userHasModule = (user, moduleId) => {
    if (user.modules == null) return true; // null = all
    return (user.modules || []).includes(moduleId);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:150,display:"flex",justifyContent:"center",overflowY:"auto",padding:"20px 12px"}}>
      <div style={{background:"#FDFAF4",border:`1px solid ${T.borderHi}`,borderRadius:"12px",width:"100%",maxWidth:"680px",padding:"24px",alignSelf:"flex-start",marginTop:"10px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",color:T.brand,margin:"0 0 2px"}}>{tenantProfile.name}</h2>
            <p style={{fontSize:"12px",color:T.muted,margin:0}}>Organization Settings</p>
          </div>
          <button style={{...mkBtn("ghost"),padding:"5px 10px"}} onClick={onClose}>✕</button>
        </div>

        {/* Active Modules (tenant-level) */}
        <div style={{...S.card,marginBottom:"16px"}}>
          <h3 style={{...S.sh,fontSize:"14px"}}>Active Modules</h3>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {enabledModules.length === 0 && <span style={{color:T.faint,fontSize:"13px"}}>No modules enabled</span>}
            {enabledModules.map(mid => {
              const m = MODULES[mid];
              if (!m) return null;
              return (
                <span key={mid} style={{padding:"5px 12px",borderRadius:"10px",fontSize:"12px",fontWeight:600,background:m.color+"20",border:`1px solid ${m.color}40`,color:m.color}}>
                  {m.icon} {m.label}
                </span>
              );
            })}
          </div>
          <p style={{margin:"8px 0 0",fontSize:"11px",color:T.faint}}>To add or remove modules contact Agri Logix support.</p>
        </div>

        {/* Team Members with per-user module access */}
        <div style={{...S.card}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
            <h3 style={{...S.sh,fontSize:"14px",margin:0}}>Team Members</h3>
            <button style={mkBtn("primary",T.brand)} onClick={()=>setShowInvite(true)}>+ Invite User</button>
          </div>

          {loading && <p style={{color:T.muted,fontSize:"13px"}}>Loading users…</p>}
          {!loading && users.length === 0 && (
            <p style={{color:T.faint,fontSize:"13px",textAlign:"center",padding:"20px"}}>No users yet. Send an invite to add team members.</p>
          )}

          {users.map(u => {
            const isMe = u.uid === session.localId;
            const isOwner = u.role === "owner";
            return (
              <div key={u.uid} style={{padding:"12px 0",borderBottom:`1px solid ${T.border}`}}>
                {/* User info row */}
                <div style={{display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap",marginBottom: !isOwner && enabledModules.length > 0 ? "10px" : "0"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:"14px"}}>{u.name||"—"}</div>
                    <div style={{fontSize:"12px",color:T.muted}}>{u.email}</div>
                  </div>

                  {/* Role selector */}
                  {!isMe ? (
                    <select style={{...S.input,width:"auto",padding:"5px 10px",fontSize:"12px"}}
                      value={u.role||"operator"}
                      onChange={e=>changeRole(u.uid,e.target.value)}>
                      {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
                    </select>
                  ) : (
                    <span style={{fontSize:"12px",padding:"4px 10px",borderRadius:"10px",background:T.brand+"20",color:T.brand,fontWeight:600,textTransform:"capitalize"}}>{u.role} (you)</span>
                  )}

                  {!isMe && u.active !== false && (
                    <button style={{...mkBtn("ghost"),padding:"4px 8px",fontSize:"11px",color:T.danger,borderColor:T.danger+"40"}} onClick={()=>deactivateUser(u.uid)}>Remove</button>
                  )}
                  {u.active === false && <span style={{fontSize:"11px",color:T.danger}}>Inactive</span>}
                </div>

                {/* Module access toggles — only for non-owner, non-me users with at least 1 module */}
                {!isMe && !isOwner && enabledModules.length > 0 && (
                  <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",paddingLeft:"4px"}}>
                    <span style={{fontSize:"11px",color:T.muted,minWidth:"90px"}}>Module access:</span>
                    {enabledModules.map(mid => {
                      const m = MODULES[mid];
                      if (!m) return null;
                      const hasAccess = userHasModule(u, mid);
                      return (
                        <button key={mid}
                          onClick={()=>toggleUserModule(u.uid, mid)}
                          style={{display:"flex",alignItems:"center",gap:"5px",padding:"4px 10px",borderRadius:"10px",fontSize:"11px",fontWeight:600,cursor:"pointer",border:`1px solid ${hasAccess ? m.color+"60" : T.border}`,background:hasAccess ? m.color+"15" : "transparent",color:hasAccess ? m.color : T.faint,transition:"all .15s"}}>
                          {hasAccess ? "✓" : "○"} {m.icon} {m.label}
                        </button>
                      );
                    })}
                    {u.modules != null && (
                      <button
                        onClick={()=>grantAllModules(u.uid)}
                        style={{fontSize:"10px",color:T.muted,cursor:"pointer",background:"none",border:"none",textDecoration:"underline",padding:"2px"}}>
                        Reset to all
                      </button>
                    )}
                  </div>
                )}

                {/* Owners always get all modules */}
                {!isMe && isOwner && enabledModules.length > 0 && (
                  <div style={{paddingLeft:"4px"}}>
                    <span style={{fontSize:"11px",color:T.faint}}>Full access to all modules</span>
                  </div>
                )}
              </div>
            );
          })}

          {err && <p style={{color:T.danger,fontSize:"13px",marginTop:"8px"}}>{err}</p>}
        </div>
      </div>

      {showInvite && (
        <InviteModal
          tenantId={profile.tenantId}
          tenantName={tenantProfile.name}
          sentBy={session.localId}
          token_auth={token}
          onClose={()=>setShowInvite(false)}
        />
      )}
    </div>
  );
}


  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:150,display:"flex",justifyContent:"center",overflowY:"auto",padding:"20px 12px"}}>
      <div style={{background:"#FDFAF4",border:`1px solid ${T.borderHi}`,borderRadius:"12px",width:"100%",maxWidth:"600px",padding:"24px",alignSelf:"flex-start",marginTop:"10px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
          <div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",color:T.brand,margin:"0 0 2px"}}>{tenantProfile.name}</h2>
            <p style={{fontSize:"12px",color:T.muted,margin:0}}>Organization Settings</p>
          </div>
          <button style={{...mkBtn("ghost"),padding:"5px 10px"}} onClick={onClose}>✕</button>
        </div>

        {/* Modules */}
        <div style={{...S.card,marginBottom:"16px"}}>
          <h3 style={{...S.sh,fontSize:"14px"}}>Active Modules</h3>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {enabledModules.length === 0 && <span style={{color:T.faint,fontSize:"13px"}}>No modules enabled</span>}
            {enabledModules.map(mid => {
              const m = MODULES[mid];
              if (!m) return null;
              return (
                <span key={mid} style={{padding:"5px 12px",borderRadius:"10px",fontSize:"12px",fontWeight:600,background:m.color+"20",border:`1px solid ${m.color}40`,color:m.color}}>
                  {m.icon} {m.label}
                </span>
              );
            })}
          </div>
          <p style={{margin:"8px 0 0",fontSize:"11px",color:T.faint}}>To add or remove modules contact Agri Logix support.</p>
        </div>

        {/* Users */}
        <div style={{...S.card}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
            <h3 style={{...S.sh,fontSize:"14px",margin:0}}>Team Members</h3>
            <button style={mkBtn("primary",T.brand)} onClick={()=>setShowInvite(true)}>+ Invite User</button>
          </div>

          {loading && <p style={{color:T.muted,fontSize:"13px"}}>Loading users…</p>}
          {!loading && users.length === 0 && (
            <p style={{color:T.faint,fontSize:"13px",textAlign:"center",padding:"20px"}}>No users yet. Send an invite to add team members.</p>
          )}

          {users.map(u => (
            <div key={u.uid} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 0",borderBottom:`1px solid ${T.border}`,flexWrap:"wrap"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:"14px"}}>{u.name||"—"}</div>
                <div style={{fontSize:"12px",color:T.muted}}>{u.email}</div>
              </div>
              {/* Role selector */}
              {u.uid !== session.localId ? (
                <select style={{...S.input,width:"auto",padding:"5px 10px",fontSize:"12px"}}
                  value={u.role||"operator"}
                  onChange={e=>changeRole(u.uid,e.target.value)}>
                  {Object.entries(ROLES).map(([k,r])=><option key={k} value={k}>{r.label}</option>)}
                </select>
              ) : (
                <span style={{fontSize:"12px",padding:"4px 10px",borderRadius:"10px",background:T.brand+"20",color:T.brand,fontWeight:600,textTransform:"capitalize"}}>{u.role} (you)</span>
              )}
              {u.uid !== session.localId && u.active !== false && (
                <button style={{...mkBtn("ghost"),padding:"4px 8px",fontSize:"11px",color:T.danger,borderColor:T.danger+"40"}} onClick={()=>deactivateUser(u.uid)}>Remove</button>
              )}
              {u.active === false && <span style={{fontSize:"11px",color:T.danger}}>Inactive</span>}
            </div>
          ))}

          {err && <p style={{color:T.danger,fontSize:"13px",marginTop:"8px"}}>{err}</p>}
        </div>
      </div>

      {showInvite && (
        <InviteModal
          tenantId={profile.tenantId}
          tenantName={tenantProfile.name}
          sentBy={session.localId}
          token_auth={token}
          onClose={()=>setShowInvite(false)}
        />
      )}
    </div>
  );
}
