import { useState, useEffect, useRef, useCallback } from "react";
import { dbRead, dbWrite, dbSafeWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

// ── Permission mapping from Agri Logix roles ──────────────────────
const PERMS = {
  owner:    { canViewInsurance:true,  canViewCropShare:true,  canEditFields:true,  canEditBins:true,  canViewCosts:true,  canReport:true,  canEditComm:true  },
  manager:  { canViewInsurance:false, canViewCropShare:false, canEditFields:true,  canEditBins:true,  canViewCosts:true,  canReport:true,  canEditComm:true  },
  operator: { canViewInsurance:false, canViewCropShare:false, canEditFields:false, canEditBins:false, canViewCosts:false, canReport:false, canEditComm:false },
};

// ── Constants ─────────────────────────────────────────────────────
const FALLBACK_GRAIN = { name:"WHEAT", bushel_lbs:60, color:"#c0b8ac" };
const DEFAULT_TRUCKS = [
  { id:"t1", name:"WHITE",  hex:"#f0f0f0", border:"#aaa",    text:"#333" },
  { id:"t2", name:"RED",    hex:"#e74c3c", border:"#c0392b", text:"#fff" },
  { id:"t3", name:"GREEN",  hex:"#27ae60", border:"#219653", text:"#fff" },
  { id:"t4", name:"BLUE",   hex:"#2980b9", border:"#1a6895", text:"#fff" },
  { id:"t5", name:"BLACK",  hex:"#2c3e50", border:"#1a252f", text:"#fff" },
  { id:"t6", name:"YELLOW", hex:"#f1c40f", border:"#d4ac0d", text:"#333" },
];
const UNITS = ["LBS","TONS","BU"];
const DEFAULT_FIELDS = [
  { id:1, name:"FIELD 1", loads:[], acres:0, costs:{}, grainPrice:"", landlord:"", cropShare:"", insCoverageLevel:"", insGuaranteedYield:"", insPriceElection:"", insType:"", insInsuredAcres:"" },
];
const DEFAULT_BINS = [
  { id:101, name:"BIN 1", capacityBu:50000, storedLbs:0, grainName:"WHEAT" },
];
const GRAIN_COLORS = ["#c8a060","#7ab870","#a0c8e0","#e8c070","#c0a8e0","#80c8a8"];

// ── Helpers ───────────────────────────────────────────────────────
const fmtWt = (lbs, unit, bushelLbs=60) => {
  if(unit==="TONS") return { value:(lbs/2000).toFixed(2), label:"TONS" };
  if(unit==="BU")   return { value:(lbs/(bushelLbs||60)).toFixed(1), label:"BU" };
  return { value:lbs.toLocaleString("en-US",{maximumFractionDigits:0}), label:"LBS" };
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
  .as-wrap { font-family: 'IBM Plex Mono', monospace; }
  .as-wrap * { box-sizing: border-box; }
  @keyframes as-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(45,122,31,0.25)} 50%{box-shadow:0 0 0 4px rgba(45,122,31,0)} }
  .as-record-btn:not(:disabled):hover { filter: brightness(1.08); }
  .as-record-btn:not(:disabled):active { transform: translateY(1px); }
  .as-numkey:active { transform: translateY(1px); box-shadow: none !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #ede9e4; }
  ::-webkit-scrollbar-thumb { background: #9a8a72; border-radius: 2px; }
`;

// ── BinGauge SVG (matches original exactly) ───────────────────────
function BinGauge({ bin, grains, small }) {
  const grain = (grains||[]).filter(Boolean).find(g=>g.name===bin.grainName) || FALLBACK_GRAIN;
  const storedBu = bin.storedLbs / (grain.bushel_lbs||60);
  const pct = bin.capacityBu > 0 ? Math.min(100, storedBu / bin.capacityBu * 100) : 0;
  const remaining = Math.max(0, bin.capacityBu - storedBu);
  const fillColor = pct >= 95 ? "#e74c3c" : pct >= 80 ? "#c47d0a" : "#4a5568";
  const fillGlow  = fillColor;

  const binH = small ? 100 : 160;
  const binW = small ? 60  : 90;
  const roofH = small ? 18  : 28;
  const neckW = small ? 18  : 28;
  const fillH = pct / 100 * binH;
  const fillY = roofH + binH - fillH;
  const svgW = binW + 20;
  const svgH = roofH + binH + (small ? 10 : 20);

  const bodyPts = `${10+neckW/2},${roofH} ${10+binW-neckW/2},${roofH} ${10+binW},${roofH+binH} ${10},${roofH+binH}`;
  const roofPts = `${10+binW/2},4 ${10+neckW/2},${roofH} ${10+binW-neckW/2},${roofH}`;

  return (
    <div style={{background:"#ede9e4",border:"2px solid #b0c8a0",borderRadius:"8px",padding:small?"10px 12px 8px":"16px 20px 12px",boxShadow:"inset 0 2px 8px rgba(0,0,0,.05)"}}>
      <div style={{display:"flex",gap:small?"10px":"16px",alignItems:"center"}}>
        <div style={{flexShrink:0}}>
          <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
            <defs>
              <linearGradient id={`fg-${bin.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.5"/>
                <stop offset="50%" stopColor={fillColor} stopOpacity="0.8"/>
                <stop offset="100%" stopColor={fillColor} stopOpacity="0.5"/>
              </linearGradient>
              <clipPath id={`bc-${bin.id}`}>
                <polygon points={bodyPts}/>
              </clipPath>
            </defs>
            {/* Body outline */}
            <polygon points={bodyPts} fill="none" stroke="#6a7280" strokeWidth="2"/>
            {/* Roof */}
            <polygon points={roofPts} fill="#e0eed8" stroke="#6a7280" strokeWidth="1.5"/>
            {/* Fill */}
            {pct > 0 && <rect x={0} y={fillY} width={binW+20} height={fillH+binH} fill={`url(#fg-${bin.id})`} clipPath={`url(#bc-${bin.id})`}/>}
            {/* Glow outline */}
            <polygon points={bodyPts} fill="none" stroke={fillColor} strokeWidth="1.5" style={{filter:pct>0?`drop-shadow(0 0 4px ${fillGlow})`:"none"}}/>
            {/* Pct label */}
            {pct > 12 && <text x={10+binW/2} y={fillY+fillH/2+5} textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize={small?"10":"13"} fontWeight="bold" fill="#fff" >{pct.toFixed(1)}%</text>}
            {/* Tick marks */}
            {[25,50,75].map(t=>{
              const ty=roofH+binH-t/100*binH;
              const x0=10+(binW-neckW)*(1-t/100)*0.5+neckW/2-2;
              return <line key={t} x1={x0} y1={ty} x2={x0-6} y2={ty} stroke="#c0b8ac" strokeWidth="1"/>;
            })}
          </svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:small?"11px":"13px",color:"#4a5568",letterSpacing:"0.08em",marginBottom:"4px"}}>{bin.name}</div>
          <div style={{fontSize:small?"9px":"10px",color:"#6a7280",letterSpacing:"0.06em",lineHeight:1.7}}>
            <div><span style={{color:fillColor,fontWeight:"bold"}}>{pct.toFixed(1)}%</span> FULL</div>
            <div>{storedBu.toFixed(0)} / {bin.capacityBu.toLocaleString()} BU</div>
            <div>{remaining.toFixed(0)} BU REMAINING</div>
            <div>{(bin.storedLbs/2000).toFixed(1)} TONS</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────
function PrintReport({ fields, bins, grains, onClose }) {
  const reportRef = useRef(null);
  const allLoads = [];
  (fields||[]).forEach(field => (field.loads||[]).forEach(load => allLoads.push({...load, fieldName: field.name})));
  allLoads.sort((a,b)=>(a.ts||0)-(b.ts||0));
  const grainFor = (name) => (grains||[]).find(g=>g.name===name) || FALLBACK_GRAIN;
  const buOf = (load) => load.net / ((grainFor(load.grainName).bushel_lbs)||60);
  const grandTotalLbs = allLoads.reduce((s,l)=>s+l.net,0);
  const grandTotalBu = allLoads.reduce((s,l)=>s+buOf(l),0);
  const reportDate = new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
  const printTime = new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});

  const handlePrint = () => {
    const content = reportRef.current.innerHTML;
    const win = window.open("", "_blank");
    let html = "<!DOCTYPE html><html><head><title>AgriScale Load Report</title><style>";
    html += "* { box-sizing: border-box; margin:0; padding:0; }";
    html += "body { font-family: 'IBM Plex Sans', sans-serif; background:#fff; color:#111; padding:32px 40px; font-size:11pt; }";
    html += ".report-wrap { max-width: 760px; margin:0 auto; }";
    html += "table { width:100%; border-collapse:collapse; font-size:10pt; margin-bottom:16px; }";
    html += "th { font-family:'IBM Plex Mono',monospace; font-size:8pt; letter-spacing:0.12em; text-transform:uppercase; padding:6px 10px; text-align:left; color:#444; border-bottom:2px solid #111; }";
    html += "td { padding:7px 10px; border-bottom:1px solid #eee; }";
    html += "tr:nth-child(even) td { background:#f9f9f9; }";
    html += "@media print { body{padding:16px 20px;} }";
    html += "</style></head><body><div class=\"report-wrap\">" + content + "</div></body></html>";
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(()=>win.print(), 400);
  };

  const th = {fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.12em",color:"#666",padding:"6px 10px",borderBottom:"2px solid #111",textAlign:"left"};
  const td = {padding:"7px 10px",borderBottom:"1px solid #eee",fontSize:"11px"};

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(30,50,20,0.65)",zIndex:400,overflowY:"auto",padding:"20px"}}>
      <div style={{maxWidth:"800px",margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
          <span style={{color:"#e8f0e0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",letterSpacing:"0.15em"}}>PRINT PREVIEW</span>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={handlePrint} style={{background:"#e8e2d8",border:"1px solid #4a5568",color:"#4a5568",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",padding:"8px 20px",borderRadius:"4px",cursor:"pointer"}}>🖨 PRINT / SAVE PDF</button>
            <button onClick={onClose} style={{background:"#fff0f0",border:"1px solid #e0c0c0",color:"#c05040",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",padding:"8px 16px",borderRadius:"4px",cursor:"pointer"}}>✕ CLOSE</button>
          </div>
        </div>
        <div ref={reportRef} style={{background:"#fff",color:"#111",fontFamily:"'IBM Plex Sans',sans-serif",padding:"28px 32px",borderRadius:"6px",border:"1px solid #ddd"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",borderBottom:"3px solid #111",paddingBottom:"14px",marginBottom:"20px"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"20px",fontWeight:700,letterSpacing:"0.05em"}}>AGRI<span style={{color:"#888"}}>SCALE</span></div>
            <div style={{textAlign:"right",fontSize:"11px",color:"#666",lineHeight:1.7}}>
              <div style={{fontWeight:700}}>{reportDate}</div>
              <div>Printed: {printTime}</div>
            </div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"20px"}}>
            {[
              ["TOTAL LOADS", String(allLoads.length)],
              ["TOTAL WEIGHT", grandTotalLbs.toLocaleString()+" lbs"],
              ["TOTAL BUSHELS", grandTotalBu.toLocaleString("en-US",{maximumFractionDigits:0})+" bu"],
              ["FIELDS ACTIVE", (fields||[]).filter(f=>(f.loads||[]).length>0).length+" of "+(fields||[]).length],
            ].map(([label,val])=>(
              <div key={label} style={{border:"1px solid #ddd",borderRadius:"4px",padding:"10px 14px"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"8px",letterSpacing:"0.18em",color:"#888",marginBottom:"4px"}}>{label}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"18px",fontWeight:700}}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.2em",color:"#888",marginTop:"20px",marginBottom:"8px",paddingTop:"12px",borderTop:"1px solid #ddd"}}>ALL LOADS — DETAILED</div>
          <table>
            <thead><tr>
              {["#","DATE","TIME","OPERATOR","FIELD","PRODUCT","BIN","TRUCK","NET WEIGHT","BUSHELS"].map((h,i)=>(
                <th key={h} style={{...th,textAlign:i>=8?"right":"left"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {allLoads.map((load,i)=>{
                const binForLoad = (bins||[]).find(b=>b.id===load.binId);
                return (
                  <tr key={load.id} style={{background:i%2===1?"#f9f9f9":"#fff"}}>
                    <td style={{...td,fontFamily:"'IBM Plex Mono',monospace",color:"#aaa",fontSize:"10px"}}>#{load.splitLabel||i+1}</td>
                    <td style={{...td,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{load.date}</td>
                    <td style={{...td,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{load.timeOnly}</td>
                    <td style={td}>{load.operator ? <span style={{background:"#e8f4e0",borderRadius:"3px",padding:"1px 7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#3a6a28"}}>{load.operator}</span> : <span style={{color:"#bbb",fontSize:"10px"}}>—</span>}</td>
                    <td style={td}><span style={{background:"#f0f0f0",borderRadius:"3px",padding:"1px 7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{load.fieldName}</span></td>
                    <td style={{...td,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{load.grainName}</td>
                    <td style={td}><span style={{background:"#e8f0e8",borderRadius:"3px",padding:"1px 7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{binForLoad?binForLoad.name:"—"}</span></td>
                    <td style={td}>
                      {load.truckColor ? (
                        <span style={{display:"inline-flex",alignItems:"center",gap:"5px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>
                          <span style={{display:"inline-block",width:"10px",height:"10px",borderRadius:"2px",background:load.truckColor,border:"1px solid rgba(0,0,0,.2)",flexShrink:0}}/>
                          {load.truckName||""}
                        </span>
                      ) : <span style={{color:"#aaa",fontSize:"10px"}}>—</span>}
                    </td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{load.net.toLocaleString()} lbs</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,color:"#c47d0a"}}>{buOf(load).toFixed(1)} bu</td>
                  </tr>
                );
              })}
              {allLoads.length===0 && <tr><td colSpan={10} style={{...td,textAlign:"center",color:"#bbb"}}>No loads recorded</td></tr>}
              {allLoads.length>0 && (
                <tr>
                  <td colSpan={8} style={{...td,fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"10px",borderTop:"2px solid #111"}}>GRAND TOTAL ({allLoads.length} loads)</td>
                  <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,borderTop:"2px solid #111"}}>{grandTotalLbs.toLocaleString()} lbs</td>
                  <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,borderTop:"2px solid #111",color:"#c47d0a"}}>{grandTotalBu.toLocaleString("en-US",{maximumFractionDigits:0})} bu</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.2em",color:"#888",marginTop:"20px",marginBottom:"8px",paddingTop:"12px",borderTop:"1px solid #ddd"}}>SUMMARY BY FIELD</div>
          <table>
            <thead><tr>
              {["FIELD","ACRES","LOADS","TOTAL WEIGHT","TOTAL BU","YIELD / ACRE"].map((h,i)=>(
                <th key={h} style={{...th,textAlign:i>=3?"right":"left"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(fields||[]).map(field=>{
                const loads=(field.loads||[]).filter(Boolean);
                if(!loads.length) return null;
                const totLbs=loads.reduce((s,l)=>s+l.net,0);
                const totBu=loads.reduce((s,l)=>s+buOf(l),0);
                const acres=parseFloat(field.acres)||0;
                return (
                  <tr key={field.id}>
                    <td style={td}>{field.name}</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{acres||"—"}</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{loads.length}</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{totLbs.toLocaleString()} lbs</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",color:"#c47d0a"}}>{totBu.toFixed(0)} bu</td>
                    <td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{acres>0?(totBu/acres).toFixed(1)+" bu/ac":"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AgriScaleModule({ tenantId, token, userProfile, persist, farmId, farmName }) {
  const BASE = `tenants/${tenantId}/agriScale`;
  // Fields on non-default farms use the farm path
  const FIELD_BASE = (!farmId || farmId === "default")
    ? `${BASE}/fields`
    : `tenants/${tenantId}/farms/${farmId}/agriScale/fields`;
  const role = userProfile?.role || "operator";
  const perms = PERMS[role] || PERMS.operator;
  const operatorName = (userProfile?.name || "OPERATOR").toUpperCase();

  // Data
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [bins,   setBins]   = useState(DEFAULT_BINS);
  const [grains, setGrains] = useState([FALLBACK_GRAIN]);
  const [trucks, setTrucks] = useState(DEFAULT_TRUCKS);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("init");

  // Scale
  const [rawInput, setRawInput] = useState("0");
  const [tare, setTare]         = useState(0);
  const [unit, setUnit]         = useState("LBS");
  const [grainIdx, setGrainIdx] = useState(0);
  const [activeFieldId, setAFId] = useState(null);
  const [activeBinId,   setABId] = useState(null);
  const [truckColor, setTruckColor] = useState(DEFAULT_TRUCKS[0].id);

  // UI
  const [tab, setTab]           = useState("SCALE");
  const [flImportModal, setFLImportModal] = useState(false);
  const [flFields,      setFLFields]      = useState([]);
  const [flSelected,    setFLSelected]    = useState(new Set());
  const [flLoading,     setFLLoading]     = useState(false);
  const [apImportModal, setAPImportModal] = useState(false);
  const [apFields,      setAPFields]      = useState([]);
  const [apSelected,    setAPSelected]    = useState(new Set());
  const [apLoading,     setAPLoading]     = useState(false);
  const [apCrops,       setApCrops]       = useState({}); // field name (lowercase) -> planned/actual crop from AgriPlan
  const [flExportModal, setFLExportModal] = useState(false);
  const [flExportData,  setFLExportData]  = useState([]);
  const [flExportSel,   setFLExportSel]   = useState(new Set());
  const [flExporting,   setFLExporting]   = useState(false);
  const [logFieldId, setLogFId] = useState(null);
  const [editField,  setEF]     = useState(null);
  const [editBin,    setEB]     = useState(null);
  const [editGrain,  setEG]     = useState(null);
  const [addGrain,   setAG]     = useState(false);
  const [editTruck,  setET]     = useState(null);
  const [addTruck,   setAT]     = useState(false);
  const [editLoad,   setEL]     = useState(null);
  const [showReport, setShowReport] = useState(false);

  const skipRef = useRef(false);
  const nextId  = useRef(Date.now());

  // ── Load ──────────────────────────────────────────────────────
  useEffect(()=>{
    if(!tenantId) return;
    dbRead(BASE,token).then(d=>{
      if(d){
        const fl=obj2arr(d.fields||{}).filter(Boolean);
        const bl=obj2arr(d.bins||{}).filter(Boolean);
        const gl=obj2arr(d.customGrains||{}).filter(Boolean);
        const tl=obj2arr(d.trucks||{}).filter(Boolean);
        if(fl.length){
          const farmFields = (!farmId||farmId==="default") ? fl.filter(f=>!f.farmId||f.farmId==="default") : fl.filter(f=>f.farmId===farmId);
          setFields(farmFields); setAFId(farmFields[0]?.id||null);
        }
        if(bl.length){ setBins(bl); setABId(bl[0].id); }
        if(gl.length)  setGrains(gl);
        if(tl.length) setTrucks(tl.filter(Boolean)); else setTrucks(DEFAULT_TRUCKS);
        asSaveCache(d);
      } else {
        setAFId(DEFAULT_FIELDS[0].id);
        setABId(DEFAULT_BINS[0].id);
      }
      setSyncStatus("live");
    }).catch(()=>{
      const cached = asLoadCache();
      if(cached){
        const fl=obj2arr(cached.fields||{}).filter(Boolean);
        const bl=obj2arr(cached.bins||{}).filter(Boolean);
        const gl=obj2arr(cached.customGrains||{}).filter(Boolean);
        const tl=obj2arr(cached.trucks||{}).filter(Boolean);
        if(fl.length){ const ff=(!farmId||farmId==="default")?fl.filter(f=>!f.farmId||f.farmId==="default"):fl.filter(f=>f.farmId===farmId); setFields(ff); setAFId(ff[0]?.id||null); }
        if(bl.length){ setBins(bl); setABId(bl[0].id); }
        if(gl.length) setGrains(gl);
        if(tl.length) setTrucks(tl.filter(Boolean));
        setSyncStatus("offline");
      } else {
        setSyncStatus("error");
      }
    }).finally(()=>setLoading(false));
  },[tenantId,token]);

  useEffect(()=>{
    if(loading||!tenantId) return;
    return dbListen(BASE,token,({data:d})=>{
      if(skipRef.current||!d) return;
      if(d.fields){
        const allF = obj2arr(d.fields).filter(Boolean);
        const farmFields = (!farmId||farmId==="default") ? allF.filter(f=>!f.farmId||f.farmId==="default") : allF.filter(f=>f.farmId===farmId);
        setFields(farmFields);
      }
      if(d.bins){
        const allB = obj2arr(d.bins).filter(Boolean);
        const farmBins = allB.filter(b => !b.farmId || b.farmId === farmId || b.farmId === "shared");
        setBins(farmBins);
      }
      if(d.customGrains) setGrains(obj2arr(d.customGrains).filter(Boolean));
      if(d.trucks)       setTrucks(obj2arr(d.trucks).filter(Boolean));
      asSaveCache(d);
    });
  },[loading,tenantId,token]);

  const QUEUE_KEY = `as_queue_${tenantId}`;
  const saveToQueue   = d => { try{ localStorage.setItem(QUEUE_KEY, JSON.stringify({data:d,savedAt:Date.now()})); }catch(e){} };
  const clearQueue    = ()  => { try{ localStorage.removeItem(QUEUE_KEY); }catch(e){} };
  const loadQueue     = ()  => { try{ const r=localStorage.getItem(QUEUE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };

  const AS_CACHE_KEY  = `as_cache_${tenantId}`;
  const asSaveCache   = d => { try{ localStorage.setItem(AS_CACHE_KEY, JSON.stringify({...d,_at:Date.now()})); }catch(e){} };
  const asLoadCache   = ()  => { try{ const r=localStorage.getItem(AS_CACHE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };

  // Merge remote + local queued loads (handles offline concurrent adds)
  const mergeWithRemote = (remote, localData) => {
    if(!remote?.fields) return localData;
    const remoteIds = new Set();
    obj2arr(remote.fields||{}).filter(Boolean).forEach(f=>(f.loads||[]).forEach(l=>remoteIds.add(l.id)));
    const localFields = obj2arr(localData.fields||{}).filter(Boolean);
    const merged = obj2arr(remote.fields||{}).filter(Boolean).map(rf=>{
      const lf = localFields.find(f=>f.id===rf.id);
      const extra = lf ? (lf.loads||[]).filter(l=>!remoteIds.has(l.id)) : [];
      return {...rf, loads:[...(rf.loads||[]),...extra].sort((a,b)=>(a.ts||0)-(b.ts||0))};
    });
    localFields.forEach(lf=>{ if(!merged.find(mf=>mf.id===lf.id)) merged.push(lf); });
    const allLoads = merged.flatMap(f=>f.loads||[]);
    const mergedBins = obj2arr(remote.bins||{}).filter(Boolean).map(rb=>({...rb, storedLbs:allLoads.filter(l=>l.binId===rb.id).reduce((s,l)=>s+l.net,0)}));
    return {...localData, fields:Object.fromEntries(merged.map(f=>[f.id,f])), bins:Object.fromEntries(mergedBins.map(b=>[b.id,b]))};
  };

  // ── Retry queued saves when back online ───────────────────────
  useEffect(()=>{
    const retry = async () => {
      const q = loadQueue();
      if(!q||!tenantId) return;
      setSyncStatus("pushing");
      try {
        const remote = await dbRead(BASE, token).catch(()=>null);
        const merged = remote ? mergeWithRemote(remote, q.data) : q.data;
        await dbSafeWrite(BASE, merged, token);
        if(merged.fields){
          const allF = obj2arr(merged.fields).filter(Boolean);
          setFields((!farmId||farmId==="default") ? allF.filter(f=>!f.farmId||f.farmId==="default") : allF.filter(f=>f.farmId===farmId));
        }
        if(merged.bins){
          const allB = obj2arr(merged.bins).filter(Boolean);
          setBins(allB.filter(b => !b.farmId || b.farmId === farmId || b.farmId === "shared"));
        }
        if(merged.customGrains) setGrains(obj2arr(merged.customGrains).filter(Boolean));
        if(merged.trucks)       setTrucks(obj2arr(merged.trucks).filter(Boolean));
        clearQueue();
        setSyncStatus("live");
      } catch(e) {
        setSyncStatus("queued");
      }
    };
    window.addEventListener("online", retry);
    // Do NOT call retry() on mount
    return ()=>window.removeEventListener("online", retry);
  },[tenantId,token]);

  const save = useCallback(async (nf,nb,ng,nt)=>{
    const payload = {
      fields:      Object.fromEntries((nf||fields).map(f=>[f.id,f])),
      bins:        Object.fromEntries((nb||bins).map(b=>[b.id,b])),
      customGrains:Object.fromEntries((ng||grains).map((g,i)=>[i,g])),
      trucks:      Object.fromEntries((nt||trucks).map((t,i)=>[i,t])),
    };
    // Always save locally first
    saveToQueue(payload);
    asSaveCache(payload); // keep the offline fallback snapshot current with local edits too
    skipRef.current = true;
    setSyncStatus("pushing");
    try {
      await dbSafeWrite(BASE, payload, token);
      clearQueue();
      setSyncStatus("live");
    } catch(e) {
      setSyncStatus("queued");
    }
    setTimeout(()=>{ skipRef.current=false; }, 1500);
  },[fields,bins,grains,trucks,token,BASE]);

  // ── Scale computed (null-safe) ────────────────────────────────
  const safeArr    = a => (Array.isArray(a)?a:[]).filter(Boolean);
  const safeFields = safeArr(fields);
  const safeBins   = safeArr(bins);
  const safeGrains = safeArr(grains);
  const safeTrucks = safeArr(trucks);
  const grain       = safeGrains[grainIdx] || FALLBACK_GRAIN;
  const rawLbs      = Math.min(99999,Math.max(0,parseInt(rawInput.replace(/^0+(?=\d)/,""))||0));
  const netLbs      = Math.max(0,rawLbs-tare);
  const canRecord   = netLbs >= 100;
  const activeField = safeFields.find(f=>f.id===activeFieldId) || safeFields[0];
  const activeBin   = safeBins.find(b=>b.id===activeBinId)     || safeBins[0];
  const activeTruck = safeTrucks.find(t=>t.id===truckColor)    || safeTrucks[0] || DEFAULT_TRUCKS[0];

  // ── Pull this year's planned/actual crop per field from AgriPlan, keyed by field name ──
  useEffect(()=>{
    if(!tenantId) return;
    const yr = new Date().getFullYear();
    dbRead(`tenants/${tenantId}/agriPlan/fields/${yr}`, token).then(d=>{
      const apArr = obj2arr(d||{}).filter(Boolean);
      const map = {};
      apArr.forEach(a=>{ if(a?.common && a?.crop) map[a.common.trim().toLowerCase()] = a.crop; });
      setApCrops(map);
    }).catch(()=>{});
  },[tenantId, token]);

  // ── Auto-select the commodity that matches the active field's AgriPlan crop ──
  useEffect(()=>{
    if(!activeField || !activeField.name) return;
    const crop = apCrops[activeField.name.trim().toLowerCase()];
    if(!crop) return;
    const idx = safeGrains.findIndex(g=>(g.name||"").toLowerCase()===crop.toLowerCase());
    if(idx>=0 && idx!==grainIdx) setGrainIdx(idx);
  },[activeFieldId, apCrops]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Numpad ────────────────────────────────────────────────────
  const onKey = k => {
    if(k==="CLR"||k==="C") { setRawInput("0"); return; }
    if(k==="⌫")  { setRawInput(p=>p.length>1?p.slice(0,-1):"0"); return; }
    setRawInput(p=>{ const n=p==="0"?String(k):p+k; return n.length>5?p:n; });
  };

  // ── Record load ───────────────────────────────────────────────
  const recordLoad = () => {
    if(!canRecord) return;
    const now = new Date();
    const load = {
      id:nextId.current++, net:netLbs, ts:now.getTime(),
      date:now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      timeOnly:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      time:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      grainName:grain.name, grainBushelLbs:grain.bushel_lbs,
      binId:activeBinId, truckId:truckColor, truckColor:activeTruck.hex, truckName:activeTruck.name, operator:operatorName,
    };
    const nf = safeFields.map(f=>f.id===activeFieldId?{...f,loads:[...(f.loads||[]),load]}:f);
    const nb = safeBins.map(b=>b.id===activeBinId?{...b,storedLbs:b.storedLbs+netLbs}:b);
    setFields(nf); setBins(nb); save(nf,nb,grains);
    setRawInput("0"); setTare(0);
  };

  // ── Edit / delete / split a recorded load ──────────────────────
  // (shared by the FIELDS-tab load rows and the LoadMo modal)
  const findLoadOwner = (loadId) => safeFields.find(f=>(f.loads||[]).some(l=>l.id===loadId));

  const updateLoad = (updatedLoad) => {
    const owner = findLoadOwner(updatedLoad.id);
    if(!owner) return;
    const oldLoad = owner.loads.find(l=>l.id===updatedLoad.id);
    const nb = safeBins.map(b=>{
      let s = b.storedLbs;
      if(b.id===oldLoad.binId) s = Math.max(0, s - oldLoad.net);
      if(b.id===updatedLoad.binId) s = s + updatedLoad.net;
      return {...b, storedLbs:s};
    });
    const nf = safeFields.map(f=>f.id===owner.id?{...f,loads:f.loads.map(l=>l.id===updatedLoad.id?updatedLoad:l)}:f);
    setFields(nf); setBins(nb); save(nf,nb,grains,trucks);
    setEL(null);
  };

  const deleteLoad = (load) => {
    const owner = findLoadOwner(load.id);
    if(!owner) return;
    const nf = safeFields.map(f=>f.id===owner.id?{...f,loads:f.loads.filter(l=>l.id!==load.id)}:f);
    const nb = safeBins.map(b=>b.id===load.binId?{...b,storedLbs:Math.max(0,b.storedLbs-load.net)}:b);
    setFields(nf); setBins(nb); save(nf,nb,grains,trucks);
    setEL(null);
  };

  const splitLoad = ({ load, splitA, splitB, binAId, binBId, labelBase }) => {
    const owner = findLoadOwner(load.id);
    if(!owner) return;
    const base = labelBase || owner.loads.findIndex(l=>l.id===load.id) + 1;
    const loadA = { ...load, net:splitA, binId:binAId, splitLabel:`${base}a` };
    const loadB = { ...load, id:nextId.current++, net:splitB, binId:binBId, splitLabel:`${base}b` };
    const nb = safeBins.map(b=>{
      let s = b.storedLbs;
      if(b.id===load.binId) s = Math.max(0, s - load.net);
      if(b.id===binAId) s = s + splitA;
      if(b.id===binBId) s = s + splitB;
      return {...b, storedLbs:s};
    });
    const nf = safeFields.map(f=>{
      if(f.id!==owner.id) return f;
      const newLoads = f.loads.map(l=>l.id===load.id?loadA:l);
      const idx = newLoads.findIndex(l=>l.id===loadA.id);
      newLoads.splice(idx+1, 0, loadB);
      return {...f, loads:newLoads};
    });
    setFields(nf); setBins(nb); save(nf,nb,grains,trucks);
    setEL(null);
  };

  const totalLoads = safeFields.reduce((s,f)=>s+(f.loads||[]).length,0);
  const syncLabel = {live:"● LIVE",pushing:"SAVING...",queued:"⚠ QUEUED",error:"ERROR",init:"INIT"}[syncStatus]||"";
  const syncColor = {live:"#4a5568",pushing:"#C07010",queued:"#dc2626",error:"#c03030",init:"#aaa"}[syncStatus]||"#aaa";
  const btnBase = {cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",borderRadius:"4px",fontWeight:"bold",transition:"all 0.15s",border:"1px solid #ccc4b8"};

  // ── Import fields from FieldLog ──────────────────────────────────
  const openFLImport = async () => {
    setFLLoading(true); setFLImportModal(true); setFLSelected(new Set());
    try {
      const flBase = (!farmId || farmId === "default")
        ? `tenants/${tenantId}/fieldlog`
        : `tenants/${tenantId}/farms/${farmId}/fieldlog`;
      const [fieldData, actData] = await Promise.all([
        dbRead(`${flBase}/fields`, token).catch(() => null),
        dbRead(`${flBase}/activities`, token).catch(() => null),
      ]);
      const flFields = obj2arr(fieldData || {}).filter(Boolean);
      const activities = obj2arr(actData || {}).filter(Boolean);
      // Only fields that have at least one seeding activity
      const seededIds = new Set(
        activities.filter(a => a.type === "seeding").map(a => a.fieldId)
      );
      const seededFields = flFields.filter(f => seededIds.has(f.id));
      // Exclude fields already in AgriScale by name
      const existingNames = new Set(fields.map(f => f.name.trim().toLowerCase()));
      const newOnly = seededFields.filter(f => !existingNames.has((f.name||"").trim().toLowerCase()));
      setFLFields(newOnly);
      setFLSelected(new Set(newOnly.map(f => f.id)));
    } catch(e) { setFLFields([]); }
    finally { setFLLoading(false); }
  };

  const importFLFields = async () => {
    const toImport = flFields.filter(f => flSelected.has(f.id));
    if(!toImport.length) { setFLImportModal(false); return; }

    // Pull AgriPlan fields for this tenant to get insurance/landlord/share data
    let apFields = [];
    let cropPrices = {};
    try {
      const yr = new Date().getFullYear();
      const [apData, cpData] = await Promise.all([
        dbRead(`tenants/${tenantId}/agriPlan/fields/${yr}`, token).catch(()=>null),
        dbRead(`tenants/${tenantId}/agriPlan/cropPrices`, token).catch(()=>null),
      ]);
      apFields = obj2arr(apData||{}).filter(Boolean);
      // cropPrices may be array or object
      const cpArr = Array.isArray(cpData) ? cpData : obj2arr(cpData||{});
      cpArr.forEach(p=>{ if(p?.crop) cropPrices[p.crop]={priceGuar:p.priceGuar||0,projPrice:p.projPrice||0}; });
    } catch(e) { console.warn("AgriScale: could not load AgriPlan data", e.message); }

    const norm = s => (s||"").trim().toLowerCase();

    const newFields = toImport.map(f => {
      // Match to AgriPlan field by name
      const ap = apFields.find(a => norm(a.common) === norm(f.name));
      // Get price election for the planned crop
      const cp = ap?.crop ? cropPrices[ap.crop] : null;

      return {
        id: genId(),
        name: f.name,
        acres: f.acres || ap?.acres || 0,
        farmId: farmId || "default",
        loads: [], costs: {},
        grainPrice: cp?.projPrice ? String(cp.projPrice) : "",
        // Pull from AgriPlan if available
        landlord:          ap?.landlord         || "",
        cropShare:         ap?.sharePercent!=null ? String(ap.sharePercent) : "",
        insType:           ap?.insuranceType     || "",
        insCoverageLevel:  ap?.coverageLevel!=null ? String(ap.coverageLevel) : "",
        insGuaranteedYield:ap?.aphYield!=null    ? String(ap.aphYield)        : "",
        insPriceElection:  cp?.priceGuar         ? String(cp.priceGuar)       : "",
        insInsuredAcres:   ap?.insuredAcres!=null ? String(ap.insuredAcres)   : "",
      };
    });

    const nf = [...fields, ...newFields];
    setFields(nf); save(nf, bins, grains, trucks);
    setFLImportModal(false);
  };

  // ── Import fields directly from AgriPlan (for tenants not using FieldLog) ──
  const openAPImport = async () => {
    setAPLoading(true); setAPImportModal(true); setAPSelected(new Set());
    try {
      const yr = new Date().getFullYear();
      const apData = await dbRead(`tenants/${tenantId}/agriPlan/fields/${yr}`, token).catch(() => null);
      const apAll = obj2arr(apData || {}).filter(Boolean);
      // Exclude fields already in AgriScale by name
      const existingNames = new Set(fields.map(f => f.name.trim().toLowerCase()));
      const newOnly = apAll.filter(a => a?.common && !existingNames.has(a.common.trim().toLowerCase()));
      setAPFields(newOnly);
      setAPSelected(new Set(newOnly.map(a => a.common)));
    } catch(e) { setAPFields([]); }
    finally { setAPLoading(false); }
  };

  const importAPFields = async () => {
    const toImport = apFields.filter(a => apSelected.has(a.common));
    if(!toImport.length) { setAPImportModal(false); return; }

    let cropPrices = {};
    try {
      const cpData = await dbRead(`tenants/${tenantId}/agriPlan/cropPrices`, token).catch(()=>null);
      const cpArr = Array.isArray(cpData) ? cpData : obj2arr(cpData||{});
      cpArr.forEach(p=>{ if(p?.crop) cropPrices[p.crop]={priceGuar:p.priceGuar||0,projPrice:p.projPrice||0}; });
    } catch(e) {}

    const newFields = toImport.map(ap => {
      const cp = ap.crop ? cropPrices[ap.crop] : null;
      return {
        id: genId(),
        name: ap.common,
        acres: ap.acres || 0,
        farmId: farmId || "default",
        loads: [], costs: {},
        grainPrice: cp?.projPrice ? String(cp.projPrice) : "",
        // Pull straight from AgriPlan
        landlord:          ap.landlord         || "",
        cropShare:         ap.sharePercent!=null ? String(ap.sharePercent) : "",
        insType:           ap.insuranceType     || "",
        insCoverageLevel:  ap.coverageLevel!=null ? String(ap.coverageLevel) : "",
        insGuaranteedYield:ap.aphYield!=null    ? String(ap.aphYield)        : "",
        insPriceElection:  cp?.priceGuar         ? String(cp.priceGuar)       : "",
        insInsuredAcres:   ap.insuredAcres!=null ? String(ap.insuredAcres)   : "",
      };
    });

    const nf = [...fields, ...newFields];
    setFields(nf); save(nf, bins, grains, trucks);
    setAPImportModal(false);
  };

  // ── Export harvest to FieldLog ────────────────────────────────────
  const openFLExport = async () => {
    setFLExporting(false); setFLExportModal(true);
    try {
      const flBase = (!farmId || farmId === "default")
        ? `tenants/${tenantId}/fieldlog`
        : `tenants/${tenantId}/farms/${farmId}/fieldlog`;
      const flFieldData = await dbRead(`${flBase}/fields`, token).catch(() => null);
      const flFieldList = obj2arr(flFieldData || {}).filter(Boolean);
      const flByName = {};
      flFieldList.forEach(f => { flByName[f.name.trim().toLowerCase()] = f; });

      // Build export rows — one per AgriScale field with loads
      const rows = safeFields.map(f => {
        const loads = (f.loads||[]).filter(Boolean);
        if (!loads.length) return null;
        const totalLbs = loads.reduce((s,l) => s + (parseFloat(l.lbs)||0), 0);
        const grain = safeGrains.find(g => g.name === (loads[0]?.grainName||f.loads?.[0]?.grainName)) || safeGrains[0];
        const lbsPerBu = parseFloat(grain?.lbsPerBu) || 60;
        const totalBu = totalLbs / lbsPerBu;
        const acres = parseFloat(f.acres) || 0;
        const yieldPerAc = acres > 0 ? (totalBu / acres).toFixed(1) : "";
        const lastDate = loads.map(l=>l.date).filter(Boolean).sort().pop() || new Date().toISOString().slice(0,10);
        const flMatch = flByName[f.name.trim().toLowerCase()];
        return {
          asFieldId: f.id,
          name: f.name,
          acres,
          totalLbs: Math.round(totalLbs),
          totalBu: Math.round(totalBu),
          yieldPerAc,
          lbsPerBu,
          grainName: loads[0]?.grainName || grain?.name || "Unknown",
          date: lastDate,
          flFieldId: flMatch?.id || null,
          flBase,
        };
      }).filter(Boolean);

      setFLExportData(rows);
      setFLExportSel(new Set(rows.filter(r => r.flFieldId).map(r => r.asFieldId)));
    } catch(e) { setFLExportData([]); }
  };

  const exportToFieldLog = async () => {
    setFLExporting(true);
    try {
      const toExport = flExportData.filter(r => flExportSel.has(r.asFieldId) && r.flFieldId);
      for (const r of toExport) {
        const actId = genId();
        const activity = {
          id: actId,
          fieldId: r.flFieldId,
          type: "harvest",
          date: r.date,
          data: {
            crop: r.grainName,
            yieldPerAc: r.yieldPerAc,
            totalBushels: String(r.totalBu),
            testWeight: String(r.lbsPerBu),
            acres: String(r.acres),
          },
          notes: `Exported from AgriScale — ${r.totalLbs.toLocaleString()} lbs`,
        };
        await dbWrite(`${r.flBase}/activities/${actId}`, activity, token);
        // Also push the harvested yield into AgriPlan's field history so it shows up
        // in that field's crop history / APH suggestions for this year.
        try {
          const hYr = new Date(r.date).getFullYear();
          await fetch(
            `https://agrilogix-1bd06-default-rtdb.firebaseio.com/tenants/${tenantId}/agriPlan/fieldHistory/${encodeURIComponent(r.name)}/${hYr}.json?auth=${token}`,
            { method: "PUT", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ crop: r.grainName, yield: r.yieldPerAc, acres: String(r.acres) }) }
          );
        } catch(_) {}
      }
      setFLExportModal(false);
      alert(`✅ ${toExport.length} harvest ${toExport.length===1?"activity":"activities"} added to FieldLog!`);
    } catch(e) {
      alert("Export failed: " + e.message);
    } finally { setFLExporting(false); }
  };

  const TABS = ["SCALE","BINS","FIELDS","COMM",...(perms.canReport?["REPORT"]:[])];
  if(loading) return <div style={{textAlign:"center",padding:"60px",fontFamily:"'IBM Plex Mono',monospace",color:"#6a7280"}}>LOADING AGRISCALE...</div>;

  return (
    <>
      <style>{CSS}</style>
      <div className="as-wrap" style={{minHeight:"calc(100vh - 50px)",background:"#f0eeea",backgroundImage:"radial-gradient(ellipse at 30% 20%, #e8f2dc 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #f5eed8 0%, transparent 60%)",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>
        <div style={{width:"100%",maxWidth:"520px"}}>

          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"14px"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"20px",fontWeight:700,color:"#4a5568",letterSpacing:"0.08em"}}>
              AGRI<span style={{color:"#4a7535"}}>SCALE</span>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",fontWeight:400,color:"#8a9a80",letterSpacing:"0.1em",marginTop:"2px"}}>{farmName || "Default Farm"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{color:"#4a5568",fontSize:"11px",letterSpacing:"0.08em"}}>{activeField?.name}</div>
              <div style={{color:"#4a7535",fontSize:"10px",letterSpacing:"0.06em"}}>→ {activeBin?.name}</div>
              <div style={{display:"flex",gap:"5px",justifyContent:"flex-end",alignItems:"center",marginTop:"3px",flexWrap:"wrap"}}>
                <span style={{fontSize:"8px",color:"#fff",background:"#5a6878",borderRadius:"3px",padding:"1px 6px",letterSpacing:"0.08em"}}>{operatorName}</span>
                <span style={{fontSize:"8px",fontFamily:"monospace",letterSpacing:"0.08em",color:syncColor,background:syncStatus==="live"?"#e8e2d8":syncStatus==="queued"?"#fff0f0":"#f0f0f0",border:`1px solid ${syncStatus==="live"?"#b0a08a":syncStatus==="queued"?"#e0c0c0":"#ddd"}`,borderRadius:"3px",padding:"1px 6px"}}>{syncLabel}</span>
                <span style={{fontSize:"8px",color:"#9a8a72",background:"#ede9e4",border:"1px solid #c0b8ac",borderRadius:"3px",padding:"1px 6px",letterSpacing:"0.08em",textTransform:"uppercase"}}>{role}</span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:"4px",marginBottom:"12px",background:"#e8e2d8",borderRadius:"6px",padding:"3px"}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{...btnBase,flex:1,padding:"8px 4px",fontSize:"10px",letterSpacing:"0.12em",background:tab===t?"#fafaf6":"transparent",color:tab===t?"#4a5568":"#9a8a72",border:tab===t?"1px solid #ccc4b8":"1px solid transparent",boxShadow:tab===t?"0 1px 3px rgba(0,0,0,.1)":"none"}}>
                {t}
              </button>
            ))}
          </div>

          {/* ── SCALE TAB ── */}
          {tab==="SCALE"&&(<>
            {/* Active bin gauge */}
            {activeBin&&<div style={{marginBottom:"8px"}}><BinGauge bin={activeBin} grains={grains}/></div>}

            {/* Bin selector */}
            <div style={{marginTop:"8px",background:"#f5f3ef",border:"1px solid #ccc4b8",borderRadius:"4px",padding:"8px",marginBottom:"8px"}}>
              <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>DESTINATION BIN</div>
              <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                {safeBins.map(b=>{
                  const g=safeGrains.find(x=>x&&x.name===b.grainName)||FALLBACK_GRAIN;
                  const pct=b.capacityBu>0?Math.min(100,b.storedLbs/(g.bushel_lbs||60)/b.capacityBu*100):0;
                  const fc=pct>=95?"#e74c3c":pct>=80?"#c47d0a":"#4a5568";
                  const isActive=b.id===activeBinId;
                  return(<button key={b.id} onClick={()=>setABId(b.id)} style={{...btnBase,padding:"5px 10px",fontSize:"10px",background:isActive?"#e8e2d8":"transparent",border:isActive?`1px solid ${fc}`:"1px solid #ccc4b8",color:isActive?fc:"#6a7280",boxShadow:isActive?`0 0 8px ${fc}40`:"none"}}>
                    {b.name} <span style={{fontSize:"8px",marginLeft:"3px"}}>{pct.toFixed(0)}%</span>
                  </button>);
                })}
              </div>
            </div>

            {/* Status bar */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 12px",background:"#ffffff",border:"1px solid #ddd8d0",borderRadius:"4px",fontSize:"10px",letterSpacing:"0.12em",marginBottom:"8px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#c0b8ac"}}/>
                <span style={{color:"#6a7280"}}>STANDBY</span>
              </div>
              <div style={{color:"#5a6878"}}>{grain.name} · {grain.bushel_lbs} LBS/BU</div>
            </div>

            {/* Display unit + grain + field + truck */}
            <div style={{display:"flex",flexDirection:"column",gap:"7px",marginBottom:"8px"}}>
              {/* Unit */}
              <div style={{background:"#f5f3ef",border:"1px solid #ccc4b8",borderRadius:"4px",padding:"8px"}}>
                <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>DISPLAY UNIT</div>
                <div style={{display:"flex",gap:"6px"}}>
                  {UNITS.map(u=>(
                    <button key={u} onClick={()=>setUnit(u)} style={{...btnBase,flex:1,padding:"5px 0",fontSize:"10px",background:unit===u?"#e8e2d8":"transparent",border:unit===u?"1px solid #9a8a72":"1px solid #ccc4b8",color:unit===u?"#4a5568":"#6a7280",boxShadow:unit===u?"inset 0 1px 3px rgba(0,0,0,.1)":"none"}}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              {/* Grain */}
              <div style={{background:"#f5f3ef",border:"1px solid #ccc4b8",borderRadius:"4px",padding:"8px"}}>
                <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>COMMODITY</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {safeGrains.map((g,i)=>(
                    <button key={i} onClick={()=>setGrainIdx(i)} style={{...btnBase,padding:"5px 10px",fontSize:"10px",background:grainIdx===i?"#e8e2d8":"transparent",border:grainIdx===i?`1px solid ${g.color||"#9a8a72"}`:"1px solid #ccc4b8",color:grainIdx===i?"#4a5568":"#6a7280"}}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Field */}
              <div style={{background:"#f5f3ef",border:"1px solid #ccc4b8",borderRadius:"4px",padding:"8px"}}>
                <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>FIELD</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {safeFields.map(f=>{
                    const isActive=f.id===activeFieldId;
                    return(<button key={f.id} onClick={()=>setAFId(f.id)} style={{...btnBase,padding:"5px 10px",fontSize:"10px",background:isActive?"#e8e2d8":"transparent",border:isActive?"1px solid #6a8a60":"1px solid #ccc4b8",color:isActive?"#4a6a40":"#6a7280"}}>
                      {f.name} <span style={{fontSize:"8px",color:"#8a9a80",marginLeft:"3px"}}>{(f.loads||[]).length}</span>
                    </button>);
                  })}
                </div>
              </div>
              {/* Truck */}
              <div style={{background:"#f5f3ef",border:"1px solid #ccc4b8",borderRadius:"4px",padding:"8px"}}>
                <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>TRUCK</div>
                <div style={{display:"flex",gap:"5px",flexWrap:"wrap"}}>
                  {safeTrucks.map(t=>(
                    <button key={t.id} onClick={()=>setTruckColor(t.id)} style={{...btnBase,padding:"4px 8px",fontSize:"9px",background:t.hex,color:t.text,border:truckColor===t.id?`2px solid #4a5568`:`1px solid ${t.border||"#aaa"}`,boxShadow:truckColor===t.id?"0 0 6px rgba(74,85,104,.4)":"none"}}>
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weight display */}
            <div style={{background:"#f5f7f2",border:"2px solid #8ab870",borderRadius:"8px",padding:"20px 28px 16px",boxShadow:"inset 0 1px 4px rgba(0,0,0,.04)",marginBottom:"10px",position:"relative",overflow:"hidden"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:"9px",color:"#6a8060",letterSpacing:"0.2em",marginBottom:"4px"}}>NET WEIGHT</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"54px",fontWeight:700,color:"#1a2a1a",letterSpacing:"0.05em",lineHeight:1,WebkitFontSmoothing:"antialiased",MozOsxFontSmoothing:"grayscale"}}>
                  {fmtWt(netLbs,unit,grain.bushel_lbs).value}
                </div>
                <div style={{fontSize:"16px",color:"#4a6040",marginLeft:"8px",letterSpacing:"0.15em",fontWeight:700,fontFamily:"'Barlow',sans-serif"}}>{fmtWt(netLbs,unit,grain.bushel_lbs).label}</div>
              </div>
              <div style={{display:"flex",gap:"32px",marginTop:"14px",paddingTop:"10px",borderTop:"1px solid #ccc4b8",justifyContent:"center"}}>
                {[{label:"GROSS",lbs:rawLbs},{label:"TARE",lbs:tare}].map(({label,lbs})=>(
                  <div key={label} style={{fontFamily:"monospace",textAlign:"center"}}>
                    <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em"}}>{label}</div>
                    <div style={{fontSize:"18px",color:"#1a2a1a",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,WebkitFontSmoothing:"antialiased"}}>{fmtWt(lbs,unit,grain.bushel_lbs).value} <span style={{fontSize:"10px",color:"#5a6878"}}>{fmtWt(lbs,unit,grain.bushel_lbs).label}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tare button */}
            <button onClick={()=>setTare(rawLbs)} style={{...btnBase,width:"100%",padding:"8px",fontSize:"10px",letterSpacing:"0.12em",background:"#f5f3ef",color:"#6a7280",boxShadow:"0 2px 0 #c8ccc0",marginBottom:"6px"}}>
              SET TARE ({fmtWt(rawLbs,unit,grain.bushel_lbs).value} {fmtWt(rawLbs,unit,grain.bushel_lbs).label})
            </button>

            {/* Numpad */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px",marginBottom:"8px"}}>
              {["7","8","9","4","5","6","1","2","3","⌫","0","CLR"].map(k=>(
                <button key={k} className="as-numkey" onClick={()=>onKey(k)} style={{...btnBase,padding:"14px 0",fontSize:"16px",background:k==="CLR"?"#fff0f0":k==="⌫"?"#fef8e8":"#fafaf6",color:k==="CLR"?"#e74c3c":k==="⌫"?"#c47d0a":"#4a5568",border:k==="CLR"?"1px solid #e0c0c0":k==="⌫"?"1px solid #e8d8a8":"1px solid #c0b8ac",boxShadow:"0 2px 0 #c8ccc0"}}>
                  {k}
                </button>
              ))}
            </div>

            {/* Record button */}
            <button className="as-record-btn" onClick={recordLoad} disabled={!canRecord} style={{width:"100%",padding:"16px",fontFamily:"'Orbitron',monospace",fontSize:"14px",fontWeight:700,letterSpacing:"0.15em",background:canRecord?"#4a7535":"#c0b8ac",color:canRecord?"#fff":"#8a8278",border:"none",borderRadius:"6px",cursor:canRecord?"pointer":"not-allowed",transition:"all .15s",boxShadow:canRecord?"0 3px 0 #2d5520, 0 0 20px rgba(74,117,53,.3)":"0 2px 0 #a0a898",animation:canRecord?"as-pulse 2s infinite":"none"}}>
              ✓ RECORD LOAD
            </button>

            {/* Recent loads for active field */}
            {(activeField?.loads||[]).length > 0 && (
              <div style={{marginTop:"10px",background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"8px"}}>
                <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"5px"}}>RECENT LOADS — {activeField.name}</div>
                <div style={{maxHeight:"320px",overflowY:"auto"}}>
                  {[...(activeField?.loads||[])].reverse().slice(0,10).map(l=>{
                    const f=fmtWt(l.net,unit,l.grainBushelLbs||60);
                    const bu=(l.net/(l.grainBushelLbs||60)).toFixed(1);
                    const tHex=l.truckColor||"#f0f0f0";
                    const bn=bins.find(b=>b.id===l.binId);
                    return(<div key={l.id} style={{borderBottom:"1px solid #ddd8d0",padding:"8px 4px",color:"#4a5568"}}>
                      <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
                        <div style={{width:"10px",height:"10px",borderRadius:"50%",background:tHex,border:"1px solid rgba(0,0,0,.15)",flexShrink:0}}/>
                        <span style={{flex:1,fontSize:"20px",fontWeight:700,color:"#c47d0a"}}>{bu} <span style={{fontSize:"12px",color:"#8a6a40"}}>BU</span></span>
                        <span style={{fontSize:"13px",color:"#4a5568"}}>{f.value} {f.label}</span>
                      </div>
                      <div style={{display:"flex",gap:"8px",alignItems:"center",marginTop:"4px",fontSize:"10px"}}>
                        <span style={{color:"#6a7280"}}>{bn?.name||"?"}</span>
                        {l.splitLabel&&<span style={{color:"#8a6a40"}}>#{l.splitLabel}</span>}
                        <span style={{color:"#9a8a72"}}>{l.date} {l.timeOnly}</span>
                        <span style={{marginLeft:"auto",display:"flex",gap:"4px"}}>
                          <button onClick={()=>setEL({load:l,fieldId:activeField.id})} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#ede9e4",color:"#4a5568",border:"1px solid #ccc4b8"}}>EDIT</button>
                          <button onClick={()=>{if(confirm("Delete this load?"))deleteLoad(l);}} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#fff0f0",color:"#c03030",border:"1px solid #e0c0c0"}}>✕</button>
                        </span>
                      </div>
                    </div>);
                  })}
                </div>
                <div style={{marginTop:"5px",fontSize:"9px",color:"#4a7535",letterSpacing:"0.08em"}}>
                  TOTAL: {fmtWt((activeField?.loads||[]).reduce((s,l)=>s+l.net,0),unit,grain.bushel_lbs).value} {fmtWt((activeField?.loads||[]).reduce((s,l)=>s+l.net,0),unit,grain.bushel_lbs).label}
                </div>
              </div>
            )}
          </>)}

          {/* ── BINS TAB ── */}
          {tab==="BINS"&&(<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>BIN STORAGE</div>
              {perms.canEditBins&&<button onClick={()=>{const nb=[...bins,{id:Date.now(),name:`BIN ${bins.length+1}`,farmId:farmId||"default",capacityBu:50000,storedLbs:0,grainName:grains[0]?.name||"WHEAT"}];setBins(nb);save(fields,nb,grains,trucks);}} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD BIN</button>}
            </div>
            {safeBins.map(b=>(
              <div key={b.id} style={{marginBottom:"10px"}}>
                <BinGauge bin={b} grains={grains}/>
                {perms.canEditBins&&<button onClick={()=>setEB(b)} style={{...btnBase,width:"100%",padding:"5px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#6a7280",boxShadow:"0 1px 0 #c8ccc0",marginTop:"4px"}}>EDIT {b.name}</button>}              </div>
            ))}
          </>)}

          {/* ── FIELDS TAB ── */}
          {tab==="FIELDS"&&(<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",gap:"6px",flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>FIELDS</div>
              <div style={{display:"flex",gap:"6px"}}>
                {perms.canEditFields&&<button onClick={openFLImport} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#e8f0e4",color:"#4a7535",border:"1px solid #b0c8a0",boxShadow:"0 2px 0 #90a880"}}>↓ FROM FIELDLOG</button>}
                {perms.canEditFields&&<button onClick={openAPImport} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f0ede4",color:"#7a5a3a",border:"1px solid #c8b090",boxShadow:"0 2px 0 #a89070"}}>↓ FROM AGRIPLAN</button>}
                {perms.canEditFields&&<button onClick={()=>{const nf=[...fields,{id:Date.now(),name:`FIELD ${safeFields.length+1}`,farmId:farmId||"default",loads:[],acres:0,costs:{},grainPrice:"",landlord:"",cropShare:"",insCoverageLevel:"",insGuaranteedYield:"",insPriceElection:"",insType:"",insInsuredAcres:""}];setFields(nf);save(nf,bins,grains,trucks);}} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD FIELD</button>}
              </div>
            </div>
            {safeFields.map(f=>{
              const totalBu=(f.loads||[]).reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
              return(<div key={f.id} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"6px",padding:"10px 12px",marginBottom:"8px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"8px"}}>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.08em",marginBottom:"4px"}}>{f.name}</div>
                    <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.08em",lineHeight:1.8}}>
                      {f.acres?<div>ACRES: {f.acres}</div>:null}
                      <div>LOADS: {(f.loads||[]).length} · TOTAL: {totalBu.toFixed(0)} BU</div>
                      {f.grainPrice&&perms.canViewCosts&&<div style={{color:"#4a7535"}}>REVENUE: ${(totalBu*parseFloat(f.grainPrice||0)).toFixed(0)}</div>}
                      {f.landlord&&perms.canViewCropShare&&<div>LANDLORD: {f.landlord} {f.cropShare?`· ${f.cropShare}%`:""}</div>}
                      {perms.canViewInsurance&&f.insType&&<div style={{color:"#5a6a90"}}>INS: {f.insType} {f.insCoverageLevel?`· ${f.insCoverageLevel}%`:""} {f.insGuaranteedYield?`· ${f.insGuaranteedYield} BU/AC GUAR.`:""}</div>}
                    </div>
                  </div>
                  {perms.canEditFields&&(
                    <div style={{display:"flex",gap:"4px",flexShrink:0}}>
                      <button onClick={()=>setEF(f)} style={{...btnBase,padding:"4px 8px",fontSize:"9px",background:"#ede9e4",color:"#4a5568",boxShadow:"0 1px 0 #c8ccc0",letterSpacing:"0.08em"}}>EDIT</button>
                      {safeFields.length>1&&<button onClick={()=>{if(!confirm("Delete?"))return;const nf=fields.filter(ff=>ff.id!==f.id);setFields(nf);save(nf,bins,grains,trucks);}} style={{...btnBase,padding:"4px 8px",fontSize:"9px",background:"#fff0f0",color:"#c03030",border:"1px solid #e0c0c0"}}>✕</button>}
                    </div>
                  )}
                </div>
                {/* Mini load log */}
                {(f.loads||[]).length>0&&(
                  <div style={{marginTop:"8px",borderTop:"1px solid #ddd8d0",paddingTop:"6px",maxHeight:"120px",overflowY:"auto"}}>
                    {[...(f.loads||[])].reverse().map(l=>{
                      const bu=(l.net/(l.grainBushelLbs||60)).toFixed(1);
                      const tHex=l.truckColor||"#f0f0f0";
                      const bn=bins.find(b=>b.id===l.binId);
                      return(<div key={l.id} style={{display:"flex",gap:"6px",alignItems:"center",fontSize:"9px",color:"#6a7280",padding:"2px 0",borderBottom:"1px solid #e8e4dc"}}>
                        <div style={{width:"7px",height:"7px",borderRadius:"50%",background:tHex,border:"1px solid rgba(0,0,0,.15)",flexShrink:0}}/>
                        <span style={{color:"#4a5568",fontWeight:"bold"}}>{bu} BU {l.splitLabel?`#${l.splitLabel}`:""}</span>
                        <span>{l.grainName}</span>
                        <span>{bn?.name||"?"}</span>
                        <span style={{marginLeft:"auto"}}>{l.date} {l.timeOnly}</span>
                      </div>);
                    })}
                  </div>
                )}
              </div>);
            })}
          </>)}

          {/* ── COMM TAB ── */}
          {tab==="COMM"&&(<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>COMMODITIES</div>
              {perms.canEditComm&&<button onClick={()=>setAG(true)} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD</button>}
            </div>
            {safeGrains.map((g,i)=>(
              <div key={i} style={{background:"#f5f3ef",border:`1px solid ${g.color||"#ccc4b8"}`,borderLeft:`4px solid ${g.color||"#9a8a72"}`,borderRadius:"4px",padding:"8px 12px",marginBottom:"6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.08em"}}>{g.name}</div>
                  <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.08em",marginTop:"2px"}}>{g.bushel_lbs} LBS/BU</div>
                </div>
                {perms.canEditComm&&<div style={{display:"flex",gap:"4px"}}>
                  <button onClick={()=>setEG({...g,idx:i})} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#ede9e4",color:"#4a5568",boxShadow:"0 1px 0 #c8ccc0",letterSpacing:"0.08em"}}>EDIT</button>
                  {grains.length>1&&<button onClick={()=>{const ng=grains.filter((_,ii)=>ii!==i);setGrains(ng);if(grainIdx>=ng.length)setGrainIdx(0);save(fields,bins,ng,trucks);}} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#fff0f0",color:"#c03030",border:"1px solid #e0c0c0"}}>✕</button>}
                </div>}
              </div>
            ))}

            {/* Trucks */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px",marginTop:"20px"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>TRUCKS</div>
              {perms.canEditComm&&<button onClick={()=>setAT(true)} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD</button>}
            </div>
            {safeTrucks.map((t,i)=>(
              <div key={t.id||i} style={{background:"#f5f3ef",borderLeft:`4px solid ${t.hex}`,border:`1px solid ${t.border||"#ccc4b8"}`,borderRadius:"4px",padding:"8px 12px",marginBottom:"6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"24px",height:"24px",borderRadius:"4px",background:t.hex,border:`1px solid ${t.border||"#aaa"}`,flexShrink:0}}/>
                  <div>
                    <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.08em"}}>{t.name}</div>
                    <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.08em",marginTop:"1px"}}>{t.hex}</div>
                  </div>
                </div>
                {perms.canEditComm&&<div style={{display:"flex",gap:"4px"}}>
                  <button onClick={()=>setET({...t,idx:i})} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#ede9e4",color:"#4a5568",boxShadow:"0 1px 0 #c8ccc0",letterSpacing:"0.08em"}}>EDIT</button>
                  {trucks.length>1&&<button onClick={()=>{const nt=trucks.filter((_,ii)=>ii!==i);setTrucks(nt);save(fields,bins,grains,nt);}} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#fff0f0",color:"#c03030",border:"1px solid #e0c0c0"}}>✕</button>}
                </div>}
              </div>
            ))}
          </>)}

          {/* ── REPORT TAB ── */}
          {tab==="REPORT"&&perms.canReport&&(<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",gap:"6px"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>HARVEST REPORT</div>
              <button onClick={openFLExport} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#e8f0e4",color:"#4a7535",border:"1px solid #b0c8a0",boxShadow:"0 2px 0 #90a880"}}>↑ EXPORT TO FIELDLOG</button>
              <button onClick={()=>setShowReport(true)} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f0ede4",color:"#7a5a3a",border:"1px solid #c8b090",boxShadow:"0 2px 0 #a89070"}}>🖨 PRINT REPORT</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              {[
                ["TOTAL LOADS",totalLoads],
                ["TOTAL FIELDS",safeFields.length],
                ["TOTAL BUSHELS",safeFields.reduce((s,f)=>s+(f.loads||[]).reduce((ss,l)=>ss+(l.net/(l.grainBushelLbs||60)),0),0).toFixed(0)],
                ["TOTAL TONS",(safeFields.reduce((s,f)=>s+(f.loads||[]).reduce((ss,l)=>ss+l.net,0),0)/2000).toFixed(1)],
              ].map(([l,v])=>(
                <div key={l} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"24px",color:"#4a7535"}}>{v}</div>
                  <div style={{fontSize:"8px",color:"#6a7280",letterSpacing:"0.15em",marginTop:"2px"}}>{l}</div>
                </div>
              ))}
            </div>
            {safeFields.map(f=>{
              const totalBu=(f.loads||[]).reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
              if(!(f.loads||[]).length) return null;
              return(<div key={f.id} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"8px"}}>
                <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a7535",letterSpacing:"0.08em",marginBottom:"6px"}}>{f.name}</div>
                <div style={{fontSize:"9px",color:"#4a5568",letterSpacing:"0.08em",lineHeight:1.8}}>
                  <div>LOADS: {(f.loads||[]).length}</div>
                  <div>BUSHELS: {totalBu.toFixed(0)} BU</div>
                  <div>TONS: {((f.loads||[]).reduce((s,l)=>s+l.net,0)/2000).toFixed(1)}</div>
                  {f.acres>0&&<div>YIELD: {(totalBu/f.acres).toFixed(1)} BU/AC</div>}
                  {f.grainPrice&&perms.canViewCosts&&<div style={{color:"#4a7535"}}>REVENUE: ${(totalBu*parseFloat(f.grainPrice||0)).toFixed(0)}</div>}
                </div>
              </div>);
            })}
          </>)}

        </div>
      </div>

      {/* ── Modals ── */}
      {editBin&&<BinMo bin={editBin} grains={grains} onSave={f=>{const nb=safeBins.map(b=>b.id===editBin.id?{...editBin,...f,capacityBu:Number(f.capacityBu),storedLbs:Number(f.storedLbs)}:b);setBins(nb);save(fields,nb,grains,trucks);setEB(null);}} onDelete={()=>{if(bins.length<2)return alert("Need at least one bin.");const nb=bins.filter(b=>b.id!==editBin.id);setBins(nb);save(fields,nb,grains,trucks);setEB(null);}} onClose={()=>setEB(null)} canDelete={bins.length>1}/>}
      {editField&&<FieldMo field={editField} perms={perms} onSave={f=>{const nf=safeFields.map(ff=>ff.id===editField.id?{...editField,...f}:ff);setFields(nf);save(nf,bins,grains,trucks);setEF(null);}} onClose={()=>setEF(null)}/>}

      {/* ── FieldLog Export Modal ── */}
      {flExportModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#1a2010",border:"1px solid #4a7535",borderRadius:"10px",padding:"24px",width:"100%",maxWidth:"480px",maxHeight:"85vh",display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"14px",color:"#b0c8a0",letterSpacing:"0.12em"}}>EXPORT HARVEST TO FIELDLOG</div>
            {flExportData.length===0&&(
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#6a8060",textAlign:"center",padding:"20px"}}>NO FIELDS WITH LOADS TO EXPORT</div>
            )}
            {flExportData.length>0&&(<>
              <div style={{fontSize:"10px",color:"#6a8060",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.08em",lineHeight:1.6}}>
                SELECT FIELDS TO WRITE AS HARVEST ACTIVITIES IN FIELDLOG.
                FIELDS WITHOUT A NAME MATCH IN FIELDLOG ARE GREYED OUT.
              </div>
              <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                {flExportData.map(r=>{
                  const sel = flExportSel.has(r.asFieldId);
                  const canSel = !!r.flFieldId;
                  return(
                    <label key={r.asFieldId} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"10px 12px",borderRadius:"5px",cursor:canSel?"pointer":"not-allowed",background:sel?"rgba(74,117,53,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${sel?"#4a7535":canSel?"rgba(255,255,255,0.08)":"rgba(255,100,100,0.15)"}`,opacity:canSel?1:0.5,transition:"all .1s"}}>
                      <input type="checkbox" checked={sel&&canSel} disabled={!canSel} onChange={()=>{const n=new Set(flExportSel);sel?n.delete(r.asFieldId):n.add(r.asFieldId);setFLExportSel(n);}} style={{accentColor:"#4a7535",width:"14px",height:"14px",flexShrink:0,marginTop:"2px"}}/>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#d0e4c0",letterSpacing:"0.06em"}}>{r.name}</div>
                        <div style={{display:"flex",gap:"12px",marginTop:"5px",flexWrap:"wrap"}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8ab090"}}>{r.grainName}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8ab090"}}>{r.totalBu.toLocaleString()} BU</span>
                          {r.yieldPerAc&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8ab090"}}>{r.yieldPerAc} BU/AC</span>}
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8ab090"}}>{r.totalLbs.toLocaleString()} LBS</span>
                        </div>
                        {!canSel&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#c06060",marginTop:"4px"}}>⚠ NO MATCHING FIELD IN FIELDLOG</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
              <button onClick={exportToFieldLog} disabled={flExportSel.size===0||flExporting}
                style={{...btnBase,padding:"10px",fontSize:"10px",letterSpacing:"0.12em",background:flExportSel.size>0?"#4a7535":"#2a3020",color:flExportSel.size>0?"#f0eeea":"#4a5548",boxShadow:flExportSel.size>0?"0 2px 0 #2a5020":"none",cursor:flExportSel.size>0?"pointer":"not-allowed"}}>
                {flExporting?"WRITING TO FIELDLOG...":`EXPORT ${flExportSel.size} FIELD${flExportSel.size!==1?"S":""} TO FIELDLOG`}
              </button>
            </>)}
            <button onClick={()=>setFLExportModal(false)} style={{...btnBase,padding:"8px",fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.04)",color:"#6a8060"}}>CANCEL</button>
          </div>
        </div>
      )}
      {flImportModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#1a2010",border:"1px solid #4a7535",borderRadius:"10px",padding:"24px",width:"100%",maxWidth:"420px",maxHeight:"80vh",display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"14px",color:"#b0c8a0",letterSpacing:"0.12em"}}>IMPORT FROM FIELDLOG</div>
            {flLoading&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#6a8060",textAlign:"center",padding:"20px"}}>READING FIELDLOG...</div>}
            {!flLoading&&flFields.length===0&&(
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#6a8060",textAlign:"center",padding:"20px",lineHeight:1.8}}>
                {fields.length>0
                  ? "ALL SEEDED FIELDS ALREADY IN AGRISCALE"
                  : "NO SEEDED FIELDS FOUND IN FIELDLOG\nLOG A SEEDING ACTIVITY FIRST"}
              </div>
            )}
            {!flLoading&&flFields.length>0&&(<>
              <div style={{fontSize:"10px",color:"#6a8060",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.08em"}}>
                SELECT FIELDS TO IMPORT ({flSelected.size} OF {flFields.length} SELECTED)
              </div>
              <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                {flFields.map(f=>{
                  const sel = flSelected.has(f.id);
                  return(
                    <label key={f.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"5px",cursor:"pointer",background:sel?"rgba(74,117,53,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${sel?"#4a7535":"rgba(255,255,255,0.08)"}`,transition:"all .1s"}}>
                      <input type="checkbox" checked={sel} onChange={()=>{const n=new Set(flSelected);sel?n.delete(f.id):n.add(f.id);setFLSelected(n);}} style={{accentColor:"#4a7535",width:"14px",height:"14px",flexShrink:0}}/>
                      <div>
                        <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#d0e4c0",letterSpacing:"0.06em"}}>{f.name}</div>
                        {f.acres&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#6a8060",marginTop:"2px"}}>{f.acres} ACRES</div>}
                      </div>
                    </label>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:"8px",paddingTop:"4px"}}>
                <button onClick={()=>setFLSelected(new Set(flFields.map(f=>f.id)))} style={{...btnBase,flex:1,fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.06)",color:"#8a9880"}}>SELECT ALL</button>
                <button onClick={()=>setFLSelected(new Set())} style={{...btnBase,flex:1,fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.06)",color:"#8a9880"}}>CLEAR</button>
              </div>
              <button onClick={importFLFields} disabled={flSelected.size===0} style={{...btnBase,padding:"10px",fontSize:"10px",letterSpacing:"0.12em",background:flSelected.size>0?"#4a7535":"#2a3020",color:flSelected.size>0?"#f0eeea":"#4a5548",boxShadow:flSelected.size>0?"0 2px 0 #2a5020":"none",cursor:flSelected.size>0?"pointer":"not-allowed"}}>
                IMPORT {flSelected.size>0?flSelected.size:""} FIELD{flSelected.size!==1?"S":""}
              </button>
            </>)}
            <button onClick={()=>setFLImportModal(false)} style={{...btnBase,padding:"8px",fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.04)",color:"#6a8060"}}>CANCEL</button>
          </div>
        </div>
      )}
      {apImportModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#1a2010",border:"1px solid #7a5a3a",borderRadius:"10px",padding:"24px",width:"100%",maxWidth:"420px",maxHeight:"80vh",display:"flex",flexDirection:"column",gap:"12px"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"14px",color:"#d0b890",letterSpacing:"0.12em"}}>IMPORT FROM AGRIPLAN</div>
            {apLoading&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#8a7860",textAlign:"center",padding:"20px"}}>READING AGRIPLAN...</div>}
            {!apLoading&&apFields.length===0&&(
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#8a7860",textAlign:"center",padding:"20px",lineHeight:1.8}}>
                {fields.length>0
                  ? "ALL AGRIPLAN FIELDS ALREADY IN AGRISCALE"
                  : "NO FIELDS FOUND IN AGRIPLAN FOR THIS YEAR"}
              </div>
            )}
            {!apLoading&&apFields.length>0&&(<>
              <div style={{fontSize:"10px",color:"#8a7860",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.08em"}}>
                SELECT FIELDS TO IMPORT ({apSelected.size} OF {apFields.length} SELECTED)
              </div>
              <div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
                {apFields.map(a=>{
                  const sel = apSelected.has(a.common);
                  return(
                    <label key={a.common} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"5px",cursor:"pointer",background:sel?"rgba(122,90,58,0.18)":"rgba(255,255,255,0.04)",border:`1px solid ${sel?"#7a5a3a":"rgba(255,255,255,0.08)"}`,transition:"all .1s"}}>
                      <input type="checkbox" checked={sel} onChange={()=>{const n=new Set(apSelected);sel?n.delete(a.common):n.add(a.common);setAPSelected(n);}} style={{accentColor:"#7a5a3a",width:"14px",height:"14px",flexShrink:0}}/>
                      <div>
                        <div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#e4d0c0",letterSpacing:"0.06em"}}>{a.common}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8a7860",marginTop:"2px"}}>{a.acres?`${a.acres} ACRES`:""}{a.acres&&a.crop?" · ":""}{a.crop||""}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:"8px",paddingTop:"4px"}}>
                <button onClick={()=>setAPSelected(new Set(apFields.map(a=>a.common)))} style={{...btnBase,flex:1,fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.06)",color:"#a89880"}}>SELECT ALL</button>
                <button onClick={()=>setAPSelected(new Set())} style={{...btnBase,flex:1,fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.06)",color:"#a89880"}}>CLEAR</button>
              </div>
              <button onClick={importAPFields} disabled={apSelected.size===0} style={{...btnBase,padding:"10px",fontSize:"10px",letterSpacing:"0.12em",background:apSelected.size>0?"#7a5a3a":"#302820",color:apSelected.size>0?"#f0eeea":"#554838",boxShadow:apSelected.size>0?"0 2px 0 #503a20":"none",cursor:apSelected.size>0?"pointer":"not-allowed"}}>
                IMPORT {apSelected.size>0?apSelected.size:""} FIELD{apSelected.size!==1?"S":""}
              </button>
            </>)}
            <button onClick={()=>setAPImportModal(false)} style={{...btnBase,padding:"8px",fontSize:"9px",letterSpacing:"0.1em",background:"rgba(255,255,255,0.04)",color:"#8a7860"}}>CANCEL</button>
          </div>
        </div>
      )}
      {(addGrain||editGrain)&&<GrainMo grain={editGrain} onSave={f=>{let ng;if(editGrain){ng=safeGrains.map((g,i)=>i===editGrain.idx?{...g,name:f.name.trim().toUpperCase(),bushel_lbs:parseInt(f.bushel_lbs)||60}:g);}else{const color=GRAIN_COLORS[grains.length%GRAIN_COLORS.length];ng=[...grains,{name:f.name.trim().toUpperCase(),bushel_lbs:parseInt(f.bushel_lbs)||60,color}];}setGrains(ng);save(fields,bins,ng,trucks);setAG(false);setEG(null);}} onClose={()=>{setAG(false);setEG(null);}}/>}
      {(addTruck||editTruck)&&<TruckMo truck={editTruck} onSave={f=>{let nt;if(editTruck){nt=safeTrucks.map((t,i)=>i===editTruck.idx?{...t,name:f.name.trim().toUpperCase(),hex:f.hex,border:f.hex,text:f.text}:t);}else{nt=[...trucks,{id:genId(),name:f.name.trim().toUpperCase(),hex:f.hex,border:f.hex,text:f.text}];}setTrucks(nt);save(fields,bins,grains,nt);setAT(false);setET(null);}} onClose={()=>{setAT(false);setET(null);}}/>}
      {editLoad&&<LoadMo load={editLoad.load} bins={safeBins} grains={safeGrains} onSave={updateLoad} onDelete={deleteLoad} onSplit={splitLoad} onClose={()=>setEL(null)}/>}
      {showReport&&<PrintReport fields={safeFields} bins={safeBins} grains={safeGrains} onClose={()=>setShowReport(false)}/>}
    </>
  );
}

// ── Modal helpers ─────────────────────────────────────────────────
const moStyle = {position:"fixed",inset:0,background:"rgba(20,30,10,.75)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"};
const cardStyle = {background:"#fff",border:"2px solid #b0a08a",borderRadius:"8px",padding:"24px",width:"100%",maxWidth:"340px",fontFamily:"'IBM Plex Mono',monospace"};
const lblStyle = {fontSize:"8px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"4px",textAlign:"left"};
const inStyle = {width:"100%",padding:"10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",border:"1px solid #b0a08a",borderRadius:"4px",color:"#4a5568",background:"#f5f3ef",outline:"none",marginBottom:"10px"};
const seStyle = {...inStyle,cursor:"pointer"};
const MoBtn = ({children,onClick,variant="ghost",disabled})=><button onClick={onClick} disabled={disabled} style={{flex:1,padding:"10px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",letterSpacing:"0.1em",border:variant==="primary"?"1px solid #4a5568":"1px solid #e0c0c0",borderRadius:"4px",background:disabled?"#f0f0f0":variant==="primary"?"#e8e2d8":variant==="danger"?"#fff0f0":"#f5f3ef",color:disabled?"#b0a870":variant==="primary"?"#4a5568":variant==="danger"?"#c03030":"#9a8a72",cursor:disabled?"not-allowed":"pointer"}}>{children}</button>;
const hdrStyle = {fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em",marginBottom:"16px",textAlign:"center"};

function BinMo({bin,grains,onSave,onDelete,onClose,canDelete}){
  const[f,setF]=useState({name:bin.name,capacityBu:bin.capacityBu,storedLbs:bin.storedLbs,grainName:bin.grainName,shared:bin.farmId==="shared"||!bin.farmId});
  const safeGrains=(Array.isArray(grains)?grains:[]).filter(Boolean);
  return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
    <div style={hdrStyle}>EDIT {bin.name}</div>
    <div style={lblStyle}>BIN NAME</div><input style={inStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
    <div style={lblStyle}>CAPACITY (BU)</div><input style={inStyle} type="number" value={f.capacityBu} onChange={e=>setF(p=>({...p,capacityBu:e.target.value}))}/>
    <div style={lblStyle}>STORED (LBS)</div><input style={inStyle} type="number" value={f.storedLbs} onChange={e=>setF(p=>({...p,storedLbs:e.target.value}))}/>
    <div style={lblStyle}>GRAIN TYPE</div><select style={seStyle} value={f.grainName} onChange={e=>setF(p=>({...p,grainName:e.target.value}))}>{safeGrains.map(g=><option key={g.name} value={g.name}>{g.name}</option>)}</select>
    <label style={{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer",margin:"8px 0",fontSize:"11px",color:"#b0c8a0",letterSpacing:"0.08em",textTransform:"uppercase"}}>
      <input type="checkbox" checked={f.shared} onChange={e=>setF(p=>({...p,shared:e.target.checked}))} style={{accentColor:"#4a7535",width:"14px",height:"14px"}}/>
      Shared across all farms
    </label>
    <div style={{display:"flex",gap:"8px"}}>
      {canDelete&&<MoBtn variant="danger" onClick={onDelete}>DELETE</MoBtn>}
      <MoBtn onClick={onClose}>CANCEL</MoBtn>
      <MoBtn variant="primary" onClick={()=>onSave({...f,farmId:f.shared?"shared":bin.farmId})}>SAVE</MoBtn>
    </div>
  </div></div>);
}

function FieldMo({field,perms,onSave,onClose}){
  const[f,setF]=useState({name:field.name,acres:field.acres||"",grainPrice:field.grainPrice||"",landlord:field.landlord||"",cropShare:field.cropShare||"",insCoverageLevel:field.insCoverageLevel||"",insGuaranteedYield:field.insGuaranteedYield||"",insPriceElection:field.insPriceElection||"",insType:field.insType||"",insInsuredAcres:field.insInsuredAcres||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<div style={moStyle} onClick={onClose}><div style={{...cardStyle,maxWidth:"380px",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
    <div style={hdrStyle}>EDIT FIELD</div>
    <div style={lblStyle}>FIELD NAME</div><input style={inStyle} value={f.name} onChange={e=>s("name",e.target.value)}/>
    <div style={lblStyle}>ACRES</div><input style={inStyle} type="number" value={f.acres} onChange={e=>s("acres",e.target.value)}/>
    {perms.canViewCosts&&<><div style={lblStyle}>GRAIN PRICE ($/BU)</div><input style={inStyle} type="number" step="0.01" value={f.grainPrice} onChange={e=>s("grainPrice",e.target.value)} placeholder="e.g. 7.25"/></>}
    {perms.canViewCropShare&&<><div style={lblStyle}>LANDLORD</div><input style={inStyle} value={f.landlord} onChange={e=>s("landlord",e.target.value)}/><div style={lblStyle}>CROP SHARE %</div><input style={inStyle} type="number" value={f.cropShare} onChange={e=>s("cropShare",e.target.value)}/></>}
    {perms.canViewInsurance&&<><div style={lblStyle}>INSURANCE TYPE</div><input style={inStyle} value={f.insType} onChange={e=>s("insType",e.target.value)} placeholder="RP, YP, APH..."/><div style={lblStyle}>COVERAGE LEVEL %</div><input style={inStyle} type="number" value={f.insCoverageLevel} onChange={e=>s("insCoverageLevel",e.target.value)}/><div style={lblStyle}>GUARANTEED YIELD (BU/AC)</div><input style={inStyle} type="number" value={f.insGuaranteedYield} onChange={e=>s("insGuaranteedYield",e.target.value)}/><div style={lblStyle}>PRICE ELECTION ($/BU)</div><input style={inStyle} type="number" step="0.01" value={f.insPriceElection} onChange={e=>s("insPriceElection",e.target.value)}/><div style={lblStyle}>INSURED ACRES</div><input style={inStyle} type="number" value={f.insInsuredAcres} onChange={e=>s("insInsuredAcres",e.target.value)}/></>}
    <div style={{display:"flex",gap:"8px"}}><MoBtn onClick={onClose}>CANCEL</MoBtn><MoBtn variant="primary" onClick={()=>onSave(f)}>SAVE</MoBtn></div>
  </div></div>);
}

function GrainMo({grain,onSave,onClose}){
  const[f,setF]=useState({name:grain?.name||"",bushel_lbs:grain?.bushel_lbs||60});
  return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
    <div style={hdrStyle}>{grain?"EDIT":"ADD"} COMMODITY</div>
    <div style={lblStyle}>NAME</div><input style={inStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="e.g. WHEAT"/>
    <div style={lblStyle}>LBS / BUSHEL</div><input style={inStyle} type="number" value={f.bushel_lbs} onChange={e=>setF(p=>({...p,bushel_lbs:e.target.value}))}/>
    <div style={{display:"flex",gap:"8px"}}><MoBtn onClick={onClose}>CANCEL</MoBtn><MoBtn variant="primary" onClick={()=>{if(!f.name.trim())return alert("Name required");onSave(f);}}>SAVE</MoBtn></div>
  </div></div>);
}

function TruckMo({truck,onSave,onClose}){
  const[f,setF]=useState({name:truck?.name||"",hex:truck?.hex||"#cccccc",text:truck?.text||"#333"});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const isLight=(hex)=>{ try{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return(r*299+g*587+b*114)/1000>128;}catch{return true;} };
  return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
    <div style={hdrStyle}>{truck?"EDIT":"ADD"} TRUCK</div>
    <div style={lblStyle}>TRUCK NAME</div><input style={inStyle} value={f.name} onChange={e=>s("name",e.target.value)} placeholder="e.g. KENWORTH, RED TRUCK"/>
    <div style={lblStyle}>COLOR</div>
    <div style={{display:"flex",gap:"8px",alignItems:"center",marginBottom:"10px"}}>
      <input type="color" value={f.hex} onChange={e=>{const hex=e.target.value;s("hex",hex);s("text",isLight(hex)?"#333":"#fff");}} style={{width:"48px",height:"36px",border:"1px solid #b0a08a",borderRadius:"4px",cursor:"pointer",padding:"2px"}}/>
      <div style={{flex:1,padding:"8px 12px",background:f.hex,borderRadius:"4px",border:"1px solid #b0a08a",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:f.text,letterSpacing:"0.08em",textAlign:"center"}}>{f.name||"PREVIEW"}</div>
    </div>
    <div style={lblStyle}>TEXT COLOR</div>
    <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
      {["#333333","#ffffff"].map(c=>(
        <button key={c} onClick={()=>s("text",c)} style={{flex:1,padding:"7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.1em",background:f.hex,color:c,border:f.text===c?"2px solid #4a5568":"1px solid #b0a08a",borderRadius:"4px",cursor:"pointer"}}>
          {c==="#333333"?"DARK TEXT":"LIGHT TEXT"}
        </button>
      ))}
    </div>
    <div style={{display:"flex",gap:"8px"}}><MoBtn onClick={onClose}>CANCEL</MoBtn><MoBtn variant="primary" onClick={()=>{if(!f.name.trim())return alert("Name required");onSave(f);}}>SAVE</MoBtn></div>
  </div></div>);
}

// LoadMo — edit / delete a load, or switch into split mode to divide it
// between two bins. Mirrors the split flow from the old standalone
// grain-cart app (component_final.jsx), adapted to this module's data
// shape (load.net in lbs, load.grainBushelLbs, load.binId).
function LoadMo({load,bins,grains,onSave,onDelete,onSplit,onClose}){
  const[f,setF]=useState({grainName:load.grainName,grainBushelLbs:load.grainBushelLbs,net:load.net,binId:load.binId,operator:load.operator||""});
  const[splitMode,setSplitMode]=useState(false);
  const[splitAmt,setSplitAmt]=useState("");
  const[splitBinId,setSplitBinId]=useState((bins.find(b=>b.id!==load.binId)||bins[0])?.id);
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  const safeGrains=(Array.isArray(grains)?grains:[]).filter(Boolean);

  const parsedNet = Math.max(0, parseInt(f.net)||0);
  const bushelLbs = parseInt(f.grainBushelLbs)||60;

  if(splitMode){
    const totalBu = parsedNet / bushelLbs;
    const splitABu = Math.max(0, Math.min(totalBu, parseFloat(splitAmt)||0));
    const splitBBu = totalBu - splitABu;
    const splitALbs = Math.round(splitABu*bushelLbs);
    const splitBLbs = parsedNet - splitALbs;
    const label = load.splitLabel || "";
    const canApply = splitABu>0 && splitBBu>1e-3 && f.binId!==splitBinId;
    const binName = id => (bins.find(b=>b.id===id)||{}).name || "?";

    return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
      <div style={hdrStyle}>SPLIT LOAD{label?` #${label}`:""}</div>
      <div style={{background:"#ede9e4",border:"1px solid #c0b8ac",borderRadius:"6px",padding:"12px",marginBottom:"14px"}}>
        <div style={{fontSize:"9px",color:"#6a7280",letterSpacing:"0.15em",marginBottom:"4px"}}>TOTAL LOAD</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"22px",color:"#4a5568"}}>{totalBu.toFixed(1)} <span style={{fontSize:"12px",color:"#5a6878"}}>BU</span></div>
        <div style={{fontSize:"9px",color:"#6a7280",marginTop:"2px"}}>{parsedNet.toLocaleString()} lbs · {bushelLbs} lbs/bu</div>
      </div>

      <div style={lblStyle}>FIRST BIN — BUSHELS</div>
      <input style={inStyle} type="number" value={splitAmt} onChange={e=>setSplitAmt(e.target.value)} placeholder={`Max ${totalBu.toFixed(1)} bu`}/>
      {splitABu>0&&(
        <div style={{marginBottom:"10px",marginTop:"-4px"}}>
          <div style={{display:"flex",height:"6px",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{width:`${(splitABu/totalBu)*100}%`,background:"#4a5568"}}/>
            <div style={{flex:1,background:"#c47d0a"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"5px",fontSize:"9px"}}>
            <span style={{color:"#4a5568",fontWeight:700}}>A: {splitABu.toFixed(1)} bu ({splitALbs.toLocaleString()} lbs)</span>
            <span style={{color:"#c47d0a",fontWeight:700}}>B: {splitBBu.toFixed(1)} bu ({splitBLbs.toLocaleString()} lbs)</span>
          </div>
        </div>
      )}

      <div style={lblStyle}>BIN A (KEEPS THIS LOAD'S BIN)</div>
      <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"10px"}}>
        {bins.map(b=>(
          <button key={b.id} onClick={()=>s("binId",b.id)} style={{...btnBase_static,padding:"5px 10px",fontSize:"10px",background:f.binId===b.id?"#e8e2d8":"transparent",border:f.binId===b.id?"1px solid #4a5568":"1px solid #ccc4b8",color:f.binId===b.id?"#4a5568":"#6a7280"}}>{b.name}</button>
        ))}
      </div>
      <div style={lblStyle}>BIN B — REMAINDER</div>
      <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"12px"}}>
        {bins.map(b=>(
          <button key={b.id} onClick={()=>setSplitBinId(b.id)} style={{...btnBase_static,padding:"5px 10px",fontSize:"10px",background:splitBinId===b.id?"#e8e2d8":"transparent",border:splitBinId===b.id?"1px solid #c47d0a":"1px solid #ccc4b8",color:splitBinId===b.id?"#c47d0a":"#6a7280"}}>{b.name}</button>
        ))}
      </div>
      {f.binId===splitBinId&&<div style={{fontSize:"9px",color:"#b04030",textAlign:"center",marginBottom:"10px"}}>BIN A AND BIN B MUST BE DIFFERENT</div>}

      <div style={{display:"flex",gap:"8px"}}>
        <MoBtn onClick={()=>setSplitMode(false)}>← BACK</MoBtn>
        <MoBtn variant="primary" disabled={!canApply} onClick={()=>onSplit({load,splitA:splitALbs,splitB:splitBLbs,binAId:f.binId,binBId:splitBinId,labelBase:load.splitLabel||undefined})}>APPLY SPLIT</MoBtn>
      </div>
    </div></div>);
  }

  return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
    <div style={hdrStyle}>EDIT LOAD{load.splitLabel?` #${load.splitLabel}`:""}</div>
    <div style={lblStyle}>GRAIN</div>
    {safeGrains.length
      ? <select style={seStyle} value={f.grainName} onChange={e=>{const g=safeGrains.find(x=>x.name===e.target.value);s("grainName",e.target.value);if(g)s("grainBushelLbs",g.bushel_lbs);}}>{safeGrains.map(g=><option key={g.name} value={g.name}>{g.name}</option>)}</select>
      : <input style={inStyle} value={f.grainName} onChange={e=>s("grainName",e.target.value)}/>
    }
    <div style={lblStyle}>LBS/BU</div><input style={inStyle} type="number" value={f.grainBushelLbs} onChange={e=>s("grainBushelLbs",e.target.value)}/>
    <div style={lblStyle}>NET WEIGHT (LBS)</div><input style={inStyle} type="number" value={f.net} onChange={e=>s("net",e.target.value)}/>
    {parsedNet>0&&bushelLbs>0&&<div style={{marginTop:"-6px",marginBottom:"10px",fontSize:"14px",fontWeight:600,color:"#c47d0a"}}>{(parsedNet/bushelLbs).toFixed(1)} <span style={{fontSize:"10px",color:"#6a7280"}}>bu</span></div>}
    <div style={lblStyle}>BIN</div><select style={seStyle} value={f.binId} onChange={e=>s("binId",Number(e.target.value))}>{bins.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
    <div style={lblStyle}>OPERATOR</div><input style={inStyle} value={f.operator} onChange={e=>s("operator",e.target.value)}/>
    <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
      <MoBtn onClick={onClose}>CANCEL</MoBtn>
      <MoBtn variant="primary" onClick={()=>onSave({...load,...f,net:Number(f.net),grainBushelLbs:Number(f.grainBushelLbs)})}>SAVE</MoBtn>
    </div>
    <div style={{display:"flex",gap:"8px"}}>
      <MoBtn onClick={()=>setSplitMode(true)}>⇄ SPLIT LOAD</MoBtn>
      <MoBtn variant="danger" onClick={()=>{if(confirm("Delete this load?"))onDelete(load);}}>✕ DELETE</MoBtn>
    </div>
  </div></div>);
}
const btnBase_static = {cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",borderRadius:"4px",fontWeight:"bold",transition:"all 0.15s"};
