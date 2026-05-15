import { useState, useEffect, useRef, useCallback } from "react";
import { dbRead, dbListen } from "../../core/firebase.js";
import { obj2arr, genId } from "../../core/helpers.js";

// ── Permission mapping from Agri Logix roles ──────────────────────
const PERMS = {
  owner:    { canViewInsurance:true,  canViewCropShare:true,  canEditFields:true,  canEditBins:true,  canViewCosts:true,  canReport:true,  canEditComm:true  },
  manager:  { canViewInsurance:false, canViewCropShare:false, canEditFields:true,  canEditBins:true,  canViewCosts:true,  canReport:true,  canEditComm:true  },
  operator: { canViewInsurance:false, canViewCropShare:false, canEditFields:false, canEditBins:false, canViewCosts:false, canReport:false, canEditComm:false },
};

// ── Constants ─────────────────────────────────────────────────────
const FALLBACK_GRAIN = { name:"WHEAT", bushel_lbs:60, color:"#D4A820" };
const TRUCK_COLORS = [
  { label:"WHITE",  value:"white",  hex:"#F0F0F0", border:"#AAA", text:"#333" },
  { label:"RED",    value:"red",    hex:"#DC2626", border:"#991B1B", text:"#FFF" },
  { label:"GREEN",  value:"green",  hex:"#16A34A", border:"#15803D", text:"#FFF" },
  { label:"BLUE",   value:"blue",   hex:"#2563EB", border:"#1D4ED8", text:"#FFF" },
  { label:"BLACK",  value:"black",  hex:"#1F2937", border:"#111827", text:"#FFF" },
  { label:"YELLOW", value:"yellow", hex:"#EAB308", border:"#CA8A04", text:"#333" },
];
const UNITS = ["LBS","TONS","BU"];
const DEFAULT_FIELDS = [
  { id:1, name:"FIELD 1", loads:[], acres:0, costs:{}, grainPrice:"", landlord:"", cropShare:"", insCoverageLevel:"", insGuaranteedYield:"", insPriceElection:"", insType:"", insInsuredAcres:"" },
];
const DEFAULT_BINS = [
  { id:101, name:"BIN 1", capacityBu:50000, storedLbs:0, grainName:"WHEAT" },
];

// ── Helpers ───────────────────────────────────────────────────────
const fmtWt = (lbs, unit, bushelLbs=60) => {
  if(unit==="TONS") return { value:(lbs/2000).toFixed(2), label:"TONS" };
  if(unit==="BU")   return { value:(lbs/(bushelLbs||60)).toFixed(1), label:"BU" };
  return { value:lbs.toLocaleString("en-US",{maximumFractionDigits:0}), label:"LBS" };
};

