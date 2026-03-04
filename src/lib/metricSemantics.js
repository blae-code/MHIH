const LOWER_BETTER_HINTS = [
  "mortality",
  "death",
  "overdose",
  "hospitalization",
  "admission",
  "er visit",
  "emergency",
  "incidence",
  "prevalence",
  "disease burden",
  "wait time",
  "risk",
  "rate",
  "injury",
  "smoking",
  "obesity",
];

const HIGHER_BETTER_HINTS = [
  "life expectancy",
  "screening",
  "vaccination",
  "immunization",
  "coverage",
  "access",
  "attendance",
  "completion",
  "employment",
  "income",
  "service uptake",
  "primary care attachment",
];

const hasHint = (text, hints) => {
  const normalized = String(text || "").toLowerCase();
  return hints.some((hint) => normalized.includes(hint));
};

export function getMetricDirection(metric) {
  if (!metric) return "neutral";

  if (typeof metric.higher_is_better === "boolean") {
    return metric.higher_is_better ? "higher_is_better" : "lower_is_better";
  }
  if (typeof metric.lower_is_better === "boolean") {
    return metric.lower_is_better ? "lower_is_better" : "higher_is_better";
  }

  const explicit = String(metric.better_direction || metric.directionality || metric.interpretation || "")
    .trim()
    .toLowerCase();
  if (["higher_is_better", "increase_is_better", "up_is_better"].includes(explicit)) {
    return "higher_is_better";
  }
  if (["lower_is_better", "decrease_is_better", "down_is_better"].includes(explicit)) {
    return "lower_is_better";
  }
  if (["neutral", "contextual"].includes(explicit)) return "neutral";

  const name = metric.name || metric.metric_name || "";
  if (hasHint(name, LOWER_BETTER_HINTS)) return "lower_is_better";
  if (hasHint(name, HIGHER_BETTER_HINTS)) return "higher_is_better";
  return "neutral";
}

export function isImprovement(delta, direction) {
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) return false;
  if (direction === "higher_is_better") return delta > 0;
  if (direction === "lower_is_better") return delta < 0;
  return false;
}

export function isHarmfulGap(gap, direction) {
  if (!Number.isFinite(gap) || Math.abs(gap) < 1e-12) return false;
  if (direction === "higher_is_better") return gap < 0;
  if (direction === "lower_is_better") return gap > 0;
  return Math.abs(gap) > 0;
}

export function compareToBenchmark(value, benchmark, direction) {
  const delta = Number(value) - Number(benchmark);
  if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) {
    return { delta: 0, better: null };
  }
  if (direction === "higher_is_better") return { delta, better: delta > 0 };
  if (direction === "lower_is_better") return { delta, better: delta < 0 };
  return { delta, better: null };
}

export function directionLabel(direction) {
  if (direction === "higher_is_better") return "Higher is better";
  if (direction === "lower_is_better") return "Lower is better";
  return "Direction contextual";
}
