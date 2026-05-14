import React, { useState, useEffect } from "react";
import { dbRead, dbWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

// ── ServiceLog uses the Agri Logix light theme ───────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
  .sl-wrap *, .sl-wrap *::before, .sl-wrap *::after { box-sizing: border-box; }
  .sl-wrap {
    --sl-bg:#F4EFE6; --sl-bg2:#EDE6D8; --sl-panel:#FFFFFF;
    --sl-border:#D8CEBC; --sl-border-hi:#C4A468;
    --sl-amber:#C07010; --sl-amber-soft:#D48820;
    --sl-blue:#1E5078; --sl-green:#2A5E2A;
    --sl-red:#841A18; --sl-danger-bg:#FDF0EE;
    --sl-text:#1E1408; --sl-muted:#7A6645; --sl-faint:#B8A880;
    background: var(--sl-bg); color: var(--sl-text);
    font-family: 'Barlow', sans-serif; min-height: calc(100vh - 50px);
    display: flex; flex-direction: column;
  }
  .sl-topbar {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px; border-bottom:1px solid var(--sl-border);
    background:#FFFFFF; flex-shrink:0; gap:12px; flex-wrap:wrap;
  }
  .sl-brand { display:flex; align-items:baseline; gap:10px; }
  .sl-eyebrow { font-size:10px; letter-spacing:3px; color:var(--sl-muted); text-transform:uppercase; font-family:'Barlow',sans-serif; }
  .sl-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--sl-text); letter-spacing:0.5px; line-height:1; }
  .sl-title span { color:var(--sl-amber); }
  .sl-stats { display:flex; gap:20px; }
  .sl-stat-val { font-size:18px; font-weight:700; color:var(--sl-amber); line-height:1; font-family:'Barlow',sans-serif; }
  .sl-stat-lbl { font-size:9px; letter-spacing:1.5px; color:var(--sl-muted); text-transform:uppercase; }
  .sl-body { display:flex; flex:1; overflow:hidden; min-height:0; }
  .sl-sidebar {
    width:240px; flex-shrink:0; border-right:1px solid var(--sl-border);
    display:flex; flex-direction:column; overflow:hidden; background:#FDFAF4;
  }
  .sl-sidebar-header {
    padding:12px 14px 10px; border-bottom:1px solid var(--sl-border);
    display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
  }
  .sl-sidebar-label { font-size:10px; letter-spacing:2px; color:var(--sl-muted); text-transform:uppercase; font-weight:700; }
  .sl-sidebar-list { overflow-y:auto; flex:1; padding:6px 0; }
  .sl-item {
    display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer;
    transition:background .12s; border-left:3px solid transparent;
  }
  .sl-item:hover { background:var(--sl-bg2); }
  .sl-item.active { background:rgba(192,112,16,.08); border-left-color:var(--sl-amber); }
  .sl-item-icon { font-size:15px; width:20px; text-align:center; flex-shrink:0; }
  .sl-item-info { flex:1; min-width:0; }
  .sl-item-name { font-size:14px; font-weight:700; color:var(--sl-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sl-item.active .sl-item-name { color:var(--sl-amber); }
  .sl-item-sub { font-size:11px; color:var(--sl-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sl-item-count { font-size:10px; color:var(--sl-muted); background:var(--sl-bg); padding:1px 6px; border-radius:10px; border:1px solid var(--sl-border); }
  .sl-item.active .sl-item-count { background:rgba(192,112,16,.12); color:var(--sl-amber); border-color:rgba(192,112,16,.3); }
  .sl-divider { height:1px; background:var(--sl-border); margin:6px 0; }
  .sl-sidebar-add {
    margin:8px 10px 10px; padding:8px; border:1px dashed var(--sl-border-hi); border-radius:6px;
    background:none; color:var(--sl-muted); font-size:13px; font-weight:600; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:6px;
    transition:border-color .15s, color .15s; flex-shrink:0; font-family:'Barlow',sans-serif;
  }
  .sl-sidebar-add:hover { border-color:var(--sl-amber); color:var(--sl-amber); }
  .sl-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .sl-content { flex:1; overflow-y:auto; padding:24px; max-width:860px; }
  .sl-section-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--sl-text); margin-bottom:4px; }
  .sl-section-sub { font-size:13px; color:var(--sl-muted); margin-bottom:20px; }
  .sl-summary-bar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .sl-summary-stat { background:var(--sl-panel); border:1px solid var(--sl-border); border-radius:8px; padding:12px 16px; flex:1; min-width:90px; }
  .sl-summary-stat-val { font-size:22px; font-weight:700; color:var(--sl-amber); line-height:1; }
  .sl-summary-stat-lbl { font-size:9px; letter-spacing:1.5px; color:var(--sl-muted); text-transform:uppercase; margin-top:3px; }
  .sl-fleet-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
  .sl-vcard {
    background:var(--sl-panel); border:1px solid var(--sl-border); border-radius:10px;
    padding:18px; cursor:pointer; transition:border-color .15s, box-shadow .15s;
  }
  .sl-vcard:hover { border-color:var(--sl-border-hi); box-shadow:0 2px 8px rgba(192,112,16,.1); }
  .sl-vcard-type { font-size:10px; letter-spacing:2px; color:var(--sl-amber); text-transform:uppercase; margin-bottom:5px; font-weight:700; }
  .sl-vcard-name { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--sl-text); margin-bottom:3px; }
  .sl-vcard-sub { font-size:12px; color:var(--sl-muted); margin-bottom:12px; }
  .sl-vcard-meta { display:flex; gap:14px; flex-wrap:wrap; }
  .sl-vcard-stat-lbl { font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--sl-muted); }
  .sl-vcard-stat-val { font-size:14px; font-weight:600; color:var(--sl-text); }
  .sl-vcard-last { margin-top:10px; font-size:11px; color:var(--sl-muted); }
  .sl-vic {
    background:var(--sl-panel); border:1px solid var(--sl-border); border-radius:10px;
    margin-bottom:20px; overflow:hidden;
  }
  .sl-vic-top {
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:16px 20px 14px; border-bottom:1px solid var(--sl-border); flex-wrap:wrap;
  }
  .sl-vic-identity { display:flex; align-items:center; gap:14px; }
  .sl-vic-icon {
    width:48px; height:48px; border-radius:8px;
    background:rgba(192,112,16,.1); border:1px solid rgba(192,112,16,.25);
    display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;
  }
  .sl-vic-name { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--sl-text); line-height:1; margin-bottom:3px; }
  .sl-vic-badge { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--sl-amber); background:rgba(192,112,16,.1); padding:2px 8px; border-radius:4px; font-weight:700; }
  .sl-vic-actions { display:flex; gap:8px; flex-shrink:0; }
  .sl-vic-specs { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); }
  .sl-vic-spec { padding:12px 18px; border-right:1px solid var(--sl-border); border-bottom:1px solid var(--sl-border); }
  .sl-vic-spec-lbl { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--sl-muted); margin-bottom:4px; font-weight:700; }
  .sl-vic-spec-val { font-size:14px; font-weight:600; color:var(--sl-text); }
  .sl-vic-notes { padding:10px 18px; font-size:13px; color:var(--sl-muted); font-style:italic; border-top:1px solid var(--sl-border); }
  .sl-records { display:flex; flex-direction:column; gap:10px; }
  .sl-record {
    background:var(--sl-panel); border:1px solid var(--sl-border); border-left:3px solid var(--sl-amber);
    border-radius:6px; padding:14px 18px;
    display:grid; grid-template-columns:56px 1fr auto; gap:14px; align-items:start;
    transition:border-left-color .15s;
  }
  .sl-record:hover { border-left-color:var(--sl-amber-soft); box-shadow:0 1px 4px rgba(0,0,0,.06); }
  .sl-rec-date-day { font-size:24px; font-weight:700; color:var(--sl-amber); line-height:1; text-align:center; }
  .sl-rec-date-mon { font-size:9px; letter-spacing:1px; color:var(--sl-muted); text-transform:uppercase; text-align:center; }
  .sl-rec-date-yr { font-size:9px; color:var(--sl-muted); text-align:center; }
  .sl-rec-type { font-size:16px; font-weight:700; color:var(--sl-text); margin-bottom:3px; }
  .sl-rec-notes { font-size:13px; color:var(--sl-muted); line-height:1.4; margin-bottom:6px; }
  .sl-rec-tags { display:flex; gap:6px; flex-wrap:wrap; }
  .sl-rec-tag { font-size:11px; color:var(--sl-muted); background:var(--sl-bg); padding:2px 8px; border-radius:10px; border:1px solid var(--sl-border); }
  .sl-rec-right { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .sl-rec-cost { font-size:14px; font-weight:700; color:var(--sl-green); }
  .sl-empty { text-align:center; padding:60px 20px; color:var(--sl-muted); }
  .sl-empty-icon { font-size:44px; margin-bottom:12px; }
  .sl-empty-title { font-size:20px; font-weight:700; margin-bottom:6px; color:var(--sl-text); font-family:'Playfair Display',serif; }
  .sl-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:background .15s; font-family:'Barlow',sans-serif; }
  .sl-btn-primary { background:var(--sl-amber); color:#FFFFFF; }
  .sl-btn-primary:hover { background:var(--sl-amber-soft); }
  .sl-btn-ghost { background:transparent; color:var(--sl-muted); border:1px solid var(--sl-border); }
  .sl-btn-ghost:hover { border-color:var(--sl-amber); color:var(--sl-amber); }
  .sl-btn-danger { background:var(--sl-danger-bg); color:var(--sl-red); border:1px solid rgba(132,26,24,.2); }
  .sl-btn-sm { padding:4px 10px; font-size:12px; }
  .sl-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
  .sl-modal { background:#FDFAF4; border:1px solid var(--sl-border-hi); border-radius:12px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
  .sl-modal-header { padding:18px 22px 14px; border-bottom:1px solid var(--sl-border); display:flex; align-items:center; justify-content:space-between; }
  .sl-modal-title { font-family:'Playfair Display',serif; font-size:19px; font-weight:700; color:var(--sl-text); }
  .sl-modal-close { background:none; border:none; color:var(--sl-muted); cursor:pointer; font-size:18px; }
  .sl-modal-body { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
  .sl-modal-footer { padding:14px 22px; border-top:1px solid var(--sl-border); display:flex; justify-content:flex-end; gap:10px; }
  .sl-form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sl-form-group { display:flex; flex-direction:column; gap:5px; }
  .sl-form-group.full { grid-column:1/-1; }
  .sl-form-label { font-size:11px; letter-spacing:0.9px; text-transform:uppercase; color:var(--sl-muted); font-weight:700; }
  .sl-form-input,.sl-form-select,.sl-form-textarea { background:#FFFFFF; border:1px solid var(--sl-border-hi); border-radius:6px; padding:8px 11px; color:var(--sl-text); font-family:'Barlow',sans-serif; font-size:14px; outline:none; transition:border-color .15s; width:100%; }
  .sl-form-input:focus,.sl-form-select:focus,.sl-form-textarea:focus { border-color:var(--sl-amber); }
  .sl-form-textarea { resize:vertical; min-height:76px; }
  @media(max-width:640px){
    .sl-sidebar{width:200px;}
    .sl-record{grid-template-columns:1fr auto;}
    .sl-rec-date-day,.sl-rec-date-mon,.sl-rec-date-yr{display:none;}
    .sl-form-row{grid-template-columns:1fr;}
  }
  @media(max-width:480px){
    .sl-sidebar{display:none;}
    .sl-content{padding:16px;}
  }
`;

const ICONS = {
  Truck:"🚛", Tractor:"🚜", Combine:"🌾", "Grain Cart":"⚙️", Semi:"🚛",
  Trailer:"📦", Sprayer:"💧", Pickup:"🛻", "ATV/UTV":"🏎️", Generator:"⚡", Other:"🔧"
};
const SERVICE_TYPES = ["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"];
const EQUIPMENT_TYPES = ["Truck","Tractor","Combine","Grain Cart","Semi","Trailer","Sprayer","Pickup","ATV/UTV","Generator","Other"];

const sumCost = (recs) => recs.reduce((s,r) => s + (parseFloat(r.cost)||0), 0);

const fmtDate = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return {
    day: d.getDate().toString().padStart(2,"0"),
    mon: d.toLocaleString("en", { month:"short" }).toUpperCase(),
    yr:  d.getFullYear(),
  };
};

export default function ServiceLogModule({ tenantId, token, persist }) {
  const [vehicles, setVehicles] = useState([]);
  const [records,  setRecords]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [modal,    setModal]    = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const BASE = `tenants/${tenantId}/serviceLog`;

  // ── Load data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      dbRead(`${BASE}/vehicles`, token).then(d => setVehicles(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/records`,  token).then(d => setRecords(obj2arr(d||{}))).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, [tenantId, token]);

  // ── Real-time listener ─────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    const unsub = dbListen(`${BASE}`, token, ({ data }) => {
      if (!data) return;
      if (data.vehicles) setVehicles(obj2arr(data.vehicles));
      if (data.records)  setRecords(obj2arr(data.records));
    });
    return unsub;
  }, [tenantId, token]);

  const save = (newVehicles, newRecords) => {
    persist("serviceLog", {
      vehicles: Object.fromEntries(newVehicles.map(v => [v.id, v])),
      records:  Object.fromEntries(newRecords.map(r  => [r.id, r])),
    });
  };

  const saveVehicle = (form) => {
    if (editTarget) {
      const nv = vehicles.map(v => v.id===editTarget.id ? {...editTarget,...form} : v);
      setVehicles(nv); save(nv, records);
    } else {
      const nv = [...vehicles, {id:genId(),...form}];
      setVehicles(nv); save(nv, records);
      setSelectedId(nv[nv.length-1].id);
    }
    setModal(null); setEditTarget(null);
  };

  const deleteVehicle = (id) => {
    if (!confirm("Delete this vehicle and all its service records?")) return;
    const nv = vehicles.filter(v => v.id!==id);
    const nr = records.filter(r => r.vehicleId!==id);
    setVehicles(nv); setRecords(nr); save(nv, nr);
    if (selectedId===id) setSelectedId(null);
  };

  const saveRecord = (form) => {
    let nv = vehicles;
    if (form.hours) {
      const newHrs = parseFloat(form.hours);
      const veh = vehicles.find(v => v.id===selectedId);
      if (veh && newHrs > (parseFloat(veh.hours)||0)) {
        nv = vehicles.map(v => v.id===selectedId ? {...v, hours:String(newHrs)} : v);
        setVehicles(nv);
      }
    }
    let nr;
    if (editTarget) {
      nr = records.map(r => r.id===editTarget.id ? {...editTarget,...form} : r);
    } else {
      nr = [...records, {id:genId(), vehicleId:selectedId, ...form}];
    }
    setRecords(nr); save(nv, nr);
    setModal(null); setEditTarget(null);
  };

  const deleteRecord = (id) => {
    if (!confirm("Delete this service record?")) return;
    const nr = records.filter(r => r.id!==id);
    setRecords(nr); save(vehicles, nr);
  };

  const selected  = vehicles.find(v => v.id===selectedId) || null;
  const vRecords  = selected
    ? records.filter(r => r.vehicleId===selectedId).sort((a,b) => b.date.localeCompare(a.date))
    : [];

  if (loading) return (
    <div style={{textAlign:"center",padding:"60px",color:"#7a8099"}}>
      <div style={{fontSize:"32px",marginBottom:"8px"}}>🔧</div>
      Loading ServiceLog…
    </div>
  );

  return (
    <>
      <style>{style}</style>
      <div className="sl-wrap">

        {/* Topbar */}
        <div className="sl-topbar">
          <div className="sl-brand">
            <div className="sl-eyebrow">⚙ Fleet</div>
            <div className="sl-title">SERVICE<span>LOG</span></div>
          </div>
          <div className="sl-stats">
            <div><div className="sl-stat-val">{vehicles.length}</div><div className="sl-stat-lbl">Equipment</div></div>
            <div><div className="sl-stat-val">{records.length}</div><div className="sl-stat-lbl">Records</div></div>
            <div><div className="sl-stat-val">${sumCost(records).toLocaleString()}</div><div className="sl-stat-lbl">Total Spent</div></div>
          </div>
          {selected
            ? <button className="sl-btn sl-btn-primary" onClick={()=>{setEditTarget(null);setModal("addRecord");}}>+ Log Service</button>
            : <button className="sl-btn sl-btn-primary" onClick={()=>{setEditTarget(null);setModal("addVehicle");}}>+ Add Equipment</button>
          }
        </div>

        <div className="sl-body">
          {/* Sidebar */}
          <div className="sl-sidebar">
            <div className="sl-sidebar-header">
              <span className="sl-sidebar-label">Fleet</span>
              <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:"var(--sl-text-dim)"}}>{vehicles.length}</span>
            </div>
            <div className="sl-sidebar-list">
              <div className={`sl-item ${!selectedId?"active":""}`} onClick={()=>setSelectedId(null)}>
                <span className="sl-item-icon">🗂️</span>
                <div className="sl-item-info">
                  <div className="sl-item-name">All Equipment</div>
                  <div className="sl-item-sub">Fleet overview</div>
                </div>
              </div>
              <div className="sl-divider"/>
              {vehicles.map(v => {
                const cnt = records.filter(r => r.vehicleId===v.id).length;
                return (
                  <div key={v.id} className={`sl-item ${selectedId===v.id?"active":""}`} onClick={()=>setSelectedId(v.id)}>
                    <span className="sl-item-icon">{ICONS[v.type]||"🔧"}</span>
                    <div className="sl-item-info">
                      <div className="sl-item-name">{v.name}</div>
                      <div className="sl-item-sub">{v.type}{v.year?` · ${v.year}`:""}</div>
                    </div>
                    {cnt>0&&<span className="sl-item-count">{cnt}</span>}
                  </div>
                );
              })}
            </div>
            <button className="sl-sidebar-add" onClick={()=>{setEditTarget(null);setModal("addVehicle");}}>＋ Add Equipment</button>
          </div>

          {/* Main */}
          <div className="sl-main">
            <div className="sl-content">

              {/* Fleet overview */}
              {!selected&&(
                <>
                  <div className="sl-section-title">Fleet Overview</div>
                  <div className="sl-section-sub">Select a vehicle or add new equipment.</div>
                  <div className="sl-summary-bar">
                    <div className="sl-summary-stat"><div className="sl-summary-stat-val">{vehicles.length}</div><div className="sl-summary-stat-lbl">Equipment</div></div>
                    <div className="sl-summary-stat"><div className="sl-summary-stat-val">{records.length}</div><div className="sl-summary-stat-lbl">Records</div></div>
                    <div className="sl-summary-stat"><div className="sl-summary-stat-val">${sumCost(records).toLocaleString()}</div><div className="sl-summary-stat-lbl">Total Spent</div></div>
                  </div>
                  <div className="sl-fleet-grid">
                    {vehicles.length===0&&(
                      <div className="sl-empty" style={{gridColumn:"1/-1"}}>
                        <div className="sl-empty-icon">🔧</div>
                        <div className="sl-empty-title">No Equipment Yet</div>
                        <div>Click "+ Add Equipment" to get started.</div>
                      </div>
                    )}
                    {vehicles.map(v=>{
                      const recs=records.filter(r=>r.vehicleId===v.id).sort((a,b)=>b.date.localeCompare(a.date));
                      return(
                        <div key={v.id} className="sl-vcard" onClick={()=>setSelectedId(v.id)}>
                          <div className="sl-vcard-type">{ICONS[v.type]} {v.type}</div>
                          <div className="sl-vcard-name">{v.name}</div>
                          <div className="sl-vcard-sub">{[v.year,v.make,v.model].filter(Boolean).join(" · ")}</div>
                          <div className="sl-vcard-meta">
                            <div><div className="sl-vcard-stat-lbl">Records</div><div className="sl-vcard-stat-val">{recs.length}</div></div>
                            <div><div className="sl-vcard-stat-lbl">Cost</div><div className="sl-vcard-stat-val">${sumCost(recs).toLocaleString()}</div></div>
                            {v.hours&&<div><div className="sl-vcard-stat-lbl">Hrs/Mi</div><div className="sl-vcard-stat-val">{Number(v.hours).toLocaleString()}</div></div>}
                          </div>
                          {recs[0]&&<div className="sl-vcard-last">Last: {recs[0].type} — {recs[0].date}</div>}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Vehicle detail */}
              {selected&&(
                <>
                  <div className="sl-vic">
                    <div className="sl-vic-top">
                      <div className="sl-vic-identity">
                        <div className="sl-vic-icon">{ICONS[selected.type]||"🔧"}</div>
                        <div>
                          <div className="sl-vic-name">{selected.name}</div>
                          <span className="sl-vic-badge">{selected.type}</span>
                        </div>
                      </div>
                      <div className="sl-vic-actions">
                        <button className="sl-btn sl-btn-ghost sl-btn-sm" onClick={()=>{setEditTarget(selected);setModal("editVehicle");}}>Edit</button>
                        <button className="sl-btn sl-btn-danger sl-btn-sm" onClick={()=>deleteVehicle(selected.id)}>Delete</button>
                      </div>
                    </div>
                    <div className="sl-vic-specs">
                      {selected.year&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Year</div><div className="sl-vic-spec-val">{selected.year}</div></div>}
                      {selected.make&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Make</div><div className="sl-vic-spec-val">{selected.make}</div></div>}
                      {selected.model&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Model</div><div className="sl-vic-spec-val">{selected.model}</div></div>}
                      {selected.hours&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Hrs / Miles</div><div className="sl-vic-spec-val">{Number(selected.hours).toLocaleString()}</div></div>}
                      {selected.vin&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">VIN / Serial</div><div className="sl-vic-spec-val" style={{fontSize:12}}>{selected.vin}</div></div>}
                      <div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Records</div><div className="sl-vic-spec-val">{vRecords.length}</div></div>
                      <div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Total Cost</div><div className="sl-vic-spec-val" style={{color:"var(--sl-green)"}}>${sumCost(vRecords).toLocaleString()}</div></div>
                      {vRecords[0]&&<div className="sl-vic-spec"><div className="sl-vic-spec-lbl">Last Service</div><div className="sl-vic-spec-val" style={{fontSize:13}}>{vRecords[0].date}</div></div>}
                    </div>
                    {selected.notes&&<div className="sl-vic-notes">📝 {selected.notes}</div>}
                  </div>

                  {vRecords.length===0
                    ?<div className="sl-empty"><div className="sl-empty-icon">🔧</div><div className="sl-empty-title">No Service Records</div><div>Hit "+ Log Service" to record the first entry.</div></div>
                    :<div className="sl-records">
                      {vRecords.map(r=>{
                        const d=fmtDate(r.date);
                        return(
                          <div key={r.id} className="sl-record">
                            <div>
                              <div className="sl-rec-date-day">{d.day}</div>
                              <div className="sl-rec-date-mon">{d.mon}</div>
                              <div className="sl-rec-date-yr">{d.yr}</div>
                            </div>
                            <div>
                              <div className="sl-rec-type">{r.type}</div>
                              {r.notes&&<div className="sl-rec-notes">{r.notes}</div>}
                              <div className="sl-rec-tags">
                                {r.tech&&<span className="sl-rec-tag">👤 {r.tech}</span>}
                                {r.hours&&<span className="sl-rec-tag">⏱ {Number(r.hours).toLocaleString()} hrs/mi</span>}
                              </div>
                            </div>
                            <div className="sl-rec-right">
                              <div className="sl-rec-cost">{r.cost?`$${Number(r.cost).toLocaleString()}`:"—"}</div>
                              <button className="sl-btn sl-btn-ghost sl-btn-sm" onClick={()=>{setEditTarget(r);setModal("editRecord");}}>Edit</button>
                              <button className="sl-btn sl-btn-danger sl-btn-sm" onClick={()=>deleteRecord(r.id)}>✕</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {(modal==="addVehicle"||modal==="editVehicle")&&(
        <VehicleModal initial={editTarget} onSave={saveVehicle} onClose={()=>{setModal(null);setEditTarget(null);}}/>
      )}
      {(modal==="addRecord"||modal==="editRecord")&&(
        <RecordModal initial={editTarget} onSave={saveRecord} onClose={()=>{setModal(null);setEditTarget(null);}}/>
      )}
    </>
  );
}

function VehicleModal({initial,onSave,onClose}){
  const[form,setForm]=useState({
    name:initial?.name||"",type:initial?.type||"Tractor",year:initial?.year||"",
    make:initial?.make||"",model:initial?.model||"",vin:initial?.vin||"",
    hours:initial?.hours||"",notes:initial?.notes||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="sl-modal-overlay" onClick={onClose}>
      <div className="sl-modal" onClick={e=>e.stopPropagation()}>
        <div className="sl-modal-header">
          <div className="sl-modal-title">{initial?"Edit Equipment":"Add Equipment"}</div>
          <button className="sl-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sl-modal-body">
          <div className="sl-form-row">
            <div className="sl-form-group full"><label className="sl-form-label">Name / Nickname *</label><input className="sl-form-input" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="e.g. JD 9620R"/></div>
            <div className="sl-form-group"><label className="sl-form-label">Type</label><select className="sl-form-select" value={form.type} onChange={e=>set("type",e.target.value)}>{EQUIPMENT_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="sl-form-group"><label className="sl-form-label">Year</label><input className="sl-form-input" value={form.year} onChange={e=>set("year",e.target.value)} placeholder="2021"/></div>
            <div className="sl-form-group"><label className="sl-form-label">Make</label><input className="sl-form-input" value={form.make} onChange={e=>set("make",e.target.value)} placeholder="John Deere"/></div>
            <div className="sl-form-group"><label className="sl-form-label">Model</label><input className="sl-form-input" value={form.model} onChange={e=>set("model",e.target.value)} placeholder="9620R"/></div>
            <div className="sl-form-group"><label className="sl-form-label">VIN / Serial</label><input className="sl-form-input" value={form.vin} onChange={e=>set("vin",e.target.value)} placeholder="Optional"/></div>
            <div className="sl-form-group"><label className="sl-form-label">Current Hours / Miles</label><input className="sl-form-input" type="number" value={form.hours} onChange={e=>set("hours",e.target.value)} placeholder="0"/></div>
            <div className="sl-form-group full"><label className="sl-form-label">Notes</label><textarea className="sl-form-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Additional notes..."/></div>
          </div>
        </div>
        <div className="sl-modal-footer">
          <button className="sl-btn sl-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sl-btn sl-btn-primary" onClick={()=>{if(!form.name.trim())return alert("Name is required.");onSave(form);}}>
            {initial?"Save Changes":"Add Equipment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordModal({initial,onSave,onClose}){
  const today=new Date().toISOString().slice(0,10);
  const[form,setForm]=useState({
    date:initial?.date||today,type:initial?.type||"Oil Change",
    notes:initial?.notes||"",cost:initial?.cost||"",
    hours:initial?.hours||"",tech:initial?.tech||"",
  });
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="sl-modal-overlay" onClick={onClose}>
      <div className="sl-modal" onClick={e=>e.stopPropagation()}>
        <div className="sl-modal-header">
          <div className="sl-modal-title">{initial?"Edit Service Record":"Log Service"}</div>
          <button className="sl-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="sl-modal-body">
          <div className="sl-form-row">
            <div className="sl-form-group"><label className="sl-form-label">Date *</label><input className="sl-form-input" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
            <div className="sl-form-group"><label className="sl-form-label">Service Type *</label><select className="sl-form-select" value={form.type} onChange={e=>set("type",e.target.value)}>{SERVICE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="sl-form-group"><label className="sl-form-label">Cost ($)</label><input className="sl-form-input" type="number" value={form.cost} onChange={e=>set("cost",e.target.value)} placeholder="0.00"/></div>
            <div className="sl-form-group"><label className="sl-form-label">Hours / Miles at Service</label><input className="sl-form-input" type="number" value={form.hours} onChange={e=>set("hours",e.target.value)} placeholder="0"/></div>
            <div className="sl-form-group full"><label className="sl-form-label">Performed By</label><input className="sl-form-input" value={form.tech} onChange={e=>set("tech",e.target.value)} placeholder="Self, Dealer, Shop..."/></div>
            <div className="sl-form-group full"><label className="sl-form-label">Notes / Parts Used</label><textarea className="sl-form-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Work done, parts replaced, observations..."/></div>
          </div>
        </div>
        <div className="sl-modal-footer">
          <button className="sl-btn sl-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sl-btn sl-btn-primary" onClick={()=>{if(!form.date||!form.type)return alert("Date and type are required.");onSave(form);}}>
            {initial?"Save Changes":"Log Service"}
          </button>
        </div>
      </div>
    </div>
  );
}
