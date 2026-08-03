import { describe, it, expect } from "vitest";
import { computeFarmStats, moduleBase } from "./farmStats.js";

describe("moduleBase", () => {
  it("scopes agriPlan/fieldlog by farm, except the default farm", () => {
    expect(moduleBase("agriPlan", "t1", "farmA")).toBe("tenants/t1/farms/farmA/agriPlan");
    expect(moduleBase("agriPlan", "t1", "default")).toBe("tenants/t1/agriPlan");
    expect(moduleBase("agriPlan", "t1", null)).toBe("tenants/t1/agriPlan");
  });

  it("never farm-scopes serviceLog or agriScale — both are tenant-wide", () => {
    expect(moduleBase("serviceLog", "t1", "farmA")).toBe("tenants/t1/serviceLog");
    expect(moduleBase("agriScale", "t1", "farmA")).toBe("tenants/t1/agriScale");
    expect(moduleBase("agriScale", "t1", "default")).toBe("tenants/t1/agriScale");
  });
});

describe("computeFarmStats — AgriScale farm filtering", () => {
  const baseSnapshot = () => ({
    asData: {
      fields: { f1: { id: "f1", farmId: "default", loads: [] }, f2: { id: "f2", farmId: "farmB", loads: [] } },
      bins: {
        b1: { id: "b1", name: "Bin 1", farmId: "default", capacityBu: 100, storedLbs: 6000 },
        b2: { id: "b2", name: "Bin 2", farmId: "farmB", capacityBu: 100, storedLbs: 1000 },
        b3: { id: "b3", name: "Bin 3", farmId: "shared", capacityBu: 100, storedLbs: 1000 },
      },
      contracts: { c1: { id: "c1", farmId: "default", crop: "WHEAT", bushels: "100" }, c2: { id: "c2", farmId: "farmB", crop: "WHEAT", bushels: "50" } },
      grains: { g1: { name: "WHEAT", bushel_lbs: 60 } },
    },
  });

  it("keeps only default-farm fields/contracts and shared/default bins when farmId is unset", () => {
    const stats = computeFarmStats(baseSnapshot(), "2026", undefined);
    expect(stats.asFieldsArr.map(f => f.id)).toEqual(["f1"]);
    expect(stats.asContractsArr.map(c => c.id)).toEqual(["c1"]);
    expect(stats.asBinsArr.map(b => b.id).sort()).toEqual(["b1", "b3"]);
  });

  it("keeps only that farm's fields/contracts, plus shared bins, for a non-default farm", () => {
    const stats = computeFarmStats(baseSnapshot(), "2026", "farmB");
    expect(stats.asFieldsArr.map(f => f.id)).toEqual(["f2"]);
    expect(stats.asContractsArr.map(c => c.id)).toEqual(["c2"]);
    expect(stats.asBinsArr.map(b => b.id).sort()).toEqual(["b2", "b3"]);
  });
});

describe("computeFarmStats — needsAttention feed", () => {
  it("includes an overdue contract as a danger item", () => {
    const past = new Date(); past.setDate(past.getDate() - 3);
    const iso = past.toISOString().slice(0, 10);
    const d = { asData: { contracts: { c1: { id: "c1", farmId: "default", crop: "WHEAT", buyer: "CHS", delivery: iso } } } };
    const stats = computeFarmStats(d, "2026", "default");
    const item = stats.needsAttention.find(i => i.id === "contract-c1");
    expect(item).toMatchObject({ severity: "danger", module: "agriScale", tab: "MARKET" });
  });

  it("flags a bin at 95%+ as danger and 80-94% as warning, ignores below 80%", () => {
    const d = { asData: {
      fields: {},
      bins: {
        full: { id: "full", name: "Full Bin", farmId: "default", capacityBu: 100, storedLbs: 6000 },   // 100 bu -> 100%
        filling: { id: "filling", name: "Filling Bin", farmId: "default", capacityBu: 100, storedLbs: 5100 }, // 85 bu -> 85%
        low: { id: "low", name: "Low Bin", farmId: "default", capacityBu: 100, storedLbs: 1200 },       // 20 bu -> 20%
      },
      grains: { g1: { name: "WHEAT", bushel_lbs: 60 } },
    } };
    const stats = computeFarmStats(d, "2026", "default");
    expect(stats.needsAttention.find(i => i.id === "bin-full")).toMatchObject({ severity: "danger" });
    expect(stats.needsAttention.find(i => i.id === "bin-filling")).toMatchObject({ severity: "warning" });
    expect(stats.needsAttention.find(i => i.id === "bin-low")).toBeUndefined();
  });

  it("includes an active plantback restriction as a warning item", () => {
    const today = new Date();
    const appliedIso = new Date(today.getTime() - 5 * 86400000).toISOString().slice(0, 10);
    const d = { fieldRestrictions: { f1: { fieldName: "North 40", chemicals: {
      "2,4-D Amine": { date: appliedIso, plantback: { Canola: 30 } },
    } } } };
    const stats = computeFarmStats(d, "2026", "default");
    expect(stats.needsAttention.find(i => i.id === "plantback-0")).toMatchObject({ severity: "warning", module: "fieldlog" });
  });

  it("includes a mirrored budget-overrun summary as a danger item", () => {
    const d = { apBudgetAlerts: { count: 2, totalOver: 500, top: [{ common: "North 40", variance: 300 }] } };
    const stats = computeFarmStats(d, "2026", "default");
    const item = stats.needsAttention.find(i => i.id === "budget-overrun");
    expect(item).toMatchObject({ severity: "danger", module: "agriPlan" });
    expect(item.title).toContain("2 fields over budget");
  });

  it("omits the budget-overrun item entirely when nothing is mirrored yet", () => {
    const stats = computeFarmStats({}, "2026", "default");
    expect(stats.needsAttention.find(i => i.id === "budget-overrun")).toBeUndefined();
  });

  it("sorts danger items before warning items", () => {
    const d = {
      asData: { contracts: { c1: { id: "c1", farmId: "default", crop: "WHEAT", delivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10) } } }, // "soon" -> warning
      apBudgetAlerts: { count: 1, top: [{ common: "North 40", variance: 100 }] }, // danger
    };
    const stats = computeFarmStats(d, "2026", "default");
    const severities = stats.needsAttention.map(i => i.severity);
    const firstWarning = severities.indexOf("warning");
    const lastDanger = severities.lastIndexOf("danger");
    expect(firstWarning === -1 || lastDanger === -1 || lastDanger < firstWarning).toBe(true);
  });

  it("returns an empty needsAttention list for a blank snapshot", () => {
    expect(computeFarmStats({}, "2026", "default").needsAttention).toEqual([]);
  });
});
