import { useState, useEffect } from "react";

const DB = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";

const ALL_CROPS = [
  "Spring Wheat","Winter Wheat","CC WW","CC HAD","Barley","Durum",
  "Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians",
  "Mustard","Canola","Flax","Corn","Hemp","Soybeans","Sunflowers"
];

const CROP_GROUPS = {
  "Cereals":  ["Spring Wheat","Winter Wheat","Durum","Barley"],
  "Pulses":   ["Lentils","Chickpeas","Green Peas","Yellow Peas","Austrians"],
  "Oilseeds": ["Mustard","Canola","Flax","Sunflowers"],
  "Other":    ["Corn","Hemp","Soybeans"],
};

const INS_TYPES    = ["APH","RAMP","None"];
const COV_LEVELS   = [65,70,75,80,85];
const STEPS = ["Welcome","Crops","Prices","Fields","Done"];

const STEP_ICONS = ["🌾","🌱","💲","📍","✓"];

// ── Helpers ────────────────────────────────────────────────────────────────────
const fb = (path, tok, method="GET", body=null) =>
  fetch(`${DB}/${path}.json?auth=${tok}`,{
    method, headers:{"Content-Type":"application/json"},
    body: body ? JSON.stringify(body) : undefined
  }).then(r=>r.json()).catch(()=>null);

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position:"fixed",inset:0,background:"rgba(8,18,8,0.92)",display:"flex",
    alignItems:"center",justifyContent:"center",zIndex:9000,
    fontFamily:"'Barlow',sans-serif",
  },
  card: {
    background:"#fff",borderRadius:14,width:"100%",maxWidth:720,
    maxHeight:"92vh",display:"flex",flexDirection:"column",
    boxShadow:"0 32px 80px rgba(0,0,0,0.5)",overflow:"hidden",
  },
  header: {
    background:"#1a3612",padding:"20px 28px",display:"flex",
    alignItems:"center",justifyContent:"space-between",flexShrink:0,
  },
  body: { padding:"28px 32px",overflowY:"auto",flex:1 },
  footer: {
    padding:"16px 32px",borderTop:"1px solid #e0edd0",display:"flex",
    justifyContent:"space-between",alignItems:"center",background:"#f8fbf4",flexShrink:0,
  },
  h1: { fontFamily:"'Playfair Display',serif",fontSize:26,color:"#1a3010",marginBottom:6 },
  h2: { fontFamily:"'Playfair Display',serif",fontSize:20,color:"#1a3010",marginBottom:4 },
  sub: { fontSize:13,color:"#5a7a40",marginBottom:20,lineHeight:1.5 },
  label: { fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,
    color:"#5a7a40",display:"block",marginBottom:4 },
  input: { width:"100%",border:"1px solid #c8dca8",borderRadius:6,padding:"8px 12px",
    fontSize:13,color:"#1a3010",outline:"none",fontFamily:"'Barlow',sans-serif",
    boxSizing:"border-box" },
  select: { width:"100%",border:"1px solid #c8dca8",borderRadius:6,padding:"8px 12px",
    fontSize:13,color:"#1a3010",outline:"none",fontFamily:"'Barlow',sans-serif",
    background:"#fff",boxSizing:"border-box" },
  btnPrimary: { background:"#2a7a18",border:"none",borderRadius:7,padding:"10px 26px",
    fontSize:13,color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"'Barlow',sans-serif" },
  btnSecondary: { background:"#f0f5e8",border:"1px solid #c8dca8",borderRadius:7,
    padding:"10px 20px",fontSize:13,color:"#5a7a40",cursor:"pointer",fontFamily:"'Barlow',sans-serif" },
  btnGhost: { background:"none",border:"none",fontSize:12,color:"#8aaa60",
    cursor:"pointer",fontFamily:"'Barlow',sans-serif",textDecoration:"underline",padding:"4px" },
  row: { display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 },
  row3: { display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:14 },
  fieldCard: { background:"#f2f8ec",border:"1px solid #b8d898",borderRadius:8,
    padding:"12px 14px",marginBottom:10,fontSize:12,display:"flex",
    justifyContent:"space-between",alignItems:"flex-start" },
};

// ── Step: Welcome ──────────────────────────────────────────────────────────────
function StepWelcome({ tenantName, profile, onChange }) {
  return (
    <div>
      <div style={{textAlign:"center",marginBottom:28,padding:"12px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
          <span style={{fontSize:36}}>🌾</span>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#3a9020",letterSpacing:0.5}}>Agri Logix</span>
        </div>
        <div style={S.h1}>Welcome to your farm management platform</div>
        <div style={S.sub}>
          Let's get your operation set up — takes about 5 minutes.<br/>
          You can skip any step and come back later.
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={S.label}>Your Operation Name</label>
        <input style={S.input} value={tenantName}
          onChange={e=>onChange("tenantName",e.target.value)}
          placeholder="Agri Logix"/>
      </div>
      <div style={S.row}>
        <div>
          <label style={S.label}>Your Name</label>
          <input style={S.input} value={profile?.displayName||profile?.name||""}
            readOnly style={{...S.input,background:"#f8f8f8",color:"#888"}}/>
        </div>
        <div>
          <label style={S.label}>Email</label>
          <input style={{...S.input,background:"#f8f8f8",color:"#888"}}
            value={profile?.email||""} readOnly/>
        </div>
      </div>
      <div style={{background:"#f2f8ec",border:"1px solid #b8d898",borderRadius:8,
        padding:"14px 16px",fontSize:12,color:"#3a6020",marginTop:8}}>
        💡 You're the account owner. You can invite team members after setup and grant them access to specific modules.
      </div>
    </div>
  );
}

// ── Step: Crops ────────────────────────────────────────────────────────────────
function StepCrops({ selected, onToggle, onSelectAll, onClearAll }) {
  return (
    <div>
      <div style={S.h2}>Which crops do you grow?</div>
      <div style={{...S.sub,marginBottom:16}}>
        This configures crop dropdowns across all modules. You can update this anytime under 🌾 Crops.
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <button onClick={onSelectAll} style={S.btnSecondary}>Select All</button>
        <button onClick={onClearAll} style={S.btnGhost}>Clear</button>
        <span style={{marginLeft:"auto",fontSize:12,color:"#7a9260"}}>
          {selected.length} selected
        </span>
      </div>
      {Object.entries(CROP_GROUPS).map(([group,crops])=>(
        <div key={group} style={{marginBottom:18}}>
          <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,
            color:"#8aaa60",marginBottom:8}}>{group}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {crops.map(c=>{
              const on = selected.includes(c);
              return(
                <button key={c} onClick={()=>onToggle(c)} style={{
                  background:on?"#1a3612":"#f8fbf4",
                  border:`1px solid ${on?"#2a7a18":"#c8dca8"}`,
                  borderRadius:20,padding:"5px 14px",fontSize:12,
                  color:on?"#c8f0a8":"#3a6020",cursor:"pointer",
                  fontFamily:"'Barlow',sans-serif",fontWeight:on?700:400,
                  transition:"all 0.1s"
                }}>
                  {on?"✓ ":""}{c}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step: Prices ───────────────────────────────────────────────────────────────
function StepPrices({ crops, prices, onChange }) {
  if(!crops.length) return (
    <div style={{textAlign:"center",padding:"40px 20px",color:"#7a9260"}}>
      <div style={{fontSize:32,marginBottom:12}}>🌱</div>
      <div>Select your crops first — go back to Step 2.</div>
    </div>
  );
  return (
    <div>
      <div style={S.h2}>Set your price benchmarks</div>
      <div style={{...S.sub,marginBottom:16}}>
        Insurance Price Elections are set by RMA each spring — your agent has the current values.
        Projected Sell Price is your own estimate for planning. Both can be updated anytime under 💲 Prices.
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead>
          <tr style={{background:"#1a3612",color:"#c8f0a8"}}>
            <th style={{padding:"8px 12px",textAlign:"left",fontSize:10,letterSpacing:0.8}}>Crop</th>
            <th style={{padding:"8px 12px",textAlign:"center",fontSize:10,letterSpacing:0.8,width:160}}>
              Ins. Price Election<br/><span style={{fontWeight:400,opacity:0.7}}>$/bu</span>
            </th>
            <th style={{padding:"8px 12px",textAlign:"center",fontSize:10,letterSpacing:0.8,width:160}}>
              Projected Sell Price<br/><span style={{fontWeight:400,opacity:0.7}}>$/bu</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {crops.map((c,i)=>(
            <tr key={c} style={{background:i%2===0?"#f6f9f0":"#fff",borderBottom:"1px solid #e8f0d8"}}>
              <td style={{padding:"6px 12px",fontWeight:600,color:"#1a4010"}}>{c}</td>
              <td style={{padding:"4px 8px"}}>
                <input type="number" step="0.01" placeholder="0.00"
                  value={prices[c]?.priceGuar||""}
                  onChange={e=>{const n=parseFloat(e.target.value);onChange(c,"priceGuar",isFinite(n)?n:0);}}
                  style={{...S.input,textAlign:"right",padding:"4px 8px"}}/>
              </td>
              <td style={{padding:"4px 8px"}}>
                <input type="number" step="0.01" placeholder="0.00"
                  value={prices[c]?.projPrice||""}
                  onChange={e=>{const n=parseFloat(e.target.value);onChange(c,"projPrice",isFinite(n)?n:0);}}
                  style={{...S.input,textAlign:"right",padding:"4px 8px"}}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Step: Fields ───────────────────────────────────────────────────────────────
function StepFields({ fields, onAdd, onRemove }) {
  const blank = { name:"",acres:"",legal:"",farm:"",entity:"",landlord:"",
    sharePercent:100,insuranceType:"APH",coverageLevel:80,insuredAcres:"" };
  const [form, setForm] = useState(blank);
  const [err, setErr] = useState("");

  const upd = (k,v) => setForm(p=>({...p,[k]:v}));
  const add = () => {
    if(!form.name.trim()) { setErr("Field name is required"); return; }
    if(!form.acres) { setErr("Acres required"); return; }
    onAdd({...form,id:`field_${Date.now()}${Math.floor(Math.random()*999)}`,
      acres:+form.acres,insuredAcres:+form.insuredAcres||0,
      sharePercent:+form.sharePercent||100,
      coverageLevel:+form.coverageLevel||80,
      createdAt:new Date().toISOString().slice(0,10)});
    setForm(blank); setErr("");
  };

  return (
    <div>
      <div style={S.h2}>Add your fields</div>
      <div style={{...S.sub,marginBottom:16}}>
        Fields are shared across AgriPlan, AgriField, and AgriScale — enter once, available everywhere.
        Add boundaries in AgriField after setup.
      </div>

      {fields.length>0&&(
        <div style={{marginBottom:16}}>
          {fields.map(f=>(
            <div key={f.id} style={S.fieldCard}>
              <div>
                <strong style={{color:"#1a4010"}}>{f.name}</strong>
                <span style={{color:"#7a9260",fontSize:11,marginLeft:8}}>{f.acres} ac</span>
                {f.landlord&&<span style={{color:"#7a9260",fontSize:11,marginLeft:8}}>· {f.landlord}</span>}
                {f.sharePercent<100&&<span style={{color:"#5a8a40",fontSize:11,marginLeft:8}}>· {f.sharePercent}% share</span>}
              </div>
              <button onClick={()=>onRemove(f.id)} style={{background:"none",border:"none",
                color:"#c04040",cursor:"pointer",fontSize:14,padding:"0 4px"}}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{background:"#f8fbf4",border:"1px solid #c8dca8",borderRadius:10,padding:"16px 18px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#3a6020",marginBottom:12,
          textTransform:"uppercase",letterSpacing:0.8}}>Add a Field</div>
        {err&&<div style={{color:"#c04040",fontSize:12,marginBottom:8}}>{err}</div>}
        <div style={S.row}>
          <div>
            <label style={S.label}>Field Name *</label>
            <input style={S.input} value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="e.g. North Field"/>
          </div>
          <div>
            <label style={S.label}>Acres *</label>
            <input style={S.input} type="number" value={form.acres} onChange={e=>upd("acres",e.target.value)} placeholder="320"/>
          </div>
        </div>
        <div style={S.row}>
          <div>
            <label style={S.label}>Legal Description</label>
            <input style={S.input} value={form.legal} onChange={e=>upd("legal",e.target.value)} placeholder="e.g. 16-31N-5E"/>
          </div>
          <div>
            <label style={S.label}>Farm / Quarter</label>
            <input style={S.input} value={form.farm} onChange={e=>upd("farm",e.target.value)} placeholder="e.g. Home Farm"/>
          </div>
        </div>
        <div style={S.row}>
          <div>
            <label style={S.label}>Landlord</label>
            <input style={S.input} value={form.landlord} onChange={e=>upd("landlord",e.target.value)} placeholder="Leave blank if owned"/>
          </div>
          <div>
            <label style={S.label}>Operator Share %</label>
            <input style={S.input} type="number" value={form.sharePercent} onChange={e=>upd("sharePercent",e.target.value)} min="1" max="100"/>
          </div>
        </div>
        <div style={S.row3}>
          <div>
            <label style={S.label}>Insurance Type</label>
            <select style={S.select} value={form.insuranceType} onChange={e=>upd("insuranceType",e.target.value)}>
              {INS_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Coverage Level</label>
            <select style={S.select} value={form.coverageLevel} onChange={e=>upd("coverageLevel",+e.target.value)}>
              {COV_LEVELS.map(l=><option key={l} value={l}>{l}%</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Insured Acres</label>
            <input style={S.input} type="number" value={form.insuredAcres} onChange={e=>upd("insuredAcres",e.target.value)} placeholder={form.acres||"0"}/>
          </div>
        </div>
        <button onClick={add} style={{...S.btnPrimary,fontSize:12,padding:"8px 18px"}}>+ Add Field</button>
      </div>
    </div>
  );
}

// ── Step: Done ─────────────────────────────────────────────────────────────────
function StepDone({ crops, fields, prices }) {
  const priceCount = Object.values(prices).filter(p=>p.priceGuar>0||p.projPrice>0).length;
  return (
    <div style={{textAlign:"center",padding:"20px 0"}}>
      <div style={{fontSize:56,marginBottom:12}}>🎉</div>
      <div style={S.h1}>You're all set!</div>
      <div style={{...S.sub,marginBottom:28}}>Here's what we set up for you.</div>
      <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginBottom:28}}>
        {[
          {icon:"🌾",label:"Crops configured",val:crops.length},
          {icon:"💲",label:"Price benchmarks",val:priceCount},
          {icon:"📍",label:"Fields added",val:fields.length},
        ].map(({icon,label,val})=>(
          <div key={label} style={{background:"#f2f8ec",border:"1px solid #b8d898",borderRadius:10,
            padding:"18px 24px",minWidth:130,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:4}}>{icon}</div>
            <div style={{fontSize:28,fontWeight:700,color:"#1a3010",lineHeight:1}}>{val}</div>
            <div style={{fontSize:11,color:"#7a9260",marginTop:4}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#f8fbf4",border:"1px solid #c8dca8",borderRadius:10,
        padding:"14px 20px",fontSize:12,color:"#5a7a40",textAlign:"left"}}>
        <strong>Next steps:</strong>
        <ul style={{margin:"8px 0 0 16px",lineHeight:2}}>
          {fields.length===0&&<li>Add your fields in <strong>AgriPlan</strong> or <strong>AgriField</strong></li>}
          {priceCount===0&&<li>Set price benchmarks under <strong>💲 Prices</strong> in AgriPlan</li>}
          <li>Import your APH history in <strong>AgriPlan → Import APH</strong></li>
          <li>Draw field boundaries in <strong>AgriField</strong></li>
        </ul>
      </div>
    </div>
  );
}

// ── Main Wizard ────────────────────────────────────────────────────────────────
export default function OnboardingWizard({ tenantId, token, profile, tenant, onComplete }) {
  const [step, setStep]         = useState(0);
  const [tenantName, setTenantName] = useState("");
  const [crops, setCrops]       = useState([]);
  const [prices, setPrices]     = useState({});
  const [fields, setFields]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const atLast = step === STEPS.length - 1;

  // ── Save current step data to Firebase ───────────────────────────────────────
  const saveStep = async (stepIdx) => {
    setSaving(true); setErr("");
    try {
      if(stepIdx === 0) {
        // Save operation name to tenant profile
        await fb(`tenants/${tenantId}/profile/name`, token, "PUT", tenantName);
      } else if(stepIdx === 1) {
        // Save crop list
        await fb(`tenants/${tenantId}/agriPlan/crops`, token, "PUT", crops);
      } else if(stepIdx === 2) {
        // Save prices as array (avoids Firebase key restrictions)
        const arr = Object.entries(prices).map(([crop,v])=>({crop,...v}));
        await fb(`tenants/${tenantId}/agriPlan/cropPrices`, token, "PUT", arr);
      } else if(stepIdx === 3) {
        // Save fields to canonical store
        const obj = {};
        fields.forEach((f,i) => { obj[i] = f; });
        await fb(`tenants/${tenantId}/fields`, token, "PUT", obj);
        // Also sync to AgriPlan for current year
        const yr = new Date().getFullYear();
        const apFields = {};
        fields.forEach((f,i) => {
          apFields[i] = {
            id: f.id, common: f.name, farm: f.farm||"", entity: f.entity||"",
            legal: f.legal||"", fieldNum: "", acres: f.acres||0, crop: "",
            eligibleCrops: crops.length>0?[...crops]:[],
            income:{bushelGuarantee:0,priceGuarantee:0,bushelProjection:0,currentPrice:0},
            expenseOverrides:{},
            landlord: f.landlord||"", sharePercent: f.sharePercent||100,
            insuranceType: f.insuranceType||"APH",
            coverageLevel: f.coverageLevel||80,
            insuredAcres: f.insuredAcres||0,
          };
        });
        if(fields.length>0) {
          await fb(`tenants/${tenantId}/agriPlan/fields/${yr}`, token, "PUT", apFields);
        }
      } else if(stepIdx === 4) {
        // Mark setup complete
        await fb(`tenants/${tenantId}/setup`, token, "PUT", {
          completed: true,
          completedAt: new Date().toISOString(),
          completedBy: profile?.localId||profile?.uid||"",
        });
      }
    } catch(e) { setErr("Save failed — " + e.message); }
    setSaving(false);
  };

  const next = async () => {
    await saveStep(step);
    if(err) return;
    if(atLast) { onComplete(); return; }
    setStep(s => s+1);
  };

  const skip = async () => {
    if(atLast) { onComplete(); return; }
    setStep(s => s+1);
  };

  const back = () => setStep(s => Math.max(0, s-1));

  const toggleCrop = (c) => setCrops(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]);
  const updPrice   = (c,k,v) => setPrices(p=>({...p,[c]:{...(p[c]||{}), [k]:v}}));
  const addField   = (f) => setFields(p=>[...p,f]);
  const removeField = (id) => setFields(p=>p.filter(f=>f.id!==id));

  const canSkip = step > 0 && step < STEPS.length-1;
  const isRequired = step === 0;

  return (
    <div style={S.overlay}>
      <div style={S.card}>

        {/* Header */}
        <div style={S.header}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:22}}>🌾</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,color:"#c8f0a8",letterSpacing:0.3}}>
              Agri Logix Setup
            </span>
          </div>
          {/* Progress steps */}
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {STEPS.map((s,i)=>(
              <div key={s} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{
                  width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                  background:i<step?"#3a9020":i===step?"#fff":"rgba(255,255,255,0.15)",
                  border:`2px solid ${i<=step?"#3a9020":"rgba(255,255,255,0.3)"}`,
                  fontSize:12,fontWeight:700,
                  color:i<step?"#fff":i===step?"#1a3010":"rgba(255,255,255,0.5)",
                  transition:"all 0.2s",
                }}>
                  {i<step?"✓":STEP_ICONS[i]}
                </div>
                {i<STEPS.length-1&&(
                  <div style={{width:20,height:2,background:i<step?"#3a9020":"rgba(255,255,255,0.2)",
                    borderRadius:1,transition:"all 0.2s"}}/>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step label */}
        <div style={{padding:"10px 32px 0",background:"#f8fbf4"}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,
            color:"#8aaa60"}}>
            Step {step+1} of {STEPS.length} — {STEPS[step]}
            {canSkip&&<span style={{marginLeft:6,fontWeight:400,color:"#b8c8a0"}}>(optional)</span>}
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          {err&&<div style={{background:"#fff0f0",border:"1px solid #e08080",borderRadius:6,
            padding:"8px 12px",fontSize:12,color:"#c02020",marginBottom:16}}>{err}</div>}

          {step===0&&<StepWelcome tenantName={tenantName} profile={profile}
            onChange={(k,v)=>{ if(k==="tenantName") setTenantName(v); }}/>}
          {step===1&&<StepCrops selected={crops} onToggle={toggleCrop}
            onSelectAll={()=>setCrops([...ALL_CROPS])} onClearAll={()=>setCrops([])}/>}
          {step===2&&<StepPrices crops={crops} prices={prices} onChange={updPrice}/>}
          {step===3&&<StepFields fields={fields} onAdd={addField} onRemove={removeField}/>}
          {step===4&&<StepDone crops={crops} fields={fields} prices={prices}/>}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div>
            {step>0&&<button onClick={back} style={S.btnSecondary}>← Back</button>}
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {canSkip&&<button onClick={skip} style={S.btnGhost}>Skip this step</button>}
            <button onClick={next} disabled={saving} style={{
              ...S.btnPrimary,
              opacity: saving?0.7:1,
              minWidth:120,
            }}>
              {saving?"Saving…":atLast?"Start farming →":step===0?"Let's go →":"Save & Continue"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
