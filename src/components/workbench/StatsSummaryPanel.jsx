/**
 * StatsSummaryPanel — visual statistics dashboard: dataset overview strip,
 * per-column stat cards (numeric with mini histograms + range bars,
 * categorical with distribution bars), and correlation analysis.
 */

import React, { useMemo, useState, useEffect } from "react";
import { Sigma, Type, GitCompare } from "lucide-react";
import { describeNumeric, describeCategorical, correlationMatrix } from "@/lib/quantStats";
import StatsOverviewStrip from "@/components/workbench/stats/StatsOverviewStrip";
import NumericStatCard from "@/components/workbench/stats/NumericStatCard";
import CategoricalStatCard from "@/components/workbench/stats/CategoricalStatCard";
import CorrelationSection from "@/components/workbench/stats/CorrelationSection";
import CorrelationVariablePicker from "@/components/workbench/stats/CorrelationVariablePicker";

function SectionHeader({ icon: IconComp, color, title, count }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-6 h-6 rounded-md flex items-center justify-center"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <IconComp size={12} style={{ color }} />
      </div>
      <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{title}</span>
      <span className="tag" style={{ fontSize: 9.5 }}>{count}</span>
    </div>
  );
}

export default function StatsSummaryPanel({ columns, rows, columnTypes }) {
  const numericCols = columnTypes.filter((c) => c.type === "numeric").map((c) => c.name);
  const catCols = columnTypes.filter((c) => c.type === "categorical").map((c) => c.name);

  const numericStats = useMemo(
    () => numericCols
      .map((c) => ({ name: c, values: rows.map((r) => r[c]), stats: describeNumeric(rows.map((r) => r[c])) }))
      .filter((s) => s.stats),
    [rows, numericCols] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const catStats = useMemo(
    () => catCols.map((c) => ({ name: c, stats: describeCategorical(rows.map((r) => r[c])) })),
    [rows, catCols] // eslint-disable-line react-hooks/exhaustive-deps
  );
  // Correlation variable selection — defaults to all numeric columns,
  // resets whenever a new dataset (different column set) is loaded.
  const [corrCols, setCorrCols] = useState(numericCols);
  useEffect(() => { setCorrCols(numericCols); }, [numericCols.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const corr = useMemo(
    () => (corrCols.length >= 2 ? correlationMatrix(rows, corrCols) : null),
    [rows, corrCols] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const completeness = useMemo(() => {
    const totalCells = rows.length * columns.length;
    if (!totalCells) return 100;
    let filled = 0;
    rows.forEach((r) => columns.forEach((c) => {
      const v = r[c];
      if (v !== null && v !== undefined && v !== "") filled++;
    }));
    return (filled / totalCells) * 100;
  }, [rows, columns]);

  if (numericStats.length === 0 && catStats.length === 0) {
    return <div className="text-xs" style={{ color: "var(--text-muted)" }}>No columns to analyze.</div>;
  }

  return (
    <div className="space-y-5">
      {/* Dataset overview */}
      <StatsOverviewStrip
        rows={rows.length}
        columns={columns.length}
        numericCount={numericCols.length}
        catCount={catCols.length}
        completeness={completeness}
      />

      {/* Numeric column widgets */}
      {numericStats.length > 0 && (
        <div>
          <SectionHeader icon={Sigma} color="#40c4ff" title="Numeric Distributions" count={`${numericStats.length} columns`} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {numericStats.map((s) => (
              <NumericStatCard key={s.name} name={s.name} stats={s.stats} values={s.values} />
            ))}
          </div>
        </div>
      )}

      {/* Categorical column widgets */}
      {catStats.length > 0 && (
        <div>
          <SectionHeader icon={Type} color="#FEDD00" title="Categorical Breakdown" count={`${catStats.length} columns`} />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {catStats.map((s) => (
              <CategoricalStatCard key={s.name} name={s.name} stats={s.stats} />
            ))}
          </div>
        </div>
      )}

      {/* Correlation analysis */}
      {numericCols.length >= 2 && (
        <div>
          <SectionHeader icon={GitCompare} color="#00e676" title="Correlation Analysis" count={`${corrCols.length} variables`} />
          <CorrelationVariablePicker allCols={numericCols} selected={corrCols} onChange={setCorrCols} />
          {corr ? (
            <CorrelationSection corr={corr} numericCols={corrCols} />
          ) : (
            <div className="text-xs px-3 py-4 rounded-lg text-center"
              style={{ background: "var(--bg-overlay)", border: "1px dashed var(--border-default)", color: "var(--text-muted)" }}>
              Select at least 2 variables above to compute the correlation matrix.
            </div>
          )}
        </div>
      )}
    </div>
  );
}