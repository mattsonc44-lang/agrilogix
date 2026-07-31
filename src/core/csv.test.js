import { describe, it, expect } from "vitest";
import { csvEscape, csvParseLine, parseCSV } from "./csv.js";

describe("csvEscape", () => {
  it("leaves plain values alone", () => {
    expect(csvEscape("Home Place")).toBe("Home Place");
    expect(csvEscape(42)).toBe("42");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    expect(csvEscape("Smith, John")).toBe('"Smith, John"');
    expect(csvEscape('Say "hi"')).toBe('"Say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });

  it("treats null/undefined as an empty string", () => {
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });
});

describe("csvParseLine", () => {
  it("splits a plain comma-separated line", () => {
    expect(csvParseLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles a quoted field containing a comma", () => {
    expect(csvParseLine('Home Place,"Smith, John",160')).toEqual(["Home Place", "Smith, John", "160"]);
  });

  it("handles an escaped double-quote inside a quoted field", () => {
    expect(csvParseLine('"Say ""hi""",ok')).toEqual(['Say "hi"', "ok"]);
  });
});

describe("parseCSV", () => {
  it("round-trips a value through csvEscape and back with the matching header", () => {
    const header = "APH Field Name,Match To";
    const row = [csvEscape("Home Place"), csvEscape("Smith, John's Quarter")].join(",");
    const text = `${header}\n${row}`;
    const parsed = parseCSV(text);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]["APH Field Name"]).toBe("Home Place");
    expect(parsed[0]["Match To"]).toBe("Smith, John's Quarter");
  });

  it("returns an empty array for empty input", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("handles Windows-style CRLF line endings", () => {
    const text = "a,b\r\n1,2\r\n3,4";
    const parsed = parseCSV(text);
    expect(parsed).toEqual([{ a: "1", b: "2" }, { a: "3", b: "4" }]);
  });

  it("fills missing trailing cells with an empty string rather than undefined", () => {
    const text = "a,b,c\n1,2";
    const parsed = parseCSV(text);
    expect(parsed[0]).toEqual({ a: "1", b: "2", c: "" });
  });
});
