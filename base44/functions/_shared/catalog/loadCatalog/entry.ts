import { z } from 'npm:zod@3.24.2';

const metricDimensionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'date']),
  allowed_values: z.array(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const metricSpecSchema = z.object({
  metric_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().min(1),
  unit: z.string().optional().nullable(),
  value_type: z.enum(['number', 'rate', 'percent', 'index', 'string']),
  direction: z.enum(['higher_is_better', 'lower_is_better', 'neutral']),
  dimensions: z.array(metricDimensionSchema).default([]),
  default_filters: z.record(z.any()).default({}),
  suppression: z.record(z.any()).default({}),
  dataset_ids: z.array(z.string().min(1)).min(1),
  method_notes: z.string().optional().nullable(),
  owner: z.string().optional().nullable(),
  status: z.enum(['active', 'deprecated']).default('active'),
  version: z.number().int().min(1).default(1),
  sensitivity_tier: z.enum(['public', 'internal', 'restricted', 'sensitive']).optional(),
});

const datasetSpecSchema = z.object({
  dataset_id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  steward: z.string().optional().nullable(),
  license: z.string().optional().nullable(),
  refresh_interval_days: z.number().int().min(0),
  schema: z.record(z.any()),
  projection_policy_id: z.string().min(1),
  status: z.enum(['active', 'deprecated']).default('active'),
  version: z.number().int().min(1).default(1),
});

function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `"${k}":${stableStringify(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function readJsonFiles(url: URL) {
  const rows: Array<{ name: string; json: any }> = [];
  for await (const entry of Deno.readDir(url)) {
    if (!entry.isFile || !entry.name.endsWith('.json')) continue;
    const fileUrl = new URL(entry.name, url);
    const raw = await Deno.readTextFile(fileUrl);
    rows.push({ name: entry.name, json: JSON.parse(raw) });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

export async function loadMetricSpecs() {
  const metricsDir = new URL('../../../catalog/metrics/', import.meta.url);
  const rows = await readJsonFiles(metricsDir);
  const parsed = rows.map(({ name, json }) => {
    const result = metricSpecSchema.safeParse(json);
    if (!result.success) {
      throw new Error(`Invalid metric spec "${name}": ${result.error.message}`);
    }
    return result.data;
  });
  return parsed;
}

export async function loadDatasetManifests() {
  const datasetsDir = new URL('../../../catalog/datasets/', import.meta.url);
  const rows = await readJsonFiles(datasetsDir);
  const parsed = [];
  for (const { name, json } of rows) {
    const result = datasetSpecSchema.safeParse(json);
    if (!result.success) {
      throw new Error(`Invalid dataset manifest "${name}": ${result.error.message}`);
    }
    const schema_hash = await sha256Hex(stableStringify(result.data.schema));
    parsed.push({
      ...result.data,
      schema_hash,
    });
  }
  return parsed;
}

export async function loadCatalog() {
  const [metrics, datasets] = await Promise.all([
    loadMetricSpecs(),
    loadDatasetManifests(),
  ]);
  return { metrics, datasets };
}
