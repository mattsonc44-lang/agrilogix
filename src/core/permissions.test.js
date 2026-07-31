import { describe, it, expect } from "vitest";
import { getPerms, PERMS } from "./permissions.js";

describe("getPerms", () => {
  it("gives owners full visibility", () => {
    const perms = getPerms({ role: "owner" });
    expect(perms.canViewCosts).toBe(true);
    expect(perms.canViewInsurance).toBe(true);
    expect(perms.canViewCropShare).toBe(true);
  });

  it("lets managers see costs but not insurance or crop share", () => {
    const perms = getPerms({ role: "manager" });
    expect(perms.canViewCosts).toBe(true);
    expect(perms.canViewInsurance).toBe(false);
    expect(perms.canViewCropShare).toBe(false);
  });

  it("hides all financial detail from operators", () => {
    const perms = getPerms({ role: "operator" });
    expect(perms.canViewCosts).toBe(false);
    expect(perms.canViewInsurance).toBe(false);
    expect(perms.canViewCropShare).toBe(false);
    expect(perms.canEditFields).toBe(false);
  });

  it("falls back to the operator (most restrictive) tier for a missing or unrecognized role", () => {
    expect(getPerms(null)).toEqual(PERMS.operator);
    expect(getPerms({})).toEqual(PERMS.operator);
    expect(getPerms({ role: "some-typo" })).toEqual(PERMS.operator);
  });
});
