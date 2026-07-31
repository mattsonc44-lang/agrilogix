import { useState, useEffect } from "react";
import { dbRead } from "../../core/firebase.js";
import { obj2arr } from "../../core/helpers.js";
import { T, mkBtn } from "../../core/theme.js";
import { MODULES } from "../../core/config.js";
import { getPerms } from "../../core/permissions.js";
import { sumLoadsBushels } from "../../core/agriscale.js";

// ── Activity type styling — small local copy of FieldLog's ACTIVITY_META
// (not exported from that module) since Home only needs icon/color/label. ──
const ACT_META = {
  seeding:     { label: "Seeding",  icon: "🌱", color: "#C07010" },
  spraying:    { label: "Spraying", icon: "💧", color: "#1E5078" },
  scouting:    { label: "Scouting", icon: "🔍", color: "#2A7A3A" },
  harvest:     { label: "Harvest",  icon: "🌾", color: "#C09010" },
  tillage:     { label: "Tillage",  icon: "🚜", color: "#8B5E3C" },
  rockPicking: { label: "Rock Picking", icon: "🪨", color: "#7A6645" },
  other:       { label: "Activity", icon: "📝", color: "#7A6645" },
};
const PRI_ORDER = { high: 0, medium: 1, low: 2 };

// Same "default farm uses the unscoped legacy path" convention every module
// already follows (apBase/flBase in AgriPlan, FIELD_BASE in AgriScale, BASE in
// FieldLog) — ServiceLog is the one exception, it's tenant-wide, not per-farm.
function moduleBase(mod, tenantId, farmId) {
  if (mod === "serviceLog") return `tenants/${tenantId}/serviceLog`;
  return (!farmId || farmId === "default")
    ? `tenants/${tenantId}/${mod}`
    : `tenants/${tenantId}/farms/${farmId}/${mod}`;
}

const fmtMoney = n => "$" + Math.round(n || 0).toLocaleString();
const timeGreeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};
const relDate = iso => {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function HomeModule({ tenantId, token, userProfile, farmId, farmName, enabledModules = [], onNavigate, onHideHome }) {
  const perms = getPerms(userProfile);
  const [loading, setLoading] = useState(true);
  const [d, setD] = useState(null);
  const year = String(new Date().getFullYear());

  useEffect(() => {
    if (!tenantId || !token) return;
    let cancelled = false;
    setLoading(true);
    const has = m => enabledModules.includes(m);
    Promise.all([
      has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fields/${year}`, token).catch(() => null)      : Promise.resolve(null),
      has("agriPlan")   ? dbRead(`${moduleBase("agriPlan", tenantId, farmId)}/fieldHistory`, token).catch(() => null)        : Promise.resolve(null),
      has("fieldlog")   ? dbRead(moduleBase("fieldlog", tenantId, farmId), token).catch(() => null)                          : Promise.resolve(null),
      has("agriScale")  ? dbRead(`${moduleBase("agriScale", tenantId, farmId)}/fields`, token).catch(() => null)             : Promise.resolve(null),
      has("serviceLog") ? dbRead(moduleBase("serviceLog", tenantId, farmId), token).catch(() => null)                        : Promise.resolve(null),
    ]).then(([apFields, apHistory, flData, asFields, slData]) => {
      if (cancelled) return;
      setD({ apFields, apHistory, flData, asFields, slData });
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tenantId, token, farmId, enabledModules.join(",")]);

  if (loading || !d) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", color: T.muted, fontFamily: "'Barlow',sans-serif" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🌾</div>
        Loading your farm…
      </div>
    );
  }

  // ── AgriPlan: acres, projected revenue, insurance guarantee, actual
  // production. Deliberately does NOT reimplement AgriPlan's expense-rate
  // engine (crop defaults + field overrides) — that math lives in one place
  // (agriPlan/index.jsx) and duplicating it here would drift out of sync.
  // Revenue/guarantee here are the same simple per-field formulas AgriPlan
  // itself uses (bushels × price × acres), so they stay correct with zero
  // duplication of the expense table.
  const apFieldsArr = obj2arr(d.apFields);
  const apAcres = apFieldsArr.reduce((s, f) => s + (parseFloat(f.acres) || 0), 0);
  const revenueProjected = apFieldsArr.reduce((s, f) => s + ((f.income?.bushelProjection || 0) * (f.income?.currentPrice || 0) * (parseFloat(f.acres) || 0)), 0);
  const guarantee = apFieldsArr.reduce((s, f) => s + ((f.income?.bushelGuarantee || 0) * (f.income?.priceGuarantee || 0) * (parseFloat(f.acres) || 0)), 0);
  let actualBushels = 0, actualRevenue = 0, fieldsWithActuals = 0;
  apFieldsArr.forEach(f => {
    const act = (d.apHistory || {})[f.common]?.[year];
    const bu = parseFloat(act?.bushels) || 0;
    if (bu > 0) {
      actualBushels += bu;
      fieldsWithActuals++;
      if (f.income?.currentPrice) actualRevenue += bu * f.income.currentPrice;
    }
  });

  // ── FieldLog: fields, recent activity feed ──────────────────────────
  const flFields = obj2arr(d.flData?.fields);
  const flActivities = obj2arr(d.flData?.activities).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const recentActs = flActivities.slice(0, 6);
  const flFieldName = id => flFields.find(f => f.id === id)?.name || "Field";
  const activitiesThisWeek = flActivities.filter(a => a.date && (Date.now() - new Date(a.date).getTime()) < 7 * 86400000).length;
  const flAcres = flFields.reduce((s, f) => s + (parseFloat(f.acres) || 0), 0);

  // ── AgriScale: season bushels (production, not $ — always visible) ──
  const asFieldsArr = obj2arr(d.asFields);
  const seasonBushels = asFieldsArr.reduce((s, f) => s + sumLoadsBushels(f.loads || []), 0);
  const loadsThisWeek = asFieldsArr.reduce((s, f) => s + (f.loads || []).filter(l => l?.ts && (Date.now() - l.ts) < 7 * 86400000).length, 0);

  // ── ServiceLog: open to-dos + parts needed (todos live per-vehicle) ──
  const slVehicles = obj2arr(d.slData?.vehicles);
  const openTodos = slVehicles
    .flatMap(v => (v.todos || []).filter(t => !t.done).map(t => ({ ...t, vehicleName: v.name })))
    .sort((a, b) => (PRI_ORDER[a.priority || "medium"] ?? 1) - (PRI_ORDER[b.priority || "medium"] ?? 1));
  const partsNeeded = obj2arr(d.slData?.partsToOrder).filter(p => !p.ordered && !p.received).length;

  const acres = apAcres || flAcres;
  const showAgriPlan = enabledModules.includes("agriPlan");
  const showFieldLog = enabledModules.includes("fieldlog");
  const showAgriScale = enabledModules.includes("agriScale");
  const showServiceLog = enabledModules.includes("serviceLog");
  const firstName = (userProfile?.displayName || userProfile?.name || userProfile?.email || "").split(/[\s@]/)[0];

  const Stat = ({ icon, label, val, sub, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "14px 16px", flex: "1 1 140px", minWidth: "140px" }}>
      <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: color || T.text }}>{val}</div>
      {sub && <div style={{ fontSize: "11px", color: T.faint, marginTop: "2px" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: "24px 20px 40px", maxWidth: "1040px", margin: "0 auto", fontFamily: "'Barlow',sans-serif" }}>
      {/* Greeting */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "26px", color: T.brand, fontWeight: 700 }}>
          {timeGreeting()}{firstName ? `, ${firstName}` : ""}
        </div>
        <div style={{ fontSize: "13px", color: T.muted, marginTop: "3px" }}>
          {farmName || "Your farm"} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Stat cards — only what's naturally already tracked, nothing implying daily upkeep */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "22px" }}>
        {(showAgriPlan || showFieldLog) && <Stat icon="🌾" label="Acres" val={acres ? acres.toLocaleString() : "—"} sub={`${(apFieldsArr.length || flFields.length)} fields`} />}
        {showAgriPlan && perms.canViewCosts && <Stat icon="💵" label="Projected Revenue" val={fmtMoney(revenueProjected)} color={T.green} sub={fieldsWithActuals > 0 ? `${fmtMoney(actualRevenue)} actual so far` : "based on current plan"} />}
        {showAgriPlan && perms.canViewInsurance && <Stat icon="🛡" label="Ins. Guarantee" val={fmtMoney(guarantee)} color={T.gold} />}
        {(showAgriPlan && fieldsWithActuals > 0) || (showAgriScale && seasonBushels > 0) ? (
          <Stat icon="⚖️" label="Bushels Harvested" val={Math.round(actualBushels || seasonBushels).toLocaleString()} sub={showAgriScale && loadsThisWeek > 0 ? `${loadsThisWeek} loads this week` : (fieldsWithActuals ? `${fieldsWithActuals} field${fieldsWithActuals !== 1 ? "s" : ""} reported` : "")} />
        ) : null}
        {showFieldLog && <Stat icon="📋" label="Activity This Week" val={activitiesThisWeek} sub={`${flActivities.length} logged total`} />}
        {showServiceLog && <Stat icon="☑️" label="Open To-Dos" val={openTodos.length} color={openTodos.length > 0 ? T.warning : T.text} />}
        {showServiceLog && partsNeeded > 0 && <Stat icon="🔩" label="Parts Needed" val={partsNeeded} color={T.warning} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* Recent activity */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: T.gold }}>Recent Activity</div>
            {showFieldLog && <button onClick={() => onNavigate("fieldlog")} style={{ ...mkBtn("ghost"), padding: "3px 10px", fontSize: "11px" }}>View All →</button>}
          </div>
          {!showFieldLog && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>AgriField isn't enabled for your account.</div>}
          {showFieldLog && recentActs.length === 0 && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>No activity logged yet — get started in AgriField.</div>}
          {showFieldLog && recentActs.map(a => {
            const meta = ACT_META[a.type] || ACT_META.other;
            return (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: "16px", flexShrink: 0 }}>{meta.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: T.text }}>{meta.label} — {flFieldName(a.fieldId)}</div>
                  {a.notes && <div style={{ fontSize: "11px", color: T.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes}</div>}
                </div>
                <div style={{ fontSize: "11px", color: T.faint, flexShrink: 0 }}>{relDate(a.date)}</div>
              </div>
            );
          })}
        </div>

        {/* Needs attention */}
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: T.gold }}>Needs Attention</div>
            {showServiceLog && <button onClick={() => onNavigate("serviceLog")} style={{ ...mkBtn("ghost"), padding: "3px 10px", fontSize: "11px" }}>Open Service →</button>}
          </div>
          {!showServiceLog && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>AgriService isn't enabled for your account.</div>}
          {showServiceLog && openTodos.length === 0 && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>Nothing pending — all caught up.</div>}
          {showServiceLog && openTodos.slice(0, 6).map((t, i) => (
            <div key={t.id || i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 0", borderBottom: `1px solid ${T.border}` }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, background: t.priority === "high" ? T.danger : t.priority === "low" ? T.faint : T.warning }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.text}</div>
                <div style={{ fontSize: "11px", color: T.muted }}>{t.vehicleName}</div>
              </div>
            </div>
          ))}
          {showServiceLog && openTodos.length > 6 && <div style={{ fontSize: "11px", color: T.faint, marginTop: "6px" }}>+ {openTodos.length - 6} more</div>}
        </div>
      </div>

      {/* Quick launch */}
      <div style={{ marginTop: "22px" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "16px", color: T.gold, marginBottom: "10px" }}>Jump In</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {enabledModules.map(mid => {
            const m = MODULES[mid]; if (!m) return null;
            return (
              <button key={mid} onClick={() => onNavigate(mid)} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px",
                background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px",
                cursor: "pointer", textAlign: "left", flex: "1 1 220px", minWidth: "220px",
                fontFamily: "'Barlow',sans-serif",
              }}>
                <span style={{ fontSize: "22px" }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: m.color }}>{m.label}</div>
                  <div style={{ fontSize: "11px", color: T.muted }}>{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {onHideHome && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <button onClick={onHideHome} style={{ background: "none", border: "none", color: T.faint, fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}>
            Skip this screen next time — go straight to my modules
          </button>
        </div>
      )}
    </div>
  );
}
