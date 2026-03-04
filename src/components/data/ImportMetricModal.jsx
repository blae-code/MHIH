import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, RefreshCw, X, CheckCircle } from "lucide-react";

export default function ImportMetricModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState("");
  const [step, setStep] = useState("upload"); // upload | preview | done
  const [preview, setPreview] = useState([]);
  const [extractedData, setExtractedData] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError(null);

    const url = await base44.integrations.Core.UploadFile({ file: f });
    setFileUrl(url.file_url || "");
    const schema = {
      type: "object",
      properties: {
        report_metadata: {
          type: "object",
          properties: {
            report_title: { type: "string" },
            organization: { type: "string" },
            report_date: { type: "string" },
            jurisdiction: { type: "string" },
            region: { type: "string" },
          }
        },
        quantitative_findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              metric_name: { type: "string" },
              metric_value: { type: "number" },
              unit: { type: "string" },
              year: { type: "number" },
              region: { type: "string" },
              category: { type: "string" },
              comparison_value: { type: "number" },
              confidence: { type: "string" },
              notes: { type: "string" },
              page_reference: { type: "string" }
            }
          }
        },
        qualitative_findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              theme: { type: "string" },
              finding: { type: "string" },
              implication: { type: "string" },
              recommendation: { type: "string" },
              evidence_quote: { type: "string" },
              page_reference: { type: "string" }
            }
          }
        }
      }
    };
    const result = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url: url.file_url, json_schema: schema });
    const parsed = /** @type {any} */ (result || {});
    const output = parsed.output || {};
    const quant = Array.isArray(output.quantitative_findings)
      ? output.quantitative_findings
      : Array.isArray(output.records)
        ? output.records.map(r => ({
          metric_name: r.name,
          metric_value: r.value,
          unit: r.unit,
          year: r.year,
          region: r.region,
          category: r.category,
          comparison_value: r.comparison_value,
          confidence: r.confidence_level,
          notes: r.notes,
        }))
        : [];
    const qual = Array.isArray(output.qualitative_findings) ? output.qualitative_findings : [];

    if (parsed.status === "success" && (quant.length || qual.length)) {
      setExtractedData({
        report_metadata: output.report_metadata || {},
        summary: output.summary || "",
        tags: output.tags || [],
        quantitative_findings: quant,
        qualitative_findings: qual,
      });
      setPreview(quant.slice(0, 10).map((r) => ({
        name: r.metric_name,
        category: r.category,
        year: r.year,
        value: r.metric_value,
        unit: r.unit,
      })));
      setStep("preview");
    } else {
      setError("Could not parse the report. Ensure it contains quantitative and/or qualitative findings.");
    }
  };

  const handleImport = async () => {
    if (!fileUrl || !extractedData) {
      setError("No parsed report data available.");
      return;
    }
    setImporting(true);
    setError(null);
    try {
      const queued = await base44.functions.invoke("queueReportIngestion", {
        file_url: fileUrl,
        file_name: file?.name || "",
        source_name: file?.name || "Imported report",
        source_type: "uploaded_report",
        pre_extracted_data: extractedData,
        import_metrics: true,
        index_knowledge: true,
        create_insight: true,
        use_llm_summary: true,
        max_context_chars: 2400,
        max_metrics: 600,
        max_qual_findings: 180,
        token_budget: 120000,
      });
      const queueDocId = queued.data?.queue_doc_id;
      const worker = await base44.functions.invoke("runReportIngestionWorker", {
        queue_doc_id: queueDocId,
        queue_limit: 1,
        import_metrics: true,
        index_knowledge: true,
        create_insight: true,
        use_llm_summary: true,
        max_context_chars: 2400,
        max_metrics: 600,
        max_qual_findings: 180,
        token_budget: 120000,
      });
      let first = worker.data?.worker?.results?.[0] || worker.data?.results?.[0] || null;
      if (!first && queueDocId) {
        const status = await base44.functions.invoke("getReportIngestionStatus", { report_document_id: queueDocId });
        first = {
          knowledge_document_id: queueDocId,
          qualitative_extracted: status.data?.findings?.qualitative_total || 0,
          quantitative_extracted: status.data?.findings?.quantitative_total || 0,
          metrics_imported: 0,
          summary: status.data?.summary || "Queued report processed.",
        };
      }
      setImportResult(first);
      setStep("done");
      setTimeout(onImported, 1200);
    } catch (e) {
      setError(e.message);
    }
    setImporting(false);
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
                Found {extractedData?.quantitative_findings?.length || 0} quantitative and {extractedData?.qualitative_findings?.length || 0} qualitative findings. Review sample before importing:
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
              <p className="text-sm" style={{ color: "var(--text-primary)" }}>Report processing complete.</p>
              {importResult && (
                <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  Metrics imported: <span style={{ color: "var(--text-secondary)" }}>{importResult.metrics_imported ?? 0}</span><br />
                  Qualitative findings indexed: <span style={{ color: "var(--text-secondary)" }}>{importResult.qualitative_extracted ?? 0}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
