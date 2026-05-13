// ── Agri Logix Design Tokens ──────────────────────────────────────
export const T = {
  // Base
  bg:       "#F4EFE6",
  panel:    "#E8DFD0",
  card:     "#FFFFFF",
  cardHov:  "#F5EDE0",
  border:   "#D8CEBC",
  borderHi: "#C4A468",
  // Brand
  brand:    "#2A5E2A",   // Agri Logix green
  brandSoft:"#3A7A3A",
  gold:     "#C07010",
  goldSoft: "#D48820",
  // Text
  text:     "#1E1408",
  muted:    "#7A6645",
  faint:    "#B8A880",
  // Semantic
  green:    "#2A5E2A",
  blue:     "#1E5078",
  danger:   "#841A18",
  warning:  "#C07010",
  // Module accents
  fieldlog:   "#C07010",
  agriScale:  "#2A6A48",
  serviceLog: "#1E5078",
};

export const S = {
  app:     { fontFamily:"'Barlow',sans-serif", background:T.bg, minHeight:"100vh", color:T.text },
  card:    { background:T.card, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"16px", marginBottom:"12px" },
  label:   { display:"block", fontSize:"11px", color:T.muted, textTransform:"uppercase", letterSpacing:"0.9px", fontWeight:700, marginBottom:"5px" },
  input:   { width:"100%", background:"#FFFFFF", border:`1px solid ${T.borderHi}`, borderRadius:"6px", padding:"8px 11px", color:T.text, fontSize:"14px", fontFamily:"'Barlow',sans-serif", outline:"none", boxSizing:"border-box" },
  row:     { marginBottom:"14px" },
  g2:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" },
  g3:      { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" },
  sh:      { fontFamily:"'Playfair Display',serif", fontSize:"16px", color:T.gold, margin:"0 0 14px 0" },
  content: { padding:"20px", maxWidth:"860px", margin:"0 auto" },
};

export const mkBtn = (v="primary", accent) => {
  const bg = v==="primary" ? (accent||T.brand) : v==="danger" ? T.danger : "transparent";
  const color = v==="primary"||v==="danger" ? "#FFFFFF" : v==="outline" ? (accent||T.brand) : T.muted;
  const border = v==="ghost"   ? `1px solid ${T.border}`
               : v==="outline" ? `1px solid ${accent||T.brand}`
               : "none";
  return {
    display:"inline-flex", alignItems:"center", gap:"6px",
    padding:"8px 16px", borderRadius:"6px", border,
    cursor:"pointer", fontSize:"13px", fontWeight:600,
    fontFamily:"'Barlow',sans-serif", background:bg, color,
  };
};

// Inject Google Fonts
if (typeof document !== "undefined" && !document.getElementById("al-fonts")) {
  const l = document.createElement("link");
  l.id = "al-fonts"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Barlow:wght@300;400;600;700&display=swap";
  document.head.appendChild(l);
}
