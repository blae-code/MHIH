/**
 * methodologies — per-tool methodology and data-handling disclosures for
 * the Analysis Workbench, so users know exactly which methods are applied
 * and where their data lives at every step.
 */

export const DATA_HANDLING_GLOBAL = [
  "Your uploaded file is held only in this browser session — it is never saved to the application database.",
  "CSV files are parsed entirely in your browser. Excel files are parsed by this app's secure backend and returned to your session; the file contents are not retained after parsing.",
  "Clicking “Clear” or leaving the page discards the dataset from memory.",
];

export const METHODOLOGIES = {
  table: {
    title: "Data Screening & Review",
    method: "Standard data-screening practice: verbatim inspection of records with type detection (numeric vs. categorical) before any analysis.",
    steps: [
      "Column types are inferred from cell contents (≥70% parseable numbers → numeric).",
      "No values are altered, cleaned, or imputed — the table shows your data exactly as uploaded.",
    ],
    dataHandling: ["All sorting and paging happens locally in your browser. No data leaves your session."],
  },
  stats: {
    title: "Descriptive Statistics & Correlation",
    method: "Descriptive statistics (mean, median, standard deviation, quartiles, missingness) and pairwise-complete Pearson product-moment correlation. Strength labels follow common conventions: |r| ≥ 0.7 strong, ≥ 0.4 moderate, otherwise weak.",
    steps: [
      "Non-numeric and missing values are excluded pairwise, not row-wise, so each correlation uses the maximum available data.",
      "Correlation measures linear association only — it does not establish causation.",
    ],
    dataHandling: ["All statistics are computed locally in your browser. No data leaves your session."],
  },
  charts: {
    title: "Exploratory Data Visualization",
    method: "Exploratory data analysis (EDA) in the tradition of Tukey (1977): visual inspection of distributions, trends, and relationships before formal modelling.",
    steps: [
      "Bar charts aggregate duplicate categories by mean; histograms use equal-width bins.",
      "Scatter plots cap at 2,000 points for rendering performance — a note if your data is larger.",
    ],
    dataHandling: ["All charts are rendered locally in your browser. No data leaves your session."],
  },
  themes: {
    title: "Thematic Analysis (Inductive Coding)",
    method: "Modelled on reflexive thematic analysis (Braun & Clarke, 2006): inductive, data-driven identification of themes with descriptions and verbatim representative quotes, followed by keyword-based quantification across the full dataset.",
    steps: [
      "The AI reads a sample of up to 200 responses (each truncated to 300 characters) and proposes 4–8 themes.",
      "Theme prevalence is then counted across ALL responses via keyword matching — an approximation, not human coding.",
      "AI-assisted coding should be reviewed by a researcher before use in publications or decisions.",
    ],
    dataHandling: [
      "Running the AI analysis sends the sampled response text to the platform's AI service for one-time processing; results are shown only in your session and are not stored.",
      "Keyword frequency counts are computed locally in your browser.",
    ],
  },
  excerpts: {
    title: "Verbatim Excerpt Review",
    method: "Data familiarization and verbatim excerpt retrieval — a foundational step in qualitative analysis ensuring interpretations stay grounded in participants' own words.",
    steps: [
      "Search is exact-phrase, case-insensitive; matches are highlighted in context.",
      "Records are shown unedited and in original order, identified by row number for citation.",
    ],
    dataHandling: ["Search and highlighting run entirely in your browser. No data leaves your session."],
  },
  sentiment: {
    title: "Sentiment & Emotional-Register Analysis",
    method: "AI-assisted interpretive analysis of emotional register: overall sentiment balance plus named emotional tones (e.g. nostalgia, pride, grief) with prevalence estimates and verbatim examples. Prevalence figures are model estimates, not counts.",
    steps: [
      "The AI reads a sample of up to 150 texts (each truncated to 400 characters).",
      "Interpretations of culturally significant material (e.g. oral histories) should be validated with community or subject-matter reviewers.",
    ],
    dataHandling: [
      "Running the analysis sends the sampled text to the platform's AI service for one-time processing; results are shown only in your session and are not stored.",
    ],
  },
  cooccurrence: {
    title: "Keyword Co-occurrence (Content Analysis)",
    method: "Quantitative content analysis: pairs of top keywords counted when they appear within the same response, surfacing linked concepts. Common stopwords are excluded; each keyword counts once per response.",
    steps: [
      "The top 30 keywords by response frequency form the candidate set; the strongest 15 pairs are shown.",
      "Co-occurrence indicates textual proximity, not semantic or causal relationship.",
    ],
    dataHandling: ["All co-occurrence counts are computed locally in your browser. No data leaves your session."],
  },
};