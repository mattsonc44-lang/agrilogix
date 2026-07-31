import { describe, it, expect, vi, beforeEach } from "vitest";
import { dbSafeWrite } from "./firebase.js";

// dbSafeWrite is the guard that stopped the onboarding-wizard data-loss bug
// (a wizard reload could otherwise silently overwrite a tenant's real fields
// with an empty local draft). These tests lock that behavior in.

function jsonResponse(body, ok = true) {
  return { ok, status: ok ? 200 : 404, json: async () => body };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("dbSafeWrite — payload validation", () => {
  it("rejects an array payload without making any network call", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    await expect(dbSafeWrite("tenants/abc/fields", [1, 2, 3], "tok")).rejects.toThrow(/not an object/);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a null/undefined payload without making any network call", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");
    await expect(dbSafeWrite("tenants/abc/fields", null, "tok")).rejects.toThrow();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("dbSafeWrite — data-loss guard", () => {
  it("blocks a write that would wipe out more than half of existing records", async () => {
    const current = { crops: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 } }; // 6 records
    const incoming = { crops: { a: 1 } }; // 1 record — an 83% drop
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(current));
    vi.stubGlobal("fetch", fetchMock);

    await expect(dbSafeWrite("tenants/abc/agriPlan/crops", incoming, "tok")).rejects.toThrow(/data loss/);

    // Only the read should have happened — the destructive write must never fire.
    const putCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === "PUT");
    expect(putCalls).toHaveLength(0);
  });

  it("allows a write that keeps most existing records", async () => {
    const current = { crops: { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 } }; // 6 records
    const incoming = { crops: { a: 1, b: 1, c: 1, d: 1, e: 1 } }; // 5 records — <50% drop
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(current));
    vi.stubGlobal("fetch", fetchMock);

    await expect(dbSafeWrite("tenants/abc/agriPlan/crops", incoming, "tok")).resolves.toBeDefined();

    // 2 PUTs expected: the pre-write timestamped backup, then the real write.
    const putCalls = fetchMock.mock.calls.filter(([, opts]) => opts?.method === "PUT");
    expect(putCalls).toHaveLength(2);
  });

  it("allows writing to a path that has no existing data yet", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(null))       // dbRead: nothing there yet
      .mockResolvedValueOnce(jsonResponse({ ok: true })); // dbWrite
    vi.stubGlobal("fetch", fetchMock);

    await expect(dbSafeWrite("tenants/new-tenant/agriPlan/crops", { crops: { a: 1 } }, "tok")).resolves.toBeDefined();
  });

  it("does not block small collections (5 or fewer records) even on a full wipe", async () => {
    // The guard only kicks in above 5 records, specifically so it doesn't get
    // in the way of legitimately clearing out a brand-new/near-empty list.
    const current = { crops: { a: 1, b: 1 } }; // 2 records
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(current));
    vi.stubGlobal("fetch", fetchMock);

    await expect(dbSafeWrite("tenants/abc/agriPlan/crops", { crops: {} }, "tok")).resolves.toBeDefined();
  });
});
