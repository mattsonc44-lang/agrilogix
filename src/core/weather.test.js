import { describe, it, expect } from "vitest";
import { degToCompass, fmtWeather, evaluateSprayWindow, HIGH_TEMP_F } from "./weather.js";

describe("degToCompass", () => {
  it("maps the four cardinal directions correctly", () => {
    expect(degToCompass(0)).toBe("N");
    expect(degToCompass(90)).toBe("E");
    expect(degToCompass(180)).toBe("S");
    expect(degToCompass(270)).toBe("W");
  });

  it("wraps 360 back to N", () => {
    expect(degToCompass(360)).toBe("N");
  });

  it("handles a real-world southwest reading (e.g. 225°)", () => {
    expect(degToCompass(225)).toBe("SW");
  });

  it("handles negative degrees by wrapping into 0-360", () => {
    expect(degToCompass(-90)).toBe("W");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(degToCompass(null)).toBe("");
    expect(degToCompass(undefined)).toBe("");
    expect(degToCompass(NaN)).toBe("");
  });
});

describe("fmtWeather", () => {
  it("formats a full reading with temp, wind, and humidity", () => {
    expect(fmtWeather({ tempF: 75, windMph: 7, windDir: "SW", humidity: 45 }))
      .toBe("75°F · Wind SW 7mph · 45% RH");
  });

  it("omits wind direction when not set", () => {
    expect(fmtWeather({ tempF: 60, windMph: 5 })).toBe("60°F · Wind 5mph");
  });

  it("returns an empty string for no data", () => {
    expect(fmtWeather(null)).toBe("");
    expect(fmtWeather(undefined)).toBe("");
  });

  it("only includes fields that are actually present", () => {
    expect(fmtWeather({ tempF: 32 })).toBe("32°F");
  });
});

describe("evaluateSprayWindow", () => {
  it("returns no flags for calm, dry, moderate-wind conditions", () => {
    const hours = [
      { windMph: 5, precipProb: 5, precipIn: 0 },
      { windMph: 6, precipProb: 10, precipIn: 0 },
    ];
    expect(evaluateSprayWindow(hours)).toEqual([]);
  });

  it("flags high wind above the general threshold", () => {
    const hours = [{ windMph: 14, precipProb: 0, precipIn: 0 }];
    const flags = evaluateSprayWindow(hours);
    expect(flags.length).toBe(1);
    expect(flags[0].msg).toMatch(/above 10 mph/);
  });

  it("flags very light wind as a possible inversion signal", () => {
    const hours = [{ windMph: 1, precipProb: 0, precipIn: 0 }];
    const flags = evaluateSprayWindow(hours);
    expect(flags.length).toBe(1);
    expect(flags[0].msg).toMatch(/temperature inversion/);
  });

  it("flags rain via high probability even with zero measured precipitation", () => {
    const hours = [{ windMph: 6, precipProb: 70, precipIn: 0 }];
    const flags = evaluateSprayWindow(hours);
    expect(flags.some(f => f.msg.includes("rainfast"))).toBe(true);
  });

  it("flags rain via measurable precipitation even with low probability", () => {
    const hours = [{ windMph: 6, precipProb: 10, precipIn: 0.02 }];
    const flags = evaluateSprayWindow(hours);
    expect(flags.some(f => f.msg.includes("rainfast"))).toBe(true);
  });

  it("can raise multiple flags at once", () => {
    const hours = [{ windMph: 15, precipProb: 80, precipIn: 0.1 }];
    expect(evaluateSprayWindow(hours).length).toBe(2);
  });

  it("flags high temperature above the general threshold", () => {
    const hours = [{ windMph: 6, precipProb: 0, precipIn: 0, tempF: 91 }];
    const flags = evaluateSprayWindow(hours);
    expect(flags.length).toBe(1);
    expect(flags[0].msg).toMatch(new RegExp(`above ${HIGH_TEMP_F}`));
    expect(flags[0].msg).toMatch(/label/i);
  });

  it("does not flag temperature at or below the threshold", () => {
    const hours = [{ windMph: 6, precipProb: 0, precipIn: 0, tempF: HIGH_TEMP_F }];
    expect(evaluateSprayWindow(hours)).toEqual([]);
  });

  it("ignores hours with missing wind/precip/temp readings rather than flagging them", () => {
    const hours = [{ windMph: null, precipProb: null, precipIn: null, tempF: null }];
    expect(evaluateSprayWindow(hours)).toEqual([]);
  });

  it("handles an empty or missing forecast without throwing", () => {
    expect(evaluateSprayWindow([])).toEqual([]);
    expect(evaluateSprayWindow(null)).toEqual([]);
    expect(evaluateSprayWindow(undefined)).toEqual([]);
  });
});
