import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useApp } from "../Layout";
import { Check, ChevronRight, Brain, BarChart3, Users, Database, ArrowRight } from "lucide-react";
import { createPageUrl } from "@/utils";

const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "Welcome to MHIP",
    subtitle: "BC Métis Health Intelligence Platform",
    description: "A comprehensive analytics platform for tracking and analyzing Métis health outcomes in British Columbia.",
    icon: Brain,
    color: "#FEDD00",
  },
  {
    id: "dashboard",
    title: "Explore Your Dashboard",
    subtitle: "Real-time health analytics",
    description: "View key health metrics, trends, and disparities between Métis and BC general population. Track your most important indicators at a glance.",
    icon: BarChart3,
    color: "#40c4ff",
  },
  {
    id: "data",
    title: "Manage Data",
    subtitle: "Import and organize metrics",
    description: "Upload health metrics from external sources, organize by category and region, and maintain a comprehensive data repository.",
    icon: Database,
    color: "#2ea043",
  },
  {
    id: "team",
    title: "Collaborate with Your Team",
    subtitle: "Manage access and roles",
    description: "Invite team members, assign roles, and control who can view and edit your health data.",
    icon: Users,
    color: "#a78bfa",
  },
];

export default function Onboarding() {
  const { user } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [userPrefs, setUserPrefs] = useState(null);

  useEffect(() => {
    if (user) {
      base44.auth.updateMe({ onboarding_completed: false });
    }
  }, [user]);

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (user) {
      await base44.auth.updateMe({ onboarding_completed: true });
    }
    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a1220 0%, #0f1829 25%, #0d1f2a 50%, #0a1523 75%, #0a1220 100%)",
        }}>
        <div className="relative z-10 w-full max-w-md px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
              style={{ background: "rgba(46, 213, 115, 0.15)" }}>
              <Check size={32} style={{ color: "#2ea043" }} />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)", fontFamily: "'Sofia Sans Extra Condensed', sans-serif" }}>
            You're All Set!
          </h1>

          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            Your workspace is ready. Let's start exploring Métis health data.
          </p>

          <a href={createPageUrl("Dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)",
              color: "#04245a",
              boxShadow: "0 8px 24px rgba(254,221,0,0.3)",
            }}>
            <span>Go to Dashboard</span>
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0a1220 0%, #0f1829 25%, #0d1f2a 50%, #0a1523 75%, #0a1220 100%)",
      }}>
      
      {/* Animated background */}
      <div style={{
        position: "absolute",
        top: "-50%",
        right: "-50%",
        width: "1000px",
        height: "1000px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(254,221,0,0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-6 py-12">
        {/* Progress bar */}
        <div className="mb-12">
          <div className="flex gap-2 mb-4">
            {ONBOARDING_STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{
                  background: i <= currentStep ? "var(--accent-primary)" : "var(--border-subtle)",
                }}
              />
            ))}
          </div>
          <p className="text-xs text-right" style={{ color: "var(--text-muted)" }}>
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)",
            border: "1px solid rgba(254,221,0,0.15)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}>
          
          <div className="grid md:grid-cols-2">
            {/* Visual side */}
            <div className="p-12 flex flex-col items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(254,221,0,0.05) 0%, rgba(64,196,255,0.05) 100%)",
                borderRight: "1px solid var(--border-subtle)",
              }}>
              <div className="flex items-center justify-center w-24 h-24 rounded-2xl mb-6"
                style={{ background: `${step.color}20` }}>
                <StepIcon size={48} style={{ color: step.color }} />
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {step.title}
                </h2>
                <p className="text-sm" style={{ color: step.color }}>
                  {step.subtitle}
                </p>
              </div>
            </div>

            {/* Content side */}
            <div className="p-12 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
                    {step.description}
                  </p>
                </div>

                {/* Step-specific content */}
                {step.id === "welcome" && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check size={16} style={{ color: "#2ea043", marginTop: 2, flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        Track Métis-specific health metrics
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check size={16} style={{ color: "#2ea043", marginTop: 2, flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        Compare with BC general population
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check size={16} style={{ color: "#2ea043", marginTop: 2, flexShrink: 0 }} />
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                        Generate AI-powered insights
                      </span>
                    </div>
                  </div>
                )}

                {step.id === "dashboard" && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-overlay)" }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      Features:
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <li>• Real-time health disparity metrics</li>
                      <li>• Customizable widget layout</li>
                      <li>• Trend analysis and forecasting</li>
                      <li>• Regional performance comparisons</li>
                    </ul>
                  </div>
                )}

                {step.id === "data" && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-overlay)" }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      Capabilities:
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <li>• Import from CSV, Excel, or APIs</li>
                      <li>• Organize by category and region</li>
                      <li>• Track data quality and confidence</li>
                      <li>• Manage multiple data sources</li>
                    </ul>
                  </div>
                )}

                {step.id === "team" && (
                  <div className="rounded-lg p-4" style={{ background: "var(--bg-overlay)" }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                      Role Types:
                    </div>
                    <ul className="space-y-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <li>• <strong>Admin:</strong> Full platform access & team management</li>
                      <li>• <strong>Analyst:</strong> Data management & insights</li>
                      <li>• <strong>Viewer:</strong> View-only dashboard access</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-8">
                {currentStep > 0 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      background: "var(--bg-overlay)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-default)",
                    }}>
                    Back
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm transition-all"
                  style={{
                    background: "linear-gradient(135deg, #FEDD00 0%, #ffed4e 100%)",
                    color: "#04245a",
                    boxShadow: "0 8px 24px rgba(254,221,0,0.3)",
                  }}>
                  <span>{currentStep === ONBOARDING_STEPS.length - 1 ? "Get Started" : "Next"}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}