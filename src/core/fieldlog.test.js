import { describe, it, expect } from "vitest";
import { calcTankMixTotals } from "./fieldlog.js";

describe("calcTankMixTotals", () => {
  it("scales a per-acre rate by field acres", () => {
    const tankMix = [{ id: "c1", chemical: "Glyphosate (Roundup PowerMax)", oz: "16", unit: "oz/ac" }];
    const { items } = calcTankMixTotals(tankMix, 80, 10);
    expect(items[0]).toMatchObject({ name: "Glyphosate (Roundup PowerMax)", total: 1280, totalUnit: "oz" });
  });

  it("scales a per-100-gal rate (e.g. an adjuvant) by total spray water, not acres", () => {
    const tankMix = [{ id: "c1", chemical: "Nonionic Surfactant (Induce)", oz: "1", unit: "qt/100 gal" }];
    // 80 ac * 10 gal/ac = 800 gal water -> 1 qt/100gal * 8 = 8 qt
    const { items, totalWaterGal } = calcTankMixTotals(tankMix, 80, 10);
    expect(totalWaterGal).toBe(800);
    expect(items[0]).toMatchObject({ total: 8, totalUnit: "qt" });
  });

  it("computes total water volume as acres times water rate", () => {
    const { totalWaterGal } = calcTankMixTotals([], 40, 15);
    expect(totalWaterGal).toBe(600);
  });

  it("resolves 'Other' chemicals to their typed-in name", () => {
    const tankMix = [{ id: "c1", chemical: "Other", chemicalName: "Farm-mixed blend", oz: "5", unit: "pt/ac" }];
    const { items } = calcTankMixTotals(tankMix, 20, 10);
    expect(items[0]).toMatchObject({ name: "Farm-mixed blend", total: 100, totalUnit: "pt" });
  });

  it("leaves total null (not 0 or guessed) when acres aren't set", () => {
    const tankMix = [{ id: "c1", chemical: "2,4-D Amine", oz: "12", unit: "oz/ac" }];
    const { items, totalWaterGal } = calcTankMixTotals(tankMix, 0, 10);
    expect(items[0].total).toBeNull();
    expect(totalWaterGal).toBeNull();
  });

  it("leaves total null for an incomplete row (no rate or no chemical yet)", () => {
    const tankMix = [{ id: "c1", chemical: "", oz: "", unit: "oz/ac" }];
    const { items } = calcTankMixTotals(tankMix, 40, 10);
    expect(items[0].total).toBeNull();
  });

  it("returns an empty items list for no tank mix", () => {
    expect(calcTankMixTotals([], 40, 10).items).toEqual([]);
    expect(calcTankMixTotals(null, 40, 10).items).toEqual([]);
  });

  it("uses an actual-gallons override as total water instead of acres * rate (spot-spray)", () => {
    // 80ac field, 10 gal/ac would blanket-estimate 800gal, but a WeedIt/
    // GreenSeeker pass only sprayed 145 actual gallons per the system readout.
    const { totalWaterGal, effectiveAcres } = calcTankMixTotals([], 80, 10, 145);
    expect(totalWaterGal).toBe(145);
    expect(effectiveAcres).toBe(14.5); // 145 / 10 gal/ac
  });

  it("scales per-acre chemical totals off effective (spot-sprayed) acres, not field acres", () => {
    const tankMix = [{ id: "c1", chemical: "Glyphosate (Roundup PowerMax)", oz: "16", unit: "oz/ac" }];
    const { items } = calcTankMixTotals(tankMix, 80, 10, 145);
    // effective acres = 14.5, so 16 oz/ac * 14.5 = 232 oz, not 16*80=1280
    expect(items[0]).toMatchObject({ total: 232, totalUnit: "oz" });
  });

  it("scales per-100-gal (adjuvant) totals off the actual override volume, not the blanket estimate", () => {
    const tankMix = [{ id: "c1", chemical: "Nonionic Surfactant (Induce)", oz: "1", unit: "qt/100 gal" }];
    const { items } = calcTankMixTotals(tankMix, 80, 10, 145);
    // 1 qt/100gal * (145/100) = 1.45 qt
    expect(items[0]).toMatchObject({ total: 1.45, totalUnit: "qt" });
  });

  it("ignores the override when it's blank/undefined and falls back to acres * rate", () => {
    const { totalWaterGal, effectiveAcres } = calcTankMixTotals([], 80, 10, "");
    expect(totalWaterGal).toBe(800);
    expect(effectiveAcres).toBe(80);
  });

  it("leaves effectiveAcres null for an override with no water rate to back-calculate against", () => {
    const { effectiveAcres, totalWaterGal } = calcTankMixTotals([], 80, 0, 145);
    expect(totalWaterGal).toBe(145);
    expect(effectiveAcres).toBeNull();
  });
});