// ── Main module ───────────────────────────────────────────────────
export default function AgriScaleModule({ tenantId, token, userProfile, persist }) {
  const BASE = `tenants/${tenantId}/agriScale`;
  const role = userProfile?.role || "operator";
  const perms = PERMS[role] || PERMS.operator;
  const operatorName = userProfile?.name || "OPERATOR";

  // Data
  const [fields, setFields] = useState(DEFAULT_FIELDS);
  const [bins,   setBins]   = useState(DEFAULT_BINS);
  const [grains, setGrains] = useState([FALLBACK_GRAIN]);
  const [loading, setLoading] = useState(true);
  const [sync, setSync]     = useState("idle");

  // Scale UI
  const [rawInput, setRawInput] = useState("0");
  const [tare, setTare]   = useState(0);
  const [unit, setUnit]   = useState("LBS");
  const [grainIdx, setGrainIdx] = useState(0);
  const [activeFieldId, setActiveFieldId] = useState(null);
  const [activeBinId,   setActiveBinId]   = useState(null);
  const [truckColor, setTruckColor] = useState("white");

  // Tabs & modals
  const [tab, setTab]         = useState("SCALE");
  const [showReport, setShowReport] = useState(false);
  const [editField,  setEditField]  = useState(null);
  const [editBin,    setEditBin]    = useState(null);
  const [editGrain,  setEditGrain]  = useState(null);
  const [showAddGrain, setShowAddGrain] = useState(false);
  const [editLoad,   setEditLoad]   = useState(null);
  const [logFieldId, setLogFieldId] = useState(null);

  const skipRef = useRef(false);
  const nextId  = useRef(Date.now());

  // ── Load data ──────────────────────────────────────────────────
  useEffect(()=>{
    if(!tenantId) return;
    dbRead(BASE, token).then(d=>{
      if(d){
        const fl = obj2arr(d.fields||{});
        const bl = obj2arr(d.bins||{});
        const gl = obj2arr(d.customGrains||{});
        if(fl.length) setFields(fl);
        if(bl.length) setBins(bl);
        if(gl.length) setGrains(gl);
        setActiveFieldId(fl[0]?.id || DEFAULT_FIELDS[0].id);
        setActiveBinId(bl[0]?.id || DEFAULT_BINS[0].id);
        if(gl.length) setGrainIdx(0);
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[tenantId,token]);

  useEffect(()=>{
    if(loading||!tenantId) return;
    return dbListen(BASE, token, ({data:d})=>{
      if(skipRef.current||!d) return;
      if(d.fields)      setFields(obj2arr(d.fields));
      if(d.bins)        setBins(obj2arr(d.bins));
      if(d.customGrains) setGrains(obj2arr(d.customGrains));
    });
  },[loading,tenantId,token]);

  const save = useCallback((newFields, newBins, newGrains) => {
    skipRef.current = true;
    setSync("saving");
    persist("agriScale", {
      fields:      Object.fromEntries((newFields||fields).map(f=>[f.id,f])),
      bins:        Object.fromEntries((newBins||bins).map(b=>[b.id,b])),
      customGrains:Object.fromEntries((newGrains||grains).map((g,i)=>[i,g])),
    });
    setSync("saved");
    setTimeout(()=>{ skipRef.current=false; setSync("idle"); }, 1500);
  },[fields,bins,grains,persist]);

  // ── Scale computed ─────────────────────────────────────────────
  const grain = grains[grainIdx] || FALLBACK_GRAIN;
  const rawLbs = Math.min(99999, Math.max(0, parseInt(rawInput.replace(/^0+(?=\d)/,""))||0));
  const netLbs = Math.max(0, rawLbs - tare);
  const activeField = fields.find(f=>f.id===activeFieldId) || fields[0];
  const activeBin   = bins.find(b=>b.id===activeBinId)     || bins[0];

  // ── Numpad ─────────────────────────────────────────────────────
  const numpad = (k) => {
    if(k==="C") { setRawInput("0"); return; }
    if(k==="⌫") { setRawInput(p=>p.length>1?p.slice(0,-1):"0"); return; }
    setRawInput(p=>{ const n=p==="0"?String(k):p+k; return n.length>5?p:n; });
  };

  // ── Record load ────────────────────────────────────────────────
  const recordLoad = () => {
    if(netLbs < 100) return;
    const now = new Date();
    const load = {
      id: nextId.current++,
      net: netLbs, ts: now.getTime(),
      date: now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      timeOnly: now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      time: now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}),
      grainName: grain.name, grainBushelLbs: grain.bushel_lbs,
      binId: activeBinId, truckColor, operator: operatorName,
    };
    const updBin = bins.map(b=>b.id===activeBinId?{...b, storedLbs:b.storedLbs+netLbs}:b);
    const updFields = fields.map(f=>f.id===activeFieldId?{...f,loads:[...f.loads,load]}:f);
    setFields(updFields); setBins(updBin);
    save(updFields, updBin, grains);
    setRawInput("0"); setTare(0);
  };

  const setTareNow = () => setTare(rawLbs);
  const totalLoads = fields.reduce((s,f)=>s+f.loads.length,0);
  const syncColor = {idle:"#D8CEBC",saving:"#C07010",saved:"#2A5E2A",error:"#841A18"}[sync]||"#D8CEBC";

  if(loading) return <div style={{textAlign:"center",padding:"60px",color:"#7a6645"}}><div style={{fontSize:"32px",marginBottom:"8px"}}>⚖️</div>Loading AgriScale…</div>;

  const tabs = [
    ["SCALE","⚖️"],
    ["LOG","📋"],
    ["BINS","🏗️"],
    ["FIELDS","🌾"],
    ["COMM","🌿"],
    ...(perms.canReport?[["REPORT","📊"]]:[]),
  ];

  return (
    <div style={{background:"#F4EFE6",minHeight:"calc(100vh - 50px)",fontFamily:"'Barlow',sans-serif",color:"#1E1408"}}>
      {/* Header */}
      <div style={{background:"#1A2E1A",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,color:"#FFFFFF"}}>⚖️ AgriScale</div>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"1.5px"}}>{totalLoads} loads</div>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:syncColor}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",textTransform:"uppercase",letterSpacing:"1px"}}>{role} · {operatorName}</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",background:"#FFFFFF",borderBottom:"1px solid #D8CEBC",overflowX:"auto"}}>
        {tabs.map(([id,icon])=>(
          <button key={id} onClick={()=>setTab(id)} style={{padding:"10px 18px",background:"none",border:"none",borderBottom:`2px solid ${tab===id?"#C07010":"transparent"}`,color:tab===id?"#C07010":"#7A6645",fontWeight:tab===id?700:400,cursor:"pointer",fontSize:"12px",fontFamily:"'Barlow',sans-serif",whiteSpace:"nowrap",transition:"all .15s"}}>
            {icon} {id}
          </button>
        ))}
      </div>

      <div style={{padding:"20px",maxWidth:"900px",margin:"0 auto"}}>

        {/* ── SCALE TAB ── */}
        {tab==="SCALE"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
            {/* Left: Weight display + numpad */}
            <div>
              {/* Weight display */}
              <div style={{background:"#EDE9E4",border:"3px solid #B0C8A0",borderRadius:"8px",padding:"20px 24px 16px",marginBottom:"12px",boxShadow:"inset 0 2px 8px rgba(0,0,0,.06)"}}>
                <div style={{textAlign:"center",marginBottom:"8px"}}>
                  {/* NET */}
                  <div style={{fontSize:"11px",letterSpacing:"2px",color:"#6A8060",textTransform:"uppercase",marginBottom:"2px"}}>NET WEIGHT</div>
                  <div style={{fontFamily:"'Share Tech Mono',monospace,monospace",fontSize:"52px",fontWeight:700,color:"#2A4820",lineHeight:1,letterSpacing:"2px"}}>
                    {fmtWt(netLbs,unit,grain.bushel_lbs).value}
                  </div>
                  <div style={{fontSize:"14px",color:"#6A8060",letterSpacing:"3px",marginTop:"2px"}}>{fmtWt(netLbs,unit,grain.bushel_lbs).label}</div>
                </div>
                {/* GROSS / TARE */}
                <div style={{display:"flex",gap:"16px",justifyContent:"center",fontSize:"12px",color:"#7A7060",borderTop:"1px solid #C0B8A8",paddingTop:"8px",marginTop:"8px"}}>
                  <div><span style={{opacity:.7}}>GROSS: </span><strong>{fmtWt(rawLbs,unit,grain.bushel_lbs).value}</strong></div>
                  <div><span style={{opacity:.7}}>TARE: </span><strong>{fmtWt(tare,unit,grain.bushel_lbs).value}</strong></div>
                </div>
              </div>

              {/* Unit selector */}
              <div style={{display:"flex",gap:"4px",marginBottom:"10px"}}>
                {UNITS.map(u=>(
                  <button key={u} onClick={()=>setUnit(u)} style={{flex:1,padding:"7px",background:unit===u?"#2A4820":"#E8E0D4",color:unit===u?"#FFF":"#5A4A30",border:"none",borderRadius:"5px",fontWeight:700,fontSize:"12px",cursor:"pointer",letterSpacing:"1px",fontFamily:"'Barlow',sans-serif"}}>
                    {u}
                  </button>
                ))}
                <button onClick={setTareNow} style={{flex:1,padding:"7px",background:"#8B6914",color:"#FFF",border:"none",borderRadius:"5px",fontWeight:700,fontSize:"11px",cursor:"pointer",letterSpacing:"0.5px",fontFamily:"'Barlow',sans-serif"}}>
                  SET TARE
                </button>
              </div>

              {/* Numpad */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"6px"}}>
                {[7,8,9,4,5,6,1,2,3,"C",0,"⌫"].map(k=>(
                  <button key={k} onClick={()=>numpad(k)} style={{padding:"18px 10px",fontSize:k==="⌫"?"18px":"22px",fontWeight:700,background:k==="C"?"#C07010":k==="⌫"?"#8B5A2A":"#FFFFFF",color:k==="C"||k==="⌫"?"#FFF":"#1A0E04",border:"1px solid #D8CEBC",borderRadius:"6px",cursor:"pointer",fontFamily:"'Barlow',sans-serif",transition:"background .1s"}}>
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Selectors + Record */}
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {/* Grain */}
              <div style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"10px",letterSpacing:"1.5px",color:"#7A6645",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>Commodity</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                  {grains.map((g,i)=>(
                    <button key={i} onClick={()=>setGrainIdx(i)} style={{padding:"6px 10px",background:grainIdx===i?g.color||"#C07010":"transparent",color:grainIdx===i?"#FFF":"#5A4A30",border:`1px solid ${g.color||"#C07010"}`,borderRadius:"4px",fontSize:"11px",fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",fontFamily:"'Barlow',sans-serif"}}>
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field */}
              <div style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"10px",letterSpacing:"1.5px",color:"#7A6645",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>Field</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                  {fields.map(f=>(
                    <button key={f.id} onClick={()=>setActiveFieldId(f.id)} style={{padding:"6px 10px",background:activeFieldId===f.id?"#2A5E2A":"transparent",color:activeFieldId===f.id?"#FFF":"#5A4A30",border:"1px solid #2A5E2A",borderRadius:"4px",fontSize:"11px",fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",fontFamily:"'Barlow',sans-serif"}}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bin */}
              <div style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"10px",letterSpacing:"1.5px",color:"#7A6645",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>Destination Bin</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                  {bins.map(b=>{
                    const bg = activeBinId===b.id?"#1E5078":"transparent";
                    return(<button key={b.id} onClick={()=>setActiveBinId(b.id)} style={{padding:"6px 10px",background:bg,color:activeBinId===b.id?"#FFF":"#5A4A30",border:"1px solid #1E5078",borderRadius:"4px",fontSize:"11px",fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",fontFamily:"'Barlow',sans-serif"}}>
                      {b.name}
                    </button>);
                  })}
                </div>
              </div>

              {/* Truck color */}
              <div style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"12px"}}>
                <div style={{fontSize:"10px",letterSpacing:"1.5px",color:"#7A6645",textTransform:"uppercase",fontWeight:700,marginBottom:"6px"}}>Truck</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"4px"}}>
                  {TRUCK_COLORS.map(c=>(
                    <button key={c.value} onClick={()=>setTruckColor(c.value)} style={{padding:"5px 8px",background:c.hex,color:c.text,border:`2px solid ${truckColor===c.value?"#C07010":c.border}`,borderRadius:"4px",fontSize:"10px",fontWeight:700,cursor:"pointer",letterSpacing:"0.5px",fontFamily:"'Barlow',sans-serif",boxShadow:truckColor===c.value?"0 0 0 2px #C07010 inset":"none"}}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field/Load summary */}
              {activeField&&(
                <div style={{background:"#F0F8F0",border:"1px solid #A0C8A0",borderRadius:"8px",padding:"10px 12px",fontSize:"12px"}}>
                  <div style={{fontWeight:700,marginBottom:"3px",color:"#2A5E2A"}}>{activeField.name}</div>
                  <div style={{color:"#5A6A50"}}>{activeField.loads.length} loads · {(activeField.loads.reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0)).toFixed(0)} bu total</div>
                </div>
              )}

              {/* Record button */}
              <button onClick={recordLoad} disabled={netLbs<100} style={{padding:"20px",background:netLbs>=100?"#2A5E2A":"#C8C0B0",color:"#FFFFFF",border:"none",borderRadius:"8px",fontSize:"18px",fontWeight:700,cursor:netLbs>=100?"pointer":"not-allowed",letterSpacing:"1px",fontFamily:"'Barlow',sans-serif",transition:"background .15s",boxShadow:netLbs>=100?"0 2px 8px rgba(42,94,42,.3)":"none"}}>
                ✓ RECORD LOAD
              </button>
            </div>
          </div>
        )}

        {/* ── LOG TAB ── */}
        {tab==="LOG"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px",flexWrap:"wrap"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>Load Log</div>
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                <button onClick={()=>setLogFieldId(null)} style={{padding:"4px 10px",background:!logFieldId?"#C07010":"transparent",color:!logFieldId?"#FFF":"#7A6645",border:"1px solid #C07010",borderRadius:"4px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>ALL</button>
                {fields.map(f=>(
                  <button key={f.id} onClick={()=>setLogFieldId(f.id)} style={{padding:"4px 10px",background:logFieldId===f.id?"#2A5E2A":"transparent",color:logFieldId===f.id?"#FFF":"#7A6645",border:"1px solid #2A5E2A",borderRadius:"4px",fontSize:"11px",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>
                    {f.name} ({f.loads.length})
                  </button>
                ))}
              </div>
            </div>
            {fields.filter(f=>!logFieldId||f.id===logFieldId).map(f=>{
              const loads=[...f.loads].reverse();
              if(!loads.length) return null;
              return(<div key={f.id} style={{marginBottom:"20px"}}>
                <div style={{fontWeight:700,fontSize:"14px",color:"#C07010",marginBottom:"8px",paddingBottom:"5px",borderBottom:"2px solid #D8CEBC"}}>
                  🌾 {f.name} — {loads.length} loads · {(loads.reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0)).toFixed(0)} bu
                </div>
                {loads.map(l=>{
                  const bu=(l.net/(l.grainBushelLbs||60)).toFixed(1);
                  const bin=bins.find(b=>b.id===l.binId);
                  const tc=TRUCK_COLORS.find(c=>c.value===l.truckColor)||TRUCK_COLORS[0];
                  return(<div key={l.id} style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"6px",padding:"8px 12px",marginBottom:"5px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
                    <div style={{width:"12px",height:"12px",borderRadius:"50%",background:tc.hex,border:`1px solid ${tc.border}`,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:"120px"}}>
                      <div style={{fontWeight:700,fontSize:"13px"}}>{l.grainName} · {bu} bu <span style={{color:"#7A6645",fontWeight:400,fontSize:"11px"}}>({l.net.toLocaleString()} lbs)</span></div>
                      <div style={{fontSize:"11px",color:"#7A6645"}}>{l.date} {l.timeOnly} · {bin?.name||`Bin ${l.binId}`} · {l.operator}</div>
                    </div>
                    {perms.canEditFields&&(
                      <button onClick={()=>setEditLoad({load:l,fieldId:f.id})} style={{padding:"3px 8px",background:"transparent",color:"#7A6645",border:"1px solid #D8CEBC",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Edit</button>
                    )}
                    {perms.canEditFields&&(
                      <button onClick={()=>{
                        if(!confirm("Delete this load?")) return;
                        const nf=fields.map(ff=>ff.id===f.id?{...ff,loads:ff.loads.filter(ll=>ll.id!==l.id)}:ff);
                        const removedLbs=l.net;
                        const nb=bins.map(b=>b.id===l.binId?{...b,storedLbs:Math.max(0,b.storedLbs-removedLbs)}:b);
                        setFields(nf); setBins(nb); save(nf,nb,grains);
                      }} style={{padding:"3px 8px",background:"#FDF0EE",color:"#841A18",border:"1px solid rgba(132,26,24,.2)",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>✕</button>
                    )}
                  </div>);
                })}
              </div>);
            })}
          </div>
        )}

        {/* ── BINS TAB ── */}
        {tab==="BINS"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",flexWrap:"wrap",gap:"8px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>Bin Storage</div>
              {perms.canEditBins&&<button onClick={()=>{setBins(b=>{const nb=[...b,{id:Date.now(),name:`BIN ${b.length+1}`,capacityBu:50000,storedLbs:0,grainName:"WHEAT"}];save(fields,nb,grains);return nb;})}} style={{padding:"7px 14px",background:"#C07010",color:"#FFF",border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>+ Add Bin</button>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:"14px"}}>
              {bins.map(b=>{
                const g=grains.find(gg=>gg.name===b.grainName)||FALLBACK_GRAIN;
                const storedBu=b.storedLbs/(g.bushel_lbs||60);
                const pct=b.capacityBu>0?Math.min(100,storedBu/b.capacityBu*100):0;
                const fillColor=pct>=95?"#DC2626":pct>=80?"#D97706":"#2A5E2A";
                return(<div key={b.id} style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"10px",padding:"16px",textAlign:"center"}}>
                  {/* SVG bin gauge */}
                  <svg width="90" height="200" viewBox="0 0 90 200" style={{margin:"0 auto 8px",display:"block"}}>
                    <polygon points="45,2 88,30 88,170 2,170 2,30" fill="#E8E0D0" stroke="#B0A890" strokeWidth="2"/>
                    {pct>0&&<clipPath id={`clip-${b.id}`}><polygon points="45,2 88,30 88,170 2,170 2,30"/></clipPath>}
                    {pct>0&&<rect x="2" y={30+(140*(100-pct)/100)} width="86" height={140*(pct/100)} fill={fillColor} opacity="0.7" clipPath={`url(#clip-${b.id})`}/>}
                    <polygon points="45,2 88,30 88,170 2,170 2,30" fill="none" stroke="#8A7A60" strokeWidth="2"/>
                    <text x="45" y="105" textAnchor="middle" fill="#2A2010" fontSize="14" fontWeight="bold">{pct.toFixed(0)}%</text>
                    <text x="45" y="120" textAnchor="middle" fill="#5A4A30" fontSize="9">{storedBu.toFixed(0)} BU</text>
                  </svg>
                  <div style={{fontWeight:700,fontSize:"14px",marginBottom:"2px"}}>{b.name}</div>
                  <div style={{fontSize:"11px",color:"#7A6645",marginBottom:"8px"}}>{b.grainName} · cap: {b.capacityBu.toLocaleString()} bu</div>
                  <div style={{fontSize:"11px",color:"#7A6645",marginBottom:"8px"}}>{(b.storedLbs/2000).toFixed(1)} tons stored</div>
                  {perms.canEditBins&&(
                    <button onClick={()=>setEditBin(b)} style={{padding:"4px 10px",background:"transparent",color:"#7A6645",border:"1px solid #D8CEBC",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Edit</button>
                  )}
                </div>);
              })}
            </div>
          </div>
        )}

        {/* ── FIELDS TAB ── */}
        {tab==="FIELDS"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",flexWrap:"wrap",gap:"8px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>Fields</div>
              {perms.canEditFields&&<button onClick={()=>{const nf=[...fields,{id:Date.now(),name:`FIELD ${fields.length+1}`,loads:[],acres:0,costs:{},grainPrice:"",landlord:"",cropShare:"",insCoverageLevel:"",insGuaranteedYield:"",insPriceElection:"",insType:"",insInsuredAcres:""}];setFields(nf);save(nf,bins,grains);}} style={{padding:"7px 14px",background:"#C07010",color:"#FFF",border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>+ Add Field</button>}
            </div>
            {fields.map(f=>{
              const totalBu=f.loads.reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
              return(<div key={f.id} style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"10px",padding:"14px 16px",marginBottom:"10px"}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"10px",flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:"16px",marginBottom:"3px"}}>{f.name}</div>
                    <div style={{fontSize:"12px",color:"#7A6645",display:"flex",gap:"12px",flexWrap:"wrap"}}>
                      {f.acres&&<span>Acres: {f.acres}</span>}
                      <span>Loads: {f.loads.length}</span>
                      <span>Total: {totalBu.toFixed(0)} bu</span>
                      {f.grainPrice&&perms.canViewCosts&&<span style={{color:"#2A5E2A",fontWeight:600}}>Revenue: ${(totalBu*parseFloat(f.grainPrice||0)).toFixed(0)}</span>}
                      {f.landlord&&perms.canViewCropShare&&<span>Landlord: {f.landlord}</span>}
                    </div>
                    {perms.canViewInsurance&&f.insType&&(
                      <div style={{fontSize:"11px",color:"#5A4A70",marginTop:"4px"}}>Insurance: {f.insType} · {f.insCoverageLevel}% · {f.insGuaranteedYield} bu/ac guaranteed</div>
                    )}
                  </div>
                  {perms.canEditFields&&(
                    <div style={{display:"flex",gap:"6px"}}>
                      <button onClick={()=>setEditField(f)} style={{padding:"4px 10px",background:"transparent",color:"#7A6645",border:"1px solid #D8CEBC",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Edit</button>
                      {fields.length>1&&<button onClick={()=>{if(!confirm("Delete this field?"))return;const nf=fields.filter(ff=>ff.id!==f.id);setFields(nf);save(nf,bins,grains);}} style={{padding:"4px 10px",background:"#FDF0EE",color:"#841A18",border:"1px solid rgba(132,26,24,.2)",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>✕</button>}
                    </div>
                  )}
                </div>
              </div>);
            })}
          </div>
        )}

        {/* ── COMM TAB ── */}
        {tab==="COMM"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px",flexWrap:"wrap",gap:"8px"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700}}>Commodities</div>
              {perms.canEditComm&&<button onClick={()=>setShowAddGrain(true)} style={{padding:"7px 14px",background:"#C07010",color:"#FFF",border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>+ Add Commodity</button>}
            </div>
            {grains.map((g,i)=>(
              <div key={i} style={{background:"#FFFFFF",border:`1px solid ${g.color||"#D8CEBC"}`,borderLeft:`4px solid ${g.color||"#C07010"}`,borderRadius:"8px",padding:"12px 16px",marginBottom:"8px",display:"flex",alignItems:"center",gap:"12px",flexWrap:"wrap"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"15px"}}>{g.name}</div>
                  <div style={{fontSize:"12px",color:"#7A6645"}}>{g.bushel_lbs} lbs/bu</div>
                </div>
                {perms.canEditComm&&(
                  <div style={{display:"flex",gap:"5px"}}>
                    <button onClick={()=>setEditGrain({...g,idx:i})} style={{padding:"4px 9px",background:"transparent",color:"#7A6645",border:"1px solid #D8CEBC",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Edit</button>
                    {grains.length>1&&<button onClick={()=>{const ng=grains.filter((_,ii)=>ii!==i);setGrains(ng);if(grainIdx>=ng.length)setGrainIdx(0);save(fields,bins,ng);}} style={{padding:"4px 9px",background:"#FDF0EE",color:"#841A18",border:"1px solid rgba(132,26,24,.2)",borderRadius:"4px",fontSize:"11px",cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>✕</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {tab==="REPORT"&&perms.canReport&&(
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:"20px",fontWeight:700,marginBottom:"16px"}}>Harvest Report</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:"10px",marginBottom:"16px"}}>
              {[
                ["Total Loads",totalLoads],
                ["Total Fields",fields.length],
                ["Total Bushels",fields.reduce((s,f)=>s+f.loads.reduce((ss,l)=>ss+(l.net/(l.grainBushelLbs||60)),0),0).toFixed(0)],
                ["Total Tons",(fields.reduce((s,f)=>s+f.loads.reduce((ss,l)=>ss+l.net,0),0)/2000).toFixed(1)],
              ].map(([l,v])=>(
                <div key={l} style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:"22px",fontWeight:700,color:"#C07010"}}>{v}</div>
                  <div style={{fontSize:"10px",color:"#7A6645",textTransform:"uppercase",letterSpacing:"1px",marginTop:"2px"}}>{l}</div>
                </div>
              ))}
            </div>
            {fields.map(f=>{
              const totalBu=f.loads.reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
              const revenue=f.grainPrice?totalBu*parseFloat(f.grainPrice||0):null;
              if(!f.loads.length) return null;
              return(<div key={f.id} style={{background:"#FFFFFF",border:"1px solid #D8CEBC",borderRadius:"8px",padding:"14px",marginBottom:"10px"}}>
                <div style={{fontWeight:700,fontSize:"15px",color:"#C07010",marginBottom:"8px"}}>{f.name}</div>
                <div style={{display:"flex",gap:"16px",flexWrap:"wrap",fontSize:"13px"}}>
                  <div><span style={{color:"#7A6645"}}>Loads: </span><strong>{f.loads.length}</strong></div>
                  <div><span style={{color:"#7A6645"}}>Bushels: </span><strong>{totalBu.toFixed(0)}</strong></div>
                  <div><span style={{color:"#7A6645"}}>Tons: </span><strong>{(f.loads.reduce((s,l)=>s+l.net,0)/2000).toFixed(1)}</strong></div>
                  {f.acres&&<div><span style={{color:"#7A6645"}}>Bu/Ac: </span><strong>{(totalBu/f.acres).toFixed(1)}</strong></div>}
                  {revenue&&perms.canViewCosts&&<div style={{color:"#2A5E2A"}}><span>Revenue: </span><strong>${revenue.toFixed(0)}</strong></div>}
                </div>
                {/* By grain breakdown */}
                {[...new Set(f.loads.map(l=>l.grainName))].map(gn=>{
                  const gLoads=f.loads.filter(l=>l.grainName===gn);
                  const gBu=gLoads.reduce((s,l)=>s+(l.net/(l.grainBushelLbs||60)),0);
                  return(<div key={gn} style={{fontSize:"12px",color:"#7A6645",marginTop:"4px"}}>{gn}: {gBu.toFixed(0)} bu ({gLoads.length} loads)</div>);
                })}
              </div>);
            })}
          </div>
        )}

      </div>

      {/* ── Modals ── */}
      {editBin&&<BinModal bin={editBin} grains={grains} onSave={f=>{const nb=bins.map(b=>b.id===editBin.id?{...editBin,...f}:b);setBins(nb);save(fields,nb,grains);setEditBin(null);}} onDelete={()=>{if(bins.length<2)return alert("Need at least one bin.");const nb=bins.filter(b=>b.id!==editBin.id);setBins(nb);save(fields,nb,grains);setEditBin(null);}} onClose={()=>setEditBin(null)} canDelete={bins.length>1}/>}
      {editField&&<FieldModal field={editField} perms={perms} onSave={f=>{const nf=fields.map(ff=>ff.id===editField.id?{...editField,...f}:ff);setFields(nf);save(nf,bins,grains);setEditField(null);}} onClose={()=>setEditField(null)}/>}
      {(showAddGrain||editGrain)&&<GrainModal grain={editGrain} onSave={f=>{
        let ng;
        if(editGrain){ng=grains.map((g,i)=>i===editGrain.idx?{name:f.name.toUpperCase(),bushel_lbs:parseInt(f.bushel_lbs)||60,color:g.color}:g);}
        else{ng=[...grains,{name:f.name.toUpperCase(),bushel_lbs:parseInt(f.bushel_lbs)||60,color:"#C07010"}];}
        setGrains(ng);save(fields,bins,ng);setShowAddGrain(false);setEditGrain(null);
      }} onClose={()=>{setShowAddGrain(false);setEditGrain(null);}}/>}
      {editLoad&&<EditLoadModal load={editLoad.load} bins={bins} onSave={f=>{const nf=fields.map(ff=>ff.id===editLoad.fieldId?{...ff,loads:ff.loads.map(l=>l.id===editLoad.load.id?{...l,...f}:l)}:ff);setFields(nf);save(nf,bins,grains);setEditLoad(null);}} onClose={()=>setEditLoad(null)}/>}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────
function Mo({title,onClose,onSave,saveLabel,children}){
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}} onClick={onClose}>
    <div style={{background:"#FDFAF4",border:"1px solid #C4A468",borderRadius:"12px",width:"100%",maxWidth:"480px",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #D8CEBC",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"18px",fontWeight:700}}>{title}</div>
        <button style={{background:"none",border:"none",color:"#7A6645",cursor:"pointer",fontSize:"17px"}} onClick={onClose}>✕</button>
      </div>
      <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:"12px"}}>{children}</div>
      <div style={{padding:"12px 20px",borderTop:"1px solid #D8CEBC",display:"flex",justifyContent:"flex-end",gap:"8px"}}>
        <button style={{padding:"7px 14px",background:"transparent",color:"#7A6645",border:"1px solid #D8CEBC",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}} onClick={onClose}>Cancel</button>
        <button style={{padding:"7px 14px",background:"#C07010",color:"#FFF",border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}} onClick={onSave}>{saveLabel||"Save"}</button>
      </div>
    </div>
  </div>);
}
function Fg({label,children}){return(<div style={{display:"flex",flexDirection:"column",gap:"4px"}}><label style={{fontSize:"10px",letterSpacing:"1px",textTransform:"uppercase",color:"#7A6645",fontWeight:700}}>{label}</label>{children}</div>);}
function Fi(props){return(<input style={{background:"#FFF",border:"1px solid #C4A468",borderRadius:"6px",padding:"7px 10px",color:"#1E1408",fontFamily:"'Barlow',sans-serif",fontSize:"13px",outline:"none",width:"100%"}} {...props}/>);}
function Fs({children,...props}){return(<select style={{background:"#FFF",border:"1px solid #C4A468",borderRadius:"6px",padding:"7px 10px",color:"#1E1408",fontFamily:"'Barlow',sans-serif",fontSize:"13px",outline:"none",width:"100%"}} {...props}>{children}</select>);}

function BinModal({bin,grains,onSave,onDelete,onClose,canDelete}){
  const[f,setF]=useState({name:bin.name,capacityBu:bin.capacityBu,storedLbs:bin.storedLbs,grainName:bin.grainName});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title="Edit Bin" onClose={onClose} onSave={()=>onSave({...f,capacityBu:Number(f.capacityBu),storedLbs:Number(f.storedLbs)})} saveLabel="Save Bin">
    <Fg label="Bin Name"><Fi value={f.name} onChange={e=>s("name",e.target.value)}/></Fg>
    <Fg label="Capacity (bu)"><Fi type="number" value={f.capacityBu} onChange={e=>s("capacityBu",e.target.value)}/></Fg>
    <Fg label="Stored (lbs)"><Fi type="number" value={f.storedLbs} onChange={e=>s("storedLbs",e.target.value)}/></Fg>
    <Fg label="Grain Type"><Fs value={f.grainName} onChange={e=>s("grainName",e.target.value)}>{grains.map(g=><option key={g.name} value={g.name}>{g.name}</option>)}</Fs></Fg>
    {canDelete&&<button onClick={onDelete} style={{padding:"7px",background:"#FDF0EE",color:"#841A18",border:"1px solid rgba(132,26,24,.2)",borderRadius:"6px",fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"'Barlow',sans-serif"}}>Delete Bin</button>}
  </Mo>);
}

function FieldModal({field,perms,onSave,onClose}){
  const[f,setF]=useState({name:field.name,acres:field.acres||"",grainPrice:field.grainPrice||"",landlord:field.landlord||"",cropShare:field.cropShare||"",insCoverageLevel:field.insCoverageLevel||"",insGuaranteedYield:field.insGuaranteedYield||"",insPriceElection:field.insPriceElection||"",insType:field.insType||"",insInsuredAcres:field.insInsuredAcres||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title={`Edit ${field.name}`} onClose={onClose} onSave={()=>onSave(f)} saveLabel="Save Field">
    <Fg label="Field Name"><Fi value={f.name} onChange={e=>s("name",e.target.value)}/></Fg>
    <Fg label="Acres"><Fi type="number" value={f.acres} onChange={e=>s("acres",e.target.value)}/></Fg>
    {perms.canViewCosts&&<Fg label="Grain Price ($/bu)"><Fi type="number" step="0.01" value={f.grainPrice} onChange={e=>s("grainPrice",e.target.value)} placeholder="e.g. 7.25"/></Fg>}
    {perms.canViewCropShare&&<><Fg label="Landlord"><Fi value={f.landlord} onChange={e=>s("landlord",e.target.value)}/></Fg><Fg label="Crop Share %"><Fi type="number" value={f.cropShare} onChange={e=>s("cropShare",e.target.value)}/></Fg></>}
    {perms.canViewInsurance&&<><Fg label="Insurance Type"><Fi value={f.insType} onChange={e=>s("insType",e.target.value)} placeholder="RP, YP, APH…"/></Fg><Fg label="Coverage Level %"><Fi type="number" value={f.insCoverageLevel} onChange={e=>s("insCoverageLevel",e.target.value)}/></Fg><Fg label="Guaranteed Yield (bu/ac)"><Fi type="number" value={f.insGuaranteedYield} onChange={e=>s("insGuaranteedYield",e.target.value)}/></Fg><Fg label="Price Election ($/bu)"><Fi type="number" step="0.01" value={f.insPriceElection} onChange={e=>s("insPriceElection",e.target.value)}/></Fg><Fg label="Insured Acres"><Fi type="number" value={f.insInsuredAcres} onChange={e=>s("insInsuredAcres",e.target.value)}/></Fg></>}
  </Mo>);
}

function GrainModal({grain,onSave,onClose}){
  const[f,setF]=useState({name:grain?.name||"",bushel_lbs:grain?.bushel_lbs||60});
  return(<Mo title={grain?"Edit Commodity":"Add Commodity"} onClose={onClose} onSave={()=>{if(!f.name.trim())return alert("Name required.");onSave(f);}} saveLabel={grain?"Save":"Add"}>
    <Fg label="Commodity Name"><Fi value={f.name} onChange={e=>setF(p=>({...p,name:e.target.value}))} placeholder="e.g. WHEAT, CANOLA, BARLEY"/></Fg>
    <Fg label="Pounds per Bushel"><Fi type="number" value={f.bushel_lbs} onChange={e=>setF(p=>({...p,bushel_lbs:e.target.value}))} placeholder="60"/></Fg>
  </Mo>);
}

function EditLoadModal({load,bins,onSave,onClose}){
  const[f,setF]=useState({grainName:load.grainName,grainBushelLbs:load.grainBushelLbs,net:load.net,binId:load.binId,operator:load.operator||""});
  const s=(k,v)=>setF(p=>({...p,[k]:v}));
  return(<Mo title="Edit Load" onClose={onClose} onSave={()=>onSave({...f,net:Number(f.net),grainBushelLbs:Number(f.grainBushelLbs)})} saveLabel="Save">
    <Fg label="Grain"><Fi value={f.grainName} onChange={e=>s("grainName",e.target.value)}/></Fg>
    <Fg label="lbs/bu"><Fi type="number" value={f.grainBushelLbs} onChange={e=>s("grainBushelLbs",e.target.value)}/></Fg>
    <Fg label="Net Weight (lbs)"><Fi type="number" value={f.net} onChange={e=>s("net",e.target.value)}/></Fg>
    <Fg label="Bin"><Fs value={f.binId} onChange={e=>s("binId",Number(e.target.value))}>{bins.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</Fs></Fg>
    <Fg label="Operator"><Fi value={f.operator} onChange={e=>s("operator",e.target.value)}/></Fg>
  </Mo>);
}
