import { useState, useEffect } from "react";
import { T, mkBtn } from "../../core/theme.js";
import { getPerms } from "../../core/permissions.js";
import { fetchFarmSnapshot, computeFarmStats } from "../home/farmStats.js";

const fmtMoney = n => "$" + Math.round(n || 0).toLocaleString();

// Side-by-side comparison across every farm in the tenant — for owners/
// managers running more than one farm who'd otherwise have to flip the farm
// picker back and forth to see the same numbers. Reuses the exact fetch +
// math HomeModule uses (farmStats.js) so a farm's numbers here always match
// what that farm's own Home screen shows.
export default function MultiFarmModule({ tenantId, token, userProfile, farms = [], enabledModules = [], onOpenFarm }) {
  const perms = getPerms(userProfile);
  const [loading, setLoading] = useState(true);
  const [statsByFarm, setStatsByFarm] = useState({});
  const year = String(new Date().getFullYear());
  const farmIds = farms.map(f => f.id).join(",");

  useEffect(() => {
    if (!tenantId || !token || farms.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(farms.map(f =>
      fetchFarmSnapshot(tenantId, token, f.id, enabledModules, year).then(snap => [f.id, computeFarmStats(snap, year, f.id)])
    )).then(results => {
      if (cancelled) return;
      const map = {};
      results.forEach(([id, stats]) => { map[id] = stats; });
      setStatsByFarm(map);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [tenantId, token, farmIds, enabledModules.join(",")]);

  if (loading || farms.length === 0) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", color: T.muted, fontFamily: "'Barlow',sans-serif" }}>
        <div style={{ fontSize: "32px", marginBottom: "10px" }}>🌾</div>
        {farms.length === 0 ? "No farms to compare yet." : "Loading your farms…"}
      </div>
    );
  }

  const showAgriPlan = enabledModules.includes("agriPlan");
  const showAgriScale = enabledModules.includes("agriScale");
  const showServiceLog = enabledModules.includes("serviceLog");

  const totals = farms.reduce((acc, f) => {
    const s = statsByFarm[f.id];
    if (!s) return acc;
    acc.acres += s.acres || 0;
    acc.revenue += s.revenueProjected || 0;
    acc.bushels += s.actualBushels || s.seasonBushels || 0;
    acc.todos += s.openTodos?.length || 0;
    return acc;
  }, { acres: 0, revenue: 0, bushels: 0, todos: 0 });

  const TotalCard = ({ icon, label, val, color }) => (
    <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "14px 16px", flex: "1 1 140px", minWidth: "140px" }}>
      <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px" }}>
        <span>{icon}</span>{label}
      </div>
      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "22px", fontWeight: 700, color: color || T.text }}>{val}</div>
    </div>
  );

  return (
    <div style={{ padding: "24px 20px 40px", maxWidth: "1100px", margin: "0 auto", fontFamily: "'Barlow',sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "26px", color: T.brand, fontWeight: 700 }}>
          All Farms
        </div>
        <div style={{ fontSize: "13px", color: T.muted, marginTop: "3px" }}>
          {farms.length} farms combined · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* Combined totals */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "26px" }}>
        <TotalCard icon="🌾" label="Total Acres" val={totals.acres ? Math.round(totals.acres).toLocaleString() : "—"} />
        {showAgriPlan && perms.canViewCosts && <TotalCard icon="💵" label="Projected Revenue" val={fmtMoney(totals.revenue)} color={T.green} />}
        {(showAgriPlan || showAgriScale) && <TotalCard icon="⚖️" label="Bushels Harvested" val={Math.round(totals.bushels).toLocaleString()} />}
        {showServiceLog && <TotalCard icon="☑️" label="Open To-Dos" val={totals.todos} color={totals.todos > 0 ? T.warning : T.text} />}
      </div>

      {/* Per-farm cards, side by side */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: "16px" }}>
        {farms.map(f => {
          const s = statsByFarm[f.id];
          if (!s) return null;
          const bushels = s.actualBushels || s.seasonBushels || 0;
          const attention = [
            ...(s.openTodos || []).slice(0, 2).map(t => t.text),
            ...(s.partsNeeded > 0 ? [`${s.partsNeeded} part${s.partsNeeded !== 1 ? "s" : ""} needed`] : []),
          ].slice(0, 2);
          return (
            <div key={f.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: f.color || T.brand, flexShrink: 0 }} />
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "17px", color: T.text, fontWeight: 700 }}>{f.name}</div>
                </div>
                <button onClick={() => onOpenFarm(f)} style={{ ...mkBtn("ghost"), padding: "4px 10px", fontSize: "11px" }}>Open →</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Acres</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: T.text }}>{s.acres ? Math.round(s.acres).toLocaleString() : "—"}</div>
                </div>
                {showAgriPlan && perms.canViewCosts && (
                  <div>
                    <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Revenue</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: T.green }}>{fmtMoney(s.revenueProjected)}</div>
                  </div>
                )}
                {(showAgriPlan || showAgriScale) && (
                  <div>
                    <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Bushels</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: T.text }}>{Math.round(bushels).toLocaleString()}</div>
                  </div>
                )}
                {showServiceLog && (
                  <div>
                    <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px" }}>To-dos</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: (s.openTodos?.length || 0) > 0 ? T.warning : T.text }}>{s.openTodos?.length || 0}</div>
                  </div>
                )}
              </div>

              {showServiceLog && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: "10px" }}>
                  <div style={{ fontSize: "11px", color: T.muted, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }}>Needs Attention</div>
                  {attention.length === 0 && <div style={{ fontSize: "12px", color: T.faint, fontStyle: "italic" }}>All caught up.</div>}
                  {attention.map((txt, i) => (
                    <div key={i} style={{ fontSize: "13px", color: T.text, padding: "3px 0" }}>{txt}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
