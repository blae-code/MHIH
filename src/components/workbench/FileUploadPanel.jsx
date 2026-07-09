/**
 * FileUploadPanel — drop zone / file picker for the Analysis Workbench.
 * CSV files are parsed client-side; Excel files are uploaded and extracted
 * via the platform file-extraction integration.
 */

import React, { useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { parseCSV } from "@/lib/quantStats";

export default function FileUploadPanel({ onData, compact = false }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const ext = file.name.split(".").pop().toLowerCase();
      if (ext === "csv") {
        const text = await file.text();
        const { columns, rows } = parseCSV(text);
        if (!columns.length || !rows.length) throw new Error("No tabular data found in this CSV.");
        onData({ fileName: file.name, columns, rows });
      } else if (ext === "xlsx" || ext === "xls") {
        if (file.size > 8 * 1024 * 1024) throw new Error("Excel file is too large (max 8 MB). Export it as CSV and try again.");
        const file_b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () => reject(new Error("Could not read the file."));
          reader.readAsDataURL(file);
        });
        const res = await base44.functions.invoke("parseSpreadsheet", { file_b64, file_name: file.name });
        const { columns, rows, error: parseError } = res.data || {};
        if (parseError) throw new Error(parseError);
        if (!rows?.length) throw new Error("No rows found in the Excel file.");
        onData({ fileName: file.name, columns, rows });
      } else {
        throw new Error("Unsupported file type — please upload a .csv, .xlsx, or .xls file.");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
        className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all text-center"
        style={{
          padding: compact ? "14px 16px" : "40px 24px",
          background: dragOver ? "rgba(64,196,255,0.08)" : "var(--bg-overlay)",
          border: `2px dashed ${dragOver ? "#40c4ff" : "var(--border-default)"}`,
        }}
      >
        {loading ? (
          <>
            <Loader2 size={compact ? 18 : 28} className="animate-spin" style={{ color: "#40c4ff" }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Reading file…
            </span>
          </>
        ) : (
          <>
            <UploadCloud size={compact ? 18 : 28} style={{ color: "#40c4ff" }} />
            <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {compact ? "Upload another file" : "Drop a CSV or Excel file here"}
            </div>
            {!compact && (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                .csv, .xlsx, .xls — or click to browse
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              <FileSpreadsheet size={11} /> Analyzed locally — nothing is saved unless you choose to
            </div>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }}
      />
      {error && (
        <div className="mt-2 text-xs px-3 py-2 rounded-md"
          style={{ background: "rgba(255,23,68,0.08)", border: "1px solid rgba(255,23,68,0.3)", color: "#ff6b81" }}>
          {error}
        </div>
      )}
    </div>
  );
}