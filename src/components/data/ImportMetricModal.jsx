import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, RefreshCw, X, FileText, CheckCircle } from "lucide-react";

export default function ImportMetricModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload"); // upload | preview | done
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const url = await base44.integrations.Core.UploadFile({ file: f });
    const schema = {
      type: "object",
      properties: {
        records: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              region: { type: "string" },
              year: { type: "number" },
              value: { type: "number" },
              unit: { type: "string" },
              notes: { type: "string" },
              confidence_level: { type: "string" },
              data_source_name: { type: "string" }
            }
          }
        }
      }
    };
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url: url.file_url, json_schema: schema });
    if (result.status === "success" && result.output?.records) {
      setPreview(result.output.records.slice(0, 10));
      setStep("preview");
    } else {
      setError("Could not parse file. Please ensure it contains health metric data with name, year, and value columns.");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    await base44.entities.HealthMetric.bulkCreate(preview.map(r => ({
      ...r,
      metis_specific: true,
      confidence_level: r.confidence_level || "medium",
    })));
    setStep("done");
    setImporting(false);
    setTimeout(onImported, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.65)" }}>
      <div className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b"
          style={{ borderColor: "var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Import Health Metrics</span>
          <button onClick={onClose} className="activity-icon" style={{ width: 26, height: 26 }}>
            <X size={14} />
          </button>
        </div>
        <div className="p-5">
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Upload a CSV, Excel, or PDF file containing health metric data. The AI will extract and map the fields automatically.
              </p>
              <label className="flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer transition-colors"
                style={{ background: "var(--bg-overlay)", border: "2px dashed var(--border-default)" }}
                onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent-primary)"}
                onMouseOut={e => e.currentTarget.style.borderColor = "var(--border-default)"}>
                <Upload size={24} className="mb-2" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {file ? file.name : "Click to upload or drag a file"}
                </span>
                <span className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>CSV, XLSX, PDF</span>
                <input type="file" className="hidden" accept=".csv,.xlsx,.pdf" onChange={handleFile} />
              </label>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
          )}
          {step === "preview" && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Found {preview.length} records. Review before importing:
              </p>
              <div className="overflow-auto rounded" style={{ maxHeight: 260, border: "1px solid var(--border-subtle)" }}>
                <table className="w-full data-table text-xs">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Category</th>
                      <th className="text-right">Year</th>
                      <th className="text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>
                        <td>{r.name}</td>
                        <td><span className="tag">{r.category}</span></td>
                        <td className="text-right">{r.year}</td>
                        <td className="text-right font-mono" style={{ color: "var(--accent-primary)" }}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setStep("upload")}
                  className="px-3 py-1.5 rounded-md text-xs"
                  style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                  Back
                </button>
                <button onClick={handleImport} disabled={importing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium disabled:opacity-50"
                  style={{ background: "var(--accent-primary)", color: "#000" }}>
                  {importing ? <RefreshCw size={11} className="animate-spin" /> : <Upload size={11} />}
                  Import {preview.length} Records
                </button>
              </div>
            </div>
          )}
          {step === "done" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <CheckCircle size={32} style={{ color: "var(--color-success)" }} />
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>Import complete!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}