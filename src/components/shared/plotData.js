/* ------------------------------------------------------------------ *
 * PLACEHOLDER GEOMETRY — not survey-accurate.
 *
 * Real plot boundaries come from Kaani's OpenCV pipeline, which traces the
 * approved DTCP layout sketch and georeferences it against the survey grid.
 * The coordinates below are MOCK: shaped like a genuine sub-division so the
 * *interaction pattern* is honest, but the numbers carry no precision. When the
 * pipeline lands, replace this module with its output — the shape of the data
 * (id, no, points, status, facts) is the contract the UI depends on.
 * ------------------------------------------------------------------ */

const VIEW_W = 960;
const VIEW_H = 600;

// Deterministic tiny jitter so boundaries read as *surveyed*, not CAD-perfect.
function jitter(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 6; // ±3px
}

function round(n) {
  return Math.round(n * 10) / 10;
}

function plotPoints(x, y, w, h, seed) {
  return [
    [x + jitter(seed + 1), y + jitter(seed + 2)],
    [x + w + jitter(seed + 3), y + jitter(seed + 4)],
    [x + w + jitter(seed + 5), y + h + jitter(seed + 6)],
    [x + jitter(seed + 7), y + h + jitter(seed + 8)],
  ].map(([px, py]) => [round(px), round(py)]);
}

function centroid(points) {
  const n = points.length;
  const sum = points.reduce((a, [px, py]) => [a[0] + px, a[1] + py], [0, 0]);
  return [round(sum[0] / n), round(sum[1] / n)];
}

// Per-plot facts. Kept plausible for Coimbatore, but they are example data.
// `conf` is the mock confidence the OpenCV trace would report for that boundary
// (0–1). The relator confirm/edit flow reads it; buyer views ignore it.
const FACTS = [
  { no: 1, area: 1620, dim: "30 × 54 ft", facing: "East", road: 30, survey: "114/2A", status: "verified", pps: 2450, conf: 0.97 },
  { no: 2, area: 1500, dim: "30 × 50 ft", facing: "East", road: 30, survey: "114/2A", status: "verified", pps: 2450, conf: 0.95 },
  { no: 3, area: 1500, dim: "30 × 50 ft", facing: "East", road: 30, survey: "114/2B", status: "pending", pps: 2400, conf: 0.71 },
  { no: 4, area: 1800, dim: "36 × 50 ft", facing: "East", road: 30, survey: "114/2B", status: "verified", pps: 2500, conf: 0.93 },
  { no: 5, area: 1500, dim: "30 × 50 ft", facing: "East", road: 30, survey: "114/3", status: "verified", pps: 2500, conf: 0.48 },
  { no: 6, area: 2040, dim: "34 × 60 ft", facing: "North", road: 30, survey: "114/3", status: "verified", pps: 2600, conf: 0.96 },
  { no: 7, area: 1620, dim: "30 × 54 ft", facing: "West", road: 24, survey: "115/1A", status: "verified", pps: 2300, conf: 0.68 },
  { no: 8, area: 1500, dim: "30 × 50 ft", facing: "West", road: 24, survey: "115/1A", status: "verified", pps: 2300, conf: 0.94 },
  { no: 9, area: 1847, dim: "33 × 56 ft", facing: "West", road: 24, survey: "115/1B", status: "verified", pps: 2350, conf: 0.98 },
  { no: 10, area: 1500, dim: "30 × 50 ft", facing: "West", road: 24, survey: "115/1B", status: "pending", pps: 2300, conf: 0.91 },
  { no: 11, area: 1500, dim: "30 × 50 ft", facing: "West", road: 24, survey: "115/2", status: "verified", pps: 2350, conf: 0.62 },
  { no: 12, area: 1920, dim: "32 × 60 ft", facing: "South", road: 24, survey: "115/2", status: "verified", pps: 2400, conf: 0.55 },
];

/* Confidence tiers. Only "high" is safe to auto-accept; "review" and "low" are
 * flagged and must be confirmed by the relator before a layout can publish. */
export function confidenceTier(conf) {
  if (conf >= 0.9) return "high";
  if (conf >= 0.6) return "review";
  return "low";
}

export function isFlagged(plot) {
  return confidenceTier(plot.confidence) !== "high";
}

// Two tiers of six plots on either side of a 24–30ft internal road.
const COLS = 6;
const MARGIN = 30;
const INSET = 5; // gap between plots reads as the boundary line
const colW = (VIEW_W - MARGIN * 2) / COLS;

const TOP = { y: 64, h: 200 };
const BOTTOM = { y: 336, h: 200 };

function buildTier(startNo, tier) {
  return Array.from({ length: COLS }, (_, i) => {
    const fact = FACTS[startNo - 1 + i];
    const x = MARGIN + i * colW + INSET;
    const w = colW - INSET * 2;
    const points = plotPoints(x, tier.y, w, tier.h, fact.no * 17 + 3);
    return {
      id: `p-${fact.no}`,
      no: fact.no,
      points,
      centroid: centroid(points),
      areaSqft: fact.area,
      dimensions: fact.dim,
      facing: fact.facing,
      roadFt: fact.road,
      survey: fact.survey,
      status: fact.status,
      pricePerSqft: fact.pps,
      guidePrice: `₹${((fact.area * fact.pps) / 100000).toFixed(1)} L`,
      confidence: fact.conf,
      tier: confidenceTier(fact.conf),
    };
  });
}

export const layout = {
  id: "kovai-gv-01",
  name: "Green Valley Nagar",
  place: "Thudiyalur, Coimbatore",
  dtcp: "DTCP/LP/0472/2019",
  approvedOn: "22 Aug 2019",
  scale: '1" = 20 ft',
  viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
  width: VIEW_W,
  height: VIEW_H,
  north: { x: 902, y: 78, r: 30 },
  road: { label: '24\'-0" ROAD', x: MARGIN, y: 276, w: VIEW_W - MARGIN * 2, h: 48 },
  osr: {
    // Open Space Reservation — required green in every DTCP layout; not sellable.
    label: "OSR · PARK",
    points: [
      [MARGIN, 548],
      [MARGIN + colW * 2.4, 550],
      [MARGIN + colW * 2.4, 582],
      [MARGIN, 580],
    ],
  },
  plots: [...buildTier(1, TOP), ...buildTier(7, BOTTOM)],
  featuredId: "p-9",
};

export function pointsToString(points) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

// A handful of layouts for the marketplace browse grid (Phase 3 reuses these).
export const layouts = [
  {
    id: "kovai-gv-01",
    name: "Green Valley Nagar",
    place: "Thudiyalur, Coimbatore",
    dtcp: "DTCP/LP/0472/2019",
    plotsTotal: 12,
    plotsVerified: 10,
    fromPricePerSqft: 2300,
    status: "verified",
  },
  {
    id: "kovai-sp-02",
    name: "Saravana Gardens",
    place: "Saravanampatti, Coimbatore",
    dtcp: "DTCP/LP/0611/2021",
    plotsTotal: 34,
    plotsVerified: 34,
    fromPricePerSqft: 3100,
    status: "verified",
  },
  {
    id: "kovai-kp-03",
    name: "Kovai Pudur Enclave",
    place: "Kovaipudur, Coimbatore",
    dtcp: "DTCP/LP/0288/2018",
    plotsTotal: 18,
    plotsVerified: 12,
    fromPricePerSqft: 1950,
    status: "partial",
  },
];
