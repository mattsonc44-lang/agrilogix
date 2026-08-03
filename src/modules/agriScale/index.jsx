import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { dbRead, dbWrite, dbSafeWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";
import { sumLoadsBushels, sumLoadsLbs, lastLoadDateISO, buildGuaranteeProgress, buildBinSummary, detectCropMismatch, detectBinOverfill, mergeFarmFields, mergeFarmBins, buildMarketingSummary, contractDeliveryStatus } from "../../core/agriscale.js";
import { getPerms } from "../../core/permissions.js";

// ── Decimal-safe numeric text input sanitizer ────────────────────────────────
// Plain <input type="number"> is a native browser control whose typing behavior
// varies by OS/browser locale — some locales reject "." as a decimal separator
// entirely, which makes it look like the field only accepts one digit at a time
// and forces you to use the up/down spinner instead. Using type="text" with this
// sanitizer sidesteps that: it strips anything that isn't a digit or a single
// decimal point, so acres like "156.2" always type normally everywhere.
function decOnly(v) {
let x = (v || "").replace(/[^0-9.]/g, "");
const parts = x.split(".");
if (parts.length > 2) x = parts[0] + "." + parts.slice(1).join("");
return x;
}

// ── Permission mapping from Agri Logix roles — now shared across modules,
// see core/permissions.js (was previously local to just this file).

// ── Constants ─────────────────────────────────────────────────────
const FALLBACK_GRAIN = { name:"WHEAT", bushel_lbs:60, color:"#c0b8ac" };
const DEFAULT_TRUCKS = [
{ id:"t1", name:"WHITE", hex:"#f0f0f0", border:"#aaa", text:"#333" },
{ id:"t2", name:"RED", hex:"#e74c3c", border:"#c0392b", text:"#fff" },
{ id:"t3", name:"GREEN", hex:"#27ae60", border:"#219653", text:"#fff" },
{ id:"t4", name:"BLUE", hex:"#2980b9", border:"#1a6895", text:"#fff" },
{ id:"t5", name:"BLACK", hex:"#2c3e50", border:"#1a252f", text:"#fff" },
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
if(unit==="BU") return { value:(lbs/(bushelLbs||60)).toFixed(1), label:"BU" };
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

// ── AgriScale design tokens (SCALE tab redesign) ───────────────────────────
// Flat, rounded-card look with color-coded sections instead of the old uniform
// tan/beige panels — each control group gets a hue that maps to what it is
// (storage = teal, commodity = amber, land = green), and the weight readout
// gets a dark, high-contrast "instrument" treatment instead of a pale box.
const AS = {
  page:     "#F4F2EC",
  pageGradient: "linear-gradient(160deg, #182420 0%, #101815 55%, #0B120F 100%)",
  textOnDark:     "#F2F0E8",
  textOnDarkSoft: "#9BA79C",
  card:     "#FFFFFF",
  cardAlt:  "#F7F6F1",
  border:   "#E4E1D6",
  borderStrong: "#D3CFC0",
  text:     "#1C2420",
  textSoft: "#6B7268",
  textFaint:"#98988C",
  teal:     "#0F6E56", tealBg: "#E1F5EE", tealText: "#085041",
  amber:    "#BA7517", amberBg:"#FAEEDA", amberText:"#412402",
  green:    "#3B6D11", greenBg:"#EAF3DE", greenText:"#173404",
  blue:     "#185FA5", blueBg: "#E6F1FB", blueText: "#042C53",
  danger:   "#A32D2D", dangerBg:"#FCEBEB",
  readout:      "#0F1512",
  readoutMuted: "#7FA88F",
  readoutText:  "#E8F5EE",
  // Pulled from the Agri Logix badge mark (public/icons) — used sparingly
  // as brand accents (thin bars, underlines) rather than large fills.
  logoGreen:     "#1F3B22",
  logoGreenSoft: "#4FA95C",
  logoGold:      "#C9A227",
  logoGoldSoft:  "#E4C468",
};

// ── Grain marketing contract form — shared for both "+ Add Contract" and
// editing an existing one (pass `initial` to pre-fill). Price is only shown
// to roles with canViewCosts — bushels/buyer/delivery aren't $ figures, but
// price and any $ value derived from it are gated the same way AgriPlan and
// ServiceLog already gate their own cost data.
function ContractForm({ initial, grains, canViewCosts, onSave, onCancel }) {
const [buyer, setBuyer] = useState(initial?.buyer || "");
const [crop, setCrop] = useState(initial?.crop || grains[0]?.name || "");
const [bushels, setBushels] = useState(initial?.bushels || "");
const [price, setPrice] = useState(initial?.price || "");
const [delivery, setDelivery] = useState(initial?.delivery || "");
const [notes, setNotes] = useState(initial?.notes || "");
const inputStyle = {width:"100%",boxSizing:"border-box",padding:"6px 8px",fontSize:"12px",fontFamily:"'IBM Plex Mono',monospace",border:"1px solid #ccc4b8",borderRadius:"4px",background:"#fff",color:"#2a2a26"};
const labelStyle = {fontSize:"8px",color:"#6a7280",letterSpacing:"0.1em",marginBottom:"2px"};
const submit = () => {
if(!crop || !(parseFloat(bushels)>0)) return;
onSave({ id: initial?.id || genId(), farmId: initial?.farmId, buyer: buyer.trim(), crop, bushels, price, delivery: delivery.trim(), notes: notes.trim() });
};
return (
<div style={{background:"#fbf9f5",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"8px"}}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"8px"}}>
<div><div style={labelStyle}>BUYER / ELEVATOR</div><input value={buyer} onChange={e=>setBuyer(e.target.value)} placeholder="e.g. CHS Big Sandy" style={inputStyle}/></div>
<div><div style={labelStyle}>CROP</div>
<select value={crop} onChange={e=>setCrop(e.target.value)} style={inputStyle}>
{grains.map(g=><option key={g.name} value={g.name}>{g.name}</option>)}
</select>
</div>
<div><div style={labelStyle}>BUSHELS</div><input type="number" value={bushels} onChange={e=>setBushels(e.target.value)} placeholder="e.g. 5000" style={inputStyle}/></div>
{canViewCosts && <div><div style={labelStyle}>PRICE ($/bu)</div><input type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="e.g. 6.25" style={inputStyle}/></div>}
<div><div style={labelStyle}>DELIVERY BY</div><input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(delivery)?delivery:""} onChange={e=>setDelivery(e.target.value)} style={inputStyle}/>
{delivery && !/^\d{4}-\d{2}-\d{2}$/.test(delivery) && <div style={{fontSize:"9px",color:"#8a8478",marginTop:"2px"}}>Existing value "{delivery}" — pick a date above to enable delivery reminders</div>}
</div>
<div style={{gridColumn:canViewCosts?"auto":"1 / -1"}}><div style={labelStyle}>NOTES</div><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Contract #, terms, etc." style={inputStyle}/></div>
</div>
<div style={{display:"flex",gap:"6px"}}>
<button onClick={submit} disabled={!crop||!(parseFloat(bushels)>0)} style={{cursor:"pointer",flex:1,padding:"7px",fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",borderRadius:"4px",border:"none",background:(!crop||!(parseFloat(bushels)>0))?"#ccc4b8":"#4a7535",color:"#fff"}}>SAVE</button>
<button onClick={onCancel} style={{cursor:"pointer",padding:"7px 14px",fontSize:"10px",fontWeight:700,letterSpacing:"0.08em",borderRadius:"4px",border:"1px solid #ccc4b8",background:"#fff",color:"#6a7280"}}>CANCEL</button>
</div>
</div>
);
}

// ── BinGauge SVG (matches original exactly) ───────────────────────
function BinGauge({ bin, grains, small }) {
const grain = (grains||[]).filter(Boolean).find(g=>g.name===bin.grainName) || FALLBACK_GRAIN;
const storedBu = bin.storedLbs / (grain.bushel_lbs||60);
const pct = bin.capacityBu > 0 ? Math.min(100, storedBu / bin.capacityBu * 100) : 0;
const remaining = Math.max(0, bin.capacityBu - storedBu);
const fillColor = pct >= 95 ? "#e74c3c" : pct >= 80 ? "#c47d0a" : "#4a5568";
const fillGlow = fillColor;

const binH = small ? 100 : 160;
const binW = small ? 60 : 90;
const roofH = small ? 18 : 28;
const neckW = small ? 18 : 28;
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
{bin.location&&<div style={{fontSize:small?"9px":"10px",color:"#8a9880",letterSpacing:"0.06em",marginBottom:"2px"}}>📍 {bin.location}</div>}
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

// ── Breakdown by Insurance Unit / Field / Crop — used by both the on-screen
// REPORT tab and the printable report. Each load already carries its own
// insuranceUnit, fieldId (via the field it's stored on) and grainName/grainBushelLbs
// at the time it was recorded, so this is a straight group-and-sum with no lookups.
function buildUnitFieldCropBreakdown(fields) {
// Field-level totals first — this is the whole field's bushels/acres regardless
// of how its loads split across insurance units or crops, so "field bu/ac" means
// the same thing on every row for that field rather than a per-unit fraction.
const fieldTotals = {};
const unitAcresByField = {};
(fields||[]).forEach(field=>{
const totBu = (field.loads||[]).filter(Boolean).reduce((s,l)=>s+l.net/(l.grainBushelLbs||60),0);
const acres = parseFloat(field.acres)||0;
fieldTotals[field.name] = { totBu, acres, yieldPerAc: acres>0 ? totBu/acres : null };
// Insurance units are stored as {name,acres} (older data may just be plain name strings —
// those have no acres info, so unit-level yield falls back to "—" for them).
const uMap = {};
(field.insuranceUnits||[]).forEach(u=>{
if(typeof u==="string" || !u?.name) return;
const a = parseFloat(u.acres)||0;
if(a>0) uMap[u.name] = a;
});
unitAcresByField[field.name] = uMap;
});
const rows = {};
(fields||[]).forEach(field=>{
(field.loads||[]).filter(Boolean).forEach(load=>{
const unit = (load.insuranceUnit && load.insuranceUnit!=="none") ? load.insuranceUnit : "None";
const crop = load.grainName || "—";
const key = `${field.name}||${unit}||${crop}`;
if(!rows[key]) rows[key] = {
fieldName:field.name, unit, crop, loads:0, totLbs:0, totBu:0, grainPrice:field.grainPrice, acres:parseFloat(field.acres)||0,
fieldYieldPerAc: fieldTotals[field.name]?.yieldPerAc ?? null,
unitAcres: unitAcresByField[field.name]?.[unit] ?? null,
};
rows[key].loads += 1;
rows[key].totLbs += load.net;
rows[key].totBu += load.net/(load.grainBushelLbs||60);
});
});
Object.values(rows).forEach(r=>{ r.unitYieldPerAc = (r.unitAcres>0) ? r.totBu/r.unitAcres : null; });
return Object.values(rows).sort((a,b)=>
(a.fieldName||"").localeCompare(b.fieldName||"", undefined,{numeric:true,sensitivity:"base"})
|| a.unit.localeCompare(b.unit)
|| a.crop.localeCompare(b.crop)
);
}

// ── Breakdown by Insurance Unit, THEN Field — same underlying load data as
// buildUnitFieldCropBreakdown above, just re-grouped so the insurance unit is
// the top-level heading and each field that fed into it is a sub-row beneath
// it, with its own bushels/acres/yield. Fields with no insurance unit set are
// left out entirely (that's what "Summary by Field" above already covers).
// Grouping only works if the same unit name is typed identically on every
// field that belongs to it (e.g. "Unit 4021-A" everywhere) — this is a
// straight string match, there is no separate "unit" record to link to.
function buildUnitBreakdown(fields) {
const units = {};
(fields||[]).forEach(field=>{
// acres this field contributes to each of its named units
const unitAcresMap = {};
(field.insuranceUnits||[]).forEach(u=>{
if(typeof u==="string" || !u?.name) return;
const a = parseFloat(u.acres)||0;
if(a>0) unitAcresMap[u.name] = a;
});
// this field's loads grouped by unit+crop
const fieldRows = {};
(field.loads||[]).filter(Boolean).forEach(load=>{
const unit = (load.insuranceUnit && load.insuranceUnit!=="none") ? load.insuranceUnit : "None";
if(unit==="None") return;
const crop = load.grainName || "—";
const key = `${unit}||${crop}`;
if(!fieldRows[key]) fieldRows[key] = { unit, crop, loads:0, totLbs:0, totBu:0 };
fieldRows[key].loads += 1;
fieldRows[key].totLbs += load.net;
fieldRows[key].totBu += load.net/(load.grainBushelLbs||60);
});
Object.values(fieldRows).forEach(r=>{
if(!units[r.unit]) units[r.unit] = { unit:r.unit, totBu:0, totLoads:0, fields:[] };
const u = units[r.unit];
u.totBu += r.totBu;
u.totLoads += r.loads;
u.fields.push({
fieldName: field.name, crop:r.crop, loads:r.loads, totLbs:r.totLbs, totBu:r.totBu,
unitAcres: unitAcresMap[r.unit] ?? null, grainPrice: field.grainPrice,
});
});
});
Object.values(units).forEach(u=>{
// Sum each distinct field's unit-acres once (a field with 2 crop rows under
// the same unit shouldn't have its acres counted twice).
const acresByField = {};
u.fields.forEach(f=>{ if(f.unitAcres!=null) acresByField[f.fieldName]=f.unitAcres; });
const acresVals = Object.values(acresByField);
u.totAcres = acresVals.length ? acresVals.reduce((s,a)=>s+a,0) : null;
u.unitYieldPerAc = (u.totAcres && u.totAcres>0) ? u.totBu/u.totAcres : null;
u.fields.sort((a,b)=>
a.fieldName.localeCompare(b.fieldName, undefined,{numeric:true,sensitivity:"base"})
|| a.crop.localeCompare(b.crop)
);
// Per-crop subtotal within this unit — e.g. "Total Spring Wheat for Unit A
// North", separate from "Total Barley for Unit A North", since a unit can
// carry more than one crop across its fields.
const cropMap = {};
u.fields.forEach(f=>{ cropMap[f.crop] = (cropMap[f.crop]||0) + f.totBu; });
u.crops = Object.entries(cropMap).sort((a,b)=>a[0].localeCompare(b[0])).map(([crop,totBu])=>({crop,totBu}));
});
return Object.values(units).sort((a,b)=>a.unit.localeCompare(b.unit, undefined,{numeric:true,sensitivity:"base"}));
}

// ── Main module ───────────────────────────────────────────────────
// (buildBinSummary — how full each bin is, its actual crop, and which fields
// fed it — now lives in core/agriscale.js, shared and unit-tested there.)
function PrintReport({ fields, bins, grains, onClose }) {
const reportRef = useRef(null);
const allLoads = [];
(fields||[]).forEach(field => (field.loads||[]).forEach(load => allLoads.push({...load, fieldName: field.name})));
allLoads.sort((a,b)=>(a.ts||0)-(b.ts||0));
const grainFor = (name) => (grains||[]).find(g=>g.name===name) || FALLBACK_GRAIN;
const buOf = (load) => load.net / ((grainFor(load.grainName).bushel_lbs)||60);
const grandTotalLbs = allLoads.reduce((s,l)=>s+l.net,0);
const grandTotalBu = allLoads.reduce((s,l)=>s+buOf(l),0);
// Rows with no insurance unit are dropped here — "Summary by Field" above
// already covers plain field totals, so a unit-less row would just repeat it.
const unitBreakdown = buildUnitBreakdown(fields);
const binSummaryRows = buildBinSummary(fields, bins, grains);
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
{[...(fields||[])].sort((a,b)=>(a.name||"").localeCompare(b.name||"", undefined, {numeric:true, sensitivity:"base"})).map(field=>{
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

<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.2em",color:"#888",marginTop:"20px",marginBottom:"8px",paddingTop:"12px",borderTop:"1px solid #ddd"}}>SUMMARY BY INSURANCE UNIT</div>
{unitBreakdown.length===0 && <p style={{fontSize:"11px",color:"#bbb",textAlign:"center",padding:"14px 0"}}>No loads with an insurance unit recorded</p>}
{unitBreakdown.map(u=>(
<div key={u.unit} style={{marginBottom:"18px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px",paddingBottom:"4px",borderBottom:"1px solid #ccc"}}>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"13px"}}>{u.unit}</div>
<div style={{fontSize:"11px",color:"#666"}}>
{u.totAcres!=null?`${u.totAcres} ac · `:""}{u.totBu.toFixed(0)} bu{u.unitYieldPerAc!=null?` · ${u.unitYieldPerAc.toFixed(1)} bu/ac`:""}
</div>
</div>
<table>
<thead><tr>
{["FIELD","CROP","LOADS","TOTAL BU","ACRES","BU/AC"].map((h,i)=>(
<th key={h} style={{...th,textAlign:i>=2?"right":"left"}}>{h}</th>
))}
</tr></thead>
<tbody>
{u.fields.map((f,i)=>(
<tr key={i}>
<td style={td}>{f.fieldName}</td>
<td style={td}>{f.crop}</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{f.loads}</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",color:"#c47d0a"}}>{f.totBu.toFixed(0)} bu</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{f.unitAcres!=null?f.unitAcres:"—"}</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{(f.unitAcres>0)?(f.totBu/f.unitAcres).toFixed(1)+" bu/ac":"—"}</td>
</tr>
))}
</tbody>
</table>
<div style={{marginTop:"8px",paddingTop:"6px",borderTop:"1px dashed #ccc"}}>
{u.crops.map(c=>(
<div key={c.crop} style={{fontSize:"11px",color:"#444",padding:"2px 0"}}>
Total <strong>{c.crop}</strong> for {u.unit} = <span style={{fontFamily:"'IBM Plex Mono',monospace",color:"#c47d0a",fontWeight:700}}>{c.totBu.toFixed(0)} bu</span>
</div>
))}
</div>
</div>
))}

<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.2em",color:"#888",marginTop:"20px",marginBottom:"8px",paddingTop:"12px",borderTop:"1px solid #ddd"}}>SUMMARY BY BIN</div>
<table>
<thead><tr>
{["BIN","CROP","% FULL","LOADS","TOTAL BU","FIELDS"].map((h,i)=>(
<th key={h} style={{...th,textAlign:i>=2&&i<=4?"right":"left"}}>{h}</th>
))}
</tr></thead>
<tbody>
{binSummaryRows.map((b)=>(
<tr key={b.id}>
<td style={td}>{b.name}</td>
<td style={td}>{b.crop}</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{b.pctFull.toFixed(1)}%</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace"}}>{b.loads}</td>
<td style={{...td,textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",color:"#c47d0a"}}>{b.totBu.toFixed(0)} bu</td>
<td style={td}>{b.fields.length ? b.fields.map(f=>`${f.name} (${f.bu.toFixed(0)} bu)`).join(", ") : "—"}</td>
</tr>
))}
{binSummaryRows.length===0 && <tr><td colSpan={6} style={{...td,textAlign:"center",color:"#bbb"}}>No bins</td></tr>}
</tbody>
</table>
</div>
</div>
</div>
);
}

export default function AgriScaleModule({ tenantId, token, userProfile, persist, farmId, farmName, initialTab }) {
const BASE = `tenants/${tenantId}/agriScale`;
// Fields on non-default farms use the farm path
const FIELD_BASE = (!farmId || farmId === "default")
? `${BASE}/fields`
: `tenants/${tenantId}/farms/${farmId}/agriScale/fields`;
// AgriPlan is a separate module with its own farm scoping — reads from it
// (planned crop, insurance/landlord data for imports) must follow the same
// farm as this AgriScale instance, or Via Terra would always see Flat Acre's
// AgriPlan data (and vice versa).
const AP_BASE = (!farmId || farmId === "default")
? `tenants/${tenantId}/agriPlan`
: `tenants/${tenantId}/farms/${farmId}/agriPlan`;
const perms = getPerms(userProfile);
const operatorName = (userProfile?.name || "OPERATOR").toUpperCase();

// Data
const [fields, setFields] = useState(DEFAULT_FIELDS);
const [bins, setBins] = useState(DEFAULT_BINS);
const [grains, setGrains] = useState([FALLBACK_GRAIN]);
const [trucks, setTrucks] = useState(DEFAULT_TRUCKS);
// Grain marketing contracts — unlike fields/bins these are written one at a
// time to their own sub-path (see addOrUpdateContract/deleteContract below),
// never via the whole-list save(), so there's no risk of one farm's save
// overwriting another farm's contracts the way fields/bins could before.
const [contracts, setContracts] = useState([]);
const [loading, setLoading] = useState(true);
const [syncStatus, setSyncStatus] = useState("init");

// Scale
const [rawInput, setRawInput] = useState("0");
const [tare, setTare] = useState(0);
const [unit, setUnit] = useState("LBS");
const [grainIdx, setGrainIdx] = useState(0);
const [activeFieldId, setAFId] = useState(null);
const [activeBinId, setABId] = useState(null);
const [truckColor, setTruckColor] = useState(DEFAULT_TRUCKS[0].id);
const [activeUnit, setActiveUnit] = useState("");

// UI
const [tab, setTab] = useState(initialTab || "SCALE");
const [flImportModal, setFLImportModal] = useState(false);
const [flFields, setFLFields] = useState([]);
const [flSelected, setFLSelected] = useState(new Set());
const [flLoading, setFLLoading] = useState(false);
const [flApByName, setFlApByName] = useState({}); // field name (lowercase) -> matching AgriPlan record, for the import-name preview
// Acres shown/edited per row in the import preview — pre-filled from
// whatever's found on the source field (or its matched AgriPlan record), but
// editable right there before importing, since acres often isn't set on a
// FieldLog field at all (e.g. added without a boundary or drawn from a KML
// with no acreage in it) and there was previously no way to notice or fix
// that until you went looking for a missing yield later.
const [flAcresOv, setFLAcresOv] = useState({}); // field.id -> acres string
const [apImportModal, setAPImportModal] = useState(false);
const [apFields, setAPFields] = useState([]);
const [apSelected, setAPSelected] = useState(new Set());
const [apAcresOv, setAPAcresOv] = useState({}); // field.common -> acres string
const [apLoading, setAPLoading] = useState(false);
// Shared by both import modals: "field" = just the field/common name (old
// behavior, default so nothing changes unless you pick otherwise), "farmField"
// = prefix with the farm/tract name (e.g. "Home - North Tiber Grade").
const [importNameFormat, setImportNameFormat] = useState("field");
// Whether to tack the AgriPlan field # onto the imported name (e.g. "Home - North Tiber Grade #1,2,3").
const [includeFieldNum, setIncludeFieldNum] = useState(false);
const buildImportName = (common, farmTract, fieldNum) => {
let base = (importNameFormat === "farmField" && farmTract) ? `${farmTract} - ${common}` : common;
if (includeFieldNum && fieldNum) base += ` #${fieldNum}`;
return base;
};
const [apCrops, setApCrops] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(`as_apcrops_${tenantId}`))||{}; }catch(e){ return {}; } }); // field name (lowercase) -> planned crop from AgriPlan
const [flCrops, setFlCrops] = useState(()=>{ try{ return JSON.parse(localStorage.getItem(`as_flcrops_${tenantId}_${farmId||"default"}`))||{}; }catch(e){ return {}; } }); // field name (lowercase) -> actually-seeded crop from FieldLog
const [flExportModal, setFLExportModal] = useState(false);
const [flExportData, setFLExportData] = useState([]);
const [flExportSel, setFLExportSel] = useState(new Set());
const [flExporting, setFLExporting] = useState(false);
const [sendActualsToAgriPlan, setSendActualsToAgriPlan] = useState(true);
const [logFieldId, setLogFId] = useState(null);
const [editField, setEF] = useState(null);
const [editBin, setEB] = useState(null);
const [editGrain, setEG] = useState(null);
const [addGrain, setAG] = useState(false);
const [editTruck, setET] = useState(null);
const [addTruck, setAT] = useState(false);
const [editLoad, setEL] = useState(null);
const [showReport, setShowReport] = useState(false);
const [addingContract, setAddingContract] = useState(false);
const [editingContractId, setEditingContractId] = useState(null);

const skipRef = useRef(false);
const nextId = useRef(Date.now());
// Full (ALL farms') copy of fields/bins as last synced from Firebase. The
// `fields`/`bins` state above only ever holds the CURRENT farm's filtered
// subset (for display) — save() must merge edits back into this full set
// rather than writing the filtered subset as if it were everything, or
// saving while on one farm silently wipes every OTHER farm's fields/bins
// from the shared tenant-wide node (dbWrite is a full overwrite at that
// path, not a merge). This is the root cause of fields disappearing when
// you import for one farm, switch farms, then import/save on the other.
const allFieldsRef = useRef([]);
const allBinsRef = useRef([]);

// ── Load ──────────────────────────────────────────────────────
useEffect(()=>{
if(!tenantId) return;
dbRead(BASE,token).then(d=>{
if(d){
const fl=obj2arr(d.fields||{}).filter(Boolean);
const bl=obj2arr(d.bins||{}).filter(Boolean);
const gl=obj2arr(d.customGrains||{}).filter(Boolean);
const tl=obj2arr(d.trucks||{}).filter(Boolean);
const cl=obj2arr(d.contracts||{}).filter(Boolean);
if(fl.length){
allFieldsRef.current = fl;
const farmFields = (!farmId||farmId==="default") ? fl.filter(f=>!f.farmId||f.farmId==="default") : fl.filter(f=>f.farmId===farmId);
setFields(farmFields); setAFId(farmFields[0]?.id||null);
}
if(bl.length){ allBinsRef.current = bl; setBins(bl); setABId(bl[0].id); }
if(gl.length) setGrains(gl);
if(tl.length) setTrucks(tl.filter(Boolean)); else setTrucks(DEFAULT_TRUCKS);
setContracts((!farmId||farmId==="default") ? cl.filter(c=>!c.farmId||c.farmId==="default") : cl.filter(c=>c.farmId===farmId));
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
const cl=obj2arr(cached.contracts||{}).filter(Boolean);
if(fl.length){ allFieldsRef.current = fl; const ff=(!farmId||farmId==="default")?fl.filter(f=>!f.farmId||f.farmId==="default"):fl.filter(f=>f.farmId===farmId); setFields(ff); setAFId(ff[0]?.id||null); }
if(bl.length){ allBinsRef.current = bl; setBins(bl); setABId(bl[0].id); }
if(gl.length) setGrains(gl);
if(tl.length) setTrucks(tl.filter(Boolean));
if(cl.length) setContracts((!farmId||farmId==="default") ? cl.filter(c=>!c.farmId||c.farmId==="default") : cl.filter(c=>c.farmId===farmId));
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
allFieldsRef.current = allF;
const farmFields = (!farmId||farmId==="default") ? allF.filter(f=>!f.farmId||f.farmId==="default") : allF.filter(f=>f.farmId===farmId);
setFields(farmFields);
}
if(d.bins){
const allB = obj2arr(d.bins).filter(Boolean);
allBinsRef.current = allB;
const farmBins = allB.filter(b => !b.farmId || b.farmId === farmId || b.farmId === "shared");
setBins(farmBins);
}
if(d.customGrains) setGrains(obj2arr(d.customGrains).filter(Boolean));
if(d.trucks) setTrucks(obj2arr(d.trucks).filter(Boolean));
if(d.contracts){
const allC = obj2arr(d.contracts).filter(Boolean);
setContracts((!farmId||farmId==="default") ? allC.filter(c=>!c.farmId||c.farmId==="default") : allC.filter(c=>c.farmId===farmId));
}
asSaveCache(d);
});
},[loading,tenantId,token]);

const QUEUE_KEY = `as_queue_${tenantId}`;
const saveToQueue = d => { try{ localStorage.setItem(QUEUE_KEY, JSON.stringify({data:d,savedAt:Date.now()})); }catch(e){} };
const clearQueue = () => { try{ localStorage.removeItem(QUEUE_KEY); }catch(e){} };
const loadQueue = () => { try{ const r=localStorage.getItem(QUEUE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };

const AS_CACHE_KEY = `as_cache_${tenantId}`;
const asSaveCache = d => { try{ localStorage.setItem(AS_CACHE_KEY, JSON.stringify({...d,_at:Date.now()})); }catch(e){} };
const asLoadCache = () => { try{ const r=localStorage.getItem(AS_CACHE_KEY); return r?JSON.parse(r):null; }catch(e){ return null; } };

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
allFieldsRef.current = allF;
setFields((!farmId||farmId==="default") ? allF.filter(f=>!f.farmId||f.farmId==="default") : allF.filter(f=>f.farmId===farmId));
}
if(merged.bins){
const allB = obj2arr(merged.bins).filter(Boolean);
allBinsRef.current = allB;
setBins(allB.filter(b => !b.farmId || b.farmId === farmId || b.farmId === "shared"));
}
if(merged.customGrains) setGrains(obj2arr(merged.customGrains).filter(Boolean));
if(merged.trucks) setTrucks(obj2arr(merged.trucks).filter(Boolean));
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
const nextFields = nf||fields;
const nextBins = nb||bins;
// Safety guard: never write if we'd be wiping fields/bins that exist in current state
if(fields.length > 0 && nextFields.length === 0) { console.warn("AgriScale save blocked: would wipe fields"); return; }
if(bins.length > 0 && nextBins.length === 0) { console.warn("AgriScale save blocked: would wipe bins"); return; }
// nextFields/nextBins only ever contain the CURRENT farm's subset (fields/
// bins state is always farm-filtered). dbWrite below is a full overwrite of
// the shared tenant-wide node, not a merge — so writing that subset directly
// would delete every OTHER farm's fields/bins. mergeFarmFields/mergeFarmBins
// (core/agriscale.js) pull out what belongs to other farms and merge this
// farm's edits back in.
const mergedFields = mergeFarmFields(allFieldsRef.current, nextFields, farmId);
const mergedBins = mergeFarmBins(allBinsRef.current, nextBins, farmId);
allFieldsRef.current = mergedFields;
allBinsRef.current = mergedBins;
const payload = {
fields: Object.fromEntries(mergedFields.map(f=>[f.id,f])),
bins: Object.fromEntries(mergedBins.map(b=>[b.id,b])),
customGrains:Object.fromEntries((ng||grains).map((g,i)=>[i,g])),
trucks: Object.fromEntries((nt||trucks).map((t,i)=>[i,t])),
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
},[fields,bins,grains,trucks,token,BASE,farmId]);

// ── Scale computed (null-safe) ────────────────────────────────
const safeArr = a => (Array.isArray(a)?a:[]).filter(Boolean);
const safeFields = safeArr(fields);
const sortedFields = [...safeFields].sort((a,b)=>(a.name||"").localeCompare(b.name||"", undefined, {numeric:true, sensitivity:"base"}));
const safeBins = safeArr(bins);
const sortedBins = [...safeBins].sort((a,b)=>(a.name||"").localeCompare(b.name||"", undefined, {numeric:true, sensitivity:"base"}));
const safeGrains = safeArr(grains);
const safeTrucks = safeArr(trucks);
const grain = safeGrains[grainIdx] || FALLBACK_GRAIN;
const rawLbs = Math.min(99999,Math.max(0,parseInt(rawInput.replace(/^0+(?=\d)/,""))||0));
const netLbs = Math.max(0,rawLbs-tare);
const canRecord = netLbs >= 100;
const activeField = safeFields.find(f=>f.id===activeFieldId) || safeFields[0];
const activeBin = safeBins.find(b=>b.id===activeBinId) || safeBins[0];
const fieldInsUnits = (activeField?.insuranceUnits||[]).map(u=>typeof u==="string"?u:(u?.name||"")).filter(Boolean);
const activeTruck = safeTrucks.find(t=>t.id===truckColor) || safeTrucks[0] || DEFAULT_TRUCKS[0];

// ── Pull this year's PLANNED crop per field from AgriPlan, keyed by field name ──
useEffect(()=>{
if(!tenantId) return;
const yr = new Date().getFullYear();
dbRead(`${AP_BASE}/fields/${yr}`, token).then(d=>{
const apArr = obj2arr(d||{}).filter(Boolean);
const map = {};
apArr.forEach(a=>{ if(a?.common && a?.crop && a.crop.trim().toLowerCase()!=="chem-fallow") map[a.common.trim().toLowerCase()] = normalizeCropName(a.crop); });
setApCrops(map);
try{ localStorage.setItem(`as_apcrops_${tenantId}`, JSON.stringify(map)); }catch(e){}
}).catch(()=>{});
},[tenantId, token]);

// ── Pull the crop actually SEEDED per field from FieldLog's most recent seeding activity ──
useEffect(()=>{
if(!tenantId) return;
const flBase = (!farmId || farmId === "default")
? `tenants/${tenantId}/fieldlog`
: `tenants/${tenantId}/farms/${farmId}/fieldlog`;
Promise.all([
dbRead(`${flBase}/fields`, token).catch(()=>null),
dbRead(`${flBase}/activities`, token).catch(()=>null),
]).then(([fieldData, actData])=>{
const flFieldsAll = obj2arr(fieldData||{}).filter(Boolean);
const flById = {};
flFieldsAll.forEach(f=>{ if(f?.id) flById[f.id]=f; });
const seedings = obj2arr(actData||{}).filter(Boolean).filter(a=>a.type==="seeding" && Array.isArray(a.data?.crops) && a.data.crops.length>0);
// keep only the most recent seeding activity per FieldLog field
const latestByField = {};
seedings.forEach(a=>{
const existing = latestByField[a.fieldId];
if(!existing || new Date(a.date) > new Date(existing.date)) latestByField[a.fieldId]=a;
});
const map = {};
Object.values(latestByField).forEach(a=>{
const f = flById[a.fieldId];
const cropNames = a.data.crops.map(c=>c?.crop).filter(Boolean);
if(f?.name && cropNames.length) map[f.name.trim().toLowerCase()] = cropNames.join(" + ");
});
setFlCrops(map);
try{ localStorage.setItem(`as_flcrops_${tenantId}_${farmId||"default"}`, JSON.stringify(map)); }catch(e){}
}).catch(()=>{});
},[tenantId, farmId, token]);

// ── Look up a crop by field name, exact match only ──
const exactCrop = (fieldName, cropMap) => {
if(!fieldName) return null;
return cropMap[fieldName.trim().toLowerCase()] || null;
};
// ── Look up a crop by field name, tolerating combined/partial names (last resort only) ──
const fuzzyCrop = (fieldName, cropMap) => {
if(!fieldName) return null;
const name = fieldName.trim().toLowerCase();
let best = null, bestLen = 0;
for(const key in cropMap){
if(key.length < 3) continue; // skip trivially short names to avoid false positives
if((name.includes(key) || key.includes(name)) && key.length > bestLen){
best = cropMap[key]; bestLen = key.length;
}
}
return best;
};

// ── Auto-select the commodity that matches what's actually seeded on the active field ──
// Priority: exact match (FieldLog seeding, then AgriPlan plan) beats ANY fuzzy match —
// a fuzzy guess from either source should never override a real exact match from the other.
useEffect(()=>{
if(!activeField || !activeField.name) return;
const crop = exactCrop(activeField.name, flCrops)
|| exactCrop(activeField.name, apCrops)
|| fuzzyCrop(activeField.name, flCrops)
|| fuzzyCrop(activeField.name, apCrops);
if(!crop) return;
// Compare on letters/numbers only — AgriPlan and FieldLog don't always agree on how
// to separate blend crops ("Austrians/Mustard" vs "Austrians Mustard" vs "Austrians + Mustard"),
// so ignore spacing/punctuation entirely rather than requiring one exact delimiter convention.
const canon = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g, "");
const idx = safeGrains.findIndex(g => canon(g.name) === canon(crop));
if(idx>=0 && idx!==grainIdx) setGrainIdx(idx);
},[activeFieldId, apCrops, flCrops]); // eslint-disable-line react-hooks/exhaustive-deps

