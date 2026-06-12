/**
 * useUrlFilters
 *
 * Two-way binding between a filter state object and the page's URL query
 * string. Lets pages have shareable, bookmarkable filter views without each
 * page reinventing the wheel.
 *
 * Usage:
 *   const [filters, setFilters] = useUrlFilters({
 *     search: "", region: "all", category: "all", confidence: "all",
 *   });
 *   setFilters({ ...filters, region: "Fraser" });   // URL updates
 *   useEffect(() => { ... }, [filters]);            // re-fetch / re-filter
 *
 * Notes:
 *   - Default values are NOT serialized into the URL (keeps URLs clean).
 *   - Reads happen once on mount + when the URL changes externally
 *     (e.g. via a cross-page link).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function parseQuery(search) {
  const out = {};
  const params = new URLSearchParams(search);
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function buildQuery(state, defaults) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(state)) {
    const def = defaults[k];
    if (v == null || v === "" || v === def) continue;
    if (Array.isArray(v)) {
      if (v.length === 0) continue;
      params.set(k, v.join(","));
    } else {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export default function useUrlFilters(defaults) {
  const location = useLocation();
  const navigate = useNavigate();

  // Hydrate initial state from URL on mount, falling back to defaults.
  const initial = useMemo(() => {
    const parsed = parseQuery(location.search);
    const merged = { ...defaults };
    for (const k of Object.keys(defaults)) {
      if (parsed[k] != null) {
        // Multi-select keys are arrays in defaults
        if (Array.isArray(defaults[k])) {
          merged[k] = parsed[k].split(",").filter(Boolean);
        } else {
          merged[k] = parsed[k];
        }
      }
    }
    return merged;
    // We intentionally don't depend on location.search here so external
    // updates flow through the syncFromUrl effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [filters, setFiltersState] = useState(initial);

  // External URL changes (e.g. cross-page links) → sync into local state.
  useEffect(() => {
    const parsed = parseQuery(location.search);
    const next = { ...defaults };
    for (const k of Object.keys(defaults)) {
      if (parsed[k] != null) {
        next[k] = Array.isArray(defaults[k])
          ? parsed[k].split(",").filter(Boolean)
          : parsed[k];
      }
    }
    // Avoid re-setting if shallow-equal to current
    const same = Object.keys(next).every((k) => {
      const a = next[k];
      const b = filters[k];
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
      }
      return a === b;
    });
    if (!same) setFiltersState(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const setFilters = useCallback(
    (updater) => {
      setFiltersState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const qs = buildQuery(next, defaults);
        // Replace history so back-button isn't spammed with filter tweaks
        navigate(`${location.pathname}${qs}`, { replace: true });
        return next;
      });
    },
    [defaults, location.pathname, navigate]
  );

  const clearFilters = useCallback(() => {
    setFilters(defaults);
  }, [defaults, setFilters]);

  return [filters, setFilters, clearFilters];
}