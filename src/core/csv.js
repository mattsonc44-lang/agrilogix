// src/core/csv.js
// Minimal RFC4180-lite CSV encode/decode — shared by any module that needs
// an export/re-import round trip (currently AgriPlan's APH mapping CSV).
// Pulled out of agriPlan/index.jsx so it can be unit tested on its own,
// without needing to load the whole component file.

export const csvEscape = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const csvParseLine = (line) => {
  // Minimal RFC4180 field splitter — handles quoted fields with embedded commas/quotes.
  const out = []; let cur = ""; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; } }
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
};

export const parseCSV = (text) => {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter(l => l.length > 0);
  if (!lines.length) return [];
  const headers = csvParseLine(lines[0]);
  return lines.slice(1).map(line => {
    const cells = csvParseLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
};

export const downloadTextFile = (filename, text, mime = "text/csv") => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
