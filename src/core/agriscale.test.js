import { describe, it, expect } from "vitest";
import { sumLoadsBushels, sumLoadsLbs, lastLoadDateISO } from "./agriscale.js";

describe("sumLoadsBushels", () => {
  it("converts net lbs to bushels using each load's own grainBushelLbs", () => {
    const loads = [
      { net: 6000, grainBushelLbs: 60 }, // 100 bu
      { net: 3200, grainBushelLbs: 32 }, // 100 bu (e.g. soybeans-style test weight)
    ];
    expect(sumLoadsBushels(loads)).toBeCloseTo(200);
  });

  it("falls back to 60 lbs/bu when grainBushelLbs is missing", () => {
    expect(sumLoadsBushels([{ net: 600 }])).toBeCloseTo(10);
  });

  it("returns 0 for no loads", () => {
    expect(sumLoadsBushels([])).toBe(0);
    expect(sumLoadsBushels(null)).toBe(0);
  });

  it("ignores loads with a missing/non-numeric net weight instead of throwing", () => {
    expect(sumLoadsBushels([{ grainBushelLbs: 60 }, { net: 600, grainBushelLbs: 60 }])).toBeCloseTo(10);
  });
});

describe("sumLoadsLbs", () => {
  it("sums net weight across loads", () => {
    expect(sumLoadsLbs([{ net: 6000 }, { net: 3200 }])).toBe(9200);
  });
  it("returns 0 for no loads", () => {
    expect(sumLoadsLbs([])).toBe(0);
  });
});

describe("lastLoadDateISO", () => {
  it("picks the load with the latest timestamp, not the latest display-date string", () => {
    // Display date strings have no year and don't sort chronologically —
    // this specifically checks ts (a real timestamp) is what's used.
    const loads = [
      { ts: new Date("2025-07-01").getTime(), date: "Tue, Jul 1" },
      { ts: new Date("2026-03-15").getTime(), date: "Sun, Mar 15" },
    ];
    expect(lastLoadDateISO(loads)).toBe("2026-03-15");
  });

  it("returns today (ISO) when there are no loads", () => {
    const todayISO = new Date().toISOString().slice(0, 10);
    expect(lastLoadDateISO([])).toBe(todayISO);
  });
});