// ── Reset the selected insurance unit when the active field changes (it's field-specific) ──
useEffect(()=>{
if(activeUnit && !fieldInsUnits.includes(activeUnit)) setActiveUnit("");
},[activeFieldId]); // eslint-disable-line react-hooks/exhaustive-deps

// ── Numpad ────────────────────────────────────────────────────
const onKey = k => {
if(k==="CLR"||k==="C") { setRawInput("0"); return; }
if(k==="⌫") { setRawInput(p=>p.length>1?p.slice(0,-1):"0"); return; }
setRawInput(p=>{ const n=p==="0"?String(k):p+k; return n.length>5?p:n; });
};

// ── Record load ───────────────────────────────────────────────
const recordLoad = () => {
if(!canRecord) return;
const mismatch = detectCropMismatch(safeFields, safeBins, activeBinId, grain.name);
if(mismatch && !confirm(`⚠ Crop mismatch: ${mismatch.binName} already has ${mismatch.existing} recorded in it. You're about to add ${grain.name}. Continue and mix grains in this bin?`)) return;
const overfill = detectBinOverfill(activeBin, grain, netLbs);
if(overfill && !confirm(`⚠ ${overfill.binName}'s capacity is ${overfill.capacityBu.toLocaleString()} BU — this load would bring it to ${overfill.wouldBeBu.toFixed(0)} BU (${overfill.overBy.toFixed(0)} BU over). Continue anyway?`)) return;
const now = new Date();
const load = {
id:nextId.current++, net:netLbs, ts:now.getTime(),
date:now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
timeOnly:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
time:now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
grainName:grain.name, grainBushelLbs:grain.bushel_lbs,
binId:activeBinId, truckId:truckColor, truckColor:activeTruck.hex, truckName:activeTruck.name, operator:operatorName,
insuranceUnit:activeUnit||"none",
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
// Same crop-mismatch guard as recording a new load — catches reassigning an
// existing load to a different bin (or correcting its grain) in a way that
// would mix crops. Excludes this load's own prior entry from the "already
// in the bin" check so fixing a typo on the bin's only load doesn't warn
// against itself.
if((updatedLoad.binId!==oldLoad.binId || updatedLoad.grainName!==oldLoad.grainName)){
const mismatch = detectCropMismatch(safeFields, safeBins, updatedLoad.binId, updatedLoad.grainName, updatedLoad.id);
if(mismatch && !confirm(`⚠ Crop mismatch: ${mismatch.binName} already has ${mismatch.existing} recorded in it. You're about to save this load as ${updatedLoad.grainName}. Continue and mix grains in this bin?`)) return;
}
// Same overfill guard as recording a new load — only relevant if the
// target bin or the load's weight actually changed; editing something
// unrelated (driver, truck, notes) shouldn't re-warn about a fill level
// that was already true before this edit.
if(updatedLoad.binId!==oldLoad.binId || updatedLoad.net!==oldLoad.net){
const targetBin = safeBins.find(b=>b.id===updatedLoad.binId);
if(targetBin){
const baseStoredLbs = updatedLoad.binId===oldLoad.binId ? Math.max(0, targetBin.storedLbs-oldLoad.net) : targetBin.storedLbs;
const targetGrain = safeGrains.find(g=>g.name===updatedLoad.grainName) || FALLBACK_GRAIN;
const overfill = detectBinOverfill({...targetBin, storedLbs:baseStoredLbs}, targetGrain, updatedLoad.net);
if(overfill && !confirm(`⚠ ${overfill.binName}'s capacity is ${overfill.capacityBu.toLocaleString()} BU — saving this load would bring it to ${overfill.wouldBeBu.toFixed(0)} BU (${overfill.overBy.toFixed(0)} BU over). Continue anyway?`)) return;
}
}
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
const nf= safeFields.map(f=>f.id===owner.id?{...f,loads:f.loads.filter(l=>l.id!==load.id)}:f);
const nb = safeBins.map(b=>b.id===load.binId?{...b,storedLbs:Math.max(0,b.storedLbs-load.net)}:b);
setFields(nf); setBins(nb); save(nf,nb,grains,trucks);
setEL(null);
};

// ── Grain marketing contracts ── written one record at a time to its own
// sub-path (tenants/{tenantId}/agriScale/contracts/{id}) rather than through
// the whole-list save() above — so, unlike fields/bins before the farm-merge
// fix, there's no full-node overwrite involved at all and no way for one
// farm's contract edit to touch another farm's contracts.
const addOrUpdateContract = async (contract) => {
const stamped = {...contract, farmId: contract.farmId || farmId || "default"};
setContracts(cs => cs.some(c=>c.id===stamped.id) ? cs.map(c=>c.id===stamped.id?stamped:c) : [...cs, stamped]);
try { await dbWrite(`${BASE}/contracts/${stamped.id}`, stamped, token); } catch(e) { console.warn("AgriScale contract save failed", e); }
};
const deleteContract = async (id) => {
setContracts(cs => cs.filter(c=>c.id!==id));
try { await dbWrite(`${BASE}/contracts/${id}`, null, token); } catch(e) { console.warn("AgriScale contract delete failed", e); }
};

// Mirror a crop-level contract summary into AgriPlan so contracted revenue
// shows up in its Actual vs Projected reports alongside actual (realized)
// revenue — kept as its own node (not merged into fieldHistory's actual
// bushels) since a contract is a forward commitment, not yet-realized
// production. Written under the current calendar year; contracts don't
// carry their own year field, so this reflects "this marketing season's
// contracts" rather than trying to infer a year from delivery dates that
// may themselves be free text (see contractDeliveryStatus in core/agriscale.js).
const mirrorContractsToAgriPlan = useCallback(async (list) => {
if (!tenantId || !token) return;
const year = new Date().getFullYear();
const byCrop = {};
(list || []).forEach(c => {
const bu = parseFloat(c.bushels) || 0;
const price = parseFloat(c.price) || 0;
if (!c.crop || bu <= 0) return;
if (!byCrop[c.crop]) byCrop[c.crop] = { contractedBu: 0, pricedBu: 0, contractedRevenue: 0 };
byCrop[c.crop].contractedBu += bu;
if (price > 0) { byCrop[c.crop].pricedBu += bu; byCrop[c.crop].contractedRevenue += bu * price; }
});
const payload = {};
Object.entries(byCrop).forEach(([crop, v]) => {
payload[crop] = { ...v, lastUpdated: new Date().toISOString(), source: "agriscale" };
});
try {
await fetch(`https://agrilogix-1bd06-default-rtdb.firebaseio.com/${AP_BASE}/contracts/${year}.json?auth=${token}`, {
method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
});
} catch (e) { console.warn("Contract mirror to AgriPlan failed", e); }
}, [tenantId, token, AP_BASE]);

// Re-mirror whenever contracts change (add/edit/delete) — gated on !loading
// so the initial empty state before contracts finish loading doesn't briefly
// overwrite AgriPlan's copy with nothing.
useEffect(() => {
if (loading) return;
mirrorContractsToAgriPlan(contracts);
}, [contracts, loading, mirrorContractsToAgriPlan]);

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
// Rows with no insurance unit are dropped here — "Summary by Field" above
// already covers plain field totals, so a unit-less row would just repeat it.
const unitBreakdown = useMemo(()=>buildUnitBreakdown(safeFields), [safeFields]);
const guaranteeProgress = useMemo(()=>buildGuaranteeProgress(safeFields), [safeFields]);
const binSummary = useMemo(()=>buildBinSummary(safeFields, safeBins, safeGrains), [safeFields, safeBins, safeGrains]);
const marketingSummary = useMemo(()=>buildMarketingSummary(safeFields, contracts), [safeFields, contracts]);
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
const yr = new Date().getFullYear();
const [fieldData, actData, apData] = await Promise.all([
dbRead(`${flBase}/fields`, token).catch(() => null),
dbRead(`${flBase}/activities`, token).catch(() => null),
dbRead(`${AP_BASE}/fields/${yr}`, token).catch(() => null),
]);
const flFields = obj2arr(fieldData || {}).filter(Boolean);
const activities = obj2arr(actData || {}).filter(Boolean);
// Farm/tract lookup by field name, for the Farm+Field naming preview below.
const norm = s => (s||"").trim().toLowerCase();
const apByName = {};
obj2arr(apData || {}).filter(Boolean).forEach(a => { if (a?.common) apByName[norm(a.common)] = a; });
setFlApByName(apByName);
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
setFLAcresOv(Object.fromEntries(newOnly.map(f => [f.id, String(f.acres || apByName[norm(f.name)]?.acres || "")])));
} catch(e) { setFLFields([]); }
finally { setFLLoading(false); }
};

