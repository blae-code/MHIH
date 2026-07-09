/**
 * quantStats — client-side quantitative analysis helpers for the
 * Analysis Workbench. CSV parsing, column type inference, descriptive
 * statistics, Pearson correlations, and histogram binning.
 */

// ── CSV parsing (quote-aware) ───────────────────────────────────────────────
export function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((f) => f !== "")) rows.push(row); }
  if (rows.length < 1) return { columns: [], rows: [] };

  const header = rows[0].map((h, i) => (h?.trim() || `column_${i + 1}`));
  const dataRows = rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => { obj[h] = r[i] !== undefined ? r[i].trim() : ""; });
    return obj;
  });
  return { columns: header, rows: dataRows };
}

// ── Type inference ──────────────────────────────────────────────────────────
export function toNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Returns { name, type: 'numeric'|'categorical', values } per column */
export function inferColumns(columns, rows) {
  return columns.map((name) => {
    const raw = rows.map((r) => r[name]);
    const nonEmpty = raw.filter((v) => v !== null && v !== undefined && v !== "");
    const numeric = nonEmpty.map(toNumber).filter((v) => v !== null);
    const isNumeric = nonEmpty.length > 0 && numeric.length / nonEmpty.length >= 0.6;
    return { name, type: isNumeric ? "numeric" : "categorical" };
  });
}

// ── Descriptive statistics ──────────────────────────────────────────────────
export function describeNumeric(values) {
  const nums = values.map(toNumber).filter((v) => v !== null).sort((a, b) => a - b);
  const n = nums.length;
  if (n === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = n > 1 ? nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  const q = (p) => {
    const idx = (n - 1) * p;
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return nums[lo] + (nums[hi] - nums[lo]) * (idx - lo);
  };
  return {
    count: n,
    missing: values.length - n,
    mean,
    median: q(0.5),
    std: Math.sqrt(variance),
    min: nums[0],
    max: nums[n - 1],
    q1: q(0.25),
    q3: q(0.75),
  };
}

export function describeCategorical(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  const counts = {};
  nonEmpty.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    count: nonEmpty.length,
    missing: values.length - nonEmpty.length,
    unique: sorted.length,
    top: sorted[0]?.[0] ?? "—",
    topFreq: sorted[0]?.[1] ?? 0,
    topValues: sorted.slice(0, 8),
  };
}

// ── Pearson correlation ─────────────────────────────────────────────────────
export function pearson(xs, ys) {
  const pairs = [];
  for (let i = 0; i < xs.length; i++) {
    const x = toNumber(xs[i]), y = toNumber(ys[i]);
    if (x !== null && y !== null) pairs.push([x, y]);
  }
  const n = pairs.length;
  if (n < 3) return null;
  const mx = pairs.reduce((a, p) => a + p[0], 0) / n;
  const my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let num = 0, dx = 0, dy = 0;
  pairs.forEach(([x, y]) => {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  });
  const den = Math.sqrt(dx * dy);
  return den === 0 ? null : num / den;
}

export function correlationMatrix(rows, numericCols) {
  return numericCols.map((a) =>
    numericCols.map((b) => {
      if (a === b) return 1;
      return pearson(rows.map((r) => r[a]), rows.map((r) => r[b]));
    })
  );
}

// ── Histogram binning ───────────────────────────────────────────────────────
export function histogram(values, binCount = 12) {
  const nums = values.map(toNumber).filter((v) => v !== null);
  if (nums.length === 0) return [];
  const min = Math.min(...nums), max = Math.max(...nums);
  if (min === max) return [{ bin: String(min), count: nums.length }];
  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    lo: min + i * width,
    hi: min + (i + 1) * width,
    count: 0,
  }));
  nums.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / width), binCount - 1);
    bins[idx].count++;
  });
  return bins.map((b) => ({
    bin: `${fmtNum(b.lo)}–${fmtNum(b.hi)}`,
    count: b.count,
  }));
}

export function fmtNum(v) {
  if (v === null || v === undefined) return "—";
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}