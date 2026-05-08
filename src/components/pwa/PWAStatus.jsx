/**
 * PWA Status component — handles three things:
 *   1. Listens for the beforeinstallprompt event and shows a small "Install"
 *      pill in the corner when the app is installable.
 *   2. Listens for service worker updates and shows a "New version available"
 *      toast with a Reload button.
 *   3. Shows an "Offline" indicator when the connection drops.
 *
 * Renders nothing in normal online state with no install prompt and no update.
 */

import React, { useEffect, useState } from "react";
import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { applyServiceWorkerUpdate } from "@/lib/registerSW";

export default function PWAStatus() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("rr-pwa-install-dismissed") === "1"
  );
  const [updateReady, setUpdateReady] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Capture install prompt
  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Listen for SW update events
  useEffect(() => {
    const onUpdate = () => setUpdateReady(true);
    window.addEventListener("redriver-sw-update", onUpdate);
    return () => window.removeEventListener("redriver-sw-update", onUpdate);
  }, []);

  // Online/offline tracking
  useEffect(() => {
    const onStatus = (e) => setOnline(e.detail?.online ?? navigator.onLine);
    window.addEventListener("redriver-online-status", onStatus);
    const onNative = () => setOnline(navigator.onLine);
    window.addEventListener("online", onNative);
    window.addEventListener("offline", onNative);
    return () => {
      window.removeEventListener("redriver-online-status", onStatus);
      window.removeEventListener("online", onNative);
      window.removeEventListener("offline", onNative);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleDismissInstall = () => {
    setInstallDismissed(true);
    localStorage.setItem("rr-pwa-install-dismissed", "1");
  };

  const handleApplyUpdate = () => {
    applyServiceWorkerUpdate();
    // Page will reload via controllerchange listener in registerSW.
  };

  return (
    <>
      {/* ── Offline banner ─────────────────────────────────────────────── */}
      {!online && (
        <div
          className="fixed top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{
            zIndex: 10000,
            background: "rgba(255, 77, 79, 0.95)",
            border: "1px solid #ff4d4f",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <WifiOff size={12} style={{ color: "#fff" }} />
          <span style={{ fontSize: 11, color: "#fff", fontWeight: 600 }}>
            Offline — showing cached data
          </span>
        </div>
      )}

      {/* ── Update available toast ─────────────────────────────────────── */}
      {updateReady && (
        <div
          className="fixed bottom-4 right-4 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            zIndex: 10000,
            background: "var(--bg-elevated)",
            border: "1px solid #FEDD00",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 24px rgba(254,221,0,0.15)",
            maxWidth: 340,
          }}
        >
          <RefreshCw size={16} style={{ color: "#FEDD00", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
              New version available
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Reload to get the latest update.
            </div>
          </div>
          <button
            onClick={handleApplyUpdate}
            className="px-2.5 py-1 rounded text-xs font-semibold shrink-0"
            style={{ background: "#FEDD00", color: "#043673" }}
          >
            Reload
          </button>
          <button
            onClick={() => setUpdateReady(false)}
            className="activity-icon shrink-0"
            style={{ width: 22, height: 22 }}
          >
            <X size={10} />
          </button>
        </div>
      )}

      {/* ── Install pill ───────────────────────────────────────────────── */}
      {installPrompt && !installDismissed && !updateReady && (
        <div
          className="fixed bottom-4 left-4 flex items-center gap-2 rounded-full pl-3 pr-1 py-1"
          style={{
            zIndex: 9999,
            background: "var(--bg-elevated)",
            border: "1px solid rgba(254,221,0,0.4)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(254,221,0,0.08)",
          }}
        >
          <Download size={12} style={{ color: "#FEDD00" }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>
            Install Red River OS
          </span>
          <button
            onClick={handleInstall}
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#FEDD00", color: "#043673", marginLeft: 4 }}
          >
            Install
          </button>
          <button
            onClick={handleDismissInstall}
            className="activity-icon"
            style={{ width: 20, height: 20 }}
            title="Dismiss"
          >
            <X size={9} />
          </button>
        </div>
      )}
    </>
  );
}