// ── Make sure every crop coming in from an import exists as a commodity ──
// ── Normalize a crop name so blends read the same everywhere, regardless of source ──
// AgriPlan stores blends like "Austrians/Mustard"; FieldLog shows them as "Austrians + Mustard".
// Canonical form used throughout AgriScale is " + ", so both sources resolve to one commodity.
const normalizeCropName = (crop) => (crop||"").replace(/\s*\/\s*/g, " + ").trim();

const ensureGrainsForCrops = (cropNames, currentGrains) => {
const canon = s => (s||"").toLowerCase().replace(/[^a-z0-9]+/g, "");
let ng = [...currentGrains];
cropNames.forEach(crop => {
if(!crop) return;
const label = crop.trim().toUpperCase();
if(!label || label.toLowerCase()==="chem-fallow") return;
const exists = ng.some(g=>canon(g.name)===canon(label));
if(!exists){
const color = GRAIN_COLORS[ng.length % GRAIN_COLORS.length];
ng.push({ name: label, bushel_lbs: 60, color });
}
});
return ng;
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
dbRead(`${AP_BASE}/fields/${yr}`, token).catch(()=>null),
dbRead(`${AP_BASE}/cropPrices`, token).catch(()=>null),
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
// Farm/tract for the naming choice: prefer the matched AgriPlan record's
// farm field, fall back to the "Farm: X" convention FieldLog notes use.
const farmTract = ap?.farm || (f.notes||"").match(/^Farm:\s*(.+)$/)?.[1] || "";

return {
id: genId(),
name: buildImportName(f.name, farmTract, ap?.fieldNum),
acres: parseFloat(flAcresOv[f.id]) || 0,
farmId: farmId || "default",
loads: [], costs: {},
grainPrice: cp?.projPrice ? String(cp.projPrice) : "",
// Pull from AgriPlan if available
landlord: ap?.landlord || "",
cropShare: ap?.sharePercent!=null ? String(ap.sharePercent) : "",
insType: ap?.insuranceType || "",
insCoverageLevel: ap?.coverageLevel!=null ? String(ap.coverageLevel) : "",
insGuaranteedYield:ap?.aphYield!=null ? String(ap.aphYield) : "",
insPriceElection: cp?.priceGuar ? String(cp.priceGuar) : "",
insInsuredAcres: ap?.insuredAcres!=null ? String(ap.insuredAcres) : "",
insuranceUnits: ap?.insuranceUnits || [],
};
});

