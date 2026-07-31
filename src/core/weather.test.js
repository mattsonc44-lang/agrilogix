import { describe, it, expect } from "vitest";
import { degToCompass, fmtWeather } from "./weather.js";

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
