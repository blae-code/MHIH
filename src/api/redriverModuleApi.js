import { base44 } from "@/api/base44Client";

function unwrapResponse(res) {
  const payload = res?.data ?? res;
  if (payload?.error) {
    const error = /** @type {any} */ (new Error(payload.error.message || "Red River API request failed"));
    error.code = payload.error.code || "api_error";
    error.details = payload.error.details;
    throw error;
  }
  return payload;
}

async function invoke(functionName, payload = {}) {
  const res = await base44.functions.invoke(functionName, payload);
  return unwrapResponse(res);
}

export function listDatasets(payload = {}) {
  return invoke("api_listDatasets", payload);
}

export function listMetrics(payload = {}) {
  return invoke("api_listMetrics", payload);
}

export function queryMetricSeries(payload) {
  return invoke("api_queryMetricSeries", {
    projection_mode: "projected",
    ...payload,
  });
}

export function createEvidenceSnapshot(payload) {
  const query = payload?.query || {};
  return invoke("api_createEvidenceSnapshot", {
    projection_mode: "projected",
    ...payload,
    query: {
      projection_mode: "projected",
      ...query,
    },
  });
}

export function getEvidenceSnapshot(payload) {
  return invoke("api_getEvidenceSnapshot", {
    projection_mode: "projected",
    ...payload,
  });
}

export function exportEvidenceSnapshot(payload) {
  return invoke("api_exportEvidenceSnapshot", {
    projection_mode: "projected",
    ...payload,
  });
}

export function syncCatalog(payload = {}) {
  return invoke("syncCatalog", payload);
}
