/* ------------------------------------------------------------------ *
 * MOCK — sample plot insights, standing in for sketch-extraction output.
 *
 * Merged into layouts in exactly one place (shared/layoutLoader.js). When
 * real extraction lands: delete this file and the two marked lines in the
 * loader. Nothing else imports it.
 *
 * Values are hand-written to look like a real run — mostly clean, a
 * couple of corners, one plot with no orientation on the sketch, one
 * printed-vs-drawn mismatch, and one plot extraction never reached
 * (no entry at all), so the UI's "missing fields" path is exercised.
 * Shape: see shared/plotInsights.js.
 * ------------------------------------------------------------------ */

/** @type {Record<string, Record<string, import("../components/shared/plotInsights").PlotInsights>>} */
const SAMPLE = {
  // Green Valley Nagar — two tiers either side of one internal road, plus a
  // side lane on the east and west ends. Top tier fronts the road on its
  // south edge, bottom tier on its north edge.
  "kovai-gv-01": {
    "p-1": { facing: "S", is_corner: true, road_edge_count: 2, dimension_check: "ok", dimension_delta_pct: 0.6 },
    "p-2": { facing: "S", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 1.1 },
    "p-3": { facing: null, is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 0.9 },
    "p-4": { facing: "S", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 0.4 },
    "p-5": { facing: "S", is_corner: false, road_edge_count: 1, dimension_check: "mismatch", dimension_delta_pct: 6.4 },
    "p-6": { facing: "SE", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 1.7 },
    "p-7": { facing: "N", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 1.3 },
    "p-8": { facing: "N", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 0.2 },
    "p-9": { facing: "N", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 0.8 },
    // p-10: deliberately absent — extraction never reached this plot
    "p-11": { facing: "N", is_corner: false, road_edge_count: 1, dimension_check: "unreadable", dimension_delta_pct: null },
    "p-12": { facing: "NE", is_corner: true, road_edge_count: 2, dimension_check: "ok", dimension_delta_pct: 1.5 },
  },
  // Vadasithur Fields — irregular field plots off an access track.
  "kovai-vs-04": {
    "p-1": { facing: "E", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 1.9 },
    "p-2": { facing: "NE", is_corner: true, road_edge_count: 2, dimension_check: "ok", dimension_delta_pct: 0.7 },
    "p-3": { facing: "N", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 2.2 },
    "p-4": { facing: "W", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 1.2 },
    "p-5": { facing: "S", is_corner: false, road_edge_count: 1, dimension_check: "ok", dimension_delta_pct: 0.5 },
  },
};

/** Returns a new layout with sample insights merged onto its plots. */
export function applyMockInsights(layout) {
  const byPlot = SAMPLE[layout.id];
  if (!byPlot) return layout;
  return {
    ...layout,
    insightsSource: "sample",
    plots: layout.plots.map((p) => (byPlot[p.id] ? { ...p, ...byPlot[p.id] } : p)),
  };
}
