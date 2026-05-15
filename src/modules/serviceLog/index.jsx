import { useState, useEffect, useRef, useCallback } from "react";
import { dbRead, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

// ── Light theme ───────────────────────────────────────────────────
const SL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Barlow:wght@300;400;600;700&display=swap');
  .sl{--bg:#F4EFE6;--bg2:#EDE6D8;--panel:#FFFFFF;--border:#D8CEBC;--border2:#C4A468;--amber:#C07010;--amber2:#D48820;--red:#841A18;--green:#2A5E2A;--blue:#1E5078;--text:#1E1408;--muted:#7A6645;--faint:#B8A880;background:var(--bg);color:var(--text);font-family:'Barlow',sans-serif;display:flex;flex-direction:column;min-height:calc(100vh - 50px);}
  .sl *,.sl *::before,.sl *::after{box-sizing:border-box;}
  /* Topbar */
  .sl-top{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid var(--border);background:var(--panel);gap:12px;flex-wrap:wrap;flex-shrink:0;}
  .sl-brand{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text);}
  .sl-brand span{color:var(--amber);}
  .sl-topstats{display:flex;gap:16px;}
  .sl-tsv{font-size:16px;font-weight:700;color:var(--amber);line-height:1;}
  .sl-tsl{font-size:9px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;}
  .sl-syncdot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
  /* Nav */
  .sl-nav{display:flex;border-bottom:1px solid var(--border);background:var(--panel);overflow-x:auto;flex-shrink:0;scrollbar-width:none;}
  .sl-nav::-webkit-scrollbar{display:none;}
  .sl-navbtn{padding:10px 16px;background:none;border:none;border-bottom:2px solid transparent;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;white-space:nowrap;font-family:'Barlow',sans-serif;transition:all .15s;}
  .sl-navbtn:hover{color:var(--amber);}
  .sl-navbtn.on{color:var(--amber);border-bottom-color:var(--amber);}
  .sl-badge{display:inline-block;background:var(--amber);color:#fff;font-size:9px;font-weight:700;padding:1px 5px;border-radius:8px;margin-left:4px;vertical-align:middle;}
  .sl-badge.b{background:var(--blue);}
  .sl-badge.g{background:var(--green);}
  .sl-badge.r{background:var(--red);}
  /* Layout */
  .sl-body{display:flex;flex:1;overflow:hidden;min-height:0;}
  .sl-sidebar{width:230px;flex-shrink:0;border-right:1px solid var(--border);background:#FDFAF4;display:flex;flex-direction:column;overflow:hidden;}
  .sl-sbhdr{padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
  .sl-sblbl{font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;font-weight:700;}
  .sl-sbsearch{padding:8px 10px;border-bottom:1px solid var(--border);flex-shrink:0;}
  .sl-sbsearch input{width:100%;background:#fff;border:1px solid var(--border);border-radius:4px;padding:5px 9px;color:var(--text);font-family:'Barlow',sans-serif;font-size:13px;outline:none;}
  .sl-sbsearch input:focus{border-color:var(--amber);}
  .sl-sblist{overflow-y:auto;flex:1;padding:4px 0;}
  .sl-sbitem{display:flex;align-items:center;gap:8px;padding:8px 14px;cursor:pointer;border-left:3px solid transparent;transition:background .12s;}
  .sl-sbitem:hover{background:var(--bg2);}
  .sl-sbitem.on{background:rgba(192,112,16,.08);border-left-color:var(--amber);}
  .sl-sbico{font-size:14px;width:20px;text-align:center;flex-shrink:0;}
  .sl-sbinfo{flex:1;min-width:0;}
  .sl-sbname{font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sl-sbitem.on .sl-sbname{color:var(--amber);}
  .sl-sbsub{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sl-sbcnt{font-size:10px;color:var(--muted);background:var(--bg);padding:1px 5px;border-radius:8px;border:1px solid var(--border);}
  .sl-sbitem.on .sl-sbcnt{background:rgba(192,112,16,.12);color:var(--amber);border-color:rgba(192,112,16,.3);}
  .sl-sbdiv{height:1px;background:var(--border);margin:4px 0;}
  .sl-sbadd{margin:6px 10px 8px;padding:7px;border:1px dashed var(--border2);border-radius:6px;background:none;color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:border-color .15s,color .15s;font-family:'Barlow',sans-serif;}
  .sl-sbadd:hover{border-color:var(--amber);color:var(--amber);}
  /* Main */
  .sl-main{flex:1;overflow:hidden;display:flex;flex-direction:column;}
  .sl-content{flex:1;overflow-y:auto;padding:22px;}
  .sl-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:var(--text);margin-bottom:4px;}
  .sl-sub{font-size:13px;color:var(--muted);margin-bottom:18px;}
  /* Summary bar */
  .sl-sumbar{display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;}
  .sl-sum{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:10px 14px;flex:1;min-width:80px;}
  .sl-sumv{font-size:20px;font-weight:700;color:var(--amber);line-height:1;}
  .sl-suml{font-size:9px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-top:2px;}
  /* Cards */
  .sl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;}
  .sl-card{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px;cursor:pointer;transition:border-color .15s,box-shadow .15s;}
  .sl-card:hover{border-color:var(--border2);box-shadow:0 2px 8px rgba(192,112,16,.1);}
  .sl-card-type{font-size:10px;letter-spacing:2px;color:var(--amber);text-transform:uppercase;margin-bottom:4px;font-weight:700;}
  .sl-card-name{font-family:'Playfair Display',serif;font-size:16px;font-weight:700;color:var(--text);margin-bottom:2px;}
  .sl-card-sub{font-size:12px;color:var(--muted);margin-bottom:10px;}
  .sl-card-meta{display:flex;gap:12px;flex-wrap:wrap;}
  .sl-card-sl{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);}
  .sl-card-sv{font-size:13px;font-weight:600;color:var(--text);}
  .sl-card-last{margin-top:8px;font-size:11px;color:var(--muted);}
  /* Vehicle info card */
  .sl-vic{background:var(--panel);border:1px solid var(--border);border-radius:10px;margin-bottom:18px;overflow:hidden;}
  .sl-vict{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-bottom:1px solid var(--border);flex-wrap:wrap;}
  .sl-vicid{display:flex;align-items:center;gap:12px;}
  .sl-vicico{width:44px;height:44px;border-radius:8px;background:rgba(192,112,16,.1);border:1px solid rgba(192,112,16,.25);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;}
  .sl-vicn{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--text);line-height:1;margin-bottom:2px;}
  .sl-vicb{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--amber);background:rgba(192,112,16,.1);padding:2px 7px;border-radius:4px;font-weight:700;}
  .sl-vica{display:flex;gap:6px;flex-shrink:0;}
  .sl-vicsp{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));}
  .sl-sp{padding:10px 16px;border-right:1px solid var(--border);border-bottom:1px solid var(--border);}
  .sl-spl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);margin-bottom:3px;font-weight:700;}
  .sl-spv{font-size:13px;font-weight:600;color:var(--text);}
  .sl-vicnr{padding:8px 16px;font-size:13px;color:var(--muted);font-style:italic;border-top:1px solid var(--border);}
  /* Todos */
  .sl-todo{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:flex-start;gap:10px;}
  .sl-todo.hi{border-left:3px solid #dc2626;}
  .sl-todo.md{border-left:3px solid #d97706;}
  .sl-todo.lo{border-left:3px solid #16a34a;}
  .sl-todo.done{opacity:.55;}
  /* Service records */
  .sl-recs{display:flex;flex-direction:column;gap:8px;}
  .sl-rec{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--amber);border-radius:6px;padding:12px 16px;display:grid;grid-template-columns:50px 1fr auto;gap:12px;align-items:start;}
  .sl-rec.sel{background:rgba(192,112,16,.04);border-left-color:var(--amber2);}
  .sl-rdd{font-size:22px;font-weight:700;color:var(--amber);line-height:1;text-align:center;}
  .sl-rdm{font-size:9px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;text-align:center;}
  .sl-rdy{font-size:9px;color:var(--muted);text-align:center;}
  .sl-rtype{font-size:15px;font-weight:700;color:var(--text);margin-bottom:2px;}
  .sl-rnotes{font-size:12px;color:var(--muted);line-height:1.4;margin-bottom:5px;}
  .sl-rtags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:3px;}
  .sl-rtag{font-size:10px;color:var(--muted);background:var(--bg);padding:2px 7px;border-radius:10px;border:1px solid var(--border);}
  .sl-rpart{font-size:10px;color:var(--amber);background:rgba(192,112,16,.08);padding:2px 6px;border-radius:3px;border:1px solid rgba(192,112,16,.2);display:inline-block;margin:1px 2px 1px 0;}
  .sl-rr{display:flex;flex-direction:column;align-items:flex-end;gap:5px;}
  .sl-rcost{font-size:13px;font-weight:700;color:var(--green);}
  .sl-inv-tag{font-size:10px;background:rgba(30,80,120,.1);color:var(--blue);padding:2px 6px;border-radius:4px;font-weight:600;}
  /* Filter bar */
  .sl-fbar{display:flex;gap:8px;flex-wrap:wrap;padding:10px 12px;background:var(--panel);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;align-items:flex-end;}
  .sl-fg{display:flex;flex-direction:column;gap:3px;flex:1;min-width:110px;}
  .sl-fl{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:700;}
  .sl-fi,.sl-fs{background:#fff;border:1px solid var(--border2);border-radius:4px;padding:5px 8px;color:var(--text);font-family:'Barlow',sans-serif;font-size:12px;outline:none;width:100%;}
  .sl-fi:focus,.sl-fs:focus{border-color:var(--amber);}
  /* Parts */
  .sl-prow{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:6px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start;}
  .sl-pdesc{font-weight:700;font-size:13px;color:var(--text);margin-bottom:2px;}
  .sl-pmeta{font-size:11px;color:var(--muted);display:flex;gap:8px;flex-wrap:wrap;}
  .sl-pstatus{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;}
  .sl-pstatus.needed{background:rgba(132,26,24,.1);color:var(--red);}
  .sl-pstatus.ordered{background:rgba(192,112,16,.15);color:var(--amber);}
  .sl-pstatus.received{background:rgba(42,94,42,.15);color:var(--green);}
  .sl-pacts{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}
  /* Inventory */
  .sl-invrow{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:6px;}
  .sl-invtop{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
  .sl-invname{font-weight:700;font-size:13px;color:var(--text);}
  .sl-invmeta{font-size:11px;color:var(--muted);margin-top:2px;}
  .sl-invlow{font-size:10px;font-weight:700;color:var(--red);background:rgba(132,26,24,.08);padding:2px 6px;border-radius:4px;}
  /* Invoice */
  .sl-invcard{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
  .sl-inv-status{font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;}
  .sl-inv-status.draft{background:#F5F5F5;color:var(--muted);}
  .sl-inv-status.sent{background:rgba(30,80,120,.1);color:var(--blue);}
  .sl-inv-status.paid{background:rgba(42,94,42,.15);color:var(--green);}
  /* Vendors */
  .sl-vcrd{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:10px;}
  .sl-vtop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px;}
  .sl-vname{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:var(--text);}
  /* Chart bar */
  .sl-bar-wrap{margin-bottom:6px;}
  .sl-bar-lbl{font-size:12px;color:var(--text);margin-bottom:2px;display:flex;justify-content:space-between;}
  .sl-bar-bg{background:var(--bg2);border-radius:4px;height:10px;overflow:hidden;}
  .sl-bar-fill{height:100%;border-radius:4px;background:var(--amber);transition:width .3s;}
  /* History */
  .sl-hrow{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:10px 14px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
  /* Admin */
  .sl-admin-sec{background:var(--panel);border:1px solid var(--border);border-radius:8px;margin-bottom:12px;overflow:hidden;}
  .sl-admin-hdr{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .sl-admin-title{font-weight:700;font-size:14px;color:var(--text);}
  .sl-admin-body{padding:12px 16px;}
  .sl-toggle-row{display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);}
  .sl-toggle-row:last-child{border-bottom:none;}
  /* Invoice selection bar */
  .sl-ibar{background:rgba(192,112,16,.08);border:1px solid rgba(192,112,16,.3);border-radius:8px;padding:10px 14px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;}
  /* Empty */
  .sl-empty{text-align:center;padding:50px 20px;color:var(--muted);}
  .sl-empty-ico{font-size:40px;margin-bottom:10px;}
  .sl-empty-title{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;margin-bottom:5px;color:var(--text);}
  /* Buttons */
  .sl-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:background .15s;font-family:'Barlow',sans-serif;}
  .sl-btn-p{background:var(--amber);color:#FFF;}
  .sl-btn-p:hover{background:var(--amber2);}
  .sl-btn-g{background:transparent;color:var(--muted);border:1px solid var(--border);}
  .sl-btn-g:hover{border-color:var(--amber);color:var(--amber);}
  .sl-btn-d{background:#FDF0EE;color:var(--red);border:1px solid rgba(132,26,24,.2);}
  .sl-btn-b{background:rgba(30,80,120,.1);color:var(--blue);border:1px solid rgba(30,80,120,.2);}
  .sl-btn-sm{padding:4px 9px;font-size:11px;}
  .sl-btn-xs{padding:2px 7px;font-size:10px;}
  /* Switch */
  .sl-switch{width:40px;height:22px;border-radius:11px;cursor:pointer;background:var(--faint);position:relative;transition:background .2s;flex-shrink:0;border:none;}
  .sl-switch.on{background:var(--green);}
  .sl-switch-knob{position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#FFF;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.2);}
  .sl-switch.on .sl-switch-knob{left:21px;}
  /* Modal */
  .sl-mo{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;}
  .sl-m{background:#FDFAF4;border:1px solid var(--border2);border-radius:12px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;}
  .sl-m-lg{max-width:700px;}
  .sl-mh{padding:16px 20px 12px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
  .sl-mt{font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:var(--text);}
  .sl-mc{background:none;border:none;color:var(--muted);cursor:pointer;font-size:17px;}
  .sl-mb{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}
  .sl-mf{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:8px;}
  .sl-mfr{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .sl-mfg{display:flex;flex-direction:column;gap:4px;}
  .sl-mfg.full{grid-column:1/-1;}
  .sl-mfl{font-size:10px;letter-spacing:.9px;text-transform:uppercase;color:var(--muted);font-weight:700;}
  .sl-mfi,.sl-mfs,.sl-mfta{background:#FFF;border:1px solid var(--border2);border-radius:6px;padding:7px 10px;color:var(--text);font-family:'Barlow',sans-serif;font-size:13px;outline:none;transition:border-color .15s;width:100%;}
  .sl-mfi:focus,.sl-mfs:focus,.sl-mfta:focus{border-color:var(--amber);}
  .sl-mfta{resize:vertical;min-height:70px;}
  /* Parts entry */
  .sl-part-entry{display:grid;grid-template-columns:1fr 90px 50px auto;gap:5px;margin-bottom:5px;align-items:center;}
  /* Customer info card */
  .sl-custcard{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:16px;}
  .sl-custmeta{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px;}
  .sl-custfield{display:flex;flex-direction:column;}
  .sl-custfl{font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);font-weight:700;}
  .sl-custfv{font-size:13px;color:var(--text);}
  @media(max-width:640px){.sl-sidebar{width:190px;}.sl-rec{grid-template-columns:1fr auto;}.sl-rdd,.sl-rdm,.sl-rdy{display:none;}.sl-mfr{grid-template-columns:1fr;}}
  @media(max-width:480px){.sl-sidebar{display:none;}.sl-content{padding:14px;}}
`;

// ── Constants ─────────────────────────────────────────────────────
const ICONS = {Truck:"🚛",Tractor:"🚜",Combine:"🌾","Grain Cart":"⚙️",Semi:"🚛",Trailer:"📦",Sprayer:"💧",Pickup:"🛻","ATV/UTV":"🏎️",Generator:"⚡",Other:"🔧"};
const EQUIP_TYPES = ["Truck","Tractor","Combine","Grain Cart","Semi","Trailer","Sprayer","Pickup","ATV/UTV","Generator","Other"];
const SVC_TYPES = ["Oil Change","Filter Replacement","Tire Service","Brake Service","Hydraulic Service","Belt/Chain Replacement","Coolant Service","Fuel System","Battery/Electrical","Inspection","Repair","Other"];
const PRIS = ["high","medium","low"];
const PRI_COLOR = {high:"#dc2626",medium:"#d97706",low:"#16a34a"};
const PRI_ORDER = {high:0,medium:1,low:2};
const INV_STATUS = ["draft","sent","paid"];

// ── Helpers ───────────────────────────────────────────────────────
const sumCost = a => a.reduce((s,r)=>s+(parseFloat(r.cost)||0),0);
const fmtDate = iso => {const d=new Date(iso+"T00:00:00");return{day:d.getDate().toString().padStart(2,"0"),mon:d.toLocaleString("en",{month:"short"}).toUpperCase(),yr:d.getFullYear()};};
const pStatus = p => p.received?"received":p.ordered?"ordered":"needed";
const pStatusL = p => p.received?"Received":p.ordered?"Ordered":"Needed";
const today = () => new Date().toISOString().slice(0,10);
const nextInvNum = invs => { const nums=invs.map(i=>parseInt((i.num||"").replace("INV-",""))||0); return "INV-"+String((nums.length?Math.max(...nums):0)+1).padStart(3,"0"); };
const getParts = r => r.parts&&Array.isArray(r.parts)&&r.parts.length?r.parts:r.partnum?[{desc:"",num:r.partnum}]:[];

// ── Main module ───────────────────────────────────────────────────
export default function ServiceLogModule({ tenantId, token, persist }) {
  const BASE = `tenants/${tenantId}/serviceLog`;

  // Data state
  const [D, setD] = useState({ vehicles:[], records:[], customers:[], invoices:[], partsToOrder:[], partsInventory:[], vendors:[], orderHistory:[], settings:{businessName:"",features:{invoicing:true,partsInventory:true,orderParts:true},qb:{mode:""}} });
  const [loading, setLoading] = useState(true);
  const [sync, setSync] = useState("idle"); // idle | syncing | synced | error

  // UI state
  const [tab, setTab] = useState("fleet");
  const [selCustId, setSelCustId] = useState(null);
  const [selVehId, setSelVehId] = useState(null);
  const [sbSearch, setSbSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [editTarget, setEdit] = useState(null);
  const [selRecIds, setSelRecIds] = useState(new Set()); // for invoice creation
  const [selInvIds, setSelInvIds] = useState(new Set());
  const [gsQuery, setGsQuery] = useState("");
  const [poFilters, setPOF] = useState({q:"",vendor:"",status:""});
  const [invFilters, setInvF] = useState({q:"",vendor:"",location:"",vehicle:""});
  const [reportView, setReportView] = useState("summary");

  // Load data
  useEffect(()=>{
    if(!tenantId) return;
    dbRead(`${BASE}`,token).then(d=>{
      if(d) setD(migrate(d));
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[tenantId,token]);

  // Real-time listener
  useEffect(()=>{
    if(!tenantId) return;
    return dbListen(`${BASE}`,token,({data:d})=>{ if(d) setD(migrate(d)); });
  },[tenantId,token]);

  const migrate = (d) => ({
    vehicles: d.vehicles||[],
    records:  d.records||[],
    customers:d.customers||[{id:"cust_default",name:"Default",notes:""}],
    invoices: d.invoices||[],
    partsToOrder: d.partsToOrder||[],
    partsInventory: d.partsInventory||[],
    vendors:  d.vendors||[],
    orderHistory: d.orderHistory||[],
    settings: { businessName:"", features:{invoicing:true,partsInventory:true,orderParts:true}, qb:{mode:""}, ...(d.settings||{}) },
  });

  const save = (updates) => {
    const next = {...D,...updates};
    setD(next);
    setSync("syncing");
    persist("serviceLog", {
      vehicles:next.vehicles, records:next.records, customers:next.customers,
      invoices:next.invoices, partsToOrder:next.partsToOrder,
      partsInventory:next.partsInventory, vendors:next.vendors,
      orderHistory:next.orderHistory, settings:next.settings,
    });
    setTimeout(()=>setSync("synced"),800);
    setTimeout(()=>setSync("idle"),3000);
  };

  // ── Mutations ──────────────────────────────────────────────────
  const saveVehicle = f => {
    let nv;
    if(editTarget) { nv=D.vehicles.map(v=>v.id===editTarget.id?{...editTarget,...f}:v); }
    else { const x={id:genId(),todos:[],...f}; nv=[...D.vehicles,x]; setSelVehId(x.id); }
    save({vehicles:nv}); setModal(null); setEdit(null);
  };
  const deleteVehicle = id => {
    if(!confirm("Delete this vehicle and all its service records?")) return;
    save({vehicles:D.vehicles.filter(v=>v.id!==id),records:D.records.filter(r=>r.vehicleId!==id)});
    if(selVehId===id){setSelVehId(null);}
  };
  const saveRecord = f => {
    let nv=D.vehicles;
    if(f.hours){const h=parseFloat(f.hours),veh=D.vehicles.find(v=>v.id===selVehId);if(veh&&h>(parseFloat(veh.hours)||0)){nv=D.vehicles.map(v=>v.id===selVehId?{...v,hours:String(h)}:v);}}
    let nr;
    if(editTarget){nr=D.records.map(r=>r.id===editTarget.id?{...editTarget,...f}:r);}
    else{nr=[...D.records,{id:genId(),vehicleId:selVehId,...f}];}
    save({vehicles:nv,records:nr}); setModal(null); setEdit(null); setSelRecIds(new Set());
  };
  const deleteRecord = id => {
    if(!confirm("Delete this service record?")) return;
    save({records:D.records.filter(r=>r.id!==id)});
    setSelRecIds(s=>{const n=new Set(s);n.delete(id);return n;});
  };
  const saveCustomer = f => {
    let nc;
    if(editTarget){nc=D.customers.map(c=>c.id===editTarget.id?{...editTarget,...f}:c);}
    else{const x={id:genId(),...f};nc=[...D.customers,x];setSelCustId(x.id);}
    save({customers:nc}); setModal(null); setEdit(null);
  };
  const deleteCustomer = id => {
    if(!confirm("Delete this customer? Vehicles will become unassigned.")) return;
    const nc=D.customers.filter(c=>c.id!==id);
    const nv=D.vehicles.map(v=>v.customerId===id?{...v,customerId:""}:v);
    save({customers:nc,vehicles:nv}); if(selCustId===id)setSelCustId(null);
  };
  const toggleTodo = (vid,tid) => {
    const nv=D.vehicles.map(v=>v.id===vid?{...v,todos:(v.todos||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:v);
    save({vehicles:nv});
  };
  const addTodo = (vid,f) => {
    const nv=D.vehicles.map(v=>v.id===vid?{...v,todos:[...(v.todos||[]),{id:genId(),done:false,...f}]}:v);
    save({vehicles:nv}); setModal(null); setEdit(null);
  };
  const deleteTodo = (vid,tid) => {
    const nv=D.vehicles.map(v=>v.id===vid?{...v,todos:(v.todos||[]).filter(t=>t.id!==tid)}:v);
    save({vehicles:nv});
  };
  const savePart = f => {
    let np;
    if(editTarget){np=D.partsToOrder.map(p=>p.id===editTarget.id?{...editTarget,...f}:p);}
    else{np=[...D.partsToOrder,{id:genId(),ordered:false,received:false,...f}];}
    save({partsToOrder:np}); setModal(null); setEdit(null);
  };
  const markOrdered = id => {
    const np=D.partsToOrder.map(p=>p.id===id?{...p,ordered:true,orderedDate:today()}:p);
    save({partsToOrder:np});
  };
  const markReceived = id => {
    const p=D.partsToOrder.find(pp=>pp.id===id); if(!p) return;
    const np=D.partsToOrder.filter(pp=>pp.id!==id);
    const nh=[...D.orderHistory,{id:genId(),desc:p.desc,num:p.num,vendor:p.vendor,qty:p.qty,unitCost:p.unitCost,vehicleId:p.vehicleId,receivedDate:today()}];
    save({partsToOrder:np,orderHistory:nh});
  };
  const deletePart = id => { save({partsToOrder:D.partsToOrder.filter(p=>p.id!==id)}); };
  const saveInvItem = f => {
    let ni;
    if(editTarget){ni=D.partsInventory.map(p=>p.id===editTarget.id?{...editTarget,...f}:p);}
    else{ni=[...D.partsInventory,{id:genId(),partNumbers:[],...f}];}
    save({partsInventory:ni}); setModal(null); setEdit(null);
  };
  const deleteInvItem = id => { save({partsInventory:D.partsInventory.filter(p=>p.id!==id)}); };
  const saveVendor = f => {
    let nv;
    if(editTarget){nv=D.vendors.map(v=>v.id===editTarget.id?{...editTarget,...f}:v);}
    else{nv=[...D.vendors,{id:genId(),...f}];}
    save({vendors:nv}); setModal(null); setEdit(null);
  };
  const deleteVendor = id => { if(!confirm("Delete this vendor?"))return; save({vendors:D.vendors.filter(v=>v.id!==id)}); };
  const createInvoice = f => {
    const recs=D.records.filter(r=>selRecIds.has(r.id));
    const inv={id:genId(),num:nextInvNum(D.invoices),date:f.date,custId:f.custId,businessName:f.businessName,records:recs.map(r=>r.id),laborCost:f.laborCost||"",laborDesc:f.laborDesc||"",status:"draft",qbExported:false};
    const nr=D.records.map(r=>selRecIds.has(r.id)?{...r,invoiced:true,invoiceId:inv.id}:r);
    save({invoices:[...D.invoices,inv],records:nr}); setModal(null); setSelRecIds(new Set());
  };
  const updateInvStatus = (id,status) => { save({invoices:D.invoices.map(i=>i.id===id?{...i,status}:i)}); };
  const deleteInvoice = id => {
    if(!confirm("Delete this invoice?"))return;
    const inv=D.invoices.find(i=>i.id===id); if(!inv)return;
    const nr=D.records.map(r=>inv.records.includes(r.id)?{...r,invoiced:false,invoiceId:""}:r);
    save({invoices:D.invoices.filter(i=>i.id!==id),records:nr});
  };
  const saveSettings = f => { save({settings:{...D.settings,...f}}); setModal(null); };
  const toggleFeature = key => { save({settings:{...D.settings,features:{...D.settings.features,[key]:!D.settings.features?.[key]}}}); };

  // ── Derived data ───────────────────────────────────────────────
  const selVeh = D.vehicles.find(v=>v.id===selVehId)||null;
  const selCust = D.customers.find(c=>c.id===selCustId)||null;
  const vRecords = selVeh ? D.records.filter(r=>r.vehicleId===selVeh.id).sort((a,b)=>b.date.localeCompare(a.date)) : [];
  const neededCnt = D.partsToOrder.filter(p=>!p.ordered&&!p.received).length;
  const orderedCnt = D.partsToOrder.filter(p=>p.ordered&&!p.received).length;
  const openTodos = D.vehicles.flatMap(v=>(v.todos||[]).filter(t=>!t.done).map(t=>({t,v}))).length;
  const lowStock = D.partsInventory.filter(p=>p.qty!==""&&p.minQty!==""&&Number(p.qty)<=Number(p.minQty)).length;
  const filteredVehicles = D.vehicles.filter(v=>!sbSearch||(v.name+v.make+v.model).toLowerCase().includes(sbSearch.toLowerCase()));
  const custName = id => D.customers.find(c=>c.id===id)?.name||"";
  const vehName = id => D.vehicles.find(v=>v.id===id)?.name||"";
  const featOn = k => D.settings.features?.[k]!==false;

  const syncColor = {idle:"#D8CEBC",syncing:"#C07010",synced:"#2A5E2A",error:"#841A18"}[sync];

  if(loading) return <div style={{textAlign:"center",padding:"60px",color:"#7a6645"}}><div style={{fontSize:"32px",marginBottom:"8px"}}>🔧</div>Loading ServiceLog…</div>;

  return (
    <>
      <style>{SL_STYLE}</style>
      <div className="sl">
        {/* Topbar */}
        <div className="sl-top">
          <div className="sl-brand">SERVICE<span>LOG</span></div>
          <div className="sl-topstats">
            <div><div className="sl-tsv">{D.vehicles.length}</div><div className="sl-tsl">Equipment</div></div>
            <div><div className="sl-tsv">{D.records.length}</div><div className="sl-tsl">Records</div></div>
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}><div className="sl-syncdot" style={{background:syncColor}}/><div className="sl-tsl" style={{textTransform:"uppercase",letterSpacing:"1.5px"}}>{sync==="synced"?"Synced":sync==="syncing"?"Saving…":sync==="error"?"Error":""}</div></div>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
            {tab==="fleet"&&selVeh&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("record");}}>+ Log Service</button>}
            {tab==="fleet"&&!selVeh&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("vehicle");}}>+ Add Equipment</button>}
            {tab==="order"&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("part");}}>+ Add Part</button>}
            {tab==="parts"&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("invItem");}}>+ Add Item</button>}
            {tab==="vendors"&&<button className="sl-btn sl-btn-p" onClick={()=>{setEdit(null);setModal("vendor");}}>+ Add Vendor</button>}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="sl-nav">
          {[
            ["fleet","🚜 Fleet"],
            ["report","📋 Report"],
            ["costs","💰 Cost Analysis"],
            ...(featOn("invoicing")?[["invoices","🧾 Invoices"]]:[]),
            ...(featOn("orderParts")?[["order","🔩 Order Parts"]]:[]),
            ...(featOn("partsInventory")?[["parts","📦 Parts"]]:[]),
            ["vendors","🏪 Vendors"],
            ["orderhistory","✅ Order History"],
            ["todos","☑️ To-Do"],
            ["search","🔍 Search"],
            ["admin","⚙️ Admin"],
          ].map(([id,label])=>(
            <button key={id} className={`sl-navbtn ${tab===id?"on":""}`} onClick={()=>setTab(id)}>
              {label}
              {id==="order"&&neededCnt>0&&<span className="sl-badge">{neededCnt}</span>}
              {id==="order"&&orderedCnt>0&&<span className="sl-badge b">{orderedCnt}</span>}
              {id==="todos"&&openTodos>0&&<span className="sl-badge">{openTodos}</span>}
              {id==="parts"&&lowStock>0&&<span className="sl-badge r">{lowStock}</span>}
            </button>
          ))}
        </div>

        <div className="sl-body">
          {/* Customer/vehicle sidebar — fleet only */}
          {tab==="fleet"&&(
            <div className="sl-sidebar">
              <div className="sl-sbhdr"><span className="sl-sblbl">Customers</span><span style={{fontSize:11,color:"var(--muted)"}}>{D.customers.length}</span></div>
              <div className="sl-sbsearch"><input placeholder="Search equipment…" value={sbSearch} onChange={e=>setSbSearch(e.target.value)}/></div>
              <div className="sl-sblist">
                {D.customers.map(c=>{
                  const cvs=filteredVehicles.filter(v=>v.customerId===c.id);
                  const isOpen=selCustId===c.id||cvs.some(v=>v.id===selVehId);
                  return(
                    <div key={c.id}>
                      <div className={`sl-sbitem ${selCustId===c.id&&!selVehId?"on":""}`} onClick={()=>{setSelCustId(c.id);setSelVehId(null);}}>
                        <span className="sl-sbico">🏢</span>
                        <div className="sl-sbinfo"><div className="sl-sbname">{c.name}</div><div className="sl-sbsub">{cvs.length} equipment</div></div>
                        <span className="sl-sbcnt">{cvs.length}</span>
                      </div>
                      {isOpen&&cvs.map(v=>(
                        <div key={v.id} className={`sl-sbitem ${selVehId===v.id?"on":""}`} style={{paddingLeft:"28px"}} onClick={()=>{setSelVehId(v.id);setSelCustId(c.id);}}>
                          <span className="sl-sbico" style={{fontSize:"12px"}}>{ICONS[v.type]||"🔧"}</span>
                          <div className="sl-sbinfo"><div className="sl-sbname" style={{fontSize:"12px"}}>{v.name}</div><div className="sl-sbsub">{D.records.filter(r=>r.vehicleId===v.id).length} records</div></div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <button className="sl-sbadd" onClick={()=>{setEdit(null);setModal("customer");}}>＋ Add Customer</button>
            </div>
          )}

          <div className="sl-main"><div className="sl-content">

            {/* ── FLEET ── */}
            {tab==="fleet"&&<FleetView D={D} selVeh={selVeh} selCust={selCust} selCustId={selCustId} setSelVehId={setSelVehId} setSelCustId={setSelCustId} vRecords={vRecords} selRecIds={selRecIds} setSelRecIds={setSelRecIds} setModal={setModal} setEdit={setEdit} deleteVehicle={deleteVehicle} deleteRecord={deleteRecord} toggleTodo={toggleTodo} deleteTodo={deleteTodo} custName={custName} ICONS={ICONS}/>}

            {/* ── REPORT ── */}
            {tab==="report"&&<ReportView D={D}/>}

            {/* ── COST ANALYSIS ── */}
            {tab==="costs"&&<CostView D={D} custName={custName}/>}

            {/* ── INVOICES ── */}
            {tab==="invoices"&&<InvoicesView D={D} selInvIds={selInvIds} setSelInvIds={setSelInvIds} updateInvStatus={updateInvStatus} deleteInvoice={deleteInvoice} custName={custName} setModal={setModal} setEdit={setEdit}/>}

            {/* ── ORDER PARTS ── */}
            {tab==="order"&&<OrderView D={D} poFilters={poFilters} setPOF={setPOF} markOrdered={markOrdered} markReceived={markReceived} deletePart={deletePart} setEdit={setEdit} setModal={setModal} vehName={vehName}/>}

            {/* ── PARTS INVENTORY ── */}
            {tab==="parts"&&<PartsView D={D} invFilters={invFilters} setInvF={setInvF} deleteInvItem={deleteInvItem} setEdit={setEdit} setModal={setModal}/>}

            {/* ── VENDORS ── */}
            {tab==="vendors"&&<VendorsView D={D} deleteVendor={deleteVendor} setEdit={setEdit} setModal={setModal}/>}

            {/* ── ORDER HISTORY ── */}
            {tab==="orderhistory"&&<HistoryView D={D} vehName={vehName}/>}

            {/* ── TODOS ── */}
            {tab==="todos"&&<TodosView D={D} toggleTodo={toggleTodo} deleteTodo={deleteTodo} setEdit={setEdit} setModal={setModal} custName={custName}/>}

            {/* ── SEARCH ── */}
            {tab==="search"&&<SearchView D={D} gsQuery={gsQuery} setGsQuery={setGsQuery} setSelVehId={setSelVehId} setSelCustId={setSelCustId} setTab={setTab}/>}

            {/* ── ADMIN ── */}
            {tab==="admin"&&<AdminView D={D} toggleFeature={toggleFeature} setModal={setModal}/>}

          </div></div>
        </div>
      </div>

      {/* ── Modals ── */}
      {modal==="vehicle" &&<VehicleModal  initial={editTarget} customers={D.customers} onSave={saveVehicle}  onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="record"  &&<RecordModal   initial={editTarget} vehicleId={selVehId} partsToOrder={D.partsToOrder} partsInventory={D.partsInventory} onSave={saveRecord}   onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="customer"&&<CustomerModal initial={editTarget} onSave={saveCustomer} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="part"    &&<PartModal     initial={editTarget} vehicles={D.vehicles} vendors={D.vendors} onSave={savePart} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="invItem" &&<InvItemModal  initial={editTarget} vehicles={D.vehicles} onSave={saveInvItem} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="vendor"  &&<VendorModal   initial={editTarget} onSave={saveVendor}  onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="invoice" &&<InvoiceModal  records={D.records.filter(r=>selRecIds.has(r.id))} customers={D.customers} settings={D.settings} selCustId={selCustId} vehicles={D.vehicles} nextNum={nextInvNum(D.invoices)} onSave={createInvoice} onClose={()=>{setModal(null);}}/>}
      {modal==="todo"    &&<TodoModal     vehicleId={editTarget?.vehicleId||selVehId} initial={editTarget} onSave={addTodo} onClose={()=>{setModal(null);setEdit(null);}}/>}
      {modal==="settings"&&<SettingsModal settings={D.settings} onSave={saveSettings} onClose={()=>setModal(null)}/>}
    </>
  );
}

// ── Fleet View ────────────────────────────────────────────────────
function FleetView({D,selVeh,selCust,selCustId,setSelVehId,setSelCustId,vRecords,selRecIds,setSelRecIds,setModal,setEdit,deleteVehicle,deleteRecord,toggleTodo,deleteTodo,custName,ICONS}){
  if(!selCustId&&!selVeh) return(
    <div>
      <div className="sl-title">Fleet Overview</div>
      <div className="sl-sub">Select a customer from the sidebar, or add equipment to get started.</div>
      <div className="sl-sumbar">
        <div className="sl-sum"><div className="sl-sumv">{D.customers.length}</div><div className="sl-suml">Customers</div></div>
        <div className="sl-sum"><div className="sl-sumv">{D.vehicles.length}</div><div className="sl-suml">Equipment</div></div>
        <div className="sl-sum"><div className="sl-sumv">{D.records.length}</div><div className="sl-suml">Records</div></div>
        <div className="sl-sum"><div className="sl-sumv">${sumCost(D.records).toLocaleString()}</div><div className="sl-suml">Total Spent</div></div>
      </div>
      <div className="sl-grid">
        {D.customers.map(c=>{
          const cvs=D.vehicles.filter(v=>v.customerId===c.id);
          const cr=D.records.filter(r=>cvs.some(v=>v.id===r.vehicleId));
          return(<div key={c.id} className="sl-card" onClick={()=>{setSelCustId(c.id);setSelVehId(null);}}>
            <div className="sl-card-type">🏢 Customer</div>
            <div className="sl-card-name">{c.name}</div>
            {c.notes&&<div className="sl-card-sub">{c.notes}</div>}
            <div className="sl-card-meta">
              <div><div className="sl-card-sl">Equipment</div><div className="sl-card-sv">{cvs.length}</div></div>
              <div><div className="sl-card-sl">Records</div><div className="sl-card-sv">{cr.length}</div></div>
              <div><div className="sl-card-sl">Total Cost</div><div className="sl-card-sv">${sumCost(cr).toLocaleString()}</div></div>
            </div>
          </div>);
        })}
      </div>
    </div>
  );

  if(selCust&&!selVeh){
    const cvs=D.vehicles.filter(v=>v.customerId===selCust.id);
    return(<div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
        <div>
          <div className="sl-title">{selCust.name}</div>
          <div className="sl-sub">Fleet overview · {cvs.length} equipment</div>
        </div>
        <div style={{display:"flex",gap:"6px"}}>
          <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(selCust);setModal("customer");}}>Edit</button>
          <button className="sl-btn sl-btn-p sl-btn-sm" onClick={()=>{setEdit(null);setModal("vehicle");}}>+ Add Equipment</button>
        </div>
      </div>
      {(selCust.businessName||selCust.contact||selCust.phone||selCust.email)&&(
        <div className="sl-custcard">
          <div className="sl-custmeta">
            {selCust.businessName&&<div className="sl-custfield"><div className="sl-custfl">Business</div><div className="sl-custfv">{selCust.businessName}</div></div>}
            {selCust.contact&&<div className="sl-custfield"><div className="sl-custfl">Contact</div><div className="sl-custfv">{selCust.contact}</div></div>}
            {selCust.phone&&<div className="sl-custfield"><div className="sl-custfl">Phone</div><div className="sl-custfv"><a href={`tel:${selCust.phone}`} style={{color:"var(--amber)",textDecoration:"none"}}>{selCust.phone}</a></div></div>}
            {selCust.email&&<div className="sl-custfield"><div className="sl-custfl">Email</div><div className="sl-custfv"><a href={`mailto:${selCust.email}`} style={{color:"var(--amber)",textDecoration:"none"}}>{selCust.email}</a></div></div>}
          </div>
        </div>
      )}
      <div className="sl-grid">
        {cvs.length===0&&<div className="sl-empty" style={{gridColumn:"1/-1"}}><div className="sl-empty-ico">🔧</div><div className="sl-empty-title">No Equipment</div><div>Add equipment for this customer.</div></div>}
        {cvs.map(v=>{const recs=D.records.filter(r=>r.vehicleId===v.id);return(
          <div key={v.id} className="sl-card" onClick={()=>setSelVehId(v.id)}>
            <div className="sl-card-type">{ICONS[v.type]||"🔧"} {v.type}</div>
            <div className="sl-card-name">{v.name}</div>
            <div className="sl-card-sub">{[v.year,v.make,v.model].filter(Boolean).join(" · ")}</div>
            <div className="sl-card-meta">
              <div><div className="sl-card-sl">Records</div><div className="sl-card-sv">{recs.length}</div></div>
              <div><div className="sl-card-sl">Cost</div><div className="sl-card-sv">${sumCost(recs).toLocaleString()}</div></div>
              {v.hours&&<div><div className="sl-card-sl">Hrs/Mi</div><div className="sl-card-sv">{Number(v.hours).toLocaleString()}</div></div>}
            </div>
            {recs[0]&&<div className="sl-card-last">Last: {recs[0].type} — {recs[0].date}</div>}
          </div>
        );})}
      </div>
    </div>);
  }

  if(selVeh){
    const openTodos=(selVeh.todos||[]).filter(t=>!t.done);
    const doneTodos=(selVeh.todos||[]).filter(t=>t.done);
    return(<div>
      {/* Vehicle info card */}
      <div className="sl-vic">
        <div className="sl-vict">
          <div className="sl-vicid">
            <div className="sl-vicico">{ICONS[selVeh.type]||"🔧"}</div>
            <div><div className="sl-vicn">{selVeh.name}</div><span className="sl-vicb">{selVeh.type}</span></div>
          </div>
          <div className="sl-vica">
            <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(selVeh);setModal("vehicle");}}>Edit</button>
            <button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteVehicle(selVeh.id)}>Delete</button>
          </div>
        </div>
        <div className="sl-vicsp">
          {selVeh.year&&<div className="sl-sp"><div className="sl-spl">Year</div><div className="sl-spv">{selVeh.year}</div></div>}
          {selVeh.make&&<div className="sl-sp"><div className="sl-spl">Make</div><div className="sl-spv">{selVeh.make}</div></div>}
          {selVeh.model&&<div className="sl-sp"><div className="sl-spl">Model</div><div className="sl-spv">{selVeh.model}</div></div>}
          {selVeh.engine&&<div className="sl-sp"><div className="sl-spl">Engine</div><div className="sl-spv">{selVeh.engine}</div></div>}
          {selVeh.hp&&<div className="sl-sp"><div className="sl-spl">HP</div><div className="sl-spv">{selVeh.hp}</div></div>}
          {selVeh.hours&&<div className="sl-sp"><div className="sl-spl">Hrs/Miles</div><div className="sl-spv">{Number(selVeh.hours).toLocaleString()}</div></div>}
          {selVeh.vin&&<div className="sl-sp" style={{gridColumn:"span 2"}}><div className="sl-spl">VIN/Serial</div><div className="sl-spv" style={{fontSize:11,wordBreak:"break-all"}}>{selVeh.vin}</div></div>}
          <div className="sl-sp"><div className="sl-spl">Records</div><div className="sl-spv">{vRecords.length}</div></div>
          <div className="sl-sp"><div className="sl-spl">Total Cost</div><div className="sl-spv" style={{color:"var(--green)"}}>${sumCost(vRecords).toLocaleString()}</div></div>
          {vRecords[0]&&<div className="sl-sp"><div className="sl-spl">Last Service</div><div className="sl-spv" style={{fontSize:11}}>{vRecords[0].date}</div></div>}
        </div>
        {selVeh.notes&&<div className="sl-vicnr">📝 {selVeh.notes}</div>}
      </div>

      {/* Todos */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px"}}>
        <span style={{fontWeight:700,fontSize:"14px",color:"var(--amber)"}}>☑️ To-Do {openTodos.length>0&&`(${openTodos.length} open)`}</span>
        <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit({vehicleId:selVeh.id});setModal("todo");}}>+ Add</button>
      </div>
      {[...openTodos,...doneTodos].map(t=>(
        <div key={t.id} className={`sl-todo ${t.priority==="high"?"hi":t.priority==="low"?"lo":"md"} ${t.done?"done":""}`}>
          <input type="checkbox" checked={t.done} onChange={()=>toggleTodo(selVeh.id,t.id)} style={{marginTop:"2px",accentColor:"var(--amber)",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:"13px",textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
            {t.dueDate&&<div style={{fontSize:"11px",color:"var(--muted)"}}>Due: {t.dueDate}</div>}
          </div>
          <span style={{fontSize:"10px",fontWeight:700,color:PRI_COLOR[t.priority||"medium"],background:PRI_COLOR[t.priority||"medium"]+"15",padding:"2px 6px",borderRadius:"8px"}}>{t.priority||"medium"}</span>
          <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>deleteTodo(selVeh.id,t.id)}>✕</button>
        </div>
      ))}
      {(selVeh.todos||[]).length===0&&<p style={{fontSize:"12px",color:"var(--faint)",marginBottom:"12px"}}>No to-do items.</p>}

      {/* Invoice selection bar */}
      {selRecIds.size>0&&(
        <div className="sl-ibar">
          <span style={{fontSize:"13px",fontWeight:600}}>📋 {selRecIds.size} record{selRecIds.size>1?"s":""} selected</span>
          <div style={{display:"flex",gap:"6px"}}>
            <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>setSelRecIds(new Set())}>Clear</button>
            <button className="sl-btn sl-btn-p sl-btn-sm" onClick={()=>setModal("invoice")}>Create Invoice</button>
          </div>
        </div>
      )}

      {/* Service records */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px",marginTop:"12px"}}>
        <span style={{fontWeight:700,fontSize:"14px",color:"var(--amber)"}}>🔧 Service Records</span>
      </div>
      {vRecords.length===0
        ?<div className="sl-empty"><div className="sl-empty-ico">🔧</div><div className="sl-empty-title">No Service Records</div><div>Hit "+ Log Service" to add the first entry.</div></div>
        :<div className="sl-recs">{vRecords.map(r=>{
          const d=fmtDate(r.date);
          const parts=getParts(r);
          const inv=r.invoiced?(D.invoices||[]).find(i=>i.id===r.invoiceId):null;
          const checked=selRecIds.has(r.id);
          return(<div key={r.id} className={`sl-rec ${checked?"sel":""}`}>
            <div>
              <div className="sl-rdd">{d.day}</div>
              <div className="sl-rdm">{d.mon}</div>
              <div className="sl-rdy">{d.yr}</div>
            </div>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
                <input type="checkbox" checked={checked} onChange={()=>setSelRecIds(s=>{const n=new Set(s);checked?n.delete(r.id):n.add(r.id);return n;})} style={{accentColor:"var(--amber)"}}/>
                <div className="sl-rtype">{r.type}</div>
                {inv&&<span className="sl-inv-tag">INV {inv.num}</span>}
              </div>
              {r.notes&&<div className="sl-rnotes">{r.notes}</div>}
              <div className="sl-rtags">
                {r.tech&&<span className="sl-rtag">👤 {r.tech}</span>}
                {r.hours&&<span className="sl-rtag">⏱ {Number(r.hours).toLocaleString()} hrs/mi</span>}
              </div>
              {parts.length>0&&<div style={{marginTop:"4px"}}>{parts.map((p,i)=><span key={i} className="sl-rpart">{[p.desc,p.num].filter(Boolean).join(" #")}{p.qty&&p.qty>1?` ×${p.qty}`:""}</span>)}</div>}
            </div>
            <div className="sl-rr">
              <div className="sl-rcost">{r.cost?`$${Number(r.cost).toLocaleString()}`:"—"}</div>
              <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(r);setModal("record");}}>Edit</button>
              <button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteRecord(r.id)}>✕</button>
            </div>
          </div>);
        })}</div>
      }
    </div>);
  }
  return null;
}

// ── Report View ───────────────────────────────────────────────────
function ReportView({D}){
  const recs=D.records||[];
  const vehs=D.vehicles||[];
  const recent30=recs.filter(r=>new Date(r.date)>=new Date(Date.now()-30*86400000)).length;
  const typeCounts={};
  recs.forEach(r=>{typeCounts[r.type||"Other"]=(typeCounts[r.type||"Other"]||0)+1;});
  const topTypes=Object.entries(typeCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const maxCount=topTypes[0]?.[1]||1;
  const byVeh=vehs.map(v=>({v,recs:recs.filter(r=>r.vehicleId===v.id)})).filter(x=>x.recs.length>0).sort((a,b)=>b.recs.length-a.recs.length).slice(0,10);
  return(<div>
    <div className="sl-title">Service Report</div>
    <div className="sl-sub">{recs.length} total records across {vehs.length} equipment</div>
    <div className="sl-sumbar">
      <div className="sl-sum"><div className="sl-sumv">{recs.length}</div><div className="sl-suml">Total Records</div></div>
      <div className="sl-sum"><div className="sl-sumv">{recent30}</div><div className="sl-suml">Last 30 Days</div></div>
      <div className="sl-sum"><div className="sl-sumv">{vehs.length}</div><div className="sl-suml">Equipment</div></div>
      <div className="sl-sum"><div className="sl-sumv">{D.customers.length}</div><div className="sl-suml">Customers</div></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",flexWrap:"wrap"}}>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px"}}>
        <div style={{fontWeight:700,marginBottom:"12px",color:"var(--amber)"}}>Service Types</div>
        {topTypes.map(([type,cnt])=>(
          <div key={type} className="sl-bar-wrap">
            <div className="sl-bar-lbl"><span>{type}</span><span style={{color:"var(--muted)"}}>{cnt}</span></div>
            <div className="sl-bar-bg"><div className="sl-bar-fill" style={{width:`${(cnt/maxCount)*100}%`}}/></div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px"}}>
        <div style={{fontWeight:700,marginBottom:"12px",color:"var(--amber)"}}>Most Serviced Equipment</div>
        {byVeh.map(({v,recs:vr})=>(
          <div key={v.id} className="sl-bar-wrap">
            <div className="sl-bar-lbl"><span style={{fontSize:"12px"}}>{v.name}</span><span style={{color:"var(--muted)"}}>{vr.length}</span></div>
            <div className="sl-bar-bg"><div className="sl-bar-fill" style={{width:`${(vr.length/(byVeh[0]?.recs.length||1))*100}%`}}/></div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

// ── Cost Analysis View ────────────────────────────────────────────
function CostView({D,custName}){
  const vehs=D.vehicles||[];
  const recs=D.records||[];
  const grand=sumCost(recs);
  const vCosts=vehs.map(v=>{const vr=recs.filter(r=>r.vehicleId===v.id);return{v,total:sumCost(vr),cnt:vr.length};}).filter(x=>x.cnt>0||x.total>0).sort((a,b)=>b.total-a.total);
  const maxV=vCosts[0]?.total||1;
  const typeCosts={};recs.forEach(r=>{const t=r.type||"Other";typeCosts[t]=(typeCosts[t]||0)+(parseFloat(r.cost)||0);});
  const topTypes=Object.entries(typeCosts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const yearCosts={};recs.forEach(r=>{const y=(r.date||"").slice(0,4);if(y>="2015"){yearCosts[y]=(yearCosts[y]||0)+(parseFloat(r.cost)||0);}});
  const years=Object.entries(yearCosts).sort((a,b)=>a[0].localeCompare(b[0]));
  const maxY=Math.max(...years.map(y=>y[1]),1);
  return(<div>
    <div className="sl-title">Cost Analysis</div>
    <div className="sl-sub">${grand.toLocaleString(undefined,{minimumFractionDigits:2})} total across all equipment</div>
    <div className="sl-sumbar">
      <div className="sl-sum"><div className="sl-sumv">${grand.toLocaleString()}</div><div className="sl-suml">Grand Total</div></div>
      <div className="sl-sum"><div className="sl-sumv">{recs.length}</div><div className="sl-suml">Records</div></div>
      <div className="sl-sum"><div className="sl-sumv">${recs.length?Math.round(grand/recs.length).toLocaleString():"0"}</div><div className="sl-suml">Avg / Record</div></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px"}}>
        <div style={{fontWeight:700,marginBottom:"12px",color:"var(--amber)"}}>Cost by Service Type</div>
        {topTypes.map(([type,cost])=>(
          <div key={type} className="sl-bar-wrap">
            <div className="sl-bar-lbl"><span>{type}</span><span style={{color:"var(--muted)"}}>${cost.toLocaleString()}</span></div>
            <div className="sl-bar-bg"><div className="sl-bar-fill" style={{width:`${(cost/(topTypes[0]?.[1]||1))*100}%`}}/></div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px"}}>
        <div style={{fontWeight:700,marginBottom:"12px",color:"var(--amber)"}}>Year over Year</div>
        {years.map(([yr,cost])=>(
          <div key={yr} className="sl-bar-wrap">
            <div className="sl-bar-lbl"><span>{yr}</span><span style={{color:"var(--muted)"}}>${cost.toLocaleString()}</span></div>
            <div className="sl-bar-bg"><div className="sl-bar-fill" style={{width:`${(cost/maxY)*100}%`}}/></div>
          </div>
        ))}
      </div>
    </div>
    <div style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"10px",padding:"16px"}}>
      <div style={{fontWeight:700,marginBottom:"12px",color:"var(--amber)"}}>Cost by Equipment (Top 15)</div>
      {vCosts.slice(0,15).map(({v,total,cnt})=>(
        <div key={v.id} className="sl-bar-wrap">
          <div className="sl-bar-lbl">
            <span style={{fontSize:"12px"}}>{v.name}{custName(v.customerId)&&<span style={{color:"var(--faint)",fontSize:"11px"}}> · {custName(v.customerId)}</span>}</span>
            <span style={{color:"var(--muted)"}}>${total.toLocaleString()} ({cnt})</span>
          </div>
          <div className="sl-bar-bg"><div className="sl-bar-fill" style={{width:`${(total/maxV)*100}%`}}/></div>
        </div>
      ))}
    </div>
  </div>);
}

// ── Invoices View ─────────────────────────────────────────────────
function InvoicesView({D,selInvIds,setSelInvIds,updateInvStatus,deleteInvoice,custName,setModal,setEdit}){
  const invs=[...D.invoices].sort((a,b)=>b.date.localeCompare(a.date));
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",flexWrap:"wrap",gap:"8px"}}>
      <div><div className="sl-title">Invoices</div><div className="sl-sub">{invs.length} invoice{invs.length!==1?"s":""}</div></div>
      <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>setModal("settings")}>⚙ Settings</button>
    </div>
    {invs.length===0&&<div className="sl-empty"><div className="sl-empty-ico">🧾</div><div className="sl-empty-title">No Invoices Yet</div><div>Select service records in the Fleet tab and click Create Invoice.</div></div>}
    {invs.map(inv=>{
      const cust=D.customers.find(c=>c.id===inv.custId);
      const recTotal=D.records.filter(r=>inv.records.includes(r.id)).reduce((s,r)=>s+(parseFloat(r.cost)||0),0);
      const total=recTotal+(parseFloat(inv.laborCost)||0);
      return(<div key={inv.id} className="sl-invcard">
        <div>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <span style={{fontWeight:700,fontSize:"15px"}}>{inv.num}</span>
            <span className={`sl-inv-status ${inv.status||"draft"}`}>{inv.status||"draft"}</span>
          </div>
          <div style={{fontSize:"13px",color:"var(--muted)"}}>{cust?.name||"Unknown"} · {inv.date} · {inv.records.length} record{inv.records.length!==1?"s":""}</div>
        </div>
        <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:"15px",color:"var(--green)"}}>${total.toLocaleString()}</span>
          {["draft","sent","paid"].map(s=>(<button key={s} className={`sl-btn sl-btn-sm ${inv.status===s?"sl-btn-b":"sl-btn-g"}`} onClick={()=>updateInvStatus(inv.id,s)}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}
          <button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteInvoice(inv.id)}>✕</button>
        </div>
      </div>);
    })}
  </div>);
}

// ── Order Parts View ──────────────────────────────────────────────
function OrderView({D,poFilters,setPOF,markOrdered,markReceived,deletePart,setEdit,setModal,vehName}){
  const filtered=D.partsToOrder.filter(p=>{
    if(poFilters.q&&!(p.desc+p.num+(p.vendor||"")).toLowerCase().includes(poFilters.q.toLowerCase()))return false;
    if(poFilters.vendor&&(p.vendor||"").toLowerCase()!==poFilters.vendor.toLowerCase())return false;
    if(poFilters.status==="needed"&&(p.ordered||p.received))return false;
    if(poFilters.status==="ordered"&&(!p.ordered||p.received))return false;
    return true;
  }).sort((a,b)=>(b.id||"").localeCompare(a.id||""));
  const needed=D.partsToOrder.filter(p=>!p.ordered&&!p.received).length;
  const ordered=D.partsToOrder.filter(p=>p.ordered&&!p.received).length;
  return(<div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px",flexWrap:"wrap",gap:"8px"}}>
      <div><div className="sl-title">Order Parts</div><div className="sl-sub">{needed} needed · {ordered} on order · {D.orderHistory.length} received all-time</div></div>
    </div>
    <div className="sl-fbar">
      <div className="sl-fg" style={{flex:2}}><label className="sl-fl">Search</label><input className="sl-fi" placeholder="Desc, part #, vendor…" value={poFilters.q} onChange={e=>setPOF(f=>({...f,q:e.target.value}))}/></div>
      <div className="sl-fg"><label className="sl-fl">Vendor</label><select className="sl-fs" value={poFilters.vendor} onChange={e=>setPOF(f=>({...f,vendor:e.target.value}))}><option value="">All</option>{[...new Set(D.partsToOrder.map(p=>p.vendor).filter(Boolean))].sort().map(v=><option key={v}>{v}</option>)}</select></div>
      <div className="sl-fg"><label className="sl-fl">Status</label><select className="sl-fs" value={poFilters.status} onChange={e=>setPOF(f=>({...f,status:e.target.value}))}><option value="">All</option><option value="needed">Needed</option><option value="ordered">Ordered</option></select></div>
      {(poFilters.q||poFilters.vendor||poFilters.status)&&<button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>setPOF({q:"",vendor:"",status:""})}>Clear</button>}
    </div>
    {filtered.length===0&&<div className="sl-empty"><div className="sl-empty-ico">🔩</div><div className="sl-empty-title">No Parts</div><div>Click "+ Add Part" to build your order list.</div></div>}
    {filtered.map(p=>(
      <div key={p.id} className="sl-prow">
        <div>
          <div className="sl-pdesc">{p.desc||"(no description)"}</div>
          <div className="sl-pmeta">
            {p.num&&<span>Part #: {p.num}</span>}
            {p.vendor&&<span>Vendor: {p.vendor}</span>}
            {p.qty&&<span>Qty: {p.qty}</span>}
            {p.unitCost&&<span>Unit: ${p.unitCost}</span>}
            {p.vehicleId&&<span>For: {vehName(p.vehicleId)}</span>}
            {p.orderedDate&&<span>Ordered: {p.orderedDate}</span>}
          </div>
        </div>
        <div className="sl-pacts">
          <span className={`sl-pstatus ${pStatus(p)}`}>{pStatusL(p)}</span>
          {!p.ordered&&<button className="sl-btn sl-btn-g sl-btn-xs" onClick={()=>markOrdered(p.id)}>Mark Ordered</button>}
          {p.ordered&&!p.received&&<button className="sl-btn sl-btn-g sl-btn-xs" style={{color:"var(--green)",borderColor:"rgba(42,94,42,.3)"}} onClick={()=>markReceived(p.id)}>Mark Received</button>}
          <button className="sl-btn sl-btn-g sl-btn-xs" onClick={()=>{setEdit(p);setModal("part");}}>Edit</button>
          <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>deletePart(p.id)}>✕</button>
        </div>
      </div>
    ))}
  </div>);
}

// ── Parts Inventory View ──────────────────────────────────────────
function PartsView({D,invFilters,setInvF,deleteInvItem,setEdit,setModal}){
  const inv=D.partsInventory||[];
  const filtered=inv.filter(p=>{
    if(invFilters.q&&!(p.name+(p.notes||"")+(p.partNumbers||[]).map(n=>n.num+(n.vendor||"")).join("")).toLowerCase().includes(invFilters.q.toLowerCase()))return false;
    if(invFilters.location&&(p.location||"").toLowerCase()!==invFilters.location.toLowerCase())return false;
    return true;
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const lowStock=inv.filter(p=>p.qty!==""&&p.minQty!==""&&Number(p.qty)<=Number(p.minQty));
  return(<div>
    <div><div className="sl-title">Parts Inventory</div><div className="sl-sub">{inv.length} item{inv.length!==1?"s":""}{lowStock.length>0&&<span style={{color:"var(--red)",fontWeight:700}}> · {lowStock.length} low stock</span>}</div></div>
    <div className="sl-fbar" style={{marginTop:"12px"}}>
      <div className="sl-fg" style={{flex:2}}><label className="sl-fl">Search</label><input className="sl-fi" placeholder="Name, part #, vendor…" value={invFilters.q} onChange={e=>setInvF(f=>({...f,q:e.target.value}))}/></div>
      <div className="sl-fg"><label className="sl-fl">Location</label><select className="sl-fs" value={invFilters.location} onChange={e=>setInvF(f=>({...f,location:e.target.value}))}><option value="">All</option>{[...new Set(inv.map(p=>p.location).filter(Boolean))].sort().map(l=><option key={l}>{l}</option>)}</select></div>
      {(invFilters.q||invFilters.location)&&<button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>setInvF({q:"",vendor:"",location:"",vehicle:""})}>Clear</button>}
    </div>
    {filtered.length===0&&<div className="sl-empty"><div className="sl-empty-ico">📦</div><div className="sl-empty-title">No Items</div><div>Click "+ Add Item" to start your parts inventory.</div></div>}
    {filtered.map(p=>{
      const isLow=p.qty!==""&&p.minQty!==""&&Number(p.qty)<=Number(p.minQty);
      return(<div key={p.id} className="sl-invrow">
        <div className="sl-invtop">
          <div>
            <div className="sl-invname">{p.name}{isLow&&<span className="sl-invlow" style={{marginLeft:"8px"}}>⚠ Low</span>}</div>
            <div className="sl-invmeta">
              {p.qty!==""&&<span>Qty: <strong>{p.qty}</strong></span>}
              {p.minQty!==""&&<span>Min: {p.minQty}</span>}
              {p.location&&<span>📍 {p.location}</span>}
            </div>
            {(p.partNumbers||[]).map((n,i)=><div key={i} style={{fontSize:"11px",color:"var(--muted)",marginTop:"2px"}}>{n.vendor&&<span style={{fontWeight:600}}>{n.vendor}: </span>}{n.num}{n.unitCost&&` · $${n.unitCost}`}</div>)}
          </div>
          <div style={{display:"flex",gap:"5px"}}>
            <button className="sl-btn sl-btn-g sl-btn-xs" onClick={()=>{setEdit(p);setModal("invItem");}}>Edit</button>
            <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>deleteInvItem(p.id)}>✕</button>
          </div>
        </div>
        {p.notes&&<div style={{fontSize:"12px",color:"var(--muted)",marginTop:"5px",fontStyle:"italic"}}>{p.notes}</div>}
      </div>);
    })}
  </div>);
}

// ── Vendors View ──────────────────────────────────────────────────
function VendorsView({D,deleteVendor,setEdit,setModal}){
  return(<div>
    <div className="sl-title">Vendors</div>
    <div className="sl-sub">Parts suppliers and service providers</div>
    {D.vendors.length===0&&<div className="sl-empty"><div className="sl-empty-ico">🏪</div><div className="sl-empty-title">No Vendors Yet</div></div>}
    {D.vendors.map(v=>(
      <div key={v.id} className="sl-vcrd">
        <div className="sl-vtop">
          <div>
            <div className="sl-vname">{v.name}</div>
            {v.contact&&<div style={{fontSize:"13px",color:"var(--muted)"}}>👤 {v.contact}</div>}
            {v.phone&&<div style={{fontSize:"13px",color:"var(--muted)"}}>📞 <a href={`tel:${v.phone}`} style={{color:"var(--amber)",textDecoration:"none"}}>{v.phone}</a></div>}
            {v.email&&<div style={{fontSize:"13px",color:"var(--muted)"}}>✉️ <a href={`mailto:${v.email}`} style={{color:"var(--amber)",textDecoration:"none"}}>{v.email}</a></div>}
            {v.notes&&<div style={{fontSize:"12px",color:"var(--muted)",fontStyle:"italic",marginTop:"5px"}}>{v.notes}</div>}
          </div>
          <div style={{display:"flex",gap:"6px"}}>
            <button className="sl-btn sl-btn-g sl-btn-sm" onClick={()=>{setEdit(v);setModal("vendor");}}>Edit</button>
            <button className="sl-btn sl-btn-d sl-btn-sm" onClick={()=>deleteVendor(v.id)}>Delete</button>
          </div>
        </div>
        {D.partsToOrder.filter(p=>p.vendor===v.name&&!p.received).length>0&&(
          <span style={{background:"rgba(192,112,16,.1)",color:"var(--amber)",padding:"2px 8px",borderRadius:"10px",fontSize:"11px",fontWeight:700}}>
            {D.partsToOrder.filter(p=>p.vendor===v.name&&!p.received).length} parts pending
          </span>
        )}
      </div>
    ))}
  </div>);
}

// ── Order History View ────────────────────────────────────────────
function HistoryView({D,vehName}){
  const hist=[...D.orderHistory].sort((a,b)=>(b.receivedDate||"").localeCompare(a.receivedDate||""));
  return(<div>
    <div className="sl-title">Order History</div>
    <div className="sl-sub">{hist.length} received item{hist.length!==1?"s":""}</div>
    {hist.length===0&&<div className="sl-empty"><div className="sl-empty-ico">✅</div><div className="sl-empty-title">No Order History</div><div>Parts marked as received will appear here.</div></div>}
    {hist.map(h=>(
      <div key={h.id} className="sl-hrow">
        <div>
          <div style={{fontWeight:700,fontSize:"13px"}}>{h.desc||h.num||"Part"}</div>
          <div style={{fontSize:"11px",color:"var(--muted)"}}>{[h.vendor,h.num?"#"+h.num:""].filter(Boolean).join(" · ")}{h.qty?` · Qty: ${h.qty}`:""}</div>
          {h.vehicleId&&<div style={{fontSize:"11px",color:"var(--muted)"}}>For: {vehName(h.vehicleId)}</div>}
        </div>
        <div style={{textAlign:"right"}}>
          {h.unitCost&&<div style={{fontWeight:700,color:"var(--green)",fontSize:"13px"}}>${(parseFloat(h.unitCost)*(parseFloat(h.qty)||1)).toLocaleString()}</div>}
          <div style={{fontSize:"11px",color:"var(--muted)"}}>{h.receivedDate}</div>
        </div>
      </div>
    ))}
  </div>);
}

// ── Todos View ────────────────────────────────────────────────────
function TodosView({D,toggleTodo,deleteTodo,setEdit,setModal,custName}){
  const items=D.vehicles.flatMap(v=>(v.todos||[]).map(t=>({t,v,cust:D.customers.find(c=>c.id===v.customerId)})));
  const open=items.filter(i=>!i.t.done).sort((a,b)=>(PRI_ORDER[a.t.priority||"medium"]||1)-(PRI_ORDER[b.t.priority||"medium"]||1)||a.v.name.localeCompare(b.v.name));
  const done=items.filter(i=>i.t.done);
  return(<div>
    <div className="sl-title">To-Do</div>
    <div className="sl-sub">{open.length} open · {done.length} done</div>
    {open.length===0&&done.length===0&&<div className="sl-empty"><div className="sl-empty-ico">☑️</div><div className="sl-empty-title">No To-Do Items</div><div>Add to-do items on individual vehicles in the Fleet tab.</div></div>}
    {[...open,...done].map(({t,v})=>(
      <div key={t.id} className={`sl-todo ${t.priority==="high"?"hi":t.priority==="low"?"lo":"md"} ${t.done?"done":""}`}>
        <input type="checkbox" checked={t.done} onChange={()=>toggleTodo(v.id,t.id)} style={{marginTop:"2px",accentColor:"var(--amber)",flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,fontSize:"13px",textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
          <div style={{fontSize:"11px",color:"var(--muted)"}}>{v.name}{t.dueDate&&` · Due: ${t.dueDate}`}</div>
        </div>
        <span style={{fontSize:"10px",fontWeight:700,color:PRI_COLOR[t.priority||"medium"],background:PRI_COLOR[t.priority||"medium"]+"15",padding:"2px 6px",borderRadius:"8px"}}>{t.priority||"medium"}</span>
        <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>deleteTodo(v.id,t.id)}>✕</button>
      </div>
    ))}
  </div>);
}

// ── Search View ───────────────────────────────────────────────────
function SearchView({D,gsQuery,setGsQuery,setSelVehId,setSelCustId,setTab}){
  const q=gsQuery.toLowerCase().trim();
  const results=[];
  if(q.length>=2){
    D.records.filter(r=>(r.notes+r.type+(r.parts||[]).map(p=>p.desc+p.num).join("")).toLowerCase().includes(q)).slice(0,20).forEach(r=>{const v=D.vehicles.find(v=>v.id===r.vehicleId);results.push({type:"record",label:`${v?.name||"?"} — ${r.type} (${r.date})`,sub:r.notes?.slice(0,80),vid:r.vehicleId,custId:v?.customerId});});
    D.vehicles.filter(v=>(v.name+v.make+v.model+v.vin+(v.notes||"")).toLowerCase().includes(q)).slice(0,10).forEach(v=>results.push({type:"vehicle",label:v.name,sub:`${v.type}${v.year?" · "+v.year:""}`,vid:v.id,custId:v.customerId}));
    D.partsInventory.filter(p=>(p.name+(p.partNumbers||[]).map(n=>n.num+(n.vendor||"")).join("")).toLowerCase().includes(q)).slice(0,10).forEach(p=>results.push({type:"part",label:p.name,sub:`Qty: ${p.qty||"?"}${p.location?" · "+p.location:""}`}));
  }
  return(<div>
    <div className="sl-title">🔍 Search</div>
    <input className="sl-mfi" style={{fontSize:"16px",padding:"12px 14px",marginBottom:"14px",width:"100%",maxWidth:"600px"}} placeholder="Search records, vehicles, parts…" value={gsQuery} onChange={e=>setGsQuery(e.target.value)} autoFocus/>
    {q.length>=2&&results.length===0&&<div style={{color:"var(--muted)",fontSize:"14px"}}>No results for "{gsQuery}"</div>}
    {results.map((r,i)=>(
      <div key={i} style={{background:"var(--panel)",border:"1px solid var(--border)",borderRadius:"6px",padding:"10px 14px",marginBottom:"6px",cursor:"pointer",display:"flex",gap:"10px",alignItems:"flex-start"}} onClick={()=>{if(r.vid){setSelVehId(r.vid);if(r.custId)setSelCustId(r.custId);setTab("fleet");}}}>
        <span style={{fontSize:"16px"}}>{r.type==="vehicle"?"🔧":r.type==="record"?"📋":"📦"}</span>
        <div>
          <div style={{fontWeight:700,fontSize:"13px"}}>{r.label}</div>
          {r.sub&&<div style={{fontSize:"12px",color:"var(--muted)"}}>{r.sub}</div>}
        </div>
      </div>
    ))}
  </div>);
}

// ── Admin View ────────────────────────────────────────────────────
function AdminView({D,toggleFeature,setModal}){
  const feats=[["invoicing","Invoicing","Show Invoices tab for creating customer invoices"],["partsInventory","Parts Inventory","Show Parts tab for tracking on-hand stock"],["orderParts","Order Parts","Show Order Parts tab for tracking parts to order"]];
  const Switch=({on,onChange})=>(<button className={`sl-switch ${on?"on":""}`} onClick={onChange}><div className="sl-switch-knob"/></button>);
  return(<div>
    <div className="sl-title">⚙ Admin</div>
    <div className="sl-admin-sec">
      <div className="sl-admin-hdr"><div className="sl-admin-title">Features</div></div>
      <div className="sl-admin-body">
        {feats.map(([key,label,desc])=>(
          <div key={key} className="sl-toggle-row">
            <div><div style={{fontWeight:600,fontSize:"13px"}}>{label}</div><div style={{fontSize:"12px",color:"var(--muted)"}}>{desc}</div></div>
            <Switch on={D.settings.features?.[key]!==false} onChange={()=>toggleFeature(key)}/>
          </div>
        ))}
      </div>
    </div>
    <div className="sl-admin-sec">
      <div className="sl-admin-hdr"><div className="sl-admin-title">Settings</div></div>
      <div className="sl-admin-body">
        <button className="sl-btn sl-btn-g" onClick={()=>setModal("settings")}>⚙ Business Name & Invoice Settings</button>
      </div>
    </div>
    <div className="sl-admin-sec">
      <div className="sl-admin-hdr"><div className="sl-admin-title">Stats</div></div>
      <div className="sl-admin-body" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
        {[["Customers",D.customers.length],["Equipment",D.vehicles.length],["Records",D.records.length],["Invoices",D.invoices.length],["Parts to Order",D.partsToOrder.length],["Parts Inventory",D.partsInventory.length]].map(([l,v])=>(
          <div key={l} style={{textAlign:"center",padding:"10px",background:"var(--bg)",borderRadius:"6px",border:"1px solid var(--border)"}}>
            <div style={{fontSize:"22px",fontWeight:700,color:"var(--amber)"}}>{v}</div>
            <div style={{fontSize:"10px",color:"var(--muted)",textTransform:"uppercase",letterSpacing:"1px"}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  </div>);
}

// ── Modals ────────────────────────────────────────────────────────
function Mo({title,onClose,onSave,saveLabel,children,large}){
  return(<div className="sl-mo" onClick={onClose}><div className={`sl-m ${large?"sl-m-lg":""}`} onClick={e=>e.stopPropagation()}><div className="sl-mh"><div className="sl-mt">{title}</div><button className="sl-mc" onClick={onClose}>✕</button></div><div className="sl-mb">{children}</div><div className="sl-mf"><button className="sl-btn sl-btn-g" onClick={onClose}>Cancel</button><button className="sl-btn sl-btn-p" onClick={onSave}>{saveLabel||"Save"}</button></div></div></div>);
}
function Fg({label,full,children}){return(<div className={`sl-mfg ${full?"full":""}`}><label className="sl-mfl">{label}</label>{children}</div>);}
function Fi(props){return(<input className="sl-mfi" {...props}/>);}
function Fs({children,...props}){return(<select className="sl-mfs" {...props}>{children}</select>);}
function Fr({children}){return(<div className="sl-mfr">{children}</div>);}

function VehicleModal({initial,customers,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",type:initial?.type||"Tractor",customerId:initial?.customerId||"",year:initial?.year||"",make:initial?.make||"",model:initial?.model||"",vin:initial?.vin||"",engine:initial?.engine||"",hp:initial?.hp||"",hours:initial?.hours||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Equipment":"Add Equipment"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Equipment"} large>
    <Fr><Fg label="Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Kenworth, JD 9620R"/></Fg></Fr>
    <Fr>
      <Fg label="Type"><Fs value={f.type} onChange={e=>s("type",e.target.value)}>{EQUIP_TYPES.map(t=><option key={t}>{t}</option>)}</Fs></Fg>
      <Fg label="Customer"><Fs value={f.customerId} onChange={e=>s("customerId",e.target.value)}><option value="">— No customer —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Fs></Fg>
      <Fg label="Year"><Fi value={f.year} onChange={e=>s("year",e.target.value)} placeholder="2018"/></Fg>
      <Fg label="Make"><Fi value={f.make} onChange={e=>s("make",e.target.value)} placeholder="Caterpillar"/></Fg>
      <Fg label="Model"><Fi value={f.model} onChange={e=>s("model",e.target.value)} placeholder="MT865"/></Fg>
      <Fg label="VIN / Serial"><Fi value={f.vin} onChange={e=>s("vin",e.target.value)}/></Fg>
      <Fg label="Engine"><Fi value={f.engine} onChange={e=>s("engine",e.target.value)} placeholder="e.g. C15 475"/></Fg>
      <Fg label="Horsepower"><Fi type="number" value={f.hp} onChange={e=>s("hp",e.target.value)}/></Fg>
      <Fg label="Current Hours / Miles"><Fi type="number" value={f.hours} onChange={e=>s("hours",e.target.value)} placeholder="0"/></Fg>
    </Fr>
    <Fg label="Notes" full><textarea className="sl-mfta" value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function RecordModal({initial,vehicleId,partsToOrder,partsInventory,onSave,onClose}){
  const[f,setF]=useState({date:initial?.date||today(),type:initial?.type||"",notes:initial?.notes||"",cost:initial?.cost||"",hours:initial?.hours||"",tech:initial?.tech||"",parts:initial?getParts(initial):[]});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addP=()=>setF(p=>({...p,parts:[...p.parts,{id:genId(),desc:"",num:"",qty:"1",cost:""}]}));
  const updP=(i,k,v)=>setF(p=>({...p,parts:p.parts.map((pp,ii)=>ii===i?{...pp,[k]:v}:pp)}));
  const remP=i=>setF(p=>({...p,parts:p.parts.filter((_,ii)=>ii!==i)}));
  const pending=partsToOrder.filter(p=>p.vehicleId===vehicleId&&!p.received);
  return(<Mo title={initial?"Edit Service Record":"Log Service"} onClose={onClose} onSave={()=>{if(!f.date||!f.type)return alert("Date and type required.");onSave(f);}} saveLabel={initial?"Save Changes":"Log Service"} large>
    <Fr>
      <Fg label="Date *"><Fi type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></Fg>
      <Fg label="Service Type *"><Fi list="svc-opts" value={f.type} onChange={e=>s("type",e.target.value)} placeholder="Type or select…"/><datalist id="svc-opts">{SVC_TYPES.map(t=><option key={t} value={t}/>)}</datalist></Fg>
      <Fg label="Cost ($)"><Fi type="number" value={f.cost} onChange={e=>s("cost",e.target.value)} placeholder="0.00" step="0.01"/></Fg>
      <Fg label="Hrs/Miles at Service"><Fi type="number" value={f.hours} onChange={e=>s("hours",e.target.value)} placeholder="0"/></Fg>
    </Fr>
    <Fg label="Performed By" full><Fi value={f.tech} onChange={e=>s("tech",e.target.value)} placeholder="Self, Dealer, Shop…"/></Fg>
    <Fg label="Notes / Work Done" full><textarea className="sl-mfta" value={f.notes} onChange={e=>s("notes",e.target.value)} placeholder="Work done, parts replaced, observations…"/></Fg>
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><label className="sl-mfl">Parts Used</label><button className="sl-btn sl-btn-g sl-btn-xs" onClick={addP}>+ Add Part</button></div>
      {pending.length>0&&f.parts.length===0&&<p style={{fontSize:"11px",color:"var(--muted)",marginBottom:"6px"}}>Pending for this vehicle: {pending.map(p=>p.desc||p.num).join(", ")}</p>}
      {f.parts.map((p,i)=>(
        <div key={p.id||i} className="sl-part-entry">
          <Fi placeholder="Description" value={p.desc} onChange={e=>updP(i,"desc",e.target.value)}/>
          <Fi placeholder="Part #" value={p.num} onChange={e=>updP(i,"num",e.target.value)}/>
          <Fi type="number" placeholder="Qty" value={p.qty} onChange={e=>updP(i,"qty",e.target.value)}/>
          <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>remP(i)}>✕</button>
        </div>
      ))}
    </div>
  </Mo>);
}

function CustomerModal({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",businessName:initial?.businessName||"",contact:initial?.contact||"",phone:initial?.phone||"",email:initial?.email||"",address:initial?.address||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Customer":"Add Customer"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Customer"}>
    <Fr>
      <Fg label="Customer Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Mattson Bros Inc."/></Fg>
      <Fg label="Business Name"><Fi value={f.businessName} onChange={e=>s("businessName",e.target.value)} placeholder="Legal business name"/></Fg>
      <Fg label="Contact Name"><Fi value={f.contact} onChange={e=>s("contact",e.target.value)}/></Fg>
      <Fg label="Phone"><Fi type="tel" value={f.phone} onChange={e=>s("phone",e.target.value)}/></Fg>
      <Fg label="Email"><Fi type="email" value={f.email} onChange={e=>s("email",e.target.value)}/></Fg>
    </Fr>
    <Fg label="Billing Address" full><textarea className="sl-mfta" style={{minHeight:"60px"}} value={f.address} onChange={e=>s("address",e.target.value)}/></Fg>
    <Fg label="Notes" full><textarea className="sl-mfta" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function PartModal({initial,vehicles,vendors,onSave,onClose}){
  const[f,setF]=useState({desc:initial?.desc||"",num:initial?.num||"",vendor:initial?.vendor||"",qty:initial?.qty||"1",unitCost:initial?.unitCost||"",vehicleId:initial?.vehicleId||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Part":"Add Part to Order"} onClose={onClose} onSave={()=>{if(!f.desc.trim())return alert("Description required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Part"}>
    <Fr>
      <Fg label="Description *" full><Fi value={f.desc} onChange={e=>s("desc",e.target.value)} placeholder="e.g. Oil Filter, Air Filter…"/></Fg>
      <Fg label="Part Number"><Fi value={f.num} onChange={e=>s("num",e.target.value)} placeholder="AF12345"/></Fg>
      <Fg label="Vendor"><Fi list="vend-list" value={f.vendor} onChange={e=>s("vendor",e.target.value)} placeholder="e.g. Brandt, NAPA…"/><datalist id="vend-list">{vendors.map(v=><option key={v.id} value={v.name}/>)}</datalist></Fg>
      <Fg label="Quantity"><Fi type="number" min="1" value={f.qty} onChange={e=>s("qty",e.target.value)}/></Fg>
      <Fg label="Unit Cost ($)"><Fi type="number" step="0.01" value={f.unitCost} onChange={e=>s("unitCost",e.target.value)} placeholder="0.00"/></Fg>
      <Fg label="For Vehicle" full><Fs value={f.vehicleId} onChange={e=>s("vehicleId",e.target.value)}><option value="">— Optional —</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Fs></Fg>
    </Fr>
    <Fg label="Notes" full><textarea className="sl-mfta" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function InvItemModal({initial,vehicles,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",qty:initial?.qty||"",minQty:initial?.minQty||"",location:initial?.location||"",notes:initial?.notes||"",vehicleIds:initial?.vehicleIds||[],partNumbers:initial?.partNumbers||[]});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const addPN=()=>setF(p=>({...p,partNumbers:[...p.partNumbers,{id:genId(),num:"",vendor:"",unitCost:""}]}));
  const updPN=(i,k,v)=>setF(p=>({...p,partNumbers:p.partNumbers.map((n,ii)=>ii===i?{...n,[k]:v}:n)}));
  const remPN=i=>setF(p=>({...p,partNumbers:p.partNumbers.filter((_,ii)=>ii!==i)}));
  return(<Mo title={initial?"Edit Inventory Item":"Add Inventory Item"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Item"} large>
    <Fr>
      <Fg label="Part Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Oil Filter 15W-40"/></Fg>
      <Fg label="Quantity on Hand"><Fi type="number" value={f.qty} onChange={e=>s("qty",e.target.value)} placeholder="0"/></Fg>
      <Fg label="Min. Quantity"><Fi type="number" value={f.minQty} onChange={e=>s("minQty",e.target.value)} placeholder="0"/></Fg>
      <Fg label="Storage Location"><Fi value={f.location} onChange={e=>s("location",e.target.value)} placeholder="e.g. Shop Shelf A"/></Fg>
    </Fr>
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"6px"}}><label className="sl-mfl">Part Numbers / Vendors</label><button className="sl-btn sl-btn-g sl-btn-xs" onClick={addPN}>+ Add</button></div>
      {f.partNumbers.map((n,i)=>(
        <div key={n.id||i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px auto",gap:"5px",marginBottom:"5px",alignItems:"center"}}>
          <Fi placeholder="Part #" value={n.num} onChange={e=>updPN(i,"num",e.target.value)}/>
          <Fi placeholder="Vendor" value={n.vendor} onChange={e=>updPN(i,"vendor",e.target.value)}/>
          <Fi type="number" placeholder="Cost" value={n.unitCost} onChange={e=>updPN(i,"unitCost",e.target.value)}/>
          <button className="sl-btn sl-btn-d sl-btn-xs" onClick={()=>remPN(i)}>✕</button>
        </div>
      ))}
    </div>
    <Fg label="Notes" full><textarea className="sl-mfta" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function VendorModal({initial,onSave,onClose}){
  const[f,setF]=useState({name:initial?.name||"",contact:initial?.contact||"",phone:initial?.phone||"",email:initial?.email||"",notes:initial?.notes||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit Vendor":"Add Vendor"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={initial?"Save Changes":"Add Vendor"}>
    <Fr>
      <Fg label="Vendor Name *" full><Fi value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. Brandt Tractor, NAPA"/></Fg>
      <Fg label="Contact Name"><Fi value={f.contact} onChange={e=>s("contact",e.target.value)}/></Fg>
      <Fg label="Phone"><Fi type="tel" value={f.phone} onChange={e=>s("phone",e.target.value)}/></Fg>
      <Fg label="Email"><Fi type="email" value={f.email} onChange={e=>s("email",e.target.value)}/></Fg>
    </Fr>
    <Fg label="Notes" full><textarea className="sl-mfta" style={{minHeight:"55px"}} value={f.notes} onChange={e=>s("notes",e.target.value)}/></Fg>
  </Mo>);
}

function InvoiceModal({records,customers,settings,selCustId,vehicles,nextNum,onSave,onClose}){
  const[f,setF]=useState({date:today(),custId:selCustId||"",businessName:settings.businessName||"",laborCost:"",laborDesc:""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const recTotal=sumCost(records);
  const total=recTotal+(parseFloat(f.laborCost)||0);
  return(<Mo title={`Create Invoice ${nextNum}`} onClose={onClose} onSave={()=>{if(!f.custId)return alert("Select a customer.");onSave(f);}} saveLabel="Create Invoice" large>
    <Fr>
      <Fg label="Business Name"><Fi value={f.businessName} onChange={e=>s("businessName",e.target.value)} placeholder="Your business name"/></Fg>
      <Fg label="Invoice Date"><Fi type="date" value={f.date} onChange={e=>s("date",e.target.value)}/></Fg>
    </Fr>
    <Fg label="Customer *" full><Fs value={f.custId} onChange={e=>s("custId",e.target.value)}><option value="">— Select customer —</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Fs></Fg>
    <div style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"6px",padding:"10px 14px",fontSize:"13px"}}>
      <div style={{fontWeight:700,marginBottom:"6px",color:"var(--amber)"}}>Service Records ({records.length})</div>
      {records.map(r=>{const v=vehicles.find(vv=>vv.id===r.vehicleId);return(<div key={r.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}><div><span style={{fontWeight:600}}>{r.type}</span><span style={{color:"var(--muted)",fontSize:"12px"}}> · {v?.name||""} · {r.date}</span></div><span style={{color:"var(--green)",fontWeight:700}}>${parseFloat(r.cost||0).toLocaleString()}</span></div>);})}
    </div>
    <Fr>
      <Fg label="Labour Cost ($)"><Fi type="number" step="0.01" value={f.laborCost} onChange={e=>s("laborCost",e.target.value)} placeholder="0.00"/></Fg>
      <Fg label="Labour Description"><Fi value={f.laborDesc} onChange={e=>s("laborDesc",e.target.value)} placeholder="e.g. Shop labour"/></Fg>
    </Fr>
    <div style={{textAlign:"right",fontWeight:700,fontSize:"16px",color:"var(--green)"}}>Total: ${total.toLocaleString(undefined,{minimumFractionDigits:2})}</div>
  </Mo>);
}

function TodoModal({vehicleId,initial,onSave,onClose}){
  const[f,setF]=useState({text:initial?.text||"",priority:initial?.priority||"medium",dueDate:initial?.dueDate||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={initial?"Edit To-Do":"Add To-Do"} onClose={onClose} onSave={()=>{if(!f.text.trim())return alert("Text required.");onSave(vehicleId,f);}} saveLabel={initial?"Save":"Add"}>
    <Fg label="Task *" full><Fi value={f.text} onChange={e=>s("text",e.target.value)} placeholder="What needs to be done?"/></Fg>
    <Fr>
      <Fg label="Priority"><Fs value={f.priority} onChange={e=>s("priority",e.target.value)}>{PRIS.map(p=><option key={p}>{p}</option>)}</Fs></Fg>
      <Fg label="Due Date"><Fi type="date" value={f.dueDate} onChange={e=>s("dueDate",e.target.value)}/></Fg>
    </Fr>
  </Mo>);
}

function SettingsModal({settings,onSave,onClose}){
  const[f,setF]=useState({businessName:settings.businessName||""});
  return(<Mo title="Settings" onClose={onClose} onSave={()=>onSave({...settings,...f})} saveLabel="Save Settings">
    <Fg label="Business Name (appears on invoices)" full><Fi value={f.businessName} onChange={e=>setF(p=>({...p,businessName:e.target.value}))} placeholder="e.g. Mattson Bros Farms"/></Fg>
  </Mo>);
}
