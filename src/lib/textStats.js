/**
 * textStats — client-side text analysis helpers for thematic analysis:
 * tokenization, stopword filtering, keyword frequencies, and text column stats.
 */

const STOPWORDS = new Set([
  "a","an","the","and","or","but","if","then","else","when","while","of","to","in","on","at","by",
  "for","with","about","against","between","into","through","during","before","after","above","below",
  "from","up","down","out","off","over","under","again","further","once","here","there","all","any",
  "both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so",
  "than","too","very","can","will","just","should","now","is","are","was","were","be","been","being",
  "have","has","had","having","do","does","did","doing","would","could","might","must","shall","may",
  "i","me","my","we","our","you","your","he","him","his","she","her","it","its","they","them","their",
  "what","which","who","whom","this","that","these","those","am","as","also","because","until","dont",
  "im","ive","id","youre","theyre","weve","isnt","arent","wasnt","werent","get","got","like","one",
]);

export function tokenize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^['-]+|['-]+$/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !/^\d+$/.test(w));
}

/** Top-N keyword frequencies across an array of text values. */
export function keywordFrequencies(values, topN = 20) {
  const counts = {};
  values.forEach((v) => {
    // Count each keyword once per response so long entries don't dominate
    new Set(tokenize(v)).forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({ word, count }));
}

/** Descriptive stats for a text column. */
export function textColumnStats(values) {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  const lengths = nonEmpty.map((v) => String(v).trim().length);
  const wordCounts = nonEmpty.map((v) => String(v).trim().split(/\s+/).length);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  return {
    responses: nonEmpty.length,
    missing: values.length - nonEmpty.length,
    unique: new Set(nonEmpty.map((v) => String(v).trim().toLowerCase())).size,
    avgWords: avg(wordCounts),
    avgChars: avg(lengths),
  };
}

/**
 * Top keyword pair co-occurrences: which of the top keywords appear together
 * in the same response. Returns [{a, b, count}] sorted by count.
 */
export function cooccurrencePairs(values, topN = 15) {
  const topWords = keywordFrequencies(values, 30).map((k) => k.word);
  const topSet = new Set(topWords);
  const pairCounts = {};
  values.forEach((v) => {
    const present = [...new Set(tokenize(v))].filter((w) => topSet.has(w)).sort();
    for (let i = 0; i < present.length; i++)
      for (let j = i + 1; j < present.length; j++) {
        const key = `${present[i]}||${present[j]}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
  });
  return Object.entries(pairCounts)
    .sort((x, y) => y[1] - x[1])
    .slice(0, topN)
    .map(([key, count]) => {
      const [a, b] = key.split("||");
      return { a, b, count };
    });
}

/** Count how many responses mention any of the given keywords (case-insensitive). */
export function countMentions(values, keywords) {
  const kws = (keywords || []).map((k) => String(k).toLowerCase()).filter(Boolean);
  if (!kws.length) return 0;
  let n = 0;
  values.forEach((v) => {
    const t = String(v ?? "").toLowerCase();
    if (kws.some((k) => t.includes(k))) n++;
  });
  return n;
}