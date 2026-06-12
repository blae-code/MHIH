/**
 * RouteErrorBoundary — catches uncaught render errors in any page so a
 * single component crash never blanks the OS shell. Logs the error and
 * presents an on-brand recovery UI with a reset button and a return-home
 * link.
 *
 * Wraps every <Route> element in App.jsx. Resets on URL change via the
 * pageKey prop (which the parent updates from `useLocation().pathname`).
 */
import React from "react";
import { AlertTriangle, RefreshCw, Home, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Console for devtools; the platform's status log will also capture this
    // via the global handler in main.jsx if any.
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error, info);
    this.setState({ info });
  }

  componentDidUpdate(prevProps) {
    if (prevProps.pageKey !== this.props.pageKey && this.state.error) {
      this.setState({ error: null, info: null, copied: false });
    }
  }

  handleReset = () => {
    this.setState({ error: null, info: null, copied: false });
  };

  handleCopy = () => {
    const { error, info } = this.state;
    const text = [
      `Page: ${this.props.pageName ?? "(unknown)"}`,
      `Error: ${error?.message ?? String(error)}`,
      `Stack: ${error?.stack ?? "(none)"}`,
      `Component stack: ${info?.componentStack ?? "(none)"}`,
    ].join("\n\n");
    try {
      navigator.clipboard.writeText(text);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 1800);
    } catch {
      // best-effort
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const message = error?.message ?? String(error);
    const pageName = this.props.pageName ?? "this page";

    return (
      <div
        className="min-h-full w-full flex items-center justify-center p-6 relative"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Ambient red glow — restrained, not alarming */}
        <div
          aria-hidden
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 260,
            background: "radial-gradient(ellipse 60% 100% at 50% 0%, rgba(255,77,79,0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          className="rounded-2xl overflow-hidden max-w-2xl w-full relative"
          style={{
            background: "linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-surface) 100%)",
            border: "1px solid rgba(255,77,79,0.25)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, transparent 0%, #ff4d4f 50%, transparent 100%)",
              boxShadow: "0 0 12px rgba(255,77,79,0.6)",
            }}
          />

          <div className="p-6 sm:p-8 relative z-10">
            <div className="flex items-start gap-4 mb-5">
              <div
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(255,77,79,0.18) 0%, rgba(255,77,79,0.04) 100%)",
                  border: "1px solid rgba(255,77,79,0.3)",
                  boxShadow: "0 0 16px rgba(255,77,79,0.15)",
                }}
              >
                <AlertTriangle size={22} style={{ color: "#ff8a8a", strokeWidth: 2 }} />
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className="dashboard-section-label"
                  style={{ margin: 0, color: "#ff8a8a" }}
                >
                  Page Error
                </div>
                <h2
                  className="mnbc-heading mt-1"
                  style={{ fontSize: 22, color: "var(--text-primary)", lineHeight: 1.15, margin: 0 }}
                >
                  Something went wrong rendering {pageName}
                </h2>
                <p
                  className="mt-2"
                  style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}
                >
                  The rest of the platform is unaffected. You can retry the page,
                  return home, or copy the error for support.
                </p>
              </div>
            </div>

            {/* Error message */}
            <div
              className="rounded-lg p-3 mb-5 font-mono text-xs"
              style={{
                background: "var(--bg-overlay)",
                border: "1px solid var(--border-subtle)",
                color: "#ff8a8a",
                maxHeight: 120,
                overflow: "auto",
                wordBreak: "break-word",
              }}
            >
              {message}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: "linear-gradient(135deg, rgba(254,221,0,0.15) 0%, rgba(254,221,0,0.05) 100%)",
                  border: "1px solid rgba(254,221,0,0.3)",
                  color: "#FEDD00",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={12} />
                Retry
              </button>
              <Link
                to={createPageUrl("RedRiverOSHome")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Home size={12} />
                Home
              </Link>
              <button
                onClick={this.handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ml-auto"
                style={{
                  background: "transparent",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <Copy size={11} />
                {this.state.copied ? "Copied" : "Copy details"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}