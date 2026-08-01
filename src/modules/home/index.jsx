import { useState, useEffect } from "react";
import { T, mkBtn } from "../../core/theme.js";
import { MODULES } from "../../core/config.js";
import { getPerms } from "../../core/permissions.js";
import { fetchFarmSnapshot, computeFarmStats } from "./farmStats.js";

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
  // "⚡ Quick Log" picker — null (closed), {step:"action"}, or {step:"entity", type}
  const [quickLog, setQuickLog] = useState(null);
  const year = String(new Date().getFullYear());

  useEffect(() => {
    if (!tenantId || !token) return;
    let cancelled = false;
    setLoading(true);
    fetchFarmSnapshot(tenantId, token, farmId, enabledModules, year).then(snapshot => {
      if (cancelled) return;
      setD(snapshot);
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

  // Shared per-farm fetch + math lives in ./farmStats.js so the multi-farm
  // compare view (modules/multiFarm) computes identical numbers with zero
  // duplication.
  const {
    apFieldsArr, revenueProjected, guarantee, actualBushels, actualRevenue, fieldsWithActuals,
    actualExpensesTotal, actualNet,
    flFields, flActivities, recentActs, activitiesThisWeek,
    seasonBushels, loadsThisWeek,
    openTodos, partsNeeded, lowStockItems, slVehicles, guaranteeProgress, acres, dueMaintenance,
  } = computeFarmStats(d, year);
  const flFieldName = id => flFields.find(f => f.id === id)?.name || "Field";

  const showAgriPlan = enabledModules.includes("agriPlan");
  const showFieldLog = enabledModules.includes("fieldlog");
  const showAgriScale = enabledModules.includes("agriScale");
  const showServiceLog = enabledModules.includes("serviceLog");
  const firstName = (userProfile?.displayName || userProfile?.name || userProfile?.email || "").split(/[\s@]/)[0];

  // "⚡ Quick Log" — one tap from Home straight into an add-form for a
  // specific field/vehicle, skipping module → navigate → pick-entity.
  const canLogActivity = showFieldLog && flFields.length > 0;
  const canLogService = showServiceLog && slVehicles.length > 0;
  const quickLogAvailable = canLogActivity || canLogService;
  const quickActionBtnStyle = {
    display: "flex", alignItems: "center", gap: "12px", textAlign: "left", width: "100%",
    background: T.bg, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "12px 14px",
    cursor: "pointer", fontFamily: "'Barlow',sans-serif",
  };
  const quickEntityBtnStyle = {
    textAlign: "left", padding: "10px 12px", borderRadius: "8px", border: `1px solid ${T.border}`,
    background: T.bg, cursor: "pointer", fontFamily: "'Barlow',sans-serif", fontSize: "13px",
    fontWeight: 600, color: T.text,
  };

  const Stat = ({ icon, label, val, sub, color, onClick }) => (
    <div
      onClick={onClick}
      onMouseEnter={onClick ? (e => { e.currentTarget.style.borderColor = T.borderHi; e.currentTarget.style.background = T.cardHov; }) : undefined}
      onMouseLeave={onClick ? (e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.card; }) : undefined}
      style={{
        background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "14px 16px",
        flex: "1 1 140px", minWidth: "140px", cursor: onClick ? "pointer" : "default", transition: "all .12s",
        position: "relative",
      }}>
      <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
        <span>{icon}</span>{label}
        {onClick && <span style={{ marginLeft: "auto", color: T.faint, fontSize: "10px" }}>→</span>}
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

      {/* Quick Log — one tap into an add-form, for whoever's actually out in the field */}
      {quickLogAvailable && (
        <button onClick={() => setQuickLog({ step: "action" })} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", width: "100%",
          background: T.brand, color: "#FFFFFF", border: "none", borderRadius: "10px",
          padding: "14px 18px", marginBottom: "20px", cursor: "pointer",
          fontFamily: "'Barlow',sans-serif", fontSize: "15px", fontWeight: 700,
        }}>
          <span style={{ fontSize: "18px" }}>⚡</span> Quick Log
        </button>
      )}

      {/* Stat cards — only what's naturally already tracked, nothing implying daily upkeep */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "22px" }}>
        {(showAgriPlan || showFieldLog) && <Stat icon="🌾" label="Acres" val={acres ? acres.toLocaleString() : "—"} sub={`${(apFieldsArr.length || flFields.length)} fields`} onClick={() => onNavigate(showAgriPlan ? "agriPlan" : "fieldlog")} />}
        {showAgriPlan && perms.canViewCosts && <Stat icon="💵" label="Projected Revenue" val={fmtMoney(revenueProjected)} color={T.green} sub={actualNet != null ? `${fmtMoney(actualNet)} net actual so far` : fieldsWithActuals > 0 ? `${fmtMoney(actualRevenue)} actual so far` : "based on current plan"} onClick={() => onNavigate("agriPlan")} />}
        {showAgriPlan && perms.canViewCosts && actualExpensesTotal > 0 && <Stat icon="🧾" label="Actual Expenses" val={fmtMoney(actualExpensesTotal)} color={T.warning} sub={actualNet != null ? `${fmtMoney(actualNet)} net so far` : "entered so far"} onClick={() => onNavigate("agriPlan")} />}
        {showAgriPlan && perms.canViewInsurance && <Stat icon="🛡" label="Ins. Guarantee" val={fmtMoney(guarantee)} color={T.gold} onClick={() => onNavigate("agriPlan")} />}
        {(showAgriPlan && fieldsWithActuals > 0) || (showAgriScale && seasonBushels > 0) ? (
          <Stat icon="⚖️" label="Bushels Harvested" val={Math.round(actualBushels || seasonBushels).toLocaleString()} sub={showAgriScale && loadsThisWeek > 0 ? `${loadsThisWeek} loads this week` : (fieldsWithActuals ? `${fieldsWithActuals} field${fieldsWithActuals !== 1 ? "s" : ""} reported` : "")} onClick={() => onNavigate(showAgriScale ? "agriScale" : "agriPlan")} />
        ) : null}
        {showAgriScale && perms.canViewInsurance && guaranteeProgress.length > 0 && (() => {
          const totalGuar = guaranteeProgress.reduce((s, u) => s + u.guaranteeBu, 0);
          const totalHarv = guaranteeProgress.reduce((s, u) => s + u.harvestedBu, 0);
          const pct = totalGuar > 0 ? Math.round((totalHarv / totalGuar) * 100) : 0;
          const behind = guaranteeProgress.filter(u => u.pct < 100).length;
          return (
            <Stat icon="🛡" label="Guarantee Progress" val={`${pct}%`} color={behind > 0 ? T.warning : T.green}
              sub={behind > 0 ? `${behind} unit${behind !== 1 ? "s" : ""} below guarantee pace so far` : "bushels logged so far"}
              onClick={() => onNavigate("agriScale", "REPORT")} />
          );
        })()}
        {showFieldLog && <Stat icon="📋" label="Activity This Week" val={activitiesThisWeek} sub={`${flActivities.length} logged total`} onClick={() => onNavigate("fieldlog")} />}
        {showServiceLog && <Stat icon="☑️" label="Open To-Dos" val={openTodos.length} color={openTodos.length > 0 ? T.warning : T.text} sub={openTodos.length > 0 ? "click to view" : undefined} onClick={() => onNavigate("serviceLog", "todos")} />}
        {showServiceLog && partsNeeded > 0 && <Stat icon="🔩" label="Parts Needed" val={partsNeeded} color={T.warning} sub="click to view" onClick={() => onNavigate("serviceLog", "order")} />}
        {showServiceLog && lowStockItems.length > 0 && <Stat icon="🔔" label="Low Stock" val={lowStockItems.length} color={T.danger} sub={lowStockItems.slice(0, 3).map(p => p.name).join(", ") + (lowStockItems.length > 3 ? "…" : "")} onClick={() => onNavigate("serviceLog", "parts")} />}
        {showServiceLog && dueMaintenance.length > 0 && <Stat icon="🔧" label="Maintenance Due" val={dueMaintenance.length} color={T.danger} sub={dueMaintenance.slice(0, 3).map(m => `${m.vehicleName}: ${m.reminder.label || "service"}`).join(", ") + (dueMaintenance.length > 3 ? "…" : "")} onClick={() => onNavigate("serviceLog", "fleet")} />}
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
              <div key={a.id} onClick={() => onNavigate("fieldlog")}
                onMouseEnter={e => e.currentTarget.style.background = T.cardHov}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 4px", margin: "0 -4px", borderRadius: "6px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
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
            {showServiceLog && <button onClick={() => onNavigate("serviceLog", "todos")} style={{ ...mkBtn("ghost"), padding: "3px 10px", fontSize: "11px" }}>Open Service →</button>}
          </div>
          {!showServiceLog && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>AgriService isn't enabled for your account.</div>}
          {showServiceLog && openTodos.length === 0 && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>Nothing pending — all caught up.</div>}
          {showServiceLog && openTodos.slice(0, 6).map((t, i) => (
            <div key={t.id || i} onClick={() => onNavigate("serviceLog", "todos")}
              onMouseEnter={e => e.currentTarget.style.background = T.cardHov}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 4px", margin: "0 -4px", borderRadius: "6px", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
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

      {/* Quick Log picker */}
      {quickLog && (
        <div onClick={() => setQuickLog(null)} style={{
          position: "fixed", inset: 0, background: "rgba(30,20,8,.45)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: T.card, borderRadius: "12px", width: "100%", maxWidth: "420px",
            maxHeight: "80vh", overflowY: "auto", padding: "22px",
          }}>
            {quickLog.step === "action" && (
              <>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: T.brand, marginBottom: "2px" }}>⚡ Quick Log</div>
                <div style={{ fontSize: "12px", color: T.muted, marginBottom: "16px" }}>What are you logging?</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {canLogActivity && (
                    <button onClick={() => setQuickLog({ step: "entity", type: "addActivity" })} style={quickActionBtnStyle}>
                      <span style={{ fontSize: "20px" }}>🌾</span>
                      <div><div style={{ fontWeight: 700, fontSize: "14px", color: T.text }}>Field Activity</div><div style={{ fontSize: "11px", color: T.muted }}>Seeding, spraying, scouting, harvest…</div></div>
                    </button>
                  )}
                  {canLogService && (
                    <button onClick={() => setQuickLog({ step: "entity", type: "logService" })} style={quickActionBtnStyle}>
                      <span style={{ fontSize: "20px" }}>🔧</span>
                      <div><div style={{ fontWeight: 700, fontSize: "14px", color: T.text }}>Service / Repair</div><div style={{ fontSize: "11px", color: T.muted }}>Log work done on a vehicle or piece of equipment</div></div>
                    </button>
                  )}
                  {canLogService && (
                    <button onClick={() => setQuickLog({ step: "entity", type: "addTodo" })} style={quickActionBtnStyle}>
                      <span style={{ fontSize: "20px" }}>☑️</span>
                      <div><div style={{ fontWeight: 700, fontSize: "14px", color: T.text }}>To-Do</div><div style={{ fontSize: "11px", color: T.muted }}>Note something that needs attention later</div></div>
                    </button>
                  )}
                </div>
              </>
            )}
            {quickLog.step === "entity" && (() => {
              const isField = quickLog.type === "addActivity";
              const list = [...(isField ? flFields : slVehicles)].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
              return (
                <>
                  <button onClick={() => setQuickLog({ step: "action" })} style={{ background: "none", border: "none", color: T.muted, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "10px" }}>← Back</button>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "18px", color: T.brand, marginBottom: "12px" }}>
                    {isField ? "Which field?" : quickLog.type === "logService" ? "Which vehicle?" : "To-do for which vehicle?"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {list.map(item => (
                      <button key={item.id} onClick={() => {
                        setQuickLog(null);
                        if (isField) onNavigate("fieldlog", null, { type: "addActivity", fieldId: item.id });
                        else onNavigate("serviceLog", "fleet", { type: quickLog.type, vehicleId: item.id });
                      }} style={quickEntityBtnStyle}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
