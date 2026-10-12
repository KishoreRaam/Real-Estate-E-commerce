import { useId } from "react";

/* Geometry, timing and copy for the Drone Survey section — shared by the
 * static stage (DroneSurveyStage.jsx) and the GSAP version (DroneSurvey.jsx). */

export const BEATS = [
  { title: "Capture", body: "Aerial imagery of a layout, shot in a single flight." },
  { title: "Stitch", body: "Frames merge into one continuous view of the site." },
  { title: "Trace", body: "Plot boundaries are extracted and numbered automatically." },
  {
    title: "Match",
    body: "Each plot is tied back to its sanctioned DTCP layout, so what you see is what was approved.",
  },
];

/* ---- stage geometry (SVG user units, viewBox 800 × 600) ---------------- */

export const VB_X = 0;
export const VB_Y = 60;
export const VB_W = 800;
export const VB_H = 500;
export const TILE = { x: 40, y: 95, w: 720, h: 410 };
export const STRIPS = [
  { y: 95, h: 137, offset: { x: -7, y: 4 } },
  { y: 232, h: 136, offset: { x: 6, y: -3 } },
  { y: 368, h: 137, offset: { x: -5, y: 3 } },
];

// Main road centreline, gently falling west → east; plots sit 22u off it.
export const roadY = (x) => 305 - ((x - 60) * 20) / 680;
const SETBACK = 22;

const TOP_ROAD_X = [92, 196, 298, 402, 506, 608, 708];
const TOP_BACK_X = [100, 206, 304, 414, 512, 620, 714];
const TOP_BACK_Y = [112, 118, 108, 115, 104, 110, 116];
const BOT_ROAD_X = [92, 200, 302, 404, 510, 612, 708];
const BOT_BACK_X = [86, 190, 296, 398, 498, 604, 712];
const BOT_BACK_Y = [490, 496, 486, 498, 490, 484, 494];

const MATCHED_PLOT = 9;

export const PLOTS = (() => {
  const plots = [];
  for (let i = 0; i < 6; i++) {
    plots.push([
      [TOP_BACK_X[i], TOP_BACK_Y[i]],
      [TOP_BACK_X[i + 1], TOP_BACK_Y[i + 1]],
      [TOP_ROAD_X[i + 1], roadY(TOP_ROAD_X[i + 1]) - SETBACK],
      [TOP_ROAD_X[i], roadY(TOP_ROAD_X[i]) - SETBACK],
    ]);
  }
  for (let i = 0; i < 6; i++) {
    plots.push([
      [BOT_ROAD_X[i], roadY(BOT_ROAD_X[i]) + SETBACK],
      [BOT_ROAD_X[i + 1], roadY(BOT_ROAD_X[i + 1]) + SETBACK],
      [BOT_BACK_X[i + 1], BOT_BACK_Y[i + 1]],
      [BOT_BACK_X[i], BOT_BACK_Y[i]],
    ]);
  }
  return plots.map((pts, i) => ({
    n: i + 1,
    d: `M${pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L")} Z`,
    cx: pts.reduce((s, p) => s + p[0], 0) / 4,
    cy: pts.reduce((s, p) => s + p[1], 0) / 4,
    bottom: Math.max(...pts.map((p) => p[1])),
  }));
})();
export const MATCHED = PLOTS[MATCHED_PLOT - 1];

/* Flight plan: a lawnmower survey, three passes joined by curved turns, then
 * an exit off the east edge. Segment lengths are measured off these exact
 * curves, so each strip's reveal can be placed at the moment the drone's
 * camera footprint (±75u wide) actually covers it. */
export const FLIGHT_D =
  "M-80 163 L690 163 C775 163 775 300 690 300 L110 300 C25 300 25 437 110 437 L690 437 C780 437 820 380 900 330";
export const LEN = {
  pass1: [0, 770],
  turn1: [770, 979.8],
  pass2: [979.8, 1559.8],
  turn2: [1559.8, 1769.6],
  pass3: [1769.6, 2349.6],
  total: 2590,
};
export const FOOT_HALF_W = 75;

/* Timeline is 4 units long, one per beat, with the flight spanning
 * 0.05 → 3.35 at constant speed, so a length along the path maps to a time. */
export const FLIGHT_START = 0.05;
export const FLIGHT_DUR = 3.3;
export const tAt = (len) => FLIGHT_START + (FLIGHT_DUR * len) / LEN.total;
// time at which the drone is at x during pass 3 (west → east from x=110)
export const tPass3X = (x) => tAt(LEN.pass3[0] + Math.min(580, Math.max(0, x - 110)));

export const SR_DESCRIPTION =
  "Illustration: a drone flies three passes over a land layout, the captured strips merge into one aerial view, twelve plot boundaries are traced and numbered, and plot 09 is highlighted as verified against the DTCP layout.";

// SVG ids must be unique and url()-safe; React's useId isn't (it has colons).
export function useStageId() {
  return `ds${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