const cropsUsed = toImport.map(f => apFields.find(a => norm(a.common) === norm(f.name))?.crop).filter(Boolean).map(normalizeCropName);
const ng = ensureGrainsForCrops(cropsUsed, grains);

const nf = [...fields, ...newFields];
setFields(nf); setGrains(ng); save(nf, bins, ng, trucks);
setFLImportModal(false);
};

// ── Import fields directly from AgriPlan (for tenants not using FieldLog) ──
const openAPImport = async () => {
setAPLoading(true); setAPImportModal(true); setAPSelected(new Set());
try {
const yr = new Date().getFullYear();
const apData = await dbRead(`${AP_BASE}/fields/${yr}`, token).catch(() => null);
const apAll = obj2arr(apData || {}).filter(Boolean);
// Exclude fields already in AgriScale by name
const existingNames = new Set(fields.map(f => f.name.trim().toLowerCase()));
const newOnly = apAll.filter(a => a?.common && a.crop?.trim().toLowerCase()!=="chem-fallow" && !existingNames.has(a.common.trim().toLowerCase()));
setAPFields(newOnly);
setAPSelected(new Set(newOnly.map(a => a.common)));
setAPAcresOv(Object.fromEntries(newOnly.map(a => [a.common, String(a.acres || "")])));
} catch(e) { setAPFields([]); }
finally { setAPLoading(false); }
};

const importAPFields = async () => {
const toImport = apFields.filter(a => apSelected.has(a.common));
if(!toImport.length) { setAPImportModal(false); return; }

let cropPrices = {};
try {
const cpData = await dbRead(`${AP_BASE}/cropPrices`, token).catch(()=>null);
const cpArr = Array.isArray(cpData) ? cpData : obj2arr(cpData||{});
cpArr.forEach(p=>{ if(p?.crop) cropPrices[p.crop]={priceGuar:p.priceGuar||0,projPrice:p.projPrice||0}; });
} catch(e) {}

const newFields = toImport.map(ap => {
const cp = ap.crop ? cropPrices[ap.crop] : null;
return {
id: genId(),
name: buildImportName(ap.common, ap.farm, ap.fieldNum),
acres: parseFloat(apAcresOv[ap.common]) || 0,
farmId: farmId || "default",
loads: [], costs: {},
grainPrice: cp?.projPrice ? String(cp.projPrice) : "",
// Pull straight from AgriPlan
landlord: ap.landlord || "",
cropShare: ap.sharePercent!=null ? String(ap.sharePercent) : "",
insType: ap.insuranceType || "",
insCoverageLevel: ap.coverageLevel!=null ? String(ap.coverageLevel) : "",
insGuaranteedYield:ap.aphYield!=null ? String(ap.aphYield) : "",
insPriceElection: cp?.priceGuar ? String(cp.priceGuar) : "",
insInsuredAcres: ap.insuredAcres!=null ? String(ap.insuredAcres) : "",
insuranceUnits: ap.insuranceUnits || [],
};
});

const nf = [...fields, ...newFields];
const cropsUsed = toImport.map(a => a.crop).filter(Boolean).map(normalizeCropName);
const ng = ensureGrainsForCrops(cropsUsed, grains);
setFields(nf); setGrains(ng); save(nf, bins, ng, trucks);
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

// AgriPlan match, for the optional "also send actuals to AgriPlan" path.
// fieldHistory is keyed by AgriPlan's own field.common string, and Firebase
// paths are case-sensitive — so the write below has to use AgriPlan's exact
// common value, not AgriScale's own field name, even though the match here
// is case/whitespace-insensitive. A Set of matched-or-not would silently
// write to the wrong (never-read) key whenever the two names differ only in
// case or spacing.
const yr = new Date().getFullYear();
const apFieldData = await dbRead(`${AP_BASE}/fields/${yr}`, token).catch(() => null);
const apFieldList = obj2arr(apFieldData || {}).filter(Boolean);
const apByName = new Map(apFieldList.map(f => [(f.common||"").trim().toLowerCase(), { common: f.common, acres: parseFloat(f.acres)||0 }]));

// Build export rows — one per AgriScale field with loads.
// Bushels come from each load's own net weight + grainBushelLbs (the value
// actually stored on the load at record time — not a separate grain-name
// lookup, which can drift if that grain's lbs/bu setting changes later).
const rows = safeFields.map(f => {
const loads = (f.loads||[]).filter(Boolean);
if (!loads.length) return null;
const totalLbs = sumLoadsLbs(loads);
const totalBu = sumLoadsBushels(loads);
const apMatch = apByName.get(f.name.trim().toLowerCase()) || null;
// AgriScale's own acres is often left blank — it mostly cares about
// weight, not acreage — so fall back to AgriPlan's acres (a required
// field there) whenever AgriScale doesn't have a usable value. Without
// this, yield/ac silently comes out blank even though bushels are real.
const ownAcres = parseFloat(f.acres) || 0;
const acres = ownAcres > 0 ? ownAcres : (apMatch?.acres || 0);
const yieldPerAc = acres > 0 ? (totalBu / acres).toFixed(1) : "";
const lastDate = lastLoadDateISO(loads);
const flMatch = flByName[f.name.trim().toLowerCase()];
return {
asFieldId: f.id,
name: f.name,
acres,
totalLbs: Math.round(totalLbs),
totalBu: Math.round(totalBu),
yieldPerAc,
grainName: loads[0]?.grainName || "Unknown",
date: lastDate,
flFieldId: flMatch?.id || null,
flBase,
apCommon: apMatch?.common || null,
};
}).filter(Boolean);

setFLExportData(rows);
setFLExportSel(new Set(rows.filter(r => r.flFieldId || r.apCommon).map(r => r.asFieldId)));
} catch(e) { setFLExportData([]); }
};

