import { useState, useEffect } from "react";
import { dbRead, dbWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Barlow:wght@300;400;500;600&display=swap');
  .sl *, .sl *::before, .sl *::after { box-sizing: border-box; }
  .sl {
    --bg:#F4EFE6; --bg2:#EDE6D8; --bg3:#E6DDD0; --panel:#FFFFFF;
    --border:#D8CEBC; --border2:#C4A468;
    --amber:#C07010; --amber2:#D48820;
    --red:#841A18; --green:#2A5E2A;
    --text:#1E1408; --muted:#7A6645; --faint:#B8A880;
    background:var(--bg); color:var(--text);
    font-family:'Barlow',sans-serif; min-height:calc(100vh - 50px);
    display:flex; flex-direction:column;
  }
  .sl-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-bottom:1px solid var(--border); background:var(--panel); flex-shrink:0; gap:12px; flex-wrap:wrap; }
  .sl-brand { display:flex; align-items:baseline; gap:10px; }
  .sl-eye { font-size:10px; letter-spacing:3px; color:var(--muted); text-transform:uppercase; }
  .sl-title { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--text); line-height:1; }
  .sl-title span { color:var(--amber); }
  .sl-stats { display:flex; gap:20px; }
  .sl-sv { font-size:18px; font-weight:700; color:var(--amber); line-height:1; }
  .sl-sl { font-size:9px; letter-spacing:1.5px; color:var(--muted); text-transform:uppercase; }
  .sl-nav { display:flex; border-bottom:1px solid var(--border); background:var(--panel); flex-shrink:0; overflow-x:auto; }
  .sl-nav-tab { padding:12px 20px; cursor:pointer; font-size:13px; font-weight:600; color:var(--muted); border-bottom:2px solid transparent; white-space:nowrap; transition:all .15s; background:none; border-top:none; border-left:none; border-right:none; font-family:'Barlow',sans-serif; }
  .sl-nav-tab:hover { color:var(--amber); }
  .sl-nav-tab.on { color:var(--amber); border-bottom-color:var(--amber); }
  .sl-nav-badge { display:inline-block; background:var(--amber); color:#fff; font-size:10px; font-weight:700; padding:1px 5px; border-radius:8px; margin-left:5px; }
  .sl-nav-badge.b { background:#1E5078; }
  .sl-nav-badge.g { background:var(--green); }
  .sl-body { display:flex; flex:1; overflow:hidden; min-height:0; }
  .sl-sidebar { width:240px; flex-shrink:0; border-right:1px solid var(--border); display:flex; flex-direction:column; overflow:hidden; background:#FDFAF4; }
  .sl-sh { padding:12px 14px 10px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
  .sl-shl { font-size:10px; letter-spacing:2px; color:var(--muted); text-transform:uppercase; font-weight:700; }
  .sl-ssearch { padding:8px 10px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .sl-ssearch input { width:100%; background:#fff; border:1px solid var(--border); border-radius:4px; padding:6px 10px; color:var(--text); font-family:'Barlow',sans-serif; font-size:13px; outline:none; }
  .sl-ssearch input:focus { border-color:var(--amber); }
  .sl-list { overflow-y:auto; flex:1; padding:6px 0; }
  .sl-item { display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer; transition:background .12s; border-left:3px solid transparent; }
  .sl-item:hover { background:var(--bg2); }
  .sl-item.on { background:rgba(192,112,16,.08); border-left-color:var(--amber); }
  .sl-ii { font-size:15px; width:20px; text-align:center; flex-shrink:0; }
  .sl-iinfo { flex:1; min-width:0; }
  .sl-iname { font-size:14px; font-weight:700; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sl-item.on .sl-iname { color:var(--amber); }
  .sl-isub { font-size:11px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .sl-icnt { font-size:10px; color:var(--muted); background:var(--bg); padding:1px 6px; border-radius:10px; border:1px solid var(--border); }
  .sl-item.on .sl-icnt { background:rgba(192,112,16,.12); color:var(--amber); border-color:rgba(192,112,16,.3); }
  .sl-div { height:1px; background:var(--border); margin:6px 0; }
  .sl-sadd { margin:8px 10px 10px; padding:8px; border:1px dashed var(--border2); border-radius:6px; background:none; color:var(--muted); font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:border-color .15s, color .15s; flex-shrink:0; font-family:'Barlow',sans-serif; }
  .sl-sadd:hover { border-color:var(--amber); color:var(--amber); }
  .sl-main { flex:1; display:flex; flex-direction:column; overflow:hidden; }
  .sl-content { flex:1; overflow-y:auto; padding:24px; }
  .sl-ot { font-family:'Playfair Display',serif; font-size:22px; font-weight:700; color:var(--text); margin-bottom:4px; }
  .sl-os { font-size:13px; color:var(--muted); margin-bottom:20px; }
  .sl-sumbar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .sl-sum { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:12px 16px; flex:1; min-width:90px; }
  .sl-sumv { font-size:22px; font-weight:700; color:var(--amber); line-height:1; }
  .sl-suml { font-size:9px; letter-spacing:1.5px; color:var(--muted); text-transform:uppercase; margin-top:3px; }
  .sl-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
  .sl-vcard { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:18px; cursor:pointer; transition:border-color .15s, box-shadow .15s; }
  .sl-vcard:hover { border-color:var(--border2); box-shadow:0 2px 8px rgba(192,112,16,.1); }
  .sl-vct { font-size:10px; letter-spacing:2px; color:var(--amber); text-transform:uppercase; margin-bottom:5px; font-weight:700; }
  .sl-vcn { font-family:'Playfair Display',serif; font-size:17px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .sl-vcs { font-size:12px; color:var(--muted); margin-bottom:12px; }
  .sl-vcm { display:flex; gap:14px; flex-wrap:wrap; }
  .sl-vcsl { font-size:9px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); }
  .sl-vcsv { font-size:14px; font-weight:600; color:var(--text); }
  .sl-vcl { margin-top:10px; font-size:11px; color:var(--muted); }
  .sl-vic { background:var(--panel); border:1px solid var(--border); border-radius:10px; margin-bottom:20px; overflow:hidden; }
  .sl-vict { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px 14px; border-bottom:1px solid var(--border); flex-wrap:wrap; }
  .sl-vicid { display:flex; align-items:center; gap:14px; }
  .sl-vicico { width:48px; height:48px; border-radius:8px; background:rgba(192,112,16,.1); border:1px solid rgba(192,112,16,.25); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
  .sl-vicn { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--text); line-height:1; margin-bottom:3px; }
  .sl-vicb { font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--amber); background:rgba(192,112,16,.1); padding:2px 8px; border-radius:4px; font-weight:700; }
  .sl-vica { display:flex; gap:8px; flex-shrink:0; }
  .sl-vicsp { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); }
  .sl-sp { padding:12px 18px; border-right:1px solid var(--border); border-bottom:1px solid var(--border); }
  .sl-spl { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); margin-bottom:4px; font-weight:700; }
  .sl-spv { font-size:14px; font-weight:600; color:var(--text); }
  .sl-vicnr { padding:10px 18px; font-size:13px; color:var(--muted); font-style:italic; border-top:1px solid var(--border); }
  .sl-recs { display:flex; flex-direction:column; gap:10px; }
  .sl-rec { background:var(--panel); border:1px solid var(--border); border-left:3px solid var(--amber); border-radius:6px; padding:14px 18px; display:grid; grid-template-columns:56px 1fr auto; gap:14px; align-items:start; }
  .sl-rec:hover { box-shadow:0 1px 4px rgba(0,0,0,.06); }
  .sl-rdd { font-size:24px; font-weight:700; color:var(--amber); line-height:1; text-align:center; }
  .sl-rdm { font-size:9px; letter-spacing:1px; color:var(--muted); text-transform:uppercase; text-align:center; }
  .sl-rdy { font-size:9px; color:var(--muted); text-align:center; }
  .sl-rtype { font-size:16px; font-weight:700; color:var(--text); margin-bottom:3px; }
  .sl-rnotes { font-size:13px; color:var(--muted); line-height:1.4; margin-bottom:6px; }
  .sl-rtags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:4px; }
  .sl-rtag { font-size:11px; color:var(--muted); background:var(--bg); padding:2px 8px; border-radius:10px; border:1px solid var(--border); }
  .sl-rpart { font-size:11px; color:var(--amber); background:rgba(192,112,16,.08); padding:2px 7px; border-radius:3px; border:1px solid rgba(192,112,16,.2); display:inline-block; margin:1px 2px 1px 0; }
  .sl-rr { display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
  .sl-rcost { font-size:14px; font-weight:700; color:var(--green); }
  .sl-filter-bar { display:flex; gap:8px; flex-wrap:wrap; padding:12px 14px; background:var(--panel); border:1px solid var(--border); border-radius:8px; margin-bottom:14px; align-items:flex-end; }
  .sl-filter-group { display:flex; flex-direction:column; gap:3px; min-width:120px; flex:1; }
  .sl-filter-lbl { font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); font-weight:700; }
  .sl-fi-sm { background:#fff; border:1px solid var(--border2); border-radius:4px; padding:6px 8px; color:var(--text); font-family:'Barlow',sans-serif; font-size:13px; outline:none; width:100%; }
  .sl-fi-sm:focus { border-color:var(--amber); }
  .sl-part-row { background:var(--panel); border:1px solid var(--border); border-radius:6px; padding:12px 16px; margin-bottom:8px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:start; }
  .sl-part-desc { font-weight:700; font-size:14px; color:var(--text); margin-bottom:2px; }
  .sl-part-meta { font-size:12px; color:var(--muted); display:flex; gap:10px; flex-wrap:wrap; }
  .sl-part-status { display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:10px; }
  .sl-part-status.needed  { background:rgba(132,26,24,.1); color:var(--red); }
  .sl-part-status.ordered { background:rgba(192,112,16,.15); color:var(--amber); }
  .sl-part-status.received{ background:rgba(42,94,42,.15); color:var(--green); }
  .sl-part-actions { display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
  .sl-vendor-card { background:var(--panel); border:1px solid var(--border); border-radius:10px; padding:18px; margin-bottom:12px; }
  .sl-vendor-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:10px; }
  .sl-vendor-name { font-family:'Playfair Display',serif; font-size:18px; font-weight:700; color:var(--text); }
  .sl-hist-row { background:var(--panel); border:1px solid var(--border); border-radius:6px; padding:12px 16px; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  .sl-empty { text-align:center; padding:60px 20px; color:var(--muted); }
  .sl-ei { font-size:44px; margin-bottom:12px; }
  .sl-et { font-family:'Playfair Display',serif; font-size:20px; font-weight:700; margin-bottom:6px; color:var(--text); }
  .sl-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; border:none; transition:background .15s; font-family:'Barlow',sans-serif; }
  .sl-btn-p { background:var(--amber); color:#FFF; }
  .sl-btn-p:hover { background:var(--amber2); }
  .sl-btn-g { background:transparent; color:var(--muted); border:1px solid var(--border); }
  .sl-btn-g:hover { border-color:var(--amber); color:var(--amber); }
  .sl-btn-d { background:#FDF0EE; color:var(--red); border:1px solid rgba(132,26,24,.2); }
  .sl-btn-sm { padding:4px 10px; font-size:12px; }
  .sl-btn-xs { padding:3px 8px; font-size:11px; }
  .sl-mo { position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; }
  .sl-m { background:#FDFAF4; border:1px solid var(--border2); border-radius:12px; width:100%; max-width:540px; max-height:90vh; overflow-y:auto; }
  .sl-mh { padding:18px 22px 14px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .sl-mt { font-family:'Playfair Display',serif; font-size:19px; font-weight:700; color:var(--text); }
  .sl-mc { background:none; border:none; color:var(--muted); cursor:pointer; font-size:18px; }
  .sl-mb { padding:18px 22px; display:flex; flex-direction:column; gap:14px; }
  .sl-mf { padding:14px 22px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; }
  .sl-fr { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .sl-fg { display:flex; flex-direction:column; gap:5px; }
  .sl-fg.full { grid-column:1/-1; }
  .sl-fl { font-size:11px; letter-spacing:0.9px; text-transform:uppercase; color:var(--muted); font-weight:700; }
  .sl-fi,.sl-fs,.sl-fta { background:#FFF; border:1px solid var(--border2); border-radius:6px; padding:8px 11px; color:var(--text); font-family:'Barlow',sans-serif; font-size:14px; outline:none; transition:border-color .15s; width:100%; }
  .sl-fi:focus,.sl-fs:focus,.sl-fta:focus { border-color:var(--amber); }
  .sl-fta { resize:vertical; min-height:76px; }
  .sl-add-part-btn { background:none; border:1px dashed var(--border2); border-radius:4px; color:var(--muted); font-size:12px; font-weight:600; padding:4px 10px; cursor:pointer; transition:border-color .15s,color .15s; font-family:'Barlow',sans-serif; }
  .sl-add-part-btn:hover { border-color:var(--amber); color:var(--amber); }
  @media(max-width:640px){ .sl-sidebar{width:200px;} .sl-rec{grid-template-columns:1fr auto;} .sl-rdd,.sl-rdm,.sl-rdy{display:none;} .sl-fr{grid-template-columns:1fr;} }
  @media(max-width:480px){ .sl-sidebar{display:none;} .sl-content{padding:16px;} }
`;

const ICONS = { Truck:"🚛",Tractor:"🚜",Combine:"🌾","Grain Cart":"⚙️",Semi:"🚛",Trailer:"📦",Sprayer:"💧",Pickup:"🛻","ATV/UTV":"🏎️",Generator:"⚡",Other:"🔧" };
const sumCost = recs => recs.reduce((s,r)=>(s+(parseFloat(r.cost)||0)),0);
const fmtDate = iso => { const d=new Date(iso+"T00:00:00"); return {day:d.getDate().toString().padStart(2,"0"),mon:d.toLocaleString("en",{month:"short"}).toUpperCase(),yr:d.getFullYear()}; };
const partStatus = p => p.received?"received":p.ordered?"ordered":"needed";
const partStatusLabel = p => p.received?"Received":p.ordered?"Ordered":"Needed";

export default function ServiceLogModule({ tenantId, token, persist }) {
  const [vehicles,setVehicles]=useState([]);
  const [records, setRecords] =useState([]);
  const [parts,   setParts]  =useState([]);
  const [vendors, setVendors]=useState([]);
  const [history, setHistory]=useState([]);
  const [loading, setLoading]=useState(true);
  const [tab,     setTab]    =useState("fleet");
  const [selId,   setSelId]  =useState(null);
  const [search,  setSearch] =useState("");
  const [modal,   setModal]  =useState(null);
  const [editTarget,setEdit] =useState(null);
  const [poFilters,setPOF]   =useState({q:"",vendor:"",status:""});

  const BASE=`tenants/${tenantId}/serviceLog`;

  useEffect(()=>{
    if(!tenantId) return;
    Promise.all([
      dbRead(`${BASE}/vehicles`,token).then(d=>setVehicles(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/records`, token).then(d=>setRecords(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/parts`,   token).then(d=>setParts(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/vendors`, token).then(d=>setVendors(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/history`, token).then(d=>setHistory(obj2arr(d||{}))).catch(()=>{}),
    ]).finally(()=>setLoading(false));
  },[tenantId,token]);

  useEffect(()=>{
    if(!tenantId) return;
    return dbListen(`${BASE}`,token,({data})=>{
      if(!data) return;
      if(data.vehicles) setVehicles(obj2arr(data.vehicles));
      if(data.records)  setRecords(obj2arr(data.records));
      if(data.parts)    setParts(obj2arr(data.parts));
      if(data.vendors)  setVendors(obj2arr(data.vendors));
      if(data.history)  setHistory(obj2arr(data.history));
    });
  },[tenantId,token]);

  const save=(updates)=>persist("serviceLog",{
    vehicles:Object.fromEntries((updates.vehicles||vehicles).map(v=>[v.id,v])),
    records: Object.fromEntries((updates.records||records).map(r=>[r.id,r])),
    parts:   Object.fromEntries((updates.parts||parts).map(p=>[p.id,p])),
    vendors: Object.fromEntries((updates.vendors||vendors).map(v=>[v.id,v])),
    history: Object.fromEntries((updates.history||history).map(h=>[h.id,h])),
  });

  const saveVehicle=(form)=>{
    let nv; if(editTarget){nv=vehicles.map(v=>v.id===editTarget.id?{...editTarget,...form}:v);}else{const x={id:genId(),...form};nv=[...vehicles,x];setSelId(x.id);}
    setVehicles(nv);save({vehicles:nv});setModal(null);setEdit(null);
  };
  const deleteVehicle=(id)=>{
    if(!confirm("Delete this vehicle and all its service records?")) return;
    const nv=vehicles.filter(v=>v.id!==id),nr=records.filter(r=>r.vehicleId!==id);
    setVehicles(nv);setRecords(nr);save({vehicles:nv,records:nr});if(selId===id)setSelId(null);
  };
  const saveRecord=(form)=>{
    let nv=vehicles;
    if(form.hours){const h=parseFloat(form.hours),veh=vehicles.find(v=>v.id===selId);if(veh&&h>(parseFloat(veh.hours)||0)){nv=vehicles.map(v=>v.id===selId?{...v,hours:String(h)}:v);setVehicles(nv);}}
    let nr; if(editTarget){nr=records.map(r=>r.id===editTarget.id?{...editTarget,...form}:r);}else{nr=[...records,{id:genId(),vehicleId:selId,...form}];}
    setRecords(nr);save({vehicles:nv,records:nr});setModal(null);setEdit(null);
  };
  const deleteRecord=(id)=>{const nr=records.filter(r=>r.id!==id);setRecords(nr);save({records:nr});};
  const savePart=(form)=>{
    let np; if(editTarget){np=parts.map(p=>p.id===editTarget.id?{...editTarget,...form}:p);}else{np=[...parts,{id:genId(),ordered:false,received:false,...form}];}
    setParts(np);save({parts:np});setModal(null);setEdit(null);
  };
  const markOrdered=(id)=>{const np=parts.map(p=>p.id===id?{...p,ordered:true,orderedDate:new Date().toISOString().slice(0,10)}:p);setParts(np);save({parts:np});};
  const markReceived=(id)=>{
    const p=parts.find(pp=>pp.id===id); if(!p) return;
    const np=parts.filter(pp=>pp.id!==id);
    const nh=[...history,{id:genId(),desc:p.desc,num:p.num,vendor:p.vendor,qty:p.qty,unitCost:p.unitCost,vehicleId:p.vehicleId,receivedDate:new Date().toISOString().slice(0,10)}];
    setParts(np);setHistory(nh);save({parts:np,history:nh});
  };
  const deletePart=(id)=>{const np=parts.filter(p=>p.id!==id);setParts(np);save({parts:np});};
  const saveVendor=(form)=>{
    let nv; if(editTarget){nv=vendors.map(v=>v.id===editTarget.id?{...editTarget,...form}:v);}else{nv=[...vendors,{id:genId(),...form}];}
    setVendors(nv);save({vendors:nv});setModal(null);setEdit(null);
  };
  const deleteVendor=(id)=>{if(!confirm("Delete this vendor?"))return;const nv=vendors.filter(v=>v.id!==id);setVendors(nv);save({vendors:nv});};

  const selected=vehicles.find(v=>v.id===selId)||null;
  const filteredVehicles=vehicles.filter(v=>!search||v.name.toLowerCase().includes(search.toLowerCase()));
  const vRecords=selected?records.filter(r=>r.vehicleId===selId).sort((a,b)=>b.date.localeCompare(a.date)):[];
  const neededCount=parts.filter(p=>!p.ordered&&!p.received).length;
  const orderedCount=parts.filter(p=>p.ordered&&!p.received).length;
  const filteredParts=parts.filter(p=>{
    if(poFilters.q&&!(p.desc+p.num+(p.vendor||"")).toLowerCase().includes(poFilters.q.toLowerCase()))return false;
    if(poFilters.vendor&&(p.vendor||"").toLowerCase()!==poFilters.vendor.toLowerCase())return false;
    if(poFilters.status==="needed"&&(p.ordered||p.received))return false;
    if(poFilters.status==="ordered"&&(!p.ordered||p.received))return false;
    return true;
  }).sort((a,b)=>(b.id||"").localeCompare(a.id||""));
  const vehicleName=id=>vehicles.find(v=>v.id===id)?.name||"—";

  if(loading) return <div style={{textAlign:"center",padding:"60px",color:"#7a6645"}}><div style={{fontSize:"32px",marginBottom:"8px"}}>🔧</div>Loading ServiceLog…</div>;

  return (
    <>
      <style>{style}</style>
      <div className="sl">
        {/* Topbar */}
        <div className="sl-topbar">
          <div className="sl-brand"><div className="sl-eye">⚙ Fleet</div><div className="sl-title">SERVICE<span>LOG</span></div></div>
          <div className="sl-stats">
            <div><div className="sl-sv">{vehicles.length}</div><div className="sl-sl">Equipment</div></div>
            <div><div className="sl-sv">{records.length}</div><div className="sl-sl">Records</div></div>
            <div><div className="sl-sv">${sumCost(records).toLocaleString()}</div><div className="sl-sl">Total Spent</div></div>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
            {tab==="fleet"&&selected&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("addRecord");}}>+ Log Service</button>}
            {tab==="fleet"&&!selected&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("addVehicle");}}>+ Add Equipment</button>}
            {tab==="parts"&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("addPart");}}>+ Add Part to Order</button>}
            {tab==="vendors"&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("addVendor");}}>+ Add Vendor</button>}
          </div>
        </div>

        {/* Nav */}
        <div className="sl-nav">
          <button className={`sl-nav-tab ${tab==="fleet"?"on":""}`} onClick={()=>setTab("fleet")}>🚜 Fleet</button>
          <button className={`sl-nav-tab ${tab==="parts"?"on":""}`} onClick={()=>setTab("parts")}>
            🔩 Order Parts{neededCount>0&&<span className="sl-nav-badge">{neededCount}</span>}{orderedCount>0&&<span className="sl-nav-badge b">{orderedCount}</span>}
          </button>
          <button className={`sl-nav-tab ${tab==="history"?"on":""}`} onClick={()=>setTab("history")}>📦 Order History{history.length>0&&<span className="sl-nav-badge g">{history.length}</span>}</button>
          <button className={`sl-nav-tab ${tab==="vendors"?"on":""}`} onClick={()=>setTab("vendors")}>🏪 Vendors</button>
        </div>

        <div className="sl-body">
          {/* Sidebar — fleet only */}
          {tab==="fleet"&&(
            <div className="sl-sidebar">
              <div className="sl-sh"><span className="sl-shl">Fleet</span><span style={{fontSize:11,color:"var(--muted)"}}>{vehicles.length}</span></div>
              <div className="sl-ssearch"><input placeholder="Search equipment…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className="sl-list">
                <div className={`sl-item ${!selId?"on":""}`} onClick={()=>setSelId(null)}><span className="sl-ii">🗂️</span><div className="sl-iinfo"><div className="sl-iname">All Equipment</div><div className="sl-isub">Fleet overview</div></div></div>
                <div className="sl-div"/>
                {filteredVehicles.map(v=>{
                  const cnt=records.filter(r=>r.vehicleId===v.id).length;
                  return(<div key={v.id} className={`sl-item ${selId===v.id?"on":""}`} onClick={()=>setSelId(v.id)}><span className="sl-ii">{ICONS[v.type]||"🔧"}</span><div className="sl-iinfo"><div className="sl-iname">{v.name}</div><div className="sl-isub">{v.type}{v.year?` · ${v.year}`:""}</div></div>{cnt>0&&<span className="sl-icnt">{cnt}</span>}</div>);
                })}
              </div>
              <button className="sl-sadd" onClick={()=>{setEdit(null);setModal("addVehicle");}}>＋ Add Equipment</button>
            </div>
          )}

          <div className="sl-main"><div className="sl-content">

            {/* FLEET */}
            {tab==="fleet"&&!selected&&(<>
              <div className="sl-ot">Fleet Overview</div><div className="sl-os">Select a vehicle or add new equipment.</div>
              <div className="sl-sumbar">
                <div className="sl-sum"><div className="sl-sumv">{vehicles.length}</div><div className="sl-suml">Equipment</div></div>
                <div className="sl-sum"><div className="sl-sumv">{records.length}</div><div className="sl-suml">Records</div></div>
                <div className="sl-sum"><div className="sl-sumv">${sumCost(records).toLocaleString()}</div><div className="sl-suml">Total Spent</div></div>
              </div>
              <div className="sl-grid">
                {vehicles.length===0&&<div className="sl-empty" style={{gridColumn:"1/-1"}}><div className="sl-ei">🔧</div><div className="sl-et">No Equipment Yet</div><div>Click "+ Add Equipment" to get started.</div></div>}
                {vehicles.map(v=>{const recs=records.filter(r=>r.vehicleId===v.id).sort((a,b)=>b.date.localeCompare(a.date));return(<div key={v.id} className="sl-vcard" onClick={()=>setSelId(v.id)}><div className="sl-vct">{ICONS[v.type]} {v.type}</div><div className="sl-vcn">{v.name}</div><div className="sl-vcs">{[v.year,v.make,v.model].filter(Boolean).join(" · ")}</div><div className="sl-vcm"><div><div className="sl-vcsl">Records</div><div className="sl-vcsv">{recs.length}</div></div><div><div className="sl-vcsl">Cost</div><div className="sl-vcsv">${sumCost(recs).toLocaleString()}</div></div>{v.hours&&<div><div className="sl-vcsl">Hrs/Mi</div><div className="sl-vcsv">{Number(v.hours).toLocaleString()}</div></div>}</div>{recs[0]&&<div className="sl-vcl">Last: {recs[0].type} — {recs[0].date}</div>}</div>);})}
              </div>
            </>)}

            {tab==="fleet"&&selected&&(<>
              <div className="sl-vic">
                <div className="sl-vict">
                  <div className="sl-vicid"><div className="sl-vicico">{ICONS[selected.type]||"🔧"}</div><div><div className="sl-vicn">{selected.name}</div><span className="sl-vicb">{selected.type}</span></div></div>
                  <div className="sl-vica"><button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(selected);setModal("editVehicle");}}>Edit</button><button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteVehicle(selected.id)}>Delete</button></div>
                </div>
                <div className="sl-vicsp">
                  {selected.year&&<div className="sl-sp"><div className="sl-spl">Year</div><div className="sl-spv">{selected.year}</div></div>}
                  {selected.make&&<div className="sl-sp"><div className="sl-spl">Make</div><div className="sl-spv">{selected.make}</div></div>}
                  {selected.model&&<div className="sl-sp"><div className="sl-spl">Model</div><div className="sl-spv">{selected.model}</div></div>}
                  {selected.hours&&<div className="sl-sp"><div className="sl-spl">Hrs/Miles</div><div className="sl-spv">{Number(selected.hours).toLocaleString()}</div></div>}
                  {selected.vin&&<div className="sl-sp"><div className="sl-spl">VIN/Serial</div><div className="sl-spv" style={{fontSize:12}}>{selected.vin}</div></div>}
                  <div className="sl-sp"><div className="sl-spl">Records</div><div className="sl-spv">{vRecords.length}</div></div>
                  <div className="sl-sp"><div className="sl-spl">Total Cost</div><div className="sl-spv" style={{color:"var(--green)"}}>${sumCost(vRecords).toLocaleString()}</div></div>
                  {vRecords[0]&&<div className="sl-sp"><div className="sl-spl">Last Service</div><div className="sl-spv" style={{fontSize:12}}>{vRecords[0].date}</div></div>}
                </div>
                {selected.notes&&<div className="sl-vicnr">📝 {selected.notes}</div>}
              </div>
              {/* Pending parts banner */}
              {parts.filter(p=>p.vehicleId===selected.id&&!p.received).length>0&&(
                <div style={{background:"rgba(192,112,16,.06)",border:"1px solid rgba(192,112,16,.25)",borderRadius:"8px",padding:"10px 14px",marginBottom:"16px",display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:"13px",color:"var(--amber)"}}>🔩 Parts pending:</span>
                  {parts.filter(p=>p.vehicleId===selected.id&&!p.received).map(p=>(<span key={p.id} style={{fontSize:"12px",padding:"2px 8px",borderRadius:"10px",background:p.ordered?"rgba(30,80,120,.1)":"rgba(132,26,24,.08)",color:p.ordered?"#1E5078":"var(--red)",border:`1px solid ${p.ordered?"rgba(30,80,120,.3)":"rgba(132,26,24,.2)"}`}}>{p.desc||p.num||"Part"} — {p.ordered?"Ordered":"Needed"}</span>))}
                </div>
              )}
              {vRecords.length===0?<div className="sl-empty"><div className="sl-ei">🔧</div><div className="sl-et">No Service Records</div><div>Hit "+ Log Service" to record the first entry.</div></div>:
              <div className="sl-recs">{vRecords.map(r=>{const d=fmtDate(r.date);return(<div key={r.id} className="sl-rec"><div><div className="sl-rdd">{d.day}</div><div className="sl-rdm">{d.mon}</div><div className="sl-rdy">{d.yr}</div></div><div><div className="sl-rtype">{r.type}</div>{r.notes&&<div className="sl-rnotes">{r.notes}</div>}<div className="sl-rtags">{r.tech&&<span className="sl-rtag">👤 {r.tech}</span>}{r.hours&&<span className="sl-rtag">⏱ {Number(r.hours).toLocaleString()} hrs/mi</span>}</div>{(r.parts||[]).length>0&&<div style={{marginTop:"4px"}}>{(r.parts||[]).map((p,i)=><span key={i} className="sl-rpart">{[p.desc,p.num].filter(Boolean).join(" #")}{p.qty&&p.qty>1?` ×${p.qty}`:""}</span>)}</div>}</div><div className="sl-rr"><div className="sl-rcost">{r.cost?`$${Number(r.cost).toLocaleString()}`:"—"}</div><button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(r);setModal("editRecord");}}>Edit</button><button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteRecord(r.id)}>✕</button></div></div>);})}</div>}
            </>)}

            {/* ORDER PARTS */}
            {tab==="parts"&&(<>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
                <div><div className="sl-ot">Order Parts</div><div className="sl-os">{neededCount} needed · {orderedCount} on order</div></div>
              </div>
              <div className="sl-filter-bar">
                <div className="sl-filter-group" style={{flex:2,minWidth:"160px"}}><label className="sl-filter-lbl">Search</label><input className="sl-fi-sm" placeholder="Description, part #, vendor…" value={poFilters.q} onChange={e=>setPOF(f=>({...f,q:e.target.value}))}/></div>
                <div className="sl-filter-group"><label className="sl-filter-lbl">Vendor</label><select className="sl-fi-sm" value={poFilters.vendor} onChange={e=>setPOF(f=>({...f,vendor:e.target.value}))}><option value="">All Vendors</option>{[...new Set(parts.map(p=>p.vendor).filter(Boolean))].sort().map(v=><option key={v}>{v}</option>)}</select></div>
                <div className="sl-filter-group"><label className="sl-filter-lbl">Status</label><select className="sl-fi-sm" value={poFilters.status} onChange={e=>setPOF(f=>({...f,status:e.target.value}))}><option value="">All</option><option value="needed">Needed</option><option value="ordered">Ordered</option></select></div>
                {(poFilters.q||poFilters.vendor||poFilters.status)&&<button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>setPOF({q:"",vendor:"",status:""})}>Clear</button>}
              </div>
              {filteredParts.length===0&&<div className="sl-empty"><div className="sl-ei">🔩</div><div className="sl-et">No Parts</div><div>Click "+ Add Part to Order" to build your list.</div></div>}
              {filteredParts.map(p=>(
                <div key={p.id} className="sl-part-row">
                  <div>
                    <div className="sl-part-desc">{p.desc||"(no description)"}</div>
                    <div className="sl-part-meta">
                      {p.num&&<span>Part #: {p.num}</span>}
                      {p.vendor&&<span>Vendor: {p.vendor}</span>}
                      {p.qty&&<span>Qty: {p.qty}</span>}
                      {p.unitCost&&<span>Unit: ${p.unitCost}</span>}
                      {p.vehicleId&&<span>For: {vehicleName(p.vehicleId)}</span>}
                      {p.orderedDate&&<span>Ordered: {p.orderedDate}</span>}
                    </div>
                  </div>
                  <div className="sl-part-actions">
                    <span className={`sl-part-status ${partStatus(p)}`}>{partStatusLabel(p)}</span>
                    {!p.ordered&&!p.received&&<button className="sl-btn sl-btn-g sl-btn-xs" onClick={()=>markOrdered(p.id)}>Mark Ordered</button>}
                    {p.ordered&&!p.received&&<button className="sl-btn sl-btn-g sl-btn-xs" style={{color:"var(--green)",borderColor:"rgba(42,94,42,.3)"}} onClick={()=>markReceived(p.id)}>Mark Received</button>}
                    <button className="sl-btn sl-btn-g sl-btn-xs" onClick={()=>{setEdit(p);setModal("editPart");}}>Edit</button>
                    <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>deletePart(p.id)}>✕</button>
                  </div>
                </div>
              ))}
            </>)}

            {/* ORDER HISTORY */}
            {tab==="history"&&(<>
              <div className="sl-ot">Order History</div><div className="sl-os">{history.length} received item{history.length!==1?"s":""}</div>
              {history.length===0&&<div className="sl-empty"><div className="sl-ei">📦</div><div className="sl-et">No Order History</div><div>Parts marked as received will appear here.</div></div>}
              {[...history].sort((a,b)=>(b.receivedDate||"").localeCompare(a.receivedDate||"")).map(h=>(
                <div key={h.id} className="sl-hist-row">
                  <div><div style={{fontWeight:700,fontSize:"14px"}}>{h.desc||h.num||"Part"}</div><div style={{fontSize:"12px",color:"var(--muted)"}}>{[h.vendor,h.num?"#"+h.num:""].filter(Boolean).join(" · ")}{h.qty?` · Qty: ${h.qty}`:""}</div>{h.vehicleId&&<div style={{fontSize:"12px",color:"var(--muted)"}}>For: {vehicleName(h.vehicleId)}</div>}</div>
                  <div style={{textAlign:"right"}}>{h.unitCost&&<div style={{fontWeight:700,color:"var(--green)",fontSize:"13px"}}>${(parseFloat(h.unitCost)*(parseFloat(h.qty)||1)).toLocaleString()}</div>}<div style={{fontSize:"12px",color:"var(--muted)"}}>{h.receivedDate}</div></div>
                </div>
              ))}
            </>)}

            {/* VENDORS */}
            {tab==="vendors"&&(<>
              <div className="sl-ot">Vendors</div><div className="sl-os">Parts suppliers and service providers</div>
              {vendors.length===0&&<div className="sl-empty"><div className="sl-ei">🏪</div><div className="sl-et">No Vendors Yet</div><div>Add vendors to reference when ordering parts.</div></div>}
              {vendors.map(v=>(
                <div key={v.id} className="sl-vendor-card">
                  <div className="sl-vendor-top">
                    <div><div className="sl-vendor-name">{v.name}</div>{v.contact&&<div style={{fontSize:"13px",color:"var(--muted)"}}>👤 {v.contact}</div>}{v.phone&&<div style={{fontSize:"13px",color:"var(--muted)"}}>📞 {v.phone}</div>}{v.email&&<div style={{fontSize:"13px",color:"var(--muted)"}}>✉️ {v.email}</div>}{v.notes&&<div style={{fontSize:"13px",color:"var(--muted)",fontStyle:"italic",marginTop:"6px"}}>{v.notes}</div>}</div>
                    <div style={{display:"flex",gap:"6px"}}><button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(v);setModal("editVendor");}}>Edit</button><button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteVendor(v.id)}>Delete</button></div>
                  </div>
                  {parts.filter(p=>p.vendor===v.name&&!p.received).length>0&&<span style={{background:"rgba(192,112,16,.1)",color:"var(--amber)",padding:"2px 8px",borderRadius:"10px",fontSize:"12px",fontWeight:700}}>{parts.filter(p=>p.vendor===v.name&&!p.received).length} parts pending</span>}
                </div>
              ))}
            </>)}

          </div></div>
        </div>
      </div>

      {(modal==="addVehicle"||modal==="editVehicle")&&<VehicleModal initial={editTarget} onSave={saveVehicle} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {(modal==="addRecord"||modal==="editRecord")&&<RecordModal initial={editTarget} vehicleId={selId} parts={parts} onSave={saveRecord} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {(modal==="addPart"||modal==="editPart")&&<PartModal initial={editTarget} vehicles={vehicles} vendors={vendors} onSave={savePart} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {(modal==="addVendor"||modal==="editVendor")&&<VendorModal initial={editTarget} onSave={saveVendor} onClose={()=>{setModal(null);setEdit(null);}}/>}
    </>
  );
}

function VehicleModal({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",type:initial?.type||"Tractor",year:initial?.year||"",make:initial?.make||"",model:initial?.model||"",vin:initial?.vin||"",hours:initial?.hours||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div className="sl-mo" onClick={onClose}><div className="sl-m" onClick={e=>e.stopPropagation()}><div className="sl-mh"><div className="sl-mt">{initial?"Edit Equipment":"Add Equipment"}</div><button className="sl-mc" onClick={onClose}>✕</button></div><div className="sl-mb"><div className="sl-fr"><div className="sl-fg full"><label className="sl-fl">Name *</label><input className="sl-fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. JD 9620R"/></div><div className="sl-fg"><label className="sl-fl">Type</label><select className="sl-fs" value={f.type} onChange={e=>s("type",e.target.value)}>{["Truck","Tractor","Combine","Grain Cart","Semi","Trailer","Sprayer","Pickup","ATV/UTV","Generator","Other"].map(t=><option key={t}>{t}</option>)}</select></div><div className="sl-fg"><label className="sl-fl">Year</label><input className="sl-fi" value={f.year} onChange={e=>s("year",e.target.value)} placeholder="2021"/></div><div className="sl-fg"><label className="sl-fl">Make</label><input className="sl-fi" value={f.make} onChange={e=>s("make",e.target.value)} placeholder="John Deere"/></div><div className="sl-fg"><label className="sl-fl">Model</label><input className="sl-fi" value={f.model} onChange={e=>s("model",e.target.value)} placeholder="9620R"/></div><div className="sl-fg"><label className="sl-fl">VIN/Serial</label><input className="sl-fi" value={f.vin} onChange={e=>s("vin",e.target.value)}/></div><div className="sl-fg"><label className="sl-fl">Current Hrs/Miles</label><input className="sl-fi" type="number" value={f.hours} onChange={e=>s("hours",e.target.value)} placeholder="0"/></div><div className="sl-fg full"><label className="sl-fl">Notes</label><textarea className="sl-fta" value={f.notes} onChange={e=>s("notes",e.target.value)}/></div></div></div><div className="sl-mf"><button className="sl-btn sl-btn-g" onClick={onClose}>Cancel</button><button className="sl-btn sl-btn-p" onClick={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}}>{initial?"Save Changes":"Add Equipment"}</button></div></div></div>);
}

function RecordModal({initial,vehicleId,parts,onSave,onClose}){
  const today=new Date().toISOString().slice(0,10);
  const[f,setF]=useState({date:initial?.date||today,type:initial?.type||"Oil Change",notes:initial?.notes||"",cost:initial?.cost||"",hours:initial?.hours||"",tech:initial?.tech||"",parts:initial?.parts||[]});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addPart=()=>setF(p=>({...p,parts:[...p.parts,{id:genId(),desc:"",num:"",qty:"1"}]}));
  const updPart=(i,k,v)=>setF(p=>({...p,parts:p.parts.map((pp,ii)=>ii===i?{...pp,[k]:v}:pp)}));
  const removePart=i=>setF(p=>({...p,parts:p.parts.filter((_,ii)=>ii!==i)}));
  const pendingParts=parts.filter(p=>p.vehicleId===vehicleId&&!p.received);
  return(<div className="sl-mo" onClick={onClose}><div className="sl-m" onClick={e=>e.stopPropagation()}><div className="sl-mh"><div className="sl-mt">{initial?"Edit Record":"Log Service"}</div><button className="sl-mc" onClick={onClose}>✕</button></div><div className="sl-mb"><div className="sl-fr"><div className="sl-fg"><label className="sl-fl">Date *</label><input className="sl-fi" type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></div><div className="sl-fg"><label className="sl-fl">Type *</label><select className="sl-fs" value={f.type} onChange={e=>s("type",e.target.value)}>{["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"].map(t=><option key={t}>{t}</option>)}</select></div><div className="sl-fg"><label className="sl-fl">Cost ($)</label><input className="sl-fi" type="number" value={f.cost} onChange={e=>s("cost",e.target.value)} placeholder="0.00"/></div><div className="sl-fg"><label className="sl-fl">Hrs/Miles at Service</label><input className="sl-fi" type="number" value={f.hours} onChange={e=>s("hours",e.target.value)} placeholder="0"/></div><div className="sl-fg full"><label className="sl-fl">Performed By</label><input className="sl-fi" value={f.tech} onChange={e=>s("tech",e.target.value)} placeholder="Self, Dealer, Shop…"/></div><div className="sl-fg full"><label className="sl-fl">Notes</label><textarea className="sl-fta" value={f.notes} onChange={e=>s("notes",e.target.value)}/></div></div>
  <div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><label className="sl-fl">Parts Used</label><button className="sl-add-part-btn" onClick={addPart}>+ Add Part</button></div>
  {pendingParts.length>0&&f.parts.length===0&&<p style={{fontSize:"12px",color:"var(--muted)",marginBottom:"8px"}}>Pending for this vehicle: {pendingParts.map(p=>p.desc||p.num).join(", ")}</p>}
  {f.parts.map((p,i)=>(<div key={p.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 60px auto",gap:"6px",marginBottom:"6px",alignItems:"center"}}><input className="sl-fi" placeholder="Description" value={p.desc} onChange={e=>updPart(i,"desc",e.target.value)}/><input className="sl-fi" placeholder="Part #" value={p.num} onChange={e=>updPart(i,"num",e.target.value)}/><input className="sl-fi" type="number" placeholder="Qty" value={p.qty} onChange={e=>updPart(i,"qty",e.target.value)}/><button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>removePart(i)}>✕</button></div>))}</div>
  </div><div className="sl-mf"><button className="sl-btn sl-btn-g" onClick={onClose}>Cancel</button><button className="sl-btn sl-btn-p" onClick={()=>{if(!f.date||!f.type)return alert("Date and type required.");onSave(f);}}>{initial?"Save Changes":"Log Service"}</button></div></div></div>);
}

function PartModal({initial,vehicles,vendors,onSave,onClose}){
  const[f,setF]=useState({desc:initial?.desc||"",num:initial?.num||"",vendor:initial?.vendor||"",qty:initial?.qty||"1",unitCost:initial?.unitCost||"",vehicleId:initial?.vehicleId||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div className="sl-mo" onClick={onClose}><div className="sl-m" onClick={e=>e.stopPropagation()}><div className="sl-mh"><div className="sl-mt">{initial?"Edit Part":"Add Part to Order"}</div><button className="sl-mc" onClick={onClose}>✕</button></div><div className="sl-mb"><div className="sl-fr"><div className="sl-fg full"><label className="sl-fl">Description *</label><input className="sl-fi" value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="e.g. Oil Filter, Air Filter…"/></div><div className="sl-fg"><label className="sl-fl">Part Number</label><input className="sl-fi" value={f.num} onChange={e=>s("num",e.target.value)} placeholder="e.g. AF12345"/></div><div className="sl-fg"><label className="sl-fl">Vendor</label><input className="sl-fi" list="v-list" value={f.vendor} onChange={e=>s("vendor",e.target.value)} placeholder="e.g. Brandt, NAPA…"/><datalist id="v-list">{vendors.map(v=><option key={v.id} value={v.name}/>)}</datalist></div><div className="sl-fg"><label className="sl-fl">Quantity</label><input className="sl-fi" type="number" min="1" value={f.qty} onChange={e=>s("qty",e.target.value)}/></div><div className="sl-fg"><label className="sl-fl">Unit Cost ($)</label><input className="sl-fi" type="number" step="0.01" value={f.unitCost} onChange={e=>s("unitCost",e.target.value)} placeholder="0.00"/></div><div className="sl-fg full"><label className="sl-fl">For Vehicle</label><select className="sl-fs" value={f.vehicleId} onChange={e=>s("vehicleId",e.target.value)}><option value="">— Optional —</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></div><div className="sl-fg full"><label className="sl-fl">Notes</label><textarea className="sl-fta" style={{minHeight:"60px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></div></div></div><div className="sl-mf"><button className="sl-btn sl-btn-g" onClick={onClose}>Cancel</button><button className="sl-btn sl-btn-p" onClick={()=>{if(!f.desc.trim())return alert("Description required.");onSave(f);}}>{initial?"Save Changes":"Add Part"}</button></div></div></div>);
}

function VendorModal({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",contact:initial?.contact||"",phone:initial?.phone||"",email:initial?.email||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div className="sl-mo" onClick={onClose}><div className="sl-m" onClick={e=>e.stopPropagation()}><div className="sl-mh"><div className="sl-mt">{initial?"Edit Vendor":"Add Vendor"}</div><button className="sl-mc" onClick={onClose}>✕</button></div><div className="sl-mb"><div className="sl-fr"><div className="sl-fg full"><label className="sl-fl">Vendor Name *</label><input className="sl-fi" value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Brandt Tractor, NAPA…"/></div><div className="sl-fg"><label className="sl-fl">Contact Name</label><input className="sl-fi" value={f.contact} onChange={e=>s("contact",e.target.value)} placeholder="Sales rep"/></div><div className="sl-fg"><label className="sl-fl">Phone</label><input className="sl-fi" type="tel" value={f.phone} onChange={e=>s("phone",e.target.value)} placeholder="(403) 555-0123"/></div><div className="sl-fg full"><label className="sl-fl">Email</label><input className="sl-fi" type="email" value={f.email} onChange={e=>s("email",e.target.value)} placeholder="parts@vendor.com"/></div><div className="sl-fg full"><label className="sl-fl">Notes</label><textarea className="sl-fta" style={{minHeight:"60px"}} value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Account number, terms…"/></div></div></div><div className="sl-mf"><button className="sl-btn sl-btn-g" onClick={onClose}>Cancel</button><button className="sl-btn sl-btn-p" onClick={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}}>{initial?"Save Changes":"Add Vendor"}</button></div></div></div>);
}
