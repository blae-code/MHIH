import { ApiError } from '../http/errorEnvelope.ts';
import { loadCatalog } from './loadCatalog.ts';

type UpsertOptions = {
  dry_run?: boolean;
};

async function assertEntityExists(base44: any, entityName: string) {
  try {
    await base44.asServiceRole.entities[entityName].list('-created_date', 1);
  } catch (error) {
    throw new ApiError(
      `Required Base44 entity "${entityName}" is unavailable. Configure schema before running syncCatalog.`,
      500,
      'missing_entity',
      { entity: entityName, cause: String((error as any)?.message || error) },
    );
  }
}

function isSameRecord(existing: any, incoming: any, keyField: string) {
  const sameVersion = Number(existing?.version || 0) === Number(incoming?.version || 0);
  const sameSchemaHash = existing?.schema_hash
    ? String(existing.schema_hash) === String(incoming.schema_hash || '')
    : true;
  const sameStatus = String(existing?.status || '') === String(incoming?.status || '');
  const sameName = String(existing?.name || '') === String(incoming?.name || '');
  const sameKey = String(existing?.[keyField] || '') === String(incoming?.[keyField] || '');
  return sameVersion && sameSchemaHash && sameStatus && sameName && sameKey;
}

async function upsertByKey(args: {
  base44: any;
  entityName: string;
  keyField: string;
  records: any[];
  dryRun: boolean;
}) {
  const stats = {
    total: args.records.length,
    created: 0,
    updated: 0,
    unchanged: 0,
  };

  for (const row of args.records) {
    const keyValue = row?.[args.keyField];
    if (!keyValue) continue;
    const existing = await args.base44.asServiceRole.entities[args.entityName]
      .filter({ [args.keyField]: keyValue }, '-updated_date', 1)
      .catch(() => []);
    const current = existing?.[0] || null;

    if (!current) {
      if (!args.dryRun) {
        await args.base44.asServiceRole.entities[args.entityName].create(row);
      }
      stats.created += 1;
      continue;
    }

    if (isSameRecord(current, row, args.keyField)) {
      stats.unchanged += 1;
      continue;
    }

    if (!args.dryRun) {
      await args.base44.asServiceRole.entities[args.entityName].update(current.id, row);
    }
    stats.updated += 1;
  }

  return stats;
}

export async function upsertCatalog(base44: any, options: UpsertOptions = {}) {
  const dryRun = options.dry_run === true;
  await assertEntityExists(base44, 'MetricDefinition');
  await assertEntityExists(base44, 'DatasetManifest');

  const catalog = await loadCatalog();
  const [metricStats, datasetStats] = await Promise.all([
    upsertByKey({
      base44,
      entityName: 'MetricDefinition',
      keyField: 'metric_id',
      records: catalog.metrics,
      dryRun,
    }),
    upsertByKey({
      base44,
      entityName: 'DatasetManifest',
      keyField: 'dataset_id',
      records: catalog.datasets,
      dryRun,
    }),
  ]);

  return {
    dry_run: dryRun,
    metrics: metricStats,
    datasets: datasetStats,
  };
}
