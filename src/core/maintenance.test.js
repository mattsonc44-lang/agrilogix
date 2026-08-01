import { describe, it, expect } from "vitest";
import { monthsSince, evaluateReminder, findDueReminders } from "./maintenance.js";

describe("monthsSince", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(monthsSince(today)).toBeCloseTo(0, 1);
  });

  it("returns roughly 6 for a date six months ago", () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    expect(monthsSince(d.toISOString().slice(0, 10))).toBeGreaterThan(5.5);
    expect(monthsSince(d.toISOString().slice(0, 10))).toBeLessThan(6.5);
  });

  it("returns null for missing or invalid input", () => {
    expect(monthsSince("")).toBeNull();
    expect(monthsSince(null)).toBeNull();
    expect(monthsSince("not a date")).toBeNull();
  });
});

describe("evaluateReminder", () => {
  it("is not due when current hours haven't reached the interval yet", () => {
    const r = { intervalHours: 250, baselineHours: 1000 };
    const result = evaluateReminder(r, 1200);
    expect(result.due).toBe(false);
    expect(result.hoursSince).toBe(200);
  });

  it("is due once elapsed hours reach the interval", () => {
    const r = { intervalHours: 250, baselineHours: 1000 };
    const result = evaluateReminder(r, 1250);
    expect(result.due).toBe(true);
    expect(result.dueByHours).toBe(true);
    expect(result.hoursOver).toBe(0);
  });

  it("reports how far over the interval it is", () => {
    const r = { intervalHours: 250, baselineHours: 1000 };
    const result = evaluateReminder(r, 1300);
    expect(result.hoursOver).toBe(50);
  });

  it("is due by elapsed time when a months interval is set", () => {
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);
    const r = { intervalMonths: 6, baselineDate: eightMonthsAgo.toISOString().slice(0, 10) };
    const result = evaluateReminder(r, 0);
    expect(result.due).toBe(true);
    expect(result.dueByDate).toBe(true);
  });

  it("is not due when neither hours nor months have elapsed enough", () => {
    const today = new Date().toISOString().slice(0, 10);
    const r = { intervalHours: 250, intervalMonths: 6, baselineHours: 1000, baselineDate: today };
    const result = evaluateReminder(r, 1050);
    expect(result.due).toBe(false);
  });

  it("is due when EITHER hours or months threshold is crossed (whichever comes first)", () => {
    const today = new Date().toISOString().slice(0, 10);
    // Months not elapsed, but hours interval crossed
    const r = { intervalHours: 250, intervalMonths: 6, baselineHours: 1000, baselineDate: today };
    expect(evaluateReminder(r, 1300).due).toBe(true);
  });

  it("treats a reminder with no interval set as never due", () => {
    const result = evaluateReminder({ baselineHours: 1000 }, 5000);
    expect(result.due).toBe(false);
  });
});

describe("findDueReminders", () => {
  it("flattens due reminders across multiple vehicles with vehicle context attached", () => {
    const vehicles = [
      { id: "v1", name: "JD 9620R", hours: 1300, maintReminders: [{ id: "r1", label: "Oil Change", intervalHours: 250, baselineHours: 1000 }] },
      { id: "v2", name: "Case Combine", hours: 500, maintReminders: [{ id: "r2", label: "Filter", intervalHours: 250, baselineHours: 200 }] },
    ];
    const due = findDueReminders(vehicles);
    expect(due.length).toBe(2);
    expect(due[0]).toMatchObject({ vehicleId: "v1", vehicleName: "JD 9620R" });
    expect(due[1]).toMatchObject({ vehicleId: "v2", vehicleName: "Case Combine" });
  });

  it("excludes reminders that aren't due yet", () => {
    const vehicles = [{ id: "v1", name: "Truck", hours: 100, maintReminders: [{ id: "r1", intervalHours: 250, baselineHours: 0 }] }];
    expect(findDueReminders(vehicles)).toEqual([]);
  });

  it("handles vehicles with no reminders or no vehicles at all", () => {
    expect(findDueReminders([{ id: "v1", name: "Truck", hours: 100 }])).toEqual([]);
    expect(findDueReminders([])).toEqual([]);
    expect(findDueReminders(null)).toEqual([]);
  });
});