const exportToFieldLog = async () => {
setFLExporting(true);
try {
const selected = flExportData.filter(r => flExportSel.has(r.asFieldId));
const toFieldLog = selected.filter(r => r.flFieldId);
const toAgriPlan = sendActualsToAgriPlan ? selected.filter(r => r.apCommon) : [];
for (const r of toFieldLog) {
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
acres: String(r.acres),
},
notes: `Exported from AgriScale — ${r.totalLbs.toLocaleString()} lbs`,
};
await dbWrite(`${r.flBase}/activities/${actId}`, activity, token);
}
// Push actual production into AgriPlan's own field-history record — the
// same place its History tab and APH/rotation suggestions already read
// from (crop/yield/acres), just with bushels/lastUpdated/source added on
// top. That's real production data showing up where AgriPlan already
// tracks production, not a second parallel node only this badge reads.
// Separate from the `fields` list AgriPlan owns outright (which it
// overwrites wholesale on every autosave), so this write can't get
// clobbered by an open AgriPlan tab.
const apFailures = [];
for (const r of toAgriPlan) {
try {
const aYr = new Date(r.date).getFullYear();
const url = `https://agrilogix-1bd06-default-rtdb.firebaseio.com/${AP_BASE}/fieldHistory/${encodeURIComponent(r.apCommon)}/${aYr}.json?auth=${token}`;
const res = await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" },
body: JSON.stringify({
crop: r.grainName, yield: r.yieldPerAc, acres: String(r.acres),
bushels: r.totalBu, lastUpdated: new Date().toISOString(), source: "agriscale",
}) });
// fetch() only rejects on a real network failure — a 401/403/400 from
// Firebase still resolves normally, so this has to be checked explicitly
// or a permission/auth problem here would silently look like success.
if (!res.ok) {
const body = await res.text().catch(() => "");
apFailures.push(`${r.name}: HTTP ${res.status} ${body}`.trim());
}
} catch(e) { apFailures.push(`${r.name}: ${e.message}`); }
}
setFLExportModal(false);
const parts = [];
const apSent = toAgriPlan.length - apFailures.length;
if (toFieldLog.length) parts.push(`${toFieldLog.length} harvest ${toFieldLog.length===1?"activity":"activities"} added to FieldLog`);
if (apSent) parts.push(`${apSent} field${apSent===1?"":"s"} sent to AgriPlan as actual production`);
if (apFailures.length) parts.push(`⚠ AgriPlan write failed for: ${apFailures.join("; ")}`);
alert(`${apFailures.length ? "⚠️" : "✅"} ${parts.join(" · ")||"Nothing to export"}`);
} catch(e) {
alert("Export failed: " + e.message);
} finally { setFLExporting(false); }
};

const TABS = ["SCALE","BINS","FIELDS","MARKET","COMM",...(perms.canReport?["REPORT"]:[])];
if(loading) return <div style={{textAlign:"center",padding:"60px",fontFamily:"'IBM Plex Mono',monospace",color:"#6a7280"}}>LOADING AGRISCALE...</div>;

