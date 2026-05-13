export const genId    = () => `${Date.now()}_${Math.random().toString(36).substr(2,5)}`;
export const nowLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
};
export const fmtDate = (iso) => {
  try { return new Date(iso).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"}); }
  catch { return iso||""; }
};
export const obj2arr  = (obj) => obj ? Object.values(obj) : [];
export const slugify  = (str) => str.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
