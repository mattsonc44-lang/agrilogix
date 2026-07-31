import { describe, it, expect, vi, beforeEach } from "vitest";

// auth-check.js reads FIREBASE_API_KEY into a module-level constant at
// import time, so each scenario that depends on it needs a fresh module
// instance — hence vi.resetModules() + a dynamic import per test instead of
// one static top-level import.

function fakeEvent(bearer) {
  return { headers: bearer ? { authorization: `Bearer ${bearer}` } : {} };
}

function jsonResponse(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  process.env.FIREBASE_API_KEY = "test-api-key";
});

describe("checkAuth — request shape", () => {
  it("denies with no Authorization header at all", async () => {
    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent(null));
    expect(result.error.statusCode).toBe(401);
  });

  it("denies an empty bearer token", async () => {
    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent(""));
    expect(result.error.statusCode).toBe(401);
  });

  it("denies (503) if FIREBASE_API_KEY isn't configured", async () => {
    delete process.env.FIREBASE_API_KEY;
    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent("sometoken"));
    expect(result.error.statusCode).toBe(503);
  });
});

describe("checkAuth — token + registration checks", () => {
  it("denies a token Firebase itself doesn't recognize", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "INVALID_ID_TOKEN" })));
    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent("bogus-token"));
    expect(result.error.statusCode).toBe(401);
  });

  it("denies a valid Firebase token for a uid with no Agri Logix user record (regression test for the always-pass bug)", async () => {
    // This is the exact bug that was fixed: Layer 2 used to read users/{uid}
    // with NO auth token, so under real (locked-down) DB rules it always got
    // a permission-denied object back — and the old `if (!data)` check let
    // that object through as if the user existed. Simulating that same
    // permission-denied shape here must now correctly deny access.
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ users: [{ localId: "uid123", email: "ghost@example.com" }] })) // Layer 1: valid token
      .mockResolvedValueOnce(jsonResponse({ error: "Permission denied" })); // Layer 2: denied read
    vi.stubGlobal("fetch", fetchMock);

    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent("valid-but-unregistered"));
    expect(result.error.statusCode).toBe(401);
  });

  it("denies a valid Firebase token for a uid with literally no record (null)", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ users: [{ localId: "uid123", email: "ghost@example.com" }] }))
      .mockResolvedValueOnce(jsonResponse(null));
    vi.stubGlobal("fetch", fetchMock);

    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent("valid-but-unregistered"));
    expect(result.error.statusCode).toBe(401);
  });

  it("allows a valid token for a real, registered user", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ users: [{ localId: "uid123", email: "chris@example.com" }] }))
      .mockResolvedValueOnce(jsonResponse({ role: "owner", tenantId: "uid123_org" }));
    vi.stubGlobal("fetch", fetchMock);

    const { checkAuth } = await import("./auth-check.js");
    const result = await checkAuth(fakeEvent("valid-registered-token"));
    expect(result.error).toBeUndefined();
    expect(result.uid).toBe("uid123");
    expect(result.email).toBe("chris@example.com");
  });

  it("passes the caller's own idToken when checking their user record (never an unauthenticated read)", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ users: [{ localId: "uid123", email: "chris@example.com" }] }))
      .mockResolvedValueOnce(jsonResponse({ role: "owner" }));
    vi.stubGlobal("fetch", fetchMock);

    const { checkAuth } = await import("./auth-check.js");
    await checkAuth(fakeEvent("my-real-token"));

    const secondCallUrl = fetchMock.mock.calls[1][0];
    expect(secondCallUrl).toContain("auth=my-real-token");
  });
});