return (
<>
<style>{CSS}</style>
<div className="as-wrap" style={{minHeight:"calc(100vh - 50px)",background:AS.pageGradient,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",fontFamily:"'IBM Plex Mono',monospace"}}>
<div style={{width:"100%",maxWidth:"420px",position:"relative",overflow:"hidden"}}>
<div aria-hidden="true" style={{position:"absolute",right:"-60px",bottom:"-60px",width:"280px",height:"280px",backgroundImage:"url(/icons/icon-512.png)",backgroundSize:"contain",backgroundRepeat:"no-repeat",opacity:0.1,pointerEvents:"none"}}/>

{/* Header */}
<div style={{height:"4px",borderRadius:"4px",background:`linear-gradient(90deg, ${AS.logoGreenSoft}, ${AS.logoGold})`,marginBottom:"12px"}}/>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"14px"}}>
<div>
<div style={{fontSize:"18px",fontWeight:700,color:AS.textOnDark,letterSpacing:"0.01em"}}>AgriScale</div>
<div style={{fontSize:"12px",color:AS.textOnDarkSoft,marginTop:"1px"}}>{farmName || "Default Farm"}</div>
</div>
<div style={{display:"flex",gap:"5px",flexWrap:"wrap",justifyContent:"flex-end",maxWidth:"180px"}}>
<span style={{fontSize:"10px",color:AS.textSoft,background:AS.cardAlt,border:`1px solid ${AS.border}`,borderRadius:"20px",padding:"3px 9px"}}>{operatorName}</span>
<span style={{fontSize:"10px",fontWeight:600,letterSpacing:"0.02em",color:syncStatus==="live"?AS.tealText:syncStatus==="queued"?AS.danger:AS.textSoft,background:syncStatus==="live"?AS.tealBg:syncStatus==="queued"?AS.dangerBg:AS.cardAlt,borderRadius:"20px",padding:"3px 9px"}}>{syncLabel}</span>
</div>
</div>

{/* Tabs */}
<div style={{display:"flex",gap:"4px",marginBottom:"14px",background:AS.cardAlt,borderRadius:"10px",padding:"4px"}}>
{TABS.map(t=>(
<button key={t} onClick={()=>setTab(t)} style={{cursor:"pointer",flex:1,padding:"8px 4px",fontSize:"12px",fontWeight:500,fontFamily:"'Barlow',sans-serif",borderRadius:"8px",background:tab===t?AS.card:"transparent",color:tab===t?AS.teal:AS.textSoft,border:"none",boxShadow:tab===t?`0 0 0 1px ${AS.border}`:"none",textTransform:"capitalize"}}>
{t.charAt(0)+t.slice(1).toLowerCase()}
</button>
))}
</div>

{/* ── SCALE TAB ── */}
{tab==="SCALE"&&(<>
{/* Destination bin — compact card with an inline fill bar instead of the full silo
graphic (still available on the BINS tab); stays on whatever bin was last picked. */}
{(()=>{
const g=safeGrains.find(x=>x&&x.name===activeBin?.grainName)||FALLBACK_GRAIN;
const pct=activeBin&&activeBin.capacityBu>0?Math.min(100,activeBin.storedLbs/(g.bushel_lbs||60)/activeBin.capacityBu*100):0;
return(
<div style={{background:AS.card,border:`1px solid ${AS.border}`,borderRadius:"12px",padding:"10px 12px",marginBottom:"8px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"7px"}}>
<span style={{fontSize:"11px",color:AS.textFaint,fontFamily:"'Barlow',sans-serif"}}>Destination bin</span>
{activeBin&&<span style={{fontSize:"11px",color:AS.teal,fontWeight:600,fontFamily:"'Barlow',sans-serif"}}>{pct.toFixed(0)}% full</span>}
</div>
<select
value={activeBinId!=null?String(activeBinId):""}
onChange={e=>{ const picked=sortedBins.find(b=>String(b.id)===e.target.value); if(picked) setABId(picked.id); }}
style={{width:"100%",padding:"8px 9px",fontSize:"13px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.cardAlt,border:"none",borderRadius:"8px",color:AS.text,outline:"none",marginBottom:"7px"}}
>
{sortedBins.map(b=>{
const bg=safeGrains.find(x=>x&&x.name===b.grainName)||FALLBACK_GRAIN;
const bpct=b.capacityBu>0?Math.min(100,b.storedLbs/(bg.bushel_lbs||60)/b.capacityBu*100):0;
return(<option key={b.id} value={String(b.id)}>{b.name}{b.location?` — ${b.location}`:""} ({bpct.toFixed(0)}%)</option>);
})}
</select>
<div style={{height:"6px",borderRadius:"4px",background:AS.tealBg,overflow:"hidden"}}>
<div style={{width:`${pct}%`,height:"100%",background:pct>=95?AS.danger:pct>=80?AS.amber:AS.teal,transition:"width .2s"}}/>
</div>
</div>
);
})()}

{/* Display unit + commodity + field + insurance unit + truck */}
<div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"8px"}}>
{/* Unit toggle */}
<div style={{display:"flex",gap:"5px",background:AS.cardAlt,borderRadius:"10px",padding:"4px"}}>
{UNITS.map(u=>(
<button key={u} onClick={()=>setUnit(u)} style={{cursor:"pointer",flex:1,padding:"7px 0",fontSize:"12px",fontWeight:500,fontFamily:"'Barlow',sans-serif",borderRadius:"7px",background:unit===u?AS.card:"transparent",border:"none",color:unit===u?AS.text:AS.textSoft,boxShadow:unit===u?`0 0 0 1px ${AS.border}`:"none"}}>
{u}
</button>
))}
</div>
{/* Commodity */}
<div style={{background:AS.amberBg,borderRadius:"12px",padding:"10px 12px"}}>
<div style={{fontSize:"11px",color:AS.amberText,opacity:0.75,marginBottom:"7px",fontFamily:"'Barlow',sans-serif"}}>Commodity · {grain.bushel_lbs} lbs/bu</div>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
{safeGrains.map((g,i)=>(
<button key={i} onClick={()=>setGrainIdx(i)} style={{cursor:"pointer",padding:"6px 12px",fontSize:"12px",fontWeight:500,fontFamily:"'Barlow',sans-serif",borderRadius:"20px",border:"none",background:grainIdx===i?(g.color||AS.amber):"rgba(255,255,255,.55)",color:grainIdx===i?"#fff":AS.amberText}}>
{g.name}
</button>
))}
</div>
</div>
{/* Field */}
<div style={{background:AS.greenBg,borderRadius:"12px",padding:"10px 12px"}}>
<div style={{fontSize:"11px",color:AS.greenText,opacity:0.75,marginBottom:"7px",fontFamily:"'Barlow',sans-serif"}}>Field</div>
<select
value={activeFieldId!=null?String(activeFieldId):""}
onChange={e=>{ const picked=sortedFields.find(f=>String(f.id)===e.target.value); if(picked) setAFId(picked.id); }}
style={{width:"100%",padding:"8px 9px",fontSize:"13px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:"rgba(255,255,255,.55)",border:"none",borderRadius:"8px",color:AS.greenText,outline:"none"}}
>
{sortedFields.map(f=>(
<option key={f.id} value={String(f.id)}>{f.name} ({(f.loads||[]).length})</option>
))}
</select>
{/* Live off-field bushels + avg bu/ac — same math the REPORT tab's per-field
cards use (sumLoadsBushels), just surfaced right where the loads are being
logged so whoever's running the scale can see it climb load by load without
switching tabs. Recomputes automatically since activeField comes straight
from state, which recordLoad() updates on every "Log load." */}
{activeField && (activeField.loads||[]).length > 0 && (()=>{
const fieldTotalBu = sumLoadsBushels(activeField.loads);
const fieldAcres = parseFloat(activeField.acres) || 0;
return (
<div style={{display:"flex",gap:"10px",marginTop:"9px",paddingTop:"9px",borderTop:"1px solid rgba(255,255,255,.6)"}}>
<div style={{flex:1}}>
<div style={{fontSize:"9px",letterSpacing:"0.08em",color:AS.greenText,opacity:0.65,fontFamily:"'Barlow',sans-serif"}}>OFF FIELD</div>
<div style={{fontSize:"16px",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:AS.greenText}}>{fieldTotalBu.toFixed(0)} bu</div>
</div>
<div style={{flex:1}}>
<div style={{fontSize:"9px",letterSpacing:"0.08em",color:AS.greenText,opacity:0.65,fontFamily:"'Barlow',sans-serif"}}>AVG</div>
<div style={{fontSize:"16px",fontWeight:700,fontFamily:"'IBM Plex Mono',monospace",color:AS.greenText}}>{fieldAcres>0?(fieldTotalBu/fieldAcres).toFixed(1)+" bu/ac":"—"}</div>
</div>
</div>
);
})()}
</div>
{/* Insurance Unit — pulled from the active field's Insurance Unit(s) set in AgriPlan; defaults to None. */}
<div style={{background:AS.blueBg,borderRadius:"12px",padding:"10px 12px"}}>
<div style={{fontSize:"11px",color:AS.blueText,opacity:0.75,marginBottom:"7px",fontFamily:"'Barlow',sans-serif"}}>Insurance unit</div>
<select
value={activeUnit||""}
onChange={e=>setActiveUnit(e.target.value)}
style={{width:"100%",padding:"8px 9px",fontSize:"13px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:"rgba(255,255,255,.55)",border:"none",borderRadius:"8px",color:AS.blueText,outline:"none"}}
>
<option value="">None</option>
{fieldInsUnits.map(u=>(<option key={u} value={u}>{u}</option>))}
</select>
</div>
{/* Truck */}
<div style={{background:AS.card,border:`1px solid ${AS.border}`,borderRadius:"12px",padding:"10px 12px"}}>
<div style={{fontSize:"11px",color:AS.textFaint,marginBottom:"7px",fontFamily:"'Barlow',sans-serif"}}>Truck</div>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
{safeTrucks.map(t=>(
<button key={t.id} onClick={()=>setTruckColor(t.id)} style={{cursor:"pointer",padding:"6px 12px",fontSize:"12px",fontWeight:500,fontFamily:"'Barlow',sans-serif",borderRadius:"20px",background:t.hex,color:t.text,border:"none",boxShadow:truckColor===t.id?`0 0 0 2px ${AS.text}`:"none"}}>
{t.name}
</button>
))}
</div>
</div>
</div>

{/* Weight display — dark "instrument" readout, accent stripe matches the active
commodity's own color so it visually ties back to the Commodity card above. */}
<div style={{background:AS.readout,borderRadius:"14px",padding:"20px 20px 16px",marginBottom:"10px",position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,.08)",borderTop:`3px solid ${grain.color||AS.amber}`}}>
<div style={{textAlign:"center"}}>
<div style={{fontSize:"11px",color:AS.readoutMuted,letterSpacing:"0.12em",marginBottom:"6px",fontFamily:"'Barlow',sans-serif"}}>NET WEIGHT</div>
<div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:"8px"}}>
<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"52px",fontWeight:700,color:AS.readoutText,lineHeight:1,fontVariantNumeric:"tabular-nums"}}>
{fmtWt(netLbs,unit,grain.bushel_lbs).value}
</span>
<span style={{fontSize:"18px",color:grain.color||AS.amber,fontWeight:600,fontFamily:"'Barlow',sans-serif"}}>{fmtWt(netLbs,unit,grain.bushel_lbs).label}</span>
</div>
</div>
<div style={{display:"flex",gap:"32px",marginTop:"16px",paddingTop:"12px",borderTop:`1px solid rgba(255,255,255,.1)`,justifyContent:"center"}}>
{[{label:"GROSS",lbs:rawLbs},{label:"TARE",lbs:tare}].map(({label,lbs})=>(
<div key={label} style={{textAlign:"center"}}>
<div style={{fontSize:"10px",color:AS.readoutMuted,letterSpacing:"0.1em",fontFamily:"'Barlow',sans-serif"}}>{label}</div>
<div style={{fontSize:"16px",color:AS.readoutText,fontFamily:"'IBM Plex Mono',monospace",fontWeight:600}}>{fmtWt(lbs,unit,grain.bushel_lbs).value} <span style={{fontSize:"11px",color:AS.readoutMuted}}>{fmtWt(lbs,unit,grain.bushel_lbs).label}</span></div>
</div>
))}
</div>
</div>

{/* Tare button */}
<button onClick={()=>setTare(rawLbs)} style={{cursor:"pointer",width:"100%",padding:"11px",fontSize:"13px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.cardAlt,color:AS.textSoft,border:"none",borderRadius:"10px",marginBottom:"7px"}}>
Set tare — {fmtWt(rawLbs,unit,grain.bushel_lbs).value} {fmtWt(rawLbs,unit,grain.bushel_lbs).label}
</button>

{/* Numpad */}
<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"7px",marginBottom:"9px"}}>
{["7","8","9","4","5","6","1","2","3","⌫","0","CLR"].map(k=>(
<button key={k} className="as-numkey" onClick={()=>onKey(k)} style={{cursor:"pointer",padding:"15px 0",fontSize:"17px",fontWeight:500,fontFamily:"'Barlow',sans-serif",borderRadius:"10px",background:k==="CLR"?AS.dangerBg:k==="⌫"?AS.amberBg:AS.cardAlt,color:k==="CLR"?AS.danger:k==="⌫"?AS.amberText:AS.text,border:"none"}}>
{k}
</button>
))}
</div>

{/* Record button */}
<button className="as-record-btn" onClick={recordLoad} disabled={!canRecord} style={{width:"100%",padding:"15px",fontSize:"14px",fontWeight:600,fontFamily:"'Barlow',sans-serif",letterSpacing:"0.02em",background:canRecord?AS.teal:AS.borderStrong,color:canRecord?"#fff":AS.textFaint,border:"none",borderRadius:"12px",cursor:canRecord?"pointer":"not-allowed",transition:"all .15s",animation:canRecord?"as-pulse 2s infinite":"none"}}>
Log load
</button>

{/* Recent loads for active field */}
{(activeField?.loads||[]).length > 0 && (
<div style={{marginTop:"12px",background:AS.card,border:`1px solid ${AS.border}`,borderRadius:"12px",padding:"10px 12px"}}>
<div style={{fontSize:"11px",color:AS.textFaint,marginBottom:"6px",fontFamily:"'Barlow',sans-serif"}}>Recent loads — {activeField.name}</div>
<div style={{maxHeight:"320px",overflowY:"auto"}}>
{[...(activeField?.loads||[])].reverse().slice(0,10).map(l=>{
const f=fmtWt(l.net,unit,l.grainBushelLbs||60);
const bu=(l.net/(l.grainBushelLbs||60)).toFixed(1);
const tHex=l.truckColor||"#f0f0f0";
const bn=bins.find(b=>b.id===l.binId);
return(<div key={l.id} style={{borderBottom:`1px solid ${AS.border}`,padding:"9px 2px",color:AS.text,fontFamily:"'Barlow',sans-serif"}}>
<div style={{display:"flex",gap:"8px",alignItems:"center"}}>
<div style={{width:"10px",height:"10px",borderRadius:"50%",background:tHex,flexShrink:0}}/>
<span style={{flex:1,fontSize:"18px",fontWeight:600,color:AS.text}}>{bu} <span style={{fontSize:"12px",color:AS.textFaint,fontWeight:400}}>bu</span></span>
<span style={{fontSize:"13px",color:AS.textSoft}}>{f.value} {f.label}</span>
</div>
<div style={{display:"flex",gap:"7px",alignItems:"center",marginTop:"5px",fontSize:"11px",flexWrap:"wrap"}}>
<span style={{background:AS.amberBg,borderRadius:"20px",padding:"2px 9px",color:AS.amberText}}>{l.grainName||"?"}</span>
{l.insuranceUnit&&l.insuranceUnit!=="none"&&<span style={{background:AS.blueBg,borderRadius:"20px",padding:"2px 9px",color:AS.blueText}}>{l.insuranceUnit}</span>}
<span style={{color:AS.textSoft}}>{bn?.name||"?"}</span>
{l.splitLabel&&<span style={{color:AS.textFaint}}>#{l.splitLabel}</span>}
<span style={{display:"inline-flex",alignItems:"center",gap:"4px"}}>
<span style={{width:"8px",height:"8px",borderRadius:"2px",background:tHex,flexShrink:0}}/>
<span style={{color:AS.textFaint}}>{l.truckName||""}</span>
</span>
<span style={{color:AS.textFaint}}>{l.date} {l.timeOnly}</span>
<span style={{marginLeft:"auto",display:"flex",gap:"4px"}}>
<button onClick={()=>setEL({load:l,fieldId:activeField.id})} style={{cursor:"pointer",padding:"4px 9px",fontSize:"10px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.cardAlt,color:AS.textSoft,border:"none",borderRadius:"20px"}}>Edit</button>
<button onClick={()=>{if(confirm("Delete this load?"))deleteLoad(l);}} style={{cursor:"pointer",padding:"4px 9px",fontSize:"10px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.dangerBg,color:AS.danger,border:"none",borderRadius:"20px"}}>✕</button>
</span>
</div>
</div>);
})}
</div>
<div style={{marginTop:"7px",fontSize:"12px",fontWeight:600,color:AS.teal,fontFamily:"'Barlow',sans-serif"}}>
Total: {fmtWt((activeField?.loads||[]).reduce((s,l)=>s+l.net,0),unit,grain.bushel_lbs).value} {fmtWt((activeField?.loads||[]).reduce((s,l)=>s+l.net,0),unit,grain.bushel_lbs).label}
</div>
</div>
)}
</>)}

{/* ── BINS TAB ── */}
{tab==="BINS"&&(<>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em"}}>BIN STORAGE</div>
{perms.canEditBins&&<button onClick={()=>{const nb=[...bins,{id:Date.now(),name:`BIN ${bins.length+1}`,farmId:farmId||"default",capacityBu:50000,storedLbs:0,grainName:grains[0]?.name||"WHEAT",location:""}];setBins(nb);save(fields,nb,grains,trucks);}} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD BIN</button>}
</div>
{safeBins.map(b=>(
<div key={b.id} style={{marginBottom:"10px"}}>
<BinGauge bin={b} grains={grains}/>
{perms.canEditBins&&<button onClick={()=>setEB(b)} style={{...btnBase,width:"100%",padding:"5px",fontSize:"9px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#6a7280",boxShadow:"0 1px 0 #c8ccc0",marginTop:"4px"}}>EDIT {b.name}</button>} </div>
))}
</>)}

{/* ── FIELDS TAB ── */}
{tab==="FIELDS"&&(<>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px",gap:"6px",flexWrap:"wrap"}}>
<div style={{fontSize:"14px",fontWeight:700,color:AS.textOnDark,fontFamily:"'Barlow',sans-serif"}}>Fields</div>
<div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
{perms.canEditFields&&<button onClick={openFLImport} style={{cursor:"pointer",padding:"6px 11px",fontSize:"11px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.greenBg,color:AS.greenText,border:"none",borderRadius:"20px"}}>↓ From FieldLog</button>}
{perms.canEditFields&&<button onClick={openAPImport} style={{cursor:"pointer",padding:"6px 11px",fontSize:"11px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.amberBg,color:AS.amberText,border:"none",borderRadius:"20px"}}>↓ From AgriPlan</button>}
{perms.canEditFields&&<button onClick={()=>{const nf=[...fields,{id:Date.now(),name:`FIELD ${safeFields.length+1}`,farmId:farmId||"default",loads:[],acres:0,costs:{},grainPrice:"",landlord:"",cropShare:"",insCoverageLevel:"",insGuaranteedYield:"",insPriceElection:"",insType:"",insInsuredAcres:""}];setFields(nf);save(nf,bins,grains,trucks);}} style={{cursor:"pointer",padding:"6px 11px",fontSize:"11px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.card,color:AS.text,border:"none",borderRadius:"20px"}}>+ Add field</button>}
</div>
</div>
{sortedFields.map(f=>{
const totalBu=(f.loads||[]).reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
return(<div key={f.id} style={{background:AS.card,border:`1px solid ${AS.border}`,borderRadius:"12px",padding:"12px 14px",marginBottom:"9px"}}>
<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"8px"}}>
<div style={{flex:1}}>
<div style={{fontSize:"14px",fontWeight:600,color:AS.text,fontFamily:"'Barlow',sans-serif",marginBottom:"4px"}}>{f.name}</div>
<div style={{fontSize:"11px",color:AS.textSoft,lineHeight:1.8,fontFamily:"'Barlow',sans-serif"}}>
{f.acres?<div>Acres: {f.acres}</div>:null}
<div>Loads: {(f.loads||[]).length} · Total: {totalBu.toFixed(0)} bu</div>
{f.grainPrice&&perms.canViewCosts&&<div style={{color:AS.teal,fontWeight:600}}>Revenue: ${(totalBu*parseFloat(f.grainPrice||0)).toFixed(0)}</div>}
{f.landlord&&perms.canViewCropShare&&<div>Landlord: {f.landlord} {f.cropShare?`· ${f.cropShare}%`:""}</div>}
{perms.canViewInsurance&&f.insType&&<div style={{color:AS.blue}}>Insurance: {f.insType} {f.insCoverageLevel?`· ${f.insCoverageLevel}%`:""} {f.insGuaranteedYield?`· ${f.insGuaranteedYield} bu/ac guar.`:""}</div>}
{perms.canViewInsurance&&(f.insuranceUnits||[]).length>0&&<div style={{color:AS.blue}}>Units: {f.insuranceUnits.map(u=>typeof u==="string"?u:`${u?.name||""}${u?.acres?` (${u.acres}ac)`:""}`).join(", ")}</div>}
</div>
</div>
{perms.canEditFields&&(
<div style={{display:"flex",gap:"4px",flexShrink:0}}>
<button onClick={()=>setEF(f)} style={{cursor:"pointer",padding:"4px 9px",fontSize:"10px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.cardAlt,color:AS.textSoft,border:"none",borderRadius:"20px"}}>Edit</button>
{safeFields.length>1&&<button onClick={()=>{if(!confirm("Delete?"))return;const nf=fields.filter(ff=>ff.id!==f.id);setFields(nf);save(nf,bins,grains,trucks);}} style={{cursor:"pointer",padding:"4px 9px",fontSize:"10px",fontWeight:500,fontFamily:"'Barlow',sans-serif",background:AS.dangerBg,color:AS.danger,border:"none",borderRadius:"20px"}}>✕</button>}
</div>
)}
</div>
{/* Mini load log */}
{(f.loads||[]).length>0&&(
<div style={{marginTop:"9px",borderTop:`1px solid ${AS.border}`,paddingTop:"7px",maxHeight:"120px",overflowY:"auto"}}>
{[...(f.loads||[])].reverse().map(l=>{
const bu=(l.net/(l.grainBushelLbs||60)).toFixed(1);
const tHex=l.truckColor||"#f0f0f0";
const bn=bins.find(b=>b.id===l.binId);
return(<div key={l.id} style={{display:"flex",gap:"7px",alignItems:"center",fontSize:"11px",color:AS.textSoft,padding:"3px 0",borderBottom:`1px solid ${AS.border}`,fontFamily:"'Barlow',sans-serif"}}>
<div style={{width:"8px",height:"8px",borderRadius:"50%",background:tHex,flexShrink:0}}/>
<span style={{color:AS.text,fontWeight:600}}>{bu} bu {l.splitLabel?`#${l.splitLabel}`:""}</span>
<span>{l.grainName}</span>
<span>{bn?.name||"?"}</span>
<span style={{marginLeft:"auto",color:AS.textFaint}}>{l.date} {l.timeOnly}</span>
</div>);
})}
</div>
)}
</div>);
})}
</>)}

{/* ── MARKET TAB ── */}
{tab==="MARKET"&&(<>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em",marginBottom:"12px"}}>GRAIN MARKETING</div>
{marketingSummary.length===0 && (
<div style={{fontSize:"10px",color:"#b0a870",textAlign:"center",padding:"14px 0",marginBottom:"12px"}}>No harvested bushels or contracts logged yet</div>
)}
{marketingSummary.map(m=>{
const over = m.uncommittedBu < 0;
return (
<div key={m.crop} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"8px"}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"12px",color:"#4a5568",letterSpacing:"0.08em",marginBottom:"6px"}}>{m.crop}</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px",textAlign:"center"}}>
<div>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"15px",color:"#4a7535"}}>{m.harvestedBu.toFixed(0)}</div>
<div style={{fontSize:"8px",color:"#6a7280",letterSpacing:"0.1em"}}>HARVESTED</div>
</div>
<div>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"15px",color:"#1E5078"}}>{m.contractedBu.toFixed(0)}</div>
<div style={{fontSize:"8px",color:"#6a7280",letterSpacing:"0.1em"}}>CONTRACTED</div>
</div>
<div>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"15px",color:over?"#c47d0a":"#4a5568"}}>{Math.abs(m.uncommittedBu).toFixed(0)}</div>
<div style={{fontSize:"8px",color:"#6a7280",letterSpacing:"0.1em"}}>{over?"FORWARD SOLD":"UNCOMMITTED"}</div>
</div>
</div>
</div>
);
})}

<div style={{fontFamily:"'Orbitron',monospace",fontSize:"13px",color:"#4a5568",letterSpacing:"0.12em",marginBottom:"10px",marginTop:"20px"}}>CONTRACTS</div>
{contracts.length===0 && !addingContract && (
<div style={{fontSize:"10px",color:"#b0a870",textAlign:"center",padding:"14px 0",marginBottom:"8px"}}>No contracts logged yet</div>
)}
{[...contracts].sort((a,b)=>(a.crop||"").localeCompare(b.crop||"")).map(c=>{
const ds = contractDeliveryStatus(c.delivery);
const deliveryLabel = /^\d{4}-\d{2}-\d{2}$/.test(c.delivery)
? new Date(c.delivery+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
: c.delivery;
return editingContractId===c.id ? (
<ContractForm key={c.id} initial={c} grains={safeGrains} canViewCosts={perms.canViewCosts}
onSave={ct=>{addOrUpdateContract(ct);setEditingContractId(null);}} onCancel={()=>setEditingContractId(null)}/>
) : (
<div key={c.id} style={{background:"#f5f3ef",border:`1px solid ${ds.status==="overdue"?"#e0c0c0":ds.status==="soon"?"#e0cf9a":"#ddd8d0"}`,borderRadius:"4px",padding:"10px 12px",marginBottom:"6px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"8px"}}>
<div style={{minWidth:0}}>
<div style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
<div style={{fontWeight:700,fontSize:"11px",color:"#4a5568"}}>{c.crop} — {parseFloat(c.bushels||0).toLocaleString()} bu</div>
{ds.status==="overdue"&&<span style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.06em",padding:"2px 6px",borderRadius:"3px",background:"#fdeaea",color:"#c03030",border:"1px solid #e0c0c0"}}>⚠ {Math.abs(ds.daysUntil)}D OVERDUE</span>}
{ds.status==="soon"&&<span style={{fontSize:"8px",fontWeight:700,letterSpacing:"0.06em",padding:"2px 6px",borderRadius:"3px",background:"#fff6e0",color:"#8a5a00",border:"1px solid #e0cf9a"}}>⏰ {ds.daysUntil===0?"DUE TODAY":`${ds.daysUntil}D LEFT`}</span>}
</div>
<div style={{fontSize:"9px",color:"#6a7280",marginTop:"2px"}}>
{c.buyer||"—"}{deliveryLabel?` · ${deliveryLabel}`:""}{perms.canViewCosts&&c.price?` · $${parseFloat(c.price).toFixed(2)}/bu`:""}
</div>
{c.notes&&<div style={{fontSize:"9px",color:"#8a8478",marginTop:"2px",fontStyle:"italic"}}>{c.notes}</div>}
</div>
<div style={{display:"flex",gap:"4px",flexShrink:0}}>
<button onClick={()=>setEditingContractId(c.id)} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#ede9e4",color:"#4a5568",boxShadow:"0 1px 0 #c8ccc0",letterSpacing:"0.08em"}}>EDIT</button>
<button onClick={()=>{if(confirm("Delete this contract?"))deleteContract(c.id);}} style={{...btnBase,padding:"3px 8px",fontSize:"9px",background:"#fff0f0",color:"#c03030",border:"1px solid #e0c0c0"}}>✕</button>
</div>
</div>
</div>
);
})}
{addingContract ? (
<ContractForm grains={safeGrains} canViewCosts={perms.canViewCosts}
onSave={ct=>{addOrUpdateContract(ct);setAddingContract(false);}} onCancel={()=>setAddingContract(false)}/>
) : (
<button onClick={()=>setAddingContract(true)} style={{...btnBase,cursor:"pointer",width:"100%",padding:"8px",fontSize:"10px",letterSpacing:"0.1em",background:"#f5f3ef",color:"#4a5568",boxShadow:"0 2px 0 #c8ccc0"}}>+ ADD CONTRACT</button>
)}
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
<button onClick={openFLExport} style={{...btnBase,padding:"5px 10px",fontSize:"9px",letterSpacing:"0.1em",background:"#e8f0e4",color:"#4a7535",border:"1px solid #b0c8a0",boxShadow:"0 2px 0 #90a880"}}>↑ EXPORT HARVEST</button>
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

{/* Guarantee progress by Insurance Unit — bushels logged vs. guaranteed yield */}
{perms.canViewInsurance && guaranteeProgress.length>0 && (<>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.1em",marginBottom:"8px",marginTop:"4px"}}>GUARANTEE PROGRESS</div>
<div style={{background:"#fdf3df",border:"1px solid #e0c078",borderRadius:"4px",padding:"9px 11px",marginBottom:"10px",fontSize:"9px",color:"#7a5008",lineHeight:1.6,letterSpacing:"0.02em"}}>
⚠ Not a claim determination. This compares bushels logged here to the Guaranteed Yield entered on each field — it doesn't know your policy's full terms, unit structure at the insurer, or adjuster-verified yields. Contact your crop insurance agent with coverage questions.
</div>
{guaranteeProgress.map(u=>{
const pct = u.pct;
const barPct = Math.max(0,Math.min(pct,100));
const barColor = pct>=100 ? "#4a7535" : pct>=60 ? "#c47d0a" : "#b0623a";
const statusColor = pct>=100 ? "#4a7535" : "#a06010";
const statusLabel = pct>=100 ? "Guarantee bushels logged" : "Below guarantee pace so far";
return (
<div key={u.unit} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"8px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px",flexWrap:"wrap",gap:"4px"}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"12px",color:"#4a5568",letterSpacing:"0.08em"}}>{u.unit}</div>
<div style={{fontSize:"9px",fontWeight:700,color:statusColor,letterSpacing:"0.04em"}}>{statusLabel}</div>
</div>
<div style={{background:"#e8e4dc",borderRadius:"3px",height:"7px",overflow:"hidden",marginBottom:"5px"}}>
<div style={{background:barColor,height:"100%",width:`${barPct}%`}}/>
</div>
<div style={{fontSize:"9px",color:"#6a7280",fontFamily:"'IBM Plex Mono',monospace"}}>
{u.harvestedBu.toFixed(0)} of {u.guaranteeBu.toFixed(0)} guarantee bu logged ({pct.toFixed(0)}%)
</div>
</div>
);
})}
</>)}

{/* Breakdown by Insurance Unit, then Field */}
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.1em",marginBottom:"8px",marginTop:"4px"}}>BREAKDOWN BY INSURANCE UNIT</div>
{unitBreakdown.length===0 && (
<div style={{fontSize:"10px",color:"#b0a870",textAlign:"center",padding:"14px 0",marginBottom:"8px"}}>No loads with an insurance unit recorded</div>
)}
{unitBreakdown.map(u=>(
<div key={u.unit} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"10px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"6px",paddingBottom:"5px",borderBottom:"1px solid #ddd8d0"}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"12px",color:"#4a5568",letterSpacing:"0.08em"}}>{u.unit}</div>
<div style={{fontSize:"9px",color:"#6a7280"}}>
{u.totAcres!=null?`${u.totAcres} ac · `:""}{u.totBu.toFixed(0)} bu{u.unitYieldPerAc!=null?` · ${u.unitYieldPerAc.toFixed(1)} bu/ac`:""}
</div>
</div>
{u.fields.map((f,i)=>(
<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"9px",color:"#4a5568",padding:"4px 0",borderBottom:i<u.fields.length-1?"1px solid #e8e4dc":"none",gap:"8px"}}>
<div style={{flex:1,minWidth:0}}>
<span style={{fontWeight:700}}>{f.fieldName}</span> <span style={{color:"#6a7280"}}>· {f.crop} · {f.loads} load{f.loads!==1?"s":""}</span>
</div>
<div style={{display:"flex",gap:"10px",flexShrink:0,fontFamily:"'IBM Plex Mono',monospace"}}>
<span style={{color:"#c47d0a"}}>{f.totBu.toFixed(0)} bu</span>
<span>{f.unitAcres!=null?`${f.unitAcres} ac`:"—"}</span>
<span>{(f.unitAcres>0)?(f.totBu/f.unitAcres).toFixed(1)+" bu/ac":"—"}</span>
{perms.canViewCosts&&<span style={{color:"#4a7535"}}>{f.grainPrice?`$${(f.totBu*parseFloat(f.grainPrice||0)).toFixed(0)}`:"—"}</span>}
</div>
</div>
))}
<div style={{marginTop:"6px",paddingTop:"5px",borderTop:"1px dashed #ccc4b8"}}>
{u.crops.map(c=>(
<div key={c.crop} style={{fontSize:"9px",color:"#4a5568",padding:"1px 0"}}>
Total <strong>{c.crop}</strong> for {u.unit} = <span style={{fontFamily:"'IBM Plex Mono',monospace",color:"#c47d0a",fontWeight:700}}>{c.totBu.toFixed(0)} bu</span>
</div>
))}
</div>
</div>
))}

{sortedFields.map(f=>{
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

{/* Breakdown by Bin */}
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a5568",letterSpacing:"0.1em",marginBottom:"8px",marginTop:"16px"}}>BIN SUMMARY</div>
{binSummary.map(b=>(
<div key={b.id} style={{background:"#f5f3ef",border:"1px solid #ddd8d0",borderRadius:"4px",padding:"10px",marginBottom:"8px"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#4a7535",letterSpacing:"0.08em"}}>{b.name}</div>
<div style={{fontSize:"11px",fontWeight:700,color:b.pctFull>=95?"#dc2626":b.pctFull>=80?"#c47d0a":"#4a5568"}}>{b.pctFull.toFixed(1)}% FULL</div>
</div>
<div style={{fontSize:"9px",color:"#4a5568",letterSpacing:"0.08em",lineHeight:1.8}}>
<div>CROP: {b.crop}</div>
<div>LOADS: {b.loads} · TOTAL: {b.totBu.toFixed(0)} BU</div>
<div>FIELDS: {b.fields.length?b.fields.map(f=>`${f.name} (${f.bu.toFixed(0)} bu)`).join(", "):"—"}</div>
</div>
</div>
))}
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
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"14px",color:"#b0c8a0",letterSpacing:"0.12em"}}>EXPORT HARVEST</div>
{flExportData.length===0&&(
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#6a8060",textAlign:"center",padding:"20px"}}>NO FIELDS WITH LOADS TO EXPORT</div>
)}
{flExportData.length>0&&(<>
<div style={{fontSize:"10px",color:"#6a8060",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.08em",lineHeight:1.6}}>
SELECT FIELDS TO WRITE AS HARVEST ACTIVITIES IN FIELDLOG AND/OR ACTUAL YIELD IN AGRIPLAN.
FIELDS WITHOUT A NAME MATCH IN EITHER MODULE ARE GREYED OUT THERE.
</div>
<label style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 10px",borderRadius:"5px",background:"rgba(74,117,53,0.1)",border:"1px solid rgba(74,117,53,0.3)",cursor:"pointer"}}>
<input type="checkbox" checked={sendActualsToAgriPlan} onChange={()=>setSendActualsToAgriPlan(v=>!v)} style={{accentColor:"#4a7535",width:"14px",height:"14px",flexShrink:0}}/>
<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#b0c8a0",letterSpacing:"0.06em"}}>ALSO SEND ACTUAL BUSHELS TO AGRIPLAN</span>
</label>
<div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
{flExportData.map(r=>{
const sel = flExportSel.has(r.asFieldId);
const canSel = !!r.flFieldId || r.apCommon;
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
<div style={{display:"flex",gap:"10px",marginTop:"4px",flexWrap:"wrap"}}>
{!r.flFieldId&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#c06060"}}>⚠ NO MATCH IN FIELDLOG</span>}
{sendActualsToAgriPlan&&!r.apCommon&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#c06060"}}>⚠ NO MATCH IN AGRIPLAN</span>}
</div>
</div>
</label>
);
})}
</div>
<button onClick={exportToFieldLog} disabled={flExportSel.size===0||flExporting}
style={{...btnBase,padding:"10px",fontSize:"10px",letterSpacing:"0.12em",background:flExportSel.size>0?"#4a7535":"#2a3020",color:flExportSel.size>0?"#f0eeea":"#4a5548",boxShadow:flExportSel.size>0?"0 2px 0 #2a5020":"none",cursor:flExportSel.size>0?"pointer":"not-allowed"}}>
{flExporting?"EXPORTING...":`EXPORT ${flExportSel.size} FIELD${flExportSel.size!==1?"S":""}`}
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
<div style={{display:"flex",flexDirection:"column",gap:"6px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"6px",border:"1px solid rgba(255,255,255,0.08)"}}>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8a9880",letterSpacing:"0.08em"}}>NAME IMPORTED FIELDS AS</div>
<div style={{display:"flex",gap:"10px"}}>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="radio" name="importNameFormat" checked={importNameFormat==="field"} onChange={()=>setImportNameFormat("field")} style={{accentColor:"#4a7535"}}/>
FIELD ONLY
</label>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="radio" name="importNameFormat" checked={importNameFormat==="farmField"} onChange={()=>setImportNameFormat("farmField")} style={{accentColor:"#4a7535"}}/>
FARM + FIELD
</label>
</div>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="checkbox" checked={includeFieldNum} onChange={()=>setIncludeFieldNum(v=>!v)} style={{accentColor:"#4a7535"}}/>
INCLUDE FIELD #
</label>
</div>
<div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
{flFields.map(f=>{
const sel = flSelected.has(f.id);
return(
<label key={f.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"5px",cursor:"pointer",background:sel?"rgba(74,117,53,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${sel?"#4a7535":"rgba(255,255,255,0.08)"}`,transition:"all .1s"}}>
<input type="checkbox" checked={sel} onChange={()=>{const n=new Set(flSelected);sel?n.delete(f.id):n.add(f.id);setFLSelected(n);}} style={{accentColor:"#4a7535",width:"14px",height:"14px",flexShrink:0}}/>
<div style={{flex:1,minWidth:0}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#d0e4c0",letterSpacing:"0.06em"}}>{buildImportName(f.name, flApByName[(f.name||"").trim().toLowerCase()]?.farm || (f.notes||"").match(/^Farm:\s*(.+)$/)?.[1] || "", flApByName[(f.name||"").trim().toLowerCase()]?.fieldNum)}</div>
</div>
<div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}} onClick={e=>e.stopPropagation()}>
<input type="number" min="0" step="0.1" value={flAcresOv[f.id]??""} onChange={e=>setFLAcresOv(o=>({...o,[f.id]:e.target.value}))}
placeholder="acres" style={{width:"64px",background:"rgba(0,0,0,0.25)",border:`1px solid ${flAcresOv[f.id]?"rgba(255,255,255,0.15)":"#a06030"}`,borderRadius:"4px",padding:"4px 6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0",textAlign:"right"}}/>
<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#6a8060"}}>ac</span>
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
<div style={{display:"flex",flexDirection:"column",gap:"6px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"6px",border:"1px solid rgba(255,255,255,0.08)"}}>
<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8a9880",letterSpacing:"0.08em"}}>NAME IMPORTED FIELDS AS</div>
<div style={{display:"flex",gap:"10px"}}>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="radio" name="importNameFormat" checked={importNameFormat==="field"} onChange={()=>setImportNameFormat("field")} style={{accentColor:"#7a5a3a"}}/>
FIELD ONLY
</label>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="radio" name="importNameFormat" checked={importNameFormat==="farmField"} onChange={()=>setImportNameFormat("farmField")} style={{accentColor:"#7a5a3a"}}/>
FARM + FIELD
</label>
</div>
<label style={{display:"flex",alignItems:"center",gap:"6px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#d0e4c0"}}>
<input type="checkbox" checked={includeFieldNum} onChange={()=>setIncludeFieldNum(v=>!v)} style={{accentColor:"#7a5a3a"}}/>
INCLUDE FIELD #
</label>
</div>
<div style={{overflowY:"auto",flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
{apFields.map(a=>{
const sel = apSelected.has(a.common);
return(
<label key={a.common} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",borderRadius:"5px",cursor:"pointer",background:sel?"rgba(122,90,58,0.18)":"rgba(255,255,255,0.04)",border:`1px solid ${sel?"#7a5a3a":"rgba(255,255,255,0.08)"}`,transition:"all .1s"}}>
<input type="checkbox" checked={sel} onChange={()=>{const n=new Set(apSelected);sel?n.delete(a.common):n.add(a.common);setAPSelected(n);}} style={{accentColor:"#7a5a3a",width:"14px",height:"14px",flexShrink:0}}/>
<div style={{flex:1,minWidth:0}}>
<div style={{fontFamily:"'Orbitron',monospace",fontSize:"11px",color:"#e4d0c0",letterSpacing:"0.06em"}}>{buildImportName(a.common, a.farm, a.fieldNum)}</div>
{a.crop&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8a7860",marginTop:"2px"}}>{a.crop}</div>}
</div>
<div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}} onClick={e=>e.stopPropagation()}>
<input type="number" min="0" step="0.1" value={apAcresOv[a.common]??""} onChange={e=>setAPAcresOv(o=>({...o,[a.common]:e.target.value}))}
placeholder="acres" style={{width:"64px",background:"rgba(0,0,0,0.25)",border:`1px solid ${apAcresOv[a.common]?"rgba(255,255,255,0.15)":"#a06030"}`,borderRadius:"4px",padding:"4px 6px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#e4d0c0",textAlign:"right"}}/>
<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#8a7860"}}>ac</span>
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
{editLoad&&<LoadMo load={editLoad.load} bins={safeBins} grains={safeGrains}
insuranceUnits={(safeFields.find(f=>f.id===editLoad.fieldId)?.insuranceUnits||[]).map(u=>typeof u==="string"?u:(u?.name||"")).filter(Boolean)}
onSave={updateLoad} onDelete={deleteLoad} onSplit={splitLoad} onClose={()=>setEL(null)}/>}
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
const[f,setF]=useState({name:bin.name,capacityBu:bin.capacityBu,storedLbs:bin.storedLbs,grainName:bin.grainName,location:bin.location||"",shared:bin.farmId==="shared"||!bin.farmId});
const safeGrains=(Array.isArray(grains)?grains:[]).filter(Boolean);
return(<div style={moStyle} onClick={onClose}><div style={cardStyle} onClick={e=>e.stopPropagation()}>
<div style={hdrStyle}>EDIT {bin.name}</div>
<div style={lblStyle}>BIN NAME</div><input style={inStyle} value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))}/>
<div style={lblStyle}>LOCATION</div><input style={inStyle} value={f.location} onChange={e=>setF(p=>({...p,location:e.target.value}))} placeholder="e.g. Home Yard, North Farm"/>
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
const[f,setF]=useState({name:field.name,acres:field.acres||"",grainPrice:field.grainPrice||"",landlord:field.landlord||"",cropShare:field.cropShare||"",insCoverageLevel:field.insCoverageLevel||"",insGuaranteedYield:field.insGuaranteedYield||"",insPriceElection:field.insPriceElection||"",insType:field.insType||"",insInsuredAcres:field.insInsuredAcres||"",insuranceUnits:field.insuranceUnits||[]});
const[newUnitText,setNewUnitText]=useState("");
const[newUnitAcres,setNewUnitAcres]=useState("");
const s=(k,v)=>setF(p=>({...p,[k]:v}));
const addUnit=()=>{const v=newUnitText.trim();if(v){s("insuranceUnits",[...(f.insuranceUnits||[]),{name:v,acres:newUnitAcres?+newUnitAcres:""}]);setNewUnitText("");setNewUnitAcres("");}};
return(<div style={moStyle} onClick={onClose}><div style={{...cardStyle,maxWidth:"380px",maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
<div style={hdrStyle}>EDIT FIELD</div>
<div style={lblStyle}>FIELD NAME</div><input style={inStyle} value={f.name} onChange={e=>s("name",e.target.value)}/>
<div style={lblStyle}>ACRES</div><input style={inStyle} type="number" value={f.acres} onChange={e=>s("acres",e.target.value)}/>
{perms.canViewCosts&&<><div style={lblStyle}>GRAIN PRICE ($/BU)</div><input style={inStyle} type="number" step="0.01" value={f.grainPrice} onChange={e=>s("grainPrice",e.target.value)} placeholder="e.g. 7.25"/></>}
{perms.canViewCropShare&&<><div style={lblStyle}>LANDLORD</div><input style={inStyle} value={f.landlord} onChange={e=>s("landlord",e.target.value)}/><div style={lblStyle}>CROP SHARE %</div><input style={inStyle} type="number" value={f.cropShare} onChange={e=>s("cropShare",e.target.value)}/></>}
{perms.canViewInsurance&&<><div style={lblStyle}>INSURANCE TYPE</div><input style={inStyle} value={f.insType} onChange={e=>s("insType",e.target.value)} placeholder="RP, YP, APH..."/><div style={lblStyle}>COVERAGE LEVEL %</div><input style={inStyle} type="number" value={f.insCoverageLevel} onChange={e=>s("insCoverageLevel",e.target.value)}/><div style={lblStyle}>GUARANTEED YIELD (BU/AC)</div><input style={inStyle} type="number" value={f.insGuaranteedYield} onChange={e=>s("insGuaranteedYield",e.target.value)}/><div style={lblStyle}>PRICE ELECTION ($/BU)</div><input style={inStyle} type="number" step="0.01" value={f.insPriceElection} onChange={e=>s("insPriceElection",e.target.value)}/><div style={lblStyle}>INSURED ACRES</div><input style={inStyle} type="number" value={f.insInsuredAcres} onChange={e=>s("insInsuredAcres",e.target.value)}/></>}
{perms.canViewInsurance&&<>
<div style={lblStyle}>INSURANCE UNIT(S)</div>
<div style={{marginBottom:"8px"}}>
{(f.insuranceUnits||[]).length===0 && <div style={{fontSize:"12px",color:"#8a9880",fontStyle:"italic",marginBottom:"6px"}}>None</div>}
{(f.insuranceUnits||[]).map((u,i)=>{
const uName=typeof u==="string"?u:(u?.name||"");
const uAcres=typeof u==="string"?"":(u?.acres??"");
const updUnit=(k,v)=>s("insuranceUnits",(f.insuranceUnits||[]).map((uu,ix)=>ix!==i?uu:{name:k==="name"?v:uName,acres:k==="acres"?v:uAcres}));
return(
<div key={i} style={{display:"flex",gap:"6px",alignItems:"center",marginBottom:"6px",background:"#eaf4dc",border:"1px solid #4a7535",borderRadius:"6px",padding:"6px 8px"}}>
<input value={uName} onChange={e=>updUnit("name",e.target.value)}
style={{flex:2,background:"#fff",border:"1px solid #4a8030",borderRadius:"4px",padding:"6px 8px",fontSize:"13px",fontWeight:600,color:"#1a4010",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
<input type="text" inputMode="decimal" value={uAcres} onChange={e=>updUnit("acres",decOnly(e.target.value))} placeholder="Acres"
style={{flex:1,background:"#fff",border:"1px solid #4a8030",borderRadius:"4px",padding:"6px 8px",fontSize:"13px",fontWeight:600,color:"#1a4010",fontFamily:"'IBM Plex Mono',monospace",outline:"none"}}/>
<button onClick={()=>s("insuranceUnits",(f.insuranceUnits||[]).filter((_,ix)=>ix!==i))}
style={{background:"none",border:"none",color:"#c02020",cursor:"pointer",fontSize:"18px",lineHeight:1,padding:"0 4px",fontWeight:700}}>×</button>
</div>
);
})}
</div>
<div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
<input value={newUnitText} onChange={e=>setNewUnitText(e.target.value)}
onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addUnit();}}}
placeholder="e.g. Unit 0102" style={{...inStyle,marginBottom:0,flex:2}}/>
<input type="text" inputMode="decimal" value={newUnitAcres} onChange={e=>setNewUnitAcres(decOnly(e.target.value))}
onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addUnit();}}}
placeholder="Acres" style={{...inStyle,marginBottom:0,flex:1}}/>
<button onClick={addUnit} style={{...btnBase_static,padding:"7px 14px",fontSize:"10px",letterSpacing:"0.1em",background:"#e8f0e4",color:"#4a7535",border:"1px solid #b0c8a0"}}>+ ADD</button>
</div>
</>}
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
function LoadMo({load,bins,grains,insuranceUnits=[],onSave,onDelete,onSplit,onClose}){
const[f,setF]=useState({grainName:load.grainName,grainBushelLbs:load.grainBushelLbs,net:load.net,binId:load.binId,operator:load.operator||"",insuranceUnit:load.insuranceUnit&&load.insuranceUnit!=="none"?load.insuranceUnit:""});
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
<div style={lblStyle}>INSURANCE UNIT</div>
<select style={seStyle} value={f.insuranceUnit} onChange={e=>s("insuranceUnit",e.target.value)}>
<option value="">None</option>
{insuranceUnits.map(u=><option key={u} value={u}>{u}</option>)}
</select>
<div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
<MoBtn onClick={onClose}>CANCEL</MoBtn>
<MoBtn variant="primary" onClick={()=>onSave({...load,...f,net:Number(f.net),grainBushelLbs:Number(f.grainBushelLbs),insuranceUnit:f.insuranceUnit||"none"})}>SAVE</MoBtn>
</div>
<div style={{display:"flex",gap:"8px"}}>
<MoBtn onClick={()=>setSplitMode(true)}>⇄ SPLIT LOAD</MoBtn>
<MoBtn variant="danger" onClick={()=>{if(confirm("Delete this load?"))onDelete(load);}}>✕ DELETE</MoBtn>
</div>
</div></div>);
}
const btnBase_static = {cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",borderRadius:"4px",fontWeight:"bold",transition:"all 0.15s"};