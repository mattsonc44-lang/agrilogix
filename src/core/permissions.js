// Shared owner/manager/operator permission model — originally built for
// AgriScale only. Every module receives a resolved per-module role from
// App.jsx (userProfile.moduleRoles?.[module] || userProfile.role), but only
// AgriScale actually read it — AgriPlan, FieldLog, and ServiceLog ignored it
// entirely, so anyone granted access to those modules saw full financials
// regardless of whether they were invited as an "operator". This file is the
// single source of truth for what each role can see/do, so that gap gets
// closed consistently instead of each module inventing its own rules.
//
// Meaning of each flag, applied per-module:
//   canViewInsurance — AgriPlan: bushel/price guarantee. AgriScale: insurance unit info.
//   canViewCropShare — AgriPlan: landlord + operator share %. AgriScale: same.
//   canViewCosts      — AgriPlan: revenue/expenses/net $. ServiceLog: parts/service/vendor pricing.
//   canEditFields      — create/edit field or vehicle records.
//   canReport          — access report/export views (CSV, PDF, cost reports).
//   canEditComm/Admin — edit comments, vendors, settings-type records.

export const PERMS = {
  owner:    { canViewInsurance:true,  canViewCropShare:true,  canViewCosts:true,  canEditFields:true,  canEditBins:true,  canReport:true,  canEditComm:true },
  manager:  { canViewInsurance:false, canViewCropShare:false, canViewCosts:true,  canEditFields:true,  canEditBins:true,  canReport:true,  canEditComm:true },
  operator: { canViewInsurance:false, canViewCropShare:false, canViewCosts:false, canEditFields:false, canEditBins:false, canReport:false, canEditComm:false },
};

// userProfile.role is always set to SOME string by App.jsx (defaulting to
// the account-wide role if there's no per-module override) — but guard
// against an unrecognized value the same way AgriScale already does,
// falling back to the most restrictive tier rather than the most open one.
export function getPerms(userProfile) {
  const role = userProfile?.role || "operator";
  return PERMS[role] || PERMS.operator;
}

// A small "$••••" style placeholder for redacted dollar figures — keeps the
// table/layout shape intact (so columns don't jump around) while making it
// obvious there's a real number being withheld, not that the value is zero.
export const REDACTED = "•••";
