import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../core/theme.js";
import { dbRead, dbWrite } from "../core/firebase.js";
import { MODULES, ROLES } from "../core/config.js";
import { genId, slugify } from "../core/helpers.js";
import { obj2arr } from "../core/helpers.js";
import InviteModal from "./InviteModal.jsx";


// ── Invoice helpers ────────────────────────────────────────────────
const _pad = n => String(n).padStart(2,"0");
const invToday = () => { const d=new Date(); return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`; };
const invAddDays = (s,n) => { const d=new Date(s); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${_pad(d.getMonth()+1)}-${_pad(d.getDate())}`; };
const invFmtDate = s => { const [y,m,d]=s.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`; };
const invMoney = n => "$" + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,",");
const invNextNum = () => `AL-${new Date().getFullYear()}-${String(Math.floor(Math.random()*900)+100)}`;
const INV_MODS = [
  { id:"agrilog",     name:"AgriLog",     desc:"Field activity tracking & mapping",  price:150 },
  { id:"agriscale",   name:"AgriScale",   desc:"Grain cart & harvest management",     price:150 },
  { id:"agriservice", name:"AgriService", desc:"Fleet & equipment maintenance",       price:150 },
];

function InvoiceBuilder({ client,setClient,sel,setSel,extras,setExtras,date,setDate,due,setDue,notes,setNotes,invNum }) {
  const toggleMod = id => setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const allThree = INV_MODS.every(m=>sel.has(m.id));
  const setBundle = () => setSel(allThree ? new Set() : new Set(INV_MODS.map(m=>m.id)));
  const addExtra = () => setExtras(e=>[...e,{id:Date.now(),desc:"",qty:1,price:""}]);
  const updExtra = (id,k,v) => setExtras(e=>e.map(x=>x.id===id?{...x,[k]:v}:x));
  const delExtra = id => setExtras(e=>e.filter(x=>x.id!==id));
  const modTotal = allThree ? 360 : [...sel].reduce((s,id)=>s+(INV_MODS.find(m=>m.id===id)?.price||0),0);
  const extTotal = extras.reduce((s,l)=>s+(+l.price||0)*(+l.qty||0),0);
  const total = modTotal + extTotal;
  const saving = allThree ? 90 : 0;

  const IC = { green:"#1A3A1A", amber:"#C07010", cream:"#FDFAF4", border:"#D8C8A8", muted:"#7A6A58", light:"#E8DEC8" };
  const iInp = { width:"100%", padding:"8px 10px", border:`1px solid ${IC.border}`, borderRadius:5, fontSize:13, background:"#F8F4EE", color:"#2A1A0A", marginBottom:7, outline:"none", fontFamily:"inherit" };

  const print = () => {
    const el = document.getElementById("al-inv-preview");
    if(!el) return;
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invNum}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Barlow:wght@400;600&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Barlow,sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ih{background:#1A3A1A;padding:32px 44px 26px}.ib{padding:28px 44px}.if{background:#E8DEC8;padding:14px 44px;border-top:1px solid #D0C0A0}
table{width:100%;border-collapse:collapse}th{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#7A6A58;padding:8px 0;border-bottom:1px solid #D8C8A8;text-align:left;font-weight:600}
td{padding:11px 0;border-bottom:1px solid #EDE3D3;font-size:14px;color:#2A1A0A;vertical-align:top}.tar{text-align:right}.sm{font-size:12px;color:#7A6A58}
</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close(); setTimeout(()=>w.print(),400);
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"290px 1fr", gap:18, alignItems:"start" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Barlow:wght@300;400;600&display=swap');`}</style>

      {/* Controls */}
      <div>
        {/* Bill To */}
        <div style={{ background:"#FDFAF4", borderRadius:8, padding:14, marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:IC.green, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Bill To</div>
          {[["name","Company / Farm Name"],["address","Street Address"],["city","City, State, ZIP"],["email","Email"]].map(([k,ph])=>(
            <input key={k} placeholder={ph} value={client[k]} onChange={e=>setClient(c=>({...c,[k]:e.target.value}))} style={iInp}/>
          ))}
        </div>
        {/* Modules */}
        <div style={{ background:"#FDFAF4", borderRadius:8, padding:14, marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:IC.green, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Modules (USD)</div>
          <button onClick={setBundle} style={{ width:"100%", padding:"9px 12px", marginBottom:8, borderRadius:6, border:`2px solid ${allThree?"#4A8A4A":IC.border}`, background:allThree?"#EBF5EB":"#F4EFE6", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"inherit" }}>
            <div style={{ textAlign:"left" }}>
              <div style={{ fontWeight:700, fontSize:12, color:allThree?"#2A6A2A":"#3A2A1A" }}>Full Bundle — All 3</div>
              <div style={{ fontSize:11, color:allThree?"#4A8A4A":IC.muted }}>Save $90 vs individual</div>
            </div>
            <div style={{ fontWeight:700, color:allThree?"#2A6A2A":IC.amber }}>$360/yr</div>
          </button>
          {INV_MODS.map(m=>(
            <label key={m.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 9px", borderRadius:5, border:`1px solid ${sel.has(m.id)?"#A8CCA8":IC.border}`, background:sel.has(m.id)?"#F0F7F0":"transparent", marginBottom:5, cursor:"pointer" }}>
              <input type="checkbox" checked={sel.has(m.id)} onChange={()=>toggleMod(m.id)} style={{ accentColor:"#4A8A4A" }}/>
              <div style={{ flex:1 }}><div style={{ fontWeight:600, fontSize:12 }}>{m.name}</div><div style={{ fontSize:11, color:IC.muted }}>{m.desc}</div></div>
              <div style={{ fontWeight:700, fontSize:12, color:IC.amber }}>${m.price}/yr</div>
            </label>
          ))}
        </div>
        {/* Custom lines */}
        <div style={{ background:"#FDFAF4", borderRadius:8, padding:14, marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:IC.green, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Custom Lines</div>
          {extras.map(l=>(
            <div key={l.id} style={{ display:"grid", gridTemplateColumns:"1fr 42px 64px 22px", gap:4, marginBottom:5 }}>
              <input placeholder="Description" value={l.desc} onChange={e=>updExtra(l.id,"desc",e.target.value)} style={{...iInp,marginBottom:0}}/>
              <input type="number" placeholder="Qty" value={l.qty} onChange={e=>updExtra(l.id,"qty",e.target.value)} style={{...iInp,marginBottom:0,textAlign:"center"}}/>
              <input type="number" placeholder="$" value={l.price} onChange={e=>updExtra(l.id,"price",e.target.value)} style={{...iInp,marginBottom:0,textAlign:"right"}}/>
              <button onClick={()=>delExtra(l.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"#C05050", fontSize:15 }}>✕</button>
            </div>
          ))}
          <button onClick={addExtra} style={{ background:"none", border:`1px dashed ${IC.border}`, borderRadius:4, padding:"5px 10px", color:IC.muted, fontSize:11, cursor:"pointer", width:"100%", fontFamily:"inherit" }}>+ Add line</button>
        </div>
        {/* Dates */}
        <div style={{ background:"#FDFAF4", borderRadius:8, padding:14, marginBottom:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:10, fontWeight:700, color:IC.green, letterSpacing:".12em", textTransform:"uppercase", marginBottom:10 }}>Details</div>
          <label style={{ fontSize:11, color:IC.muted, display:"block", marginBottom:3 }}>Invoice Date</label>
          <input type="date" value={date} onChange={e=>{setDate(e.target.value);setDue(invAddDays(e.target.value,30));}} style={iInp}/>
          <label style={{ fontSize:11, color:IC.muted, display:"block", marginBottom:3 }}>Due Date</label>
          <input type="date" value={due} onChange={e=>setDue(e.target.value)} style={iInp}/>
          <label style={{ fontSize:11, color:IC.muted, display:"block", marginBottom:3 }}>Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{...iInp,resize:"vertical"}}/>
        </div>
        <button onClick={print} style={{ width:"100%", background:IC.amber, color:"#fff", border:"none", borderRadius:6, padding:"11px", fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"inherit", letterSpacing:".04em" }}>🖨 Print / Save PDF</button>
      </div>

      {/* Preview */}
      <div id="al-inv-preview" style={{ background:IC.cream, borderRadius:8, boxShadow:"0 4px 20px rgba(0,0,0,.1)", overflow:"hidden" }}>
        <style>{`.al-ib table{width:100%;border-collapse:collapse}.al-ib th{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#7A6A58;padding:8px 0;border-bottom:1px solid #D8C8A8;text-align:left;font-weight:600}.al-ib td{padding:11px 0;border-bottom:1px solid #EDE3D3;font-size:14px;color:#2A1A0A;vertical-align:top}`}</style>
        {/* Header */}
        <div className="ih" style={{ background:IC.green, padding:"32px 44px 26px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#F4EFE6", fontWeight:700 }}>Agri<span style={{ color:IC.amber }}>Logix</span></div>
              <div style={{ fontSize:10, color:"rgba(244,239,230,0.45)", letterSpacing:".18em", textTransform:"uppercase", marginTop:4 }}>Solutions</div>
              <div style={{ marginTop:12, fontSize:11, color:"rgba(244,239,230,0.55)", lineHeight:1.9 }}>agrilogixsolutions.com<br/>info@agrilogixsolutions.com</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, color:"#F4EFE6", fontWeight:400, letterSpacing:".06em" }}>INVOICE</div>
              <div style={{ color:IC.amber, fontWeight:600, fontSize:13, marginTop:5 }}>{invNum}</div>
              <div style={{ fontSize:11, color:"rgba(244,239,230,0.5)", marginTop:8, lineHeight:1.9 }}>Issued: {invFmtDate(date)}<br/>Due: {invFmtDate(due)}</div>
            </div>
          </div>
        </div>
        {/* Body */}
        <div className="al-ib" style={{ padding:"28px 44px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div>
              <div style={{ fontSize:10, color:IC.muted, textTransform:"uppercase", letterSpacing:".14em", marginBottom:7, fontWeight:600 }}>Bill To</div>
              {client.name
                ? <><div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:IC.green, fontWeight:700 }}>{client.name}</div>
                   {client.address && <div style={{ fontSize:13, color:IC.muted, marginTop:2 }}>{client.address}</div>}
                   {client.city    && <div style={{ fontSize:13, color:IC.muted }}>{client.city}</div>}
                   {client.email   && <div style={{ fontSize:12, color:IC.amber, marginTop:3 }}>{client.email}</div>}</>
                : <div style={{ fontSize:13, color:"#C8B898", fontStyle:"italic" }}>Enter client info →</div>
              }
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:IC.muted, textTransform:"uppercase", letterSpacing:".14em", marginBottom:7, fontWeight:600 }}>Terms</div>
              <div style={{ fontSize:12, color:IC.muted, lineHeight:1.7 }}>Annual subscription<br/>All prices in USD</div>
            </div>
          </div>
          <hr style={{ border:"none", borderTop:`1px solid ${IC.border}`, margin:"0 0 18px" }}/>
          <table>
            <thead>
              <tr>{["Description","Qty","Unit Price","Amount"].map((h,i)=>(
                <th key={h} style={{ textAlign:i>1?"right":"left", paddingRight:i===2?16:0 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {allThree
                ? <tr>
                    <td><div style={{ fontWeight:600 }}>Agri Logix — Full Suite Bundle</div><div style={{ fontSize:12, color:IC.muted }}>AgriLog · AgriScale · AgriService — Annual</div></td>
                    <td style={{ textAlign:"center" }}>1</td>
                    <td style={{ textAlign:"right", paddingRight:16 }}>{invMoney(360)}</td>
                    <td style={{ textAlign:"right", fontWeight:600 }}>{invMoney(360)}</td>
                  </tr>
                : [...sel].map(id=>{const m=INV_MODS.find(x=>x.id===id);return m?(
                    <tr key={id}>
                      <td><div style={{ fontWeight:600 }}>Agri Logix — {m.name}</div><div style={{ fontSize:12, color:IC.muted }}>{m.desc} — Annual</div></td>
                      <td style={{ textAlign:"center" }}>1</td>
                      <td style={{ textAlign:"right", paddingRight:16 }}>{invMoney(m.price)}</td>
                      <td style={{ textAlign:"right", fontWeight:600 }}>{invMoney(m.price)}</td>
                    </tr>
                  ):null;})
              }
              {extras.filter(l=>l.desc).map(l=>(
                <tr key={l.id}>
                  <td style={{ fontWeight:600 }}>{l.desc}</td>
                  <td style={{ textAlign:"center" }}>{l.qty}</td>
                  <td style={{ textAlign:"right", paddingRight:16 }}>{invMoney(+l.price||0)}</td>
                  <td style={{ textAlign:"right", fontWeight:600 }}>{invMoney((+l.price||0)*(+l.qty||1))}</td>
                </tr>
              ))}
              {sel.size===0&&extras.length===0&&<tr><td colSpan={4} style={{ textAlign:"center", color:"#C8B898", fontStyle:"italic", padding:"24px 0" }}>Select modules to add line items</td></tr>}
            </tbody>
          </table>
          {(sel.size>0||extras.length>0)&&(
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
              <table style={{ borderCollapse:"collapse" }}>
                <tbody>
                  {saving>0&&<tr><td style={{ padding:"4px 24px 4px 0", fontSize:12, color:IC.muted }}>Bundle savings</td><td style={{ fontSize:12, color:"#4A8A4A", textAlign:"right", fontWeight:600 }}>−{invMoney(saving)}</td></tr>}
                  <tr><td style={{ padding:"6px 24px 6px 0", fontSize:13, color:IC.muted }}>Subtotal</td><td style={{ fontSize:13, textAlign:"right" }}>{invMoney(total)}</td></tr>
                  <tr>
                    <td style={{ padding:"10px 24px 0 0", fontSize:15, color:IC.green, fontWeight:700, borderTop:`2px solid ${IC.green}` }}>TOTAL DUE</td>
                    <td style={{ fontSize:20, color:IC.amber, fontWeight:700, textAlign:"right", borderTop:`2px solid ${IC.green}`, paddingTop:10 }}>{invMoney(total)} USD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {notes&&<div style={{ marginTop:24, background:"#F0EBE0", borderRadius:6, padding:"12px 16px", borderLeft:`3px solid ${IC.amber}` }}>
            <div style={{ fontSize:10, color:IC.muted, textTransform:"uppercase", letterSpacing:".12em", marginBottom:4, fontWeight:600 }}>Notes</div>
            <div style={{ fontSize:13, color:IC.muted, lineHeight:1.7 }}>{notes}</div>
          </div>}
        </div>
        {/* Footer */}
        <div className="if" style={{ background:IC.light, padding:"14px 44px", borderTop:`1px solid ${IC.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:11, color:IC.muted }}>Agri Logix Solutions · Built for the Hi-Line</div>
          <div style={{ fontSize:11, color:IC.amber, fontWeight:600 }}>{invNum}</div>
        </div>
      </div>
    </div>
  );
}

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
  const [adminTab,     setAdminTab]     = useState("orgs");
  const [invClient,  setInvClient]  = useState({name:"",address:"",city:"",email:""});
  const [invSel,     setInvSel]     = useState(new Set());
  const [invExtras,  setInvExtras]  = useState([]);
  const [invDate,    setInvDate]    = useState(invToday());
  const [invDue,     setInvDue]     = useState(invAddDays(invToday(),30));
  const [invNotes,   setInvNotes]   = useState("Payment due within 30 days. Thank you for your business!");
  const [invNum]                    = useState(invNextNum());

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

      <div style={{ background:"#F0EBE0", borderBottom:`1px solid ${T.border}`, padding:"0 20px", display:"flex" }}>
        {[["orgs","🏢 Organizations"],["invoice","🧾 Invoice"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setAdminTab(id)} style={{ padding:"11px 18px", border:"none", borderBottom:`2px solid ${adminTab===id?T.brand:"transparent"}`, background:"transparent", color:adminTab===id?T.brand:T.muted, fontWeight:adminTab===id?700:400, fontSize:"13px", cursor:"pointer", transition:"all .15s", fontFamily:"inherit" }}>{lbl}</button>
        ))}
      </div>
      {adminTab==="invoice"
        ? <div style={S.content}><InvoiceBuilder client={invClient} setClient={setInvClient} sel={invSel} setSel={setInvSel} extras={invExtras} setExtras={setInvExtras} date={invDate} setDate={setInvDate} due={invDue} setDue={setInvDue} notes={invNotes} setNotes={setInvNotes} invNum={invNum}/></div>
        : <div style={S.content}>
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

      </div>}{/* end orgs tab */}
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
