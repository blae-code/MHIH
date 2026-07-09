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
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url,
          json_schema: { type: "array", items: { type: "object", additionalProperties: true } },
        });
        if (result.status !== "success") throw new Error(result.details || "Could not extract data from the Excel file.");
        const rows = Array.isArray(result.output) ? result.output : [result.output];
        if (!rows.length) throw new Error("No rows found in the Excel file.");
        const columns = [...new Set(rows.flatMap((r) => Object.keys(r || {})))];
        onData({ fileName: file.name, columns, rows });
      } else {
        throw new Error("Unsupported file type — please upload a .csv, .xlsx, or .xls file.");
      }
    } catch (e) {
      setError(e.message);
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