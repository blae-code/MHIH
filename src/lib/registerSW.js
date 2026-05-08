/**
 * Service Worker registration for Red River OS.
 *
 * - Registers /sw.js on app boot (production only by default).
 * - Detects when a new SW has installed and is waiting; emits a CustomEvent
 *   `redriver-sw-update` with `{ waiting }` so the UI can show an update toast.
 * - Detects offline/online status and emits `redriver-online-status`.
 */

let waitingWorker = null;

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  // Skip in dev — the SW intercepts Vite HMR otherwise.
  if (import.meta.env?.DEV) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // If a worker is already waiting, surface the update prompt.
      if (reg.waiting) {
        waitingWorker = reg.waiting;
        emitUpdateAvailable(reg.waiting);
      }

      // Listen for new updates.
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            waitingWorker = installing;
            emitUpdateAvailable(installing);
          }
        });
      });

      // Reload once the new SW takes control.
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (err) {
      // SW registration failed — app still works fine, just no offline support.
      console.warn("[SW] registration failed:", err?.message ?? err);
    }
  });

  // Online/offline broadcasts.
  const broadcast = () => {
    window.dispatchEvent(
      new CustomEvent("redriver-online-status", { detail: { online: navigator.onLine } })
    );
  };
  window.addEventListener("online", broadcast);
  window.addEventListener("offline", broadcast);
}

function emitUpdateAvailable(worker) {
  window.dispatchEvent(
    new CustomEvent("redriver-sw-update", { detail: { worker } })
  );
}

/** Tell the waiting SW to take control immediately. */
export function applyServiceWorkerUpdate() {
  if (waitingWorker) {
    waitingWorker.postMessage("SKIP_WAITING");
  }
}