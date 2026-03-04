import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Loader2, Upload, Check, AlertCircle, X } from "lucide-react";

export default function AddressEnricher({ records, addressField, onEnrichComplete, onClose }) {
  const [loading, setLoading] = useState(false);
  const [enrichedData, setEnrichedData] = useState(null);
  const [error, setError] = useState(null);

  const handleEnrich = async () => {
    if (!records || records.length === 0) {
      setError("No records to enrich");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("bcAddressGeocoder", {
        action: "enrich_records",
        records,
        addressField,
      });
      if (res.data?.success) {
        setEnrichedData(res.data);
        if (onEnrichComplete) onEnrichComplete(res.data.results);
      } else {
        setError(res.data?.error || "Enrichment failed");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="flex flex-col w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", maxHeight: "85vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <div className="flex items-center gap-2">
            <MapPin size={15} style={{ color: "var(--accent-primary)" }} />
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>BC Address Geocoder Enrichment</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Add coordinates and location data to your records</div>
            </div>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!enrichedData ? (
            <div className="space-y-4">
              <div className="p-3 rounded-md" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Enrichment Summary</div>
                <div className="space-y-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <div>Records to process: <span style={{ color: "var(--accent-primary)" }}>{records?.length || 0}</span></div>
                  <div>Address field: <span style={{ color: "var(--accent-primary)" }}>{addressField}</span></div>
                  <div className="mt-2">This will add:</div>
                  <ul className="list-disc list-inside ml-2">
                    <li>latitude & longitude</li>
                    <li>full_address (standardized)</li>
                    <li>locality & province code</li>
                    <li>match score (0-100)</li>
                  </ul>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-md flex items-start gap-2" style={{ background: "rgba(185,38,45,0.1)", border: "1px solid var(--color-error)" }}>
                  <AlertCircle size={14} style={{ color: "var(--color-error)", marginTop: 2, flexShrink: 0 }} />
                  <span className="text-xs" style={{ color: "var(--color-error)" }}>{error}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-md flex items-center gap-2" style={{ background: "rgba(46,160,67,0.1)", border: "1px solid var(--color-success)" }}>
                <Check size={14} style={{ color: "var(--color-success)", flexShrink: 0 }} />
                <span className="text-xs" style={{ color: "var(--color-success)" }}>
                  Successfully enriched {enrichedData.enriched} of {enrichedData.total} records
                </span>
              </div>

              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Preview of enriched records:</div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {enrichedData.results?.slice(0, 5).map((record, i) => (
                  <div key={i} className="p-2 rounded text-xs" style={{ background: "var(--bg-overlay)", border: `1px solid ${record.geocoded ? "var(--color-success)" : "var(--color-error)"}` }}>
                    <div className="flex items-start gap-2">
                      {record.geocoded ? (
                        <Check size={12} style={{ color: "var(--color-success)", marginTop: 1, flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={12} style={{ color: "var(--color-error)", marginTop: 1, flexShrink: 0 }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div style={{ color: "var(--text-primary)" }}>{record[addressField]}</div>
                        {record.geocoded ? (
                          <div style={{ color: "var(--text-muted)" }}>
                            ({record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}) • {record.locality || "N/A"} • Score: {record.score}
                          </div>
                        ) : (
                          <div style={{ color: "var(--color-error)" }}>{record.error}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {enrichedData.results?.length > 5 && (
                <div className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  ... and {enrichedData.results.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t shrink-0"
          style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {enrichedData
              ? "Enrichment complete. Download or save the enriched records."
              : "Uses BC Address Geocoder API to match and enrich addresses."}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-3 py-1.5 rounded-md text-xs"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              {enrichedData ? "Done" : "Cancel"}
            </button>
            {!enrichedData && (
              <button onClick={handleEnrich} disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: loading ? "var(--text-muted)" : "var(--accent-primary)", color: "#000", opacity: loading ? 0.6 : 1 }}>
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <MapPin size={12} /> Enrich Now
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}