import React, { useState, useEffect } from "react";
import { T, S, mkBtn } from "../../core/theme.js";
import { dbRead, dbWrite, dbListen } from "../../core/firebase.js";
import { obj2arr, genId, nowLocal, fmtDate } from "../../core/helpers.js";

// ── Re-export the full FieldLog app scoped to this tenant ─────────
// All data lives at: tenants/{tenantId}/fieldlog/fields + activities

export default function FieldLogModule({ tenantId, token, userProfile, persist }) {
  const [fields,     setFields]  = useState([]);
  const [activities, setActs]    = useState([]);
  const [loading,    setLoading] = useState(true);
  const [view,       setView]    = useState("home");
  const [activeField,setAF]      = useState(null);
  const [showAddAct, setShowAdd] = useState(false);
  const [showImport, setShowImport]=useState(false);
  const [reportFieldId,setRFId]  = useState(null);

  const BASE = `tenants/${tenantId}/fieldlog`;

  // ── Load data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      dbRead(`${BASE}/fields`,     token).then(d=>setFields(obj2arr(d||{}))).catch(()=>{}),
      dbRead(`${BASE}/activities`, token).then(d=>setActs(obj2arr(d||{}))).catch(()=>{}),
    ]).finally(() => setLoading(false));
  }, [tenantId, token]);

  // ── Real-time listener ───────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    const unsub = dbListen(`${BASE}`, token, ({ data }) => {
      if (!data) return;
      if (data.fields)     setFields(obj2arr(data.fields));
      if (data.activities) setActs(obj2arr(data.activities));
    });
    return unsub;
  }, [tenantId, token]);

  // ── Mutations ────────────────────────────────────────────────────
  const save = (newFields, newActs) => {
    persist("fieldlog", {
      fields:     Object.fromEntries(newFields.map(f=>[f.id,f])),
      activities: Object.fromEntries(newActs.map(a=>[a.id,a])),
    });
  };

  const addField    = (f) => { const nf=[...fields,f]; setFields(nf); save(nf,activities); setView("home"); };
  const updateField = (id,u) => { const nf=fields.map(f=>f.id===id?{...f,...u}:f); setFields(nf); save(nf,activities); };
  const deleteField = (id) => {
    const nf=fields.filter(f=>f.id!==id), na=activities.filter(a=>a.fieldId!==id);
    setFields(nf); setActs(na); save(nf,na); setView("home");
  };
  const addActivity = (a) => { const na=[...activities,a]; setActs(na); save(fields,na); };
  const delActivity = (id) => { const na=activities.filter(a=>a.id!==id); setActs(na); save(fields,na); };

  const curField = activeField ? fields.find(f=>f.id===activeField.id)||activeField : null;

  if (loading) return (
    <div style={{ textAlign:"center", padding:"60px", color:T.muted }}>
      <div style={{ fontSize:"32px", marginBottom:"8px" }}>🌾</div>
      Loading FieldLog…
    </div>
  );

  // ── Dynamic imports for sub-components ───────────────────────────
  // These are the same components from the standalone FieldLog,
  // just receiving data + handlers as props instead of managing their own state.
  return (
    <FieldLogShell
      fields={fields} activities={activities}
      view={view} setView={setView}
      activeField={activeField} setAF={setAF}
      curField={curField}
      showAdd={showAddAct} setShowAdd={setShowAdd}
      showImport={showImport} setShowImport={setShowImport}
      reportFieldId={reportFieldId} setRFId={setRFId}
      addField={addField} updateField={updateField}
      deleteField={deleteField} addActivity={addActivity}
      delActivity={delActivity}
      userProfile={userProfile}
    />
  );
}

// ── The full FieldLog UI is imported inline here ──────────────────
// (This file will grow to include all the FieldLog components.
//  For now it renders a placeholder that confirms the module is wired.)
function FieldLogShell(props) {
  const { fields, activities, view, setView, curField, setAF,
          addField, updateField, deleteField, addActivity, delActivity,
          showAdd, setShowAdd, reportFieldId, setRFId, showImport, setShowImport,
          userProfile } = props;

  return (
    <div>
      <FieldLogContent {...props}/>
    </div>
  );
}

// Placeholder — the full FieldLog component tree goes here.
// In the next step this gets replaced with the full port from the standalone app.
function FieldLogContent({ fields, activities, view, setView, setAF, curField,
  addField, updateField, deleteField, addActivity, delActivity,
  showAdd, setShowAdd, setRFId, showImport, setShowImport, reportFieldId }) {
  return (
    <div style={S.content}>
      <div style={{ ...S.card, textAlign:"center", padding:"48px" }}>
        <div style={{ fontSize:"48px", marginBottom:"12px" }}>🌾</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"24px", color:T.gold, marginBottom:"8px" }}>
          FieldLog Module
        </h2>
        <p style={{ color:T.muted, marginBottom:"4px" }}>
          Multi-tenant scaffold ready. {fields.length} fields · {activities.length} activities loaded.
        </p>
        <p style={{ color:T.faint, fontSize:"12px" }}>
          Full FieldLog UI ports in next step.
        </p>
      </div>
    </div>
  );
}
