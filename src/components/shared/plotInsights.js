/* ------------------------------------------------------------------ *
 * Plot insights — the contract for what sketch extraction will report
 * about each plot, plus the pure helpers the UI uses to read it. This
 * file stays when real extraction lands; only src/mock/plotInsights.js
 * (the sample values) goes.
 *
 * Every field is optional. A plot with none of them renders exactly as
 * before: no chips, no flag, never matches an active filter.
 * ------------------------------------------------------------------ */

/**
 * @typedef {"N"|"NE"|"E"|"SE"|"S"|"SW"|"W"|"NW"} Facing
 *
 * @typedef {Object} PlotInsights
 * @property {Facing|null} [facing]          null = extraction ran but the sketch has no orientation for this plot
 * @property {boolean} [is_corner]
 * @property {number} [road_edge_count]      how many plot edges front a road
 * @property {"ok"|"mismatch"|"unreadable"} [dimension_check]
 *           printed dimensions vs the drawn shape — RELATOR VIEW ONLY
 * @property {number|null} [dimension_delta_pct]
 *
 * @typedef {Object} LayoutInsightsMeta
 * @property {"sample"|"extracted"} [insightsSource]  "sample" shows the "Sample insights" label
 */

export const FACINGS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const FACING_WORDS = {
  N: "North",
  NE: "North-east",
  E: "East",
  SE: "South-east",
  S: "South",
  SW: "South-west",
  W: "West",
  NW: "North-west",
};

/** "E" → "East"; anything else (null, undefined, junk) → null */
export function facingWord(code) {
  return FACING_WORDS[code] ?? null;
}

/** Facts-row value: the word, "Not on sketch" for an explicit null, "—" when unknown. */
export function facingFact(plot) {
  if (plot?.facing === null) return "Not on sketch";
  return facingWord(plot?.facing) ?? "—";
}

/* ---- buyer filters ------------------------------------------------- */

/** @typedef {{ facing: Facing[], corner: boolean }} PlotFilters */

export const EMPTY_FILTERS = Object.freeze({ facing: [], corner: false });

export function isFilterActive(f) {
  return f.facing.length > 0 || f.corner;
}

export function plotMatches(plot, f) {
  if (f.facing.length && !f.facing.includes(plot.facing)) return false;
  if (f.corner && plot.is_corner !== true) return false;
  return true;
}

/* URL shape: ?facing=E,NE&corner=1 — enum values only, nothing personal.
 * Unknown values from a hand-edited or stale link are dropped, not trusted. */
export function filtersFromParams(params) {
  const facing = (params.get("facing") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s, i, all) => FACINGS.includes(s) && all.indexOf(s) === i);
  facing.sort((a, b) => FACINGS.indexOf(a) - FACINGS.indexOf(b));
  return { facing, corner: params.get("corner") === "1" };
}

export function writeFiltersToParams(params, f) {
  const next = new URLSearchParams(params);
  if (f.facing.length) next.set("facing", f.facing.join(","));
  else next.delete("facing");
  if (f.corner) next.set("corner", "1");
  else next.delete("corner");
  return next;
}
