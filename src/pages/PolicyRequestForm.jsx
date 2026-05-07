import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { FileSignature, Send, CheckCircle2, X } from "lucide-react";

const REQUEST_TYPES = [
  { value: "legislation_review", label: "Legislation Review" },
  { value: "document_review", label: "Document Review" },
  { value: "policy_development_and_review", label: "Policy Development & Review" },
];

const DEPARTMENTS = [
  "Elders",
  "Veterans",
  "Health",
  "Mental Health & Harm Reduction",
  "Social Programs & Administration",
];

const URGENCY_LEVELS = [
  { value: "low", label: "Low", color: "#52c41a" },
  { value: "medium", label: "Medium", color: "#40c4ff" },
  { value: "high", label: "High", color: "#faad14" },
  { value: "critical", label: "Critical", color: "#ff4d4f" },
];

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  background: "var(--bg-overlay)",
  border: "1.5px solid var(--border-default)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease",
};

// <option> elements inherit the OS chrome color when unstyled.
// Forcing dark bg + light text makes options readable in all browsers.
const optionStyle = {
  background: "#0f1829",
  color: "#f0f6ff",
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-secondary)",
  marginBottom: 6,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

export default function PolicyRequestForm() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    request_title: "",
    request_type: "",
    description: "",
    objective: "",
    policy_areas: "",
    department: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
    key_people_involved: "",
    urgency: "medium",
    required_completion_date: "",
    reason_for_urgency: "",
    relevant_documents_urls: "",
    preferred_communication_method: "Email",
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        policy_areas: form.policy_areas
          ? form.policy_areas.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        key_people_involved: form.key_people_involved
          ? form.key_people_involved.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        relevant_documents_urls: form.relevant_documents_urls
          ? form.relevant_documents_urls.split("\n").map((s) => s.trim()).filter(Boolean)
          : [],
        current_status: "submitted",
      };
      await base44.entities.PolicyRequest.create(payload);
      setSubmitted(true);
    } catch (err) {
      setError(err?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-xl p-8 text-center"
          style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)" }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(82,196,26,0.15)" }}>
            <CheckCircle2 size={28} style={{ color: "#52c41a" }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Request Submitted
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Your policy request has been submitted. You'll be notified by email once it has been assigned to a reviewer.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setSubmitted(false); setForm((f) => ({ ...f, request_title: "", description: "", objective: "" })); }}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-primary)" }}>
              Submit Another
            </button>
            <button
              onClick={() => navigate(createPageUrl("PolicyRequestTable"))}
              className="px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "#FEDD00", color: "#043673" }}>
              View Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      {/* Inline focus styles for inputs/selects/textareas inside the form */}
      <style>{`
        .prf-form input:focus,
        .prf-form select:focus,
        .prf-form textarea:focus {
          border-color: #FEDD00 !important;
          box-shadow: 0 0 0 3px rgba(254,221,0,0.15);
          background: var(--bg-elevated) !important;
        }
        .prf-form input:hover:not(:focus),
        .prf-form select:hover:not(:focus),
        .prf-form textarea:hover:not(:focus) {
          border-color: var(--border-emphasis, #FEDD00) !important;
          border-color: rgba(254,221,0,0.45) !important;
        }
        .prf-field {
          background: var(--bg-surface);
          border: 1.5px solid rgba(254,221,0,0.45);
          border-radius: 10px;
          padding: 12px 14px;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .prf-field:hover {
          border-color: rgba(254,221,0,0.7);
        }
        .prf-field:focus-within {
          border-color: #FEDD00;
          background: var(--bg-overlay);
          box-shadow: 0 0 0 3px rgba(254,221,0,0.15);
        }
      `}</style>

      <div className="px-6 py-5 border-b shrink-0"
        style={{
          background: "linear-gradient(135deg, var(--bg-surface) 0%, #0d1f2a 45%, var(--bg-elevated) 100%)",
          borderColor: "var(--border-default)",
        }}>
        <div className="dashboard-section-label">Red River Module · Intake</div>
        <h1 className="text-lg font-bold mt-1 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
          <FileSignature size={18} style={{ color: "#FEDD00" }} />
          Policy Request Form
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Submit a request for legislation review, document review, or policy development assistance.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="prf-form max-w-3xl mx-auto p-6 space-y-6">
        {error && (
          <div className="rounded-lg p-3 text-xs flex items-center gap-2"
            style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)", color: "#ff4d4f" }}>
            <X size={14} /> {error}
          </div>
        )}

        {/* Section: Request Details */}
        <Section title="Request Details">
          <Field label="Request Title *">
            <input style={inputStyle} value={form.request_title}
              onChange={(e) => update("request_title", e.target.value)} required />
          </Field>

          <Field label="Request Type *">
            <select style={inputStyle} value={form.request_type} required
              onChange={(e) => update("request_type", e.target.value)}>
              <option value="" style={optionStyle}>Select a request type…</option>
              {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value} style={optionStyle}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Description *">
            <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
              value={form.description} onChange={(e) => update("description", e.target.value)}
              placeholder="Describe what assistance you need..." required />
          </Field>

          <Field label="Objective / Desired Outcome">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              value={form.objective} onChange={(e) => update("objective", e.target.value)}
              placeholder="What outcome do you want to achieve?" />
          </Field>

          <Field label="Policy Areas (comma separated)">
            <input style={inputStyle} value={form.policy_areas}
              onChange={(e) => update("policy_areas", e.target.value)}
              placeholder="e.g. Mental Health, Substance Use, Children & Youth" />
          </Field>
        </Section>

        {/* Section: Contact */}
        <Section title="Contact & Department">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Department *">
              <select style={inputStyle} value={form.department} required
                onChange={(e) => update("department", e.target.value)}>
                <option value="" style={optionStyle}>Select a department…</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d} style={optionStyle}>{d}</option>)}
              </select>
            </Field>
            <Field label="Contact Person *">
              <input style={inputStyle} value={form.contact_person_name}
                onChange={(e) => update("contact_person_name", e.target.value)} required />
            </Field>
            <Field label="Contact Email *">
              <input type="email" style={inputStyle} value={form.contact_person_email}
                onChange={(e) => update("contact_person_email", e.target.value)} required />
            </Field>
            <Field label="Preferred Communication">
              <select style={inputStyle} value={form.preferred_communication_method}
                onChange={(e) => update("preferred_communication_method", e.target.value)}>
                <option style={optionStyle}>Email</option>
                <option style={optionStyle}>Phone</option>
              </select>
            </Field>
            {form.preferred_communication_method === "Phone" && (
              <Field label="Contact Phone Number *">
                <input type="tel" style={inputStyle} value={form.contact_person_phone}
                  onChange={(e) => update("contact_person_phone", e.target.value)}
                  placeholder="e.g. (250) 555-1234" required />
              </Field>
            )}
          </div>
          <Field label="Key People Involved (comma separated)">
            <input style={inputStyle} value={form.key_people_involved}
              onChange={(e) => update("key_people_involved", e.target.value)}
              placeholder="e.g. Jane Smith, John Doe" />
          </Field>
        </Section>

        {/* Section: Urgency */}
        <Section title="Urgency & Timeline">
          <Field label="Urgency *">
            <div className="flex gap-2 flex-wrap">
              {URGENCY_LEVELS.map((u) => (
                <button type="button" key={u.value} onClick={() => update("urgency", u.value)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
                  style={{
                    background: form.urgency === u.value ? `${u.color}22` : "var(--bg-overlay)",
                    border: `1px solid ${form.urgency === u.value ? u.color : "var(--border-default)"}`,
                    color: form.urgency === u.value ? u.color : "var(--text-secondary)",
                  }}>
                  {u.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Required Completion Date">
              <input type="date" style={inputStyle} value={form.required_completion_date}
                onChange={(e) => update("required_completion_date", e.target.value)} />
            </Field>
            {(form.urgency === "high" || form.urgency === "critical") && (
              <Field label="Reason for Urgency">
                <input style={inputStyle} value={form.reason_for_urgency}
                  onChange={(e) => update("reason_for_urgency", e.target.value)}
                  placeholder="Why is this urgent?" />
              </Field>
            )}
          </div>
        </Section>

        {/* Section: Documents */}
        <Section title="Supporting Documents">
          <Field label="Relevant Document URLs (one per line)">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
              value={form.relevant_documents_urls}
              onChange={(e) => update("relevant_documents_urls", e.target.value)}
              placeholder="https://..." />
          </Field>
        </Section>

        <div className="flex gap-3 justify-end pt-2">
          <button type="button" onClick={() => navigate(createPageUrl("PolicyRequestTable"))}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
            Cancel
          </button>
          <button type="submit" disabled={submitting}
            className="px-5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
            style={{ background: "#FEDD00", color: "#043673" }}>
            <Send size={13} />
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl p-5 space-y-4"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
      }}>
      <div className="flex items-center gap-2 pb-3 mb-1"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ width: 3, height: 14, background: "#FEDD00", borderRadius: 2, boxShadow: "0 0 6px rgba(254,221,0,0.5)" }} />
        <div className="text-xs font-bold uppercase" style={{ color: "#FEDD00", letterSpacing: "0.1em" }}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="prf-field">
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}