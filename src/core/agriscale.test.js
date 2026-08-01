import { describe, it, expect } from "vitest";
import { sumLoadsBushels, sumLoadsLbs, lastLoadDateISO, buildGuaranteeProgress, buildBinSummary, detectCropMismatch, detectBinOverfill } from "./agriscale.js";

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

describe("buildGuaranteeProgress", () => {
  it("weights guarantee bushels by each unit's own acres, not the whole field's acres", () => {
    // One field split across two units at different acreages — the guarantee
    // for each unit must use ITS acres, not the field's total.
    const fields = [
      {
        name: "Home Quarter", insGuaranteedYield: "40",
        insuranceUnits: [{ name: "Unit A", acres: 100 }, { name: "Unit B", acres: 60 }],
        loads: [
          { net: 6000, grainBushelLbs: 60, insuranceUnit: "Unit A" }, // 100 bu
          { net: 3000, grainBushelLbs: 60, insuranceUnit: "Unit B" }, // 50 bu
        ],
      },
    ];
    const result = buildGuaranteeProgress(fields);
    const unitA = result.find(u => u.unit === "Unit A");
    const unitB = result.find(u => u.unit === "Unit B");
    expect(unitA.guaranteeBu).toBeCloseTo(4000); // 100ac * 40bu/ac
    expect(unitA.harvestedBu).toBeCloseTo(100);
    expect(unitA.pct).toBeCloseTo(2.5);
    expect(unitB.guaranteeBu).toBeCloseTo(2400); // 60ac * 40bu/ac
    expect(unitB.harvestedBu).toBeCloseTo(50);
  });

  it("sums guarantee bushels across multiple fields feeding the same unit", () => {
    const fields = [
      { name: "Field 1", insGuaranteedYield: "50", insuranceUnits: [{ name: "Unit 4021", acres: 80 }], loads: [] },
      { name: "Field 2", insGuaranteedYield: "30", insuranceUnits: [{ name: "Unit 4021", acres: 40 }], loads: [] },
    ];
    const [unit] = buildGuaranteeProgress(fields);
    expect(unit.guaranteeBu).toBeCloseTo(80 * 50 + 40 * 30); // 5200
  });

  it("excludes a unit entirely when no field feeding it has a Guaranteed Yield entered", () => {
    const fields = [
      { name: "Field 1", insGuaranteedYield: "", insuranceUnits: [{ name: "Unit X", acres: 100 }], loads: [] },
    ];
    expect(buildGuaranteeProgress(fields)).toEqual([]);
  });

  it("ignores loads tagged 'none' or with no insurance unit", () => {
    const fields = [
      {
        name: "Field 1", insGuaranteedYield: "40", insuranceUnits: [{ name: "Unit A", acres: 50 }],
        loads: [{ net: 6000, grainBushelLbs: 60, insuranceUnit: "none" }, { net: 6000, grainBushelLbs: 60 }],
      },
    ];
    const [unit] = buildGuaranteeProgress(fields);
    expect(unit.harvestedBu).toBe(0);
  });
});

describe("buildBinSummary", () => {
  const grains = [{ name: "DURUM", bushel_lbs: 60 }, { name: "BARLEY", bushel_lbs: 48 }];

  it("labels a bin by what was actually loaded into it, not its stale assigned grain", () => {
    // Bin was set up as "WHEAT" but every load actually dumped into it is durum —
    // this is exactly the bug reported: the report kept showing the bin's old
    // assigned label instead of what's really in there.
    const bins = [{ id: 1, name: "Bin 1", grainName: "WHEAT", capacityBu: 10000, storedLbs: 6000 }];
    const fields = [{ name: "North 40", loads: [{ net: 6000, grainBushelLbs: 60, grainName: "DURUM", binId: 1 }] }];
    const [summary] = buildBinSummary(fields, bins, grains);
    expect(summary.crop).toBe("DURUM");
    expect(summary.totBu).toBeCloseTo(100);
  });

  it("falls back to the bin's assigned grain when it has no load history yet", () => {
    const bins = [{ id: 1, name: "Bin 1", grainName: "WHEAT", capacityBu: 10000, storedLbs: 0 }];
    const [summary] = buildBinSummary([], bins, grains);
    expect(summary.crop).toBe("WHEAT");
  });

  it("flags a bin that actually has more than one grain dumped into it instead of picking one silently", () => {
    const bins = [{ id: 1, name: "Bin 1", grainName: "WHEAT", capacityBu: 10000, storedLbs: 8880 }];
    const fields = [{
      name: "North 40",
      loads: [
        { net: 6000, grainBushelLbs: 60, grainName: "DURUM", binId: 1 },   // 100 bu
        { net: 2880, grainBushelLbs: 48, grainName: "BARLEY", binId: 1 },  // 60 bu
      ],
    }];
    const [summary] = buildBinSummary(fields, bins, grains);
    expect(summary.crop).toBe("DURUM + BARLEY"); // higher-bushel grain listed first
  });

  it("only counts loads whose binId matches this bin", () => {
    const bins = [
      { id: 1, name: "Bin 1", grainName: "WHEAT", capacityBu: 10000, storedLbs: 6000 },
      { id: 2, name: "Bin 2", grainName: "WHEAT", capacityBu: 10000, storedLbs: 3000 },
    ];
    const fields = [{
      name: "North 40",
      loads: [
        { net: 6000, grainBushelLbs: 60, grainName: "DURUM", binId: 1 },
        { net: 3000, grainBushelLbs: 60, grainName: "BARLEY", binId: 2 },
      ],
    }];
    const [bin1, bin2] = buildBinSummary(fields, bins, grains);
    expect(bin1.crop).toBe("DURUM");
    expect(bin1.loads).toBe(1);
    expect(bin2.crop).toBe("BARLEY");
    expect(bin2.loads).toBe(1);
  });
});

describe("detectCropMismatch", () => {
  const bins = [{ id: 1, name: "Bin 1", grainName: "WHEAT", storedLbs: 6000 }];

  it("flags adding a different grain than what's already recorded in the bin", () => {
    const fields = [{ loads: [{ id: "a", net: 6000, grainName: "WHEAT", binId: 1 }] }];
    const result = detectCropMismatch(fields, bins, 1, "BARLEY");
    expect(result).toEqual({ binName: "Bin 1", existing: "WHEAT" });
  });

  it("does not flag adding the same grain that's already in the bin", () => {
    const fields = [{ loads: [{ id: "a", net: 6000, grainName: "WHEAT", binId: 1 }] }];
    expect(detectCropMismatch(fields, bins, 1, "WHEAT")).toBeNull();
  });

  it("does not flag an empty bin with no stored weight and no load history", () => {
    const emptyBins = [{ id: 2, name: "Bin 2", grainName: "WHEAT", storedLbs: 0 }];
    expect(detectCropMismatch([], emptyBins, 2, "BARLEY")).toBeNull();
  });

  it("falls back to the bin's assigned grain when there's stored weight but no load history yet", () => {
    // e.g. grain that predates AgriScale tracking, or was set by hand
    const result = detectCropMismatch([], bins, 1, "BARLEY");
    expect(result).toEqual({ binName: "Bin 1", existing: "WHEAT" });
  });

  it("excludes the load's own prior entry so editing the bin's only load doesn't flag itself", () => {
    const fields = [{ loads: [{ id: "a", net: 6000, grainName: "WHEAT", binId: 1 }] }];
    // Correcting load "a" from WHEAT to DURUM — it's the only load in the bin,
    // so with itself excluded there's nothing left to conflict with.
    expect(detectCropMismatch(fields, bins, 1, "DURUM", "a")).toBeNull();
  });

  it("still flags a different load's edit when another load in the bin has a different grain", () => {
    const fields = [{
      loads: [
        { id: "a", net: 6000, grainName: "WHEAT", binId: 1 },
        { id: "b", net: 3000, grainName: "WHEAT", binId: 1 },
      ],
    }];
    // Editing load "b" to DURUM should still conflict with load "a" (still WHEAT).
    expect(detectCropMismatch(fields, bins, 1, "DURUM", "b")).toEqual({ binName: "Bin 1", existing: "WHEAT" });
  });

  it("returns null for a bin id that doesn't exist", () => {
    expect(detectCropMismatch([], bins, 999, "WHEAT")).toBeNull();
  });
});

describe("detectBinOverfill", () => {
  const wheat = { name: "WHEAT", bushel_lbs: 60 };

  it("flags a load that would push stored bushels past capacity", () => {
    // 9000 lbs already stored = 150 bu, capacity 200 bu, adding 3600 lbs (60 bu) -> 210 bu, 10 over
    const bin = { name: "Bin 1", capacityBu: 200, storedLbs: 9000 };
    const result = detectBinOverfill(bin, wheat, 3600);
    expect(result).toEqual({ binName: "Bin 1", capacityBu: 200, wouldBeBu: 210, overBy: 10 });
  });

  it("does not flag a load that stays at or under capacity", () => {
    const bin = { name: "Bin 1", capacityBu: 200, storedLbs: 9000 };
    expect(detectBinOverfill(bin, wheat, 2940)).toBeNull(); // 150 + 49 = 199 bu
    expect(detectBinOverfill(bin, wheat, 3000)).toBeNull(); // exactly 200 bu
  });

  it("returns null for a bin with no capacity set", () => {
    expect(detectBinOverfill({ name: "Bin 1", capacityBu: 0, storedLbs: 9000 }, wheat, 3600)).toBeNull();
    expect(detectBinOverfill({ name: "Bin 1", storedLbs: 9000 }, wheat, 3600)).toBeNull();
  });

  it("returns null for a missing bin", () => {
    expect(detectBinOverfill(null, wheat, 3600)).toBeNull();
  });

  it("falls back to 60 lbs/bu when the grain is missing", () => {
    const bin = { name: "Bin 1", capacityBu: 100, storedLbs: 0 };
    expect(detectBinOverfill(bin, null, 6600)).toEqual({ binName: "Bin 1", capacityBu: 100, wouldBeBu: 110, overBy: 10 });
  });
});
