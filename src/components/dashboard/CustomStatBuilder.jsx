import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, X, RefreshCw } from "lucide-react";

const COLORS = ["#FEDD00", "#40C4FF", "#2ED573", "#FF4757", "#58A6FF", "#A78BFA"];

export default function CustomStatBuilder({ onAdd, onClose }) {
  const [step, setStep] = useState("description");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  const handleGenerateConfig = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      const result = await base44.functions.invoke("generateCustomStatConfig", {
        description: description,
      });
      setConfig(result.data);
      setStep("review");
    } catch (e) {
      console.error("Failed to generate config:", e);
      alert("Failed to generate stat config. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddStat = () => {
    if (config && config.label) {
      onAdd({
        id: `custom_stat_${Date.now()}`,
        label: config.label,
        description: config.description,
        color: COLORS[selectedColor],
        formula: config.formula,
        metricField: config.metricField,
        isCustom: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-[#141f2e] to-[#0f1829] rounded-2xl p-6 max-w-md w-full mx-4 border border-[#243f60] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(254,221,0,0.15)]">
              <Sparkles size={16} style={{ color: "#FEDD00" }} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              AI Stat Builder
            </span>
          </div>
          <button onClick={onClose} className="activity-icon" style={{ width: 24, height: 24 }}>
            <X size={14} />
          </button>
        </div>

        {step === "description" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-secondary)" }}>
                What metric would you like to track?
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g., 'Average mortality rate for chronic diseases' or 'Percentage of regions meeting health targets'"
                className="w-full p-3 rounded-lg outline-none text-xs resize-none"
                rows={4}
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                Cancel
              </button>
              <button
                onClick={handleGenerateConfig}
                disabled={!description.trim() || loading}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: description.trim() ? "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.08) 100%)" : "var(--bg-overlay)",
                  border: description.trim() ? "1px solid rgba(254,221,0,0.3)" : "1px solid var(--border-subtle)",
                  color: description.trim() ? "#FEDD00" : "var(--text-muted)",
                  cursor: loading || !description.trim() ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1
                }}>
                {loading ? (
                  <>
                    <RefreshCw size={11} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "review" && config && (
          <div className="space-y-4">
            <div className="rounded-lg p-3" style={{ background: "rgba(254,221,0,0.03)", border: "1px solid rgba(254,221,0,0.15)" }}>
              <div className="text-xs font-semibold mb-3" style={{ color: "#FEDD00" }}>Generated Configuration</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Label</div>
                  <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{config.label}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Description</div>
                  <div className="text-sm" style={{ color: "var(--text-secondary)" }}>{config.description}</div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>Formula</div>
                  <div className="text-xs font-mono" style={{ color: "var(--accent-primary)" }}>{config.formula}</div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: "var(--text-secondary)" }}>
                Pick a color
              </label>
              <div className="flex gap-2">
                {COLORS.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className="w-8 h-8 rounded-lg transition-all border-2"
                    style={{
                      background: color,
                      borderColor: selectedColor === idx ? "var(--text-primary)" : "transparent",
                      boxShadow: selectedColor === idx ? `0 0 12px ${color}` : "none"
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep("description")}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                Back
              </button>
              <button
                onClick={handleAddStat}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: `linear-gradient(135deg, ${COLORS[selectedColor]}22 0%, ${COLORS[selectedColor]}11 100%)`,
                  border: `1px solid ${COLORS[selectedColor]}44`,
                  color: COLORS[selectedColor],
                  fontWeight: 600
                }}>
                Add Stat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}