/* Pure geometry for the 3D view — no three.js import, so the 2D page and the
 * explorer shell can use it without pulling the WebGL chunk.
 *
 * Coordinate contract: plot points are SVG user units, x right / y DOWN, in the
 * layout's viewBox. The 3D scene is y-up with the ground on the XZ plane. We
 * map svg (x, y) → world (X, Z) = ((x − cx)·k, (y − cy)·k): svg "up the sheet"
 * becomes −Z, i.e. away from a camera parked on +Z — so north stays at the top
 * of the screen, exactly as in the 2D plan. */

export const SCENE_SIZE = 20; // longest side of the layout, in world units

function shoelace(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

function orient(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

// Proper crossing of segments ab and cd (touching endpoints don't count).
function crosses(a, b, c, d) {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

/* Returns { ok: true, points } with consecutive duplicates removed, or
 * { ok: false, reason } when the plot can't be extruded honestly. */
export function validatePolygon(raw) {
  if (!Array.isArray(raw)) return { ok: false, reason: "no point list" };
  const finite = raw.every(
    (p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  );
  if (!finite) return { ok: false, reason: "non-numeric coordinates" };

  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  const pts = [];
  for (const p of raw) if (!pts.length || !same(pts[pts.length - 1], p)) pts.push(p);
  if (pts.length > 1 && same(pts[0], pts[pts.length - 1])) pts.pop();
  if (pts.length < 3) return { ok: false, reason: "fewer than 3 distinct points" };
  if (Math.abs(shoelace(pts)) < 1) return { ok: false, reason: "zero area (degenerate)" };

  const n = pts.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // adjacent edges share a vertex — skip them
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (crosses(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) {
        return { ok: false, reason: "self-intersecting boundary" };
      }
    }
  }
  return { ok: true, points: pts };
}

export function makeProjector(layout) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const take = ([x, y]) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  layout.plots.forEach((p) => (p.points ?? []).forEach(take));
  if (layout.road) {
    take([layout.road.x, layout.road.y]);
    take([layout.road.x + layout.road.w, layout.road.y + layout.road.h]);
  }
  (layout.osr?.points ?? []).forEach(take);
  if (!Number.isFinite(minX)) {
    minX = 0;
    minY = 0;
    maxX = layout.width ?? 100;
    maxY = layout.height ?? 100;
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const k = SCENE_SIZE / Math.max(maxX - minX, maxY - minY, 1);
  return {
    k,
    halfW: ((maxX - minX) * k) / 2,
    halfD: ((maxY - minY) * k) / 2,
    toWorld: ([x, y]) => [(x - cx) * k, (y - cy) * k],
  };
}

/* Splits a layout into plots we can extrude and plots we must leave to 2D.
 * `shape` coordinates are world X and −Z: the shape is drawn in a y-up plane
 * that the scene rotates flat onto the ground. */
export function planPlots(layout, projector) {
  const items = [];
  const skipped = [];
  for (const plot of layout.plots) {
    const v = validatePolygon(plot.points);
    if (!v.ok) {
      skipped.push({ id: plot.id, no: plot.no, reason: v.reason });
      continue;
    }
    const world = v.points.map(projector.toWorld);
    const shape = world.map(([X, Z]) => [X, -Z]);
    const xs = world.map((p) => p[0]);
    const zs = world.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const center = [(minX + maxX) / 2, (minZ + maxZ) / 2];
    items.push({
      plot,
      shape,
      shapeCenter: [center[0], -center[1]],
      size: [maxX - minX, maxZ - minZ],
    });
  }
  return { items, skipped };
}

export function pointInPolygon([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Small deterministic RNG so the illustrative town is the same every visit.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
