import { ExtrudeGeometry, Shape, ShapeGeometry } from "three";

/* ------------------------------------------------------------------ *
 * SVG plan → 3D scene geometry. Pure functions, no React, so validation
 * and the coordinate transform can be tested on their own.
 *
 * Coordinate contract (see plotData.js): SVG user units, origin top-left,
 * y pointing DOWN, north = up the sheet.
 *
 *   1. centre on the layout centroid (mean of plot centroids)
 *   2. scale so the layout's longer side spans SCENE_SIZE units
 *   3. flip y (SVG y-down → shape y-up), so north stays "up" in the shape
 *   4. the scene group is then rotated -90° about X, which maps shape
 *      (x, y, z) → world (x, z, -y): the plan lies on the XZ plane, north is
 *      world -Z, and extrusion depth becomes height (+Y).
 * ------------------------------------------------------------------ */

export const SCENE_SIZE = 10;
export const PLOT_DEPTH = 0.12;

export function makeTransform(layout) {
  const cs = layout.plots.map((p) => p.centroid ?? meanPoint(p.points ?? []));
  const valid = cs.filter((c) => c && Number.isFinite(c[0]) && Number.isFinite(c[1]));
  const [cx, cy] = valid.length ? meanPoint(valid) : [layout.width / 2, layout.height / 2];
  const s = SCENE_SIZE / Math.max(layout.width, layout.height);
  return {
    cx,
    cy,
    s,
    // SVG point → shape-plane point (y flipped)
    toPlane: ([x, y]) => [(x - cx) * s, -(y - cy) * s],
    // half-extent of the sheet in world units, for clamping pan
    halfW: (layout.width * s) / 2,
    halfD: (layout.height * s) / 2,
    // the sheet's own centre may not be the centroid; pan bounds use it
    sheetCentre: [(layout.width / 2 - cx) * s, -(layout.height / 2 - cy) * s],
  };
}

function meanPoint(pts) {
  const n = pts.length || 1;
  const sum = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function orient(a, b, c) {
  const v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  return Math.abs(v) < 1e-9 ? 0 : Math.sign(v);
}

function onSegment(a, b, p) {
  return (
    Math.min(a[0], b[0]) - 1e-9 <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) + 1e-9 &&
    Math.min(a[1], b[1]) - 1e-9 <= p[1] &&
    p[1] <= Math.max(a[1], b[1]) + 1e-9
  );
}

function segmentsIntersect(p1, p2, p3, p4) {
  const o1 = orient(p1, p2, p3);
  const o2 = orient(p1, p2, p4);
  const o3 = orient(p3, p4, p1);
  const o4 = orient(p3, p4, p2);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p2, p3)) return true;
  if (o2 === 0 && onSegment(p1, p2, p4)) return true;
  if (o3 === 0 && onSegment(p3, p4, p1)) return true;
  if (o4 === 0 && onSegment(p3, p4, p2)) return true;
  return false;
}

/* Returns { points } (cleaned, SVG units) or { reason } explaining why the
 * polygon can't be extruded. Cheap O(n²) — plot polygons have a handful of
 * vertices, and this runs once per layout, not per frame. */
export function validatePolygon(raw, minArea) {
  if (!Array.isArray(raw)) return { reason: "no polygon" };
  if (raw.some((p) => !Array.isArray(p) || !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) {
    return { reason: "non-numeric coordinate" };
  }
  // drop repeated consecutive vertices, including an explicit closing vertex
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const pts = [];
  for (const p of raw) if (!pts.length || !same(pts.at(-1), p)) pts.push(p);
  while (pts.length > 1 && same(pts[0], pts.at(-1))) pts.pop();
  if (pts.length < 3) return { reason: `only ${pts.length} distinct vertices` };
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // skip edges that share a vertex
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segmentsIntersect(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) {
        return { reason: "self-intersecting boundary" };
      }
    }
  }
  // after the crossing check, so a bowtie (whose halves cancel) reports as
  // self-intersecting rather than as zero area
  if (Math.abs(signedArea(pts)) <= minArea) return { reason: "zero area (collinear or collapsed)" };
  return { points: pts };
}

function shapeFrom(planePts) {
  const shape = new Shape();
  planePts.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  return shape;
}

function hasBadPositions(geo) {
  const arr = geo.getAttribute("position")?.array;
  if (!arr || arr.length === 0) return true;
  for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) return true;
  return false;
}

/* Builds one extruded geometry per valid plot. Each plot is isolated in its
 * own try/catch: one bad trace from the pipeline must cost that plot only,
 * never the whole 3D view. Caller owns disposal of every returned geometry. */
export function buildScene(layout) {
  const t = makeTransform(layout);
  const minArea = layout.width * layout.height * 1e-6;
  const plots = [];
  const skipped = [];

  for (const plot of layout.plots) {
    try {
      const v = validatePolygon(plot.points, minArea);
      if (v.reason) throw new Error(v.reason);
      const plane = v.points.map(t.toPlane);
      const geometry = new ExtrudeGeometry(shapeFrom(plane), { depth: PLOT_DEPTH, bevelEnabled: false });
      if (hasBadPositions(geometry)) {
        geometry.dispose();
        throw new Error("triangulation produced no faces");
      }
      const [lx, ly] = t.toPlane(plot.centroid ?? meanPoint(v.points));
      plots.push({
        plot,
        geometry,
        outline: plane, // shape-plane ring, used for the selected outline
        label: [lx, ly],
      });
    } catch (err) {
      skipped.push({ id: plot.id, no: plot.no, reason: err.message });
    }
  }

  if (skipped.length) {
    console.warn(
      `[Plot3DView] ${skipped.length} plot(s) not rendered in 3D (shown in 2D only):`,
      skipped.map((s) => `#${s.no} (${s.id}): ${s.reason}`).join("; "),
    );
  }

  // road + open space are flat, non-interactive ShapeGeometry
  let road = null;
  if (layout.road) {
    const { x, y, w, h } = layout.road;
    road = new ShapeGeometry(
      shapeFrom([
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ].map(t.toPlane)),
    );
  }
  let osr = null;
  const osrCheck = layout.osr ? validatePolygon(layout.osr.points, minArea) : null;
  if (osrCheck?.points) osr = new ShapeGeometry(shapeFrom(osrCheck.points.map(t.toPlane)));

  const dispose = () => {
    plots.forEach((p) => p.geometry.dispose());
    road?.dispose();
    osr?.dispose();
  };

  return { transform: t, plots, skipped, road, osr, dispose };
}
