// ╔══════════════════════════════════════════════════════════════════╗
// ║  AGRI LOGIX — Platform Configuration                           ║
// ╠══════════════════════════════════════════════════════════════════╣
export const FIREBASE_URL  = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
export const STRIPE_KEY    = (typeof window !== "undefined" && window.__STRIPE_KEY__)  || "";
export const ANTHROPIC_KEY = (typeof window !== "undefined" && window.__ANTHROPIC_KEY__) || "";

// ── Module definitions ────────────────────────────────────────────
export const MODULES = {
  fieldlog: {
    id:    "fieldlog",
    label: "FieldLog",
    icon:  "🌾",
    desc:  "Field activity tracking — seeding, spraying, scouting, harvest",
    price: 150,   // USD / year
    color: "#C07010",
  },
  agriScale: {
    id:    "agriScale",
    label: "AgriScale",
    icon:  "⚖️",
    desc:  "Grain cart management — loads, bins, harvest tracking",
    price: 150,
    color: "#2A6A48",
  },
  serviceLog: {
    id:    "serviceLog",
    label: "ServiceLog",
    icon:  "🔧",
    desc:  "Equipment & vehicle maintenance — service records, schedules",
    price: 150,
    color: "#1E5078",
  },
};

// ── Roles ─────────────────────────────────────────────────────────
export const ROLES = {
  owner:    { label: "Owner",    level: 3 },
  manager:  { label: "Manager",  level: 2 },
  operator: { label: "Operator", level: 1 },
};

export const FB_CONFIGURED = !FIREBASE_URL.includes("YOUR-");
