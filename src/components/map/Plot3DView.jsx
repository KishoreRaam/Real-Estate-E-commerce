import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, Html, Line, OrbitControls } from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { makeProjector, planPlots, pointInPolygon, rng, validatePolygon } from "./mapGeometry";
import { readTokens } from "./tokens";

/* ------------------------------------------------------------------ *
 * Plot3DView — an ILLUSTRATIVE second renderer over the same map state as
 * PlotOverlay. Lazy-loaded; three.js never ships until someone opens it.
 *
 * Honesty rules carried over from 2D:
 *   - plot geometry is the traced polygon, extruded a uniform sliver — the
 *     height means nothing, so it's the same for every plot
 *   - brick is the verified state and nothing else (roofs, cars, labels on
 *     unverified plots never use it)
 *   - the surrounding town and the "sample homes" are scenery, labelled as
 *     such on the canvas; they are not part of any listing
 *
 * Rendering is on demand: a frame is drawn only when something moves
 * (camera, hover lift, intro rise, ambient traffic), never on an idle loop.
 * ------------------------------------------------------------------ */

const PLOT_DEPTH = 0.14;
const PLOT_BASE = 0.03;
const HOME_DIST = 25;
const MIN_DIST = 7;
const MAX_DIST = 48;

const hex = (a, b, t) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------------------------- the town ----------------------------- */

/* Deterministic scenery around the site boundary: a ring road, two rows of
 * houses and low-rise blocks, and trees — plus trees inside the OSR. */
function planTown(layout, projector, seed) {
  const r = rng(seed);
  const { halfW, halfD } = projector;
  const houses = [];
  const trees = [];

  const band = (offset, depthRange, heightRange, density, pitched) => {
    const sides = [
      { axis: "x", fixed: -(halfD + offset), len: halfW + offset + 1 },
      { axis: "x", fixed: halfD + offset, len: halfW + offset + 1 },
      { axis: "z", fixed: -(halfW + offset), len: halfD + offset - 1 },
      { axis: "z", fixed: halfW + offset, len: halfD + offset - 1 },
    ];
    for (const s of sides) {
      let t = -s.len;
      while (t < s.len) {
        const w = 0.9 + r() * 0.8;
        const d = depthRange[0] + r() * (depthRange[1] - depthRange[0]);
        const along = t + w / 2;
        const outward = Math.sign(s.fixed) * (d / 2);
        const [x, z] = s.axis === "x" ? [along, s.fixed + outward] : [s.fixed + outward, along];
        if (r() < density) {
          const h = heightRange[0] + r() * (heightRange[1] - heightRange[0]);
          const isPitched = pitched && h < 1.3;
          houses.push(s.axis === "x" ? { x, z, w, d, h, pitched: isPitched, tone: r() } : { x, z, w: d, d: w, h, pitched: isPitched, tone: r() });
        } else {
          trees.push({ x, z, s: 0.28 + r() * 0.22, tone: r() });
        }
        t += w + 0.25 + r() * 0.35;
      }
    }
  };
  band(1.9, [0.9, 1.3], [0.55, 1.2], 0.78, true); // street-facing homes
  band(4.0, [1.2, 1.8], [1.0, 3.2], 0.55, false); // low-rise behind them

  // scattered tree belt further out
  const outer = Math.max(halfW, halfD) + 7;
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const rad = outer + r() * 9;
    trees.push({ x: Math.cos(a) * rad * (halfW / Math.max(halfW, halfD) + 0.35), z: Math.sin(a) * rad * 0.8, s: 0.3 + r() * 0.35, tone: r() });
  }

  // trees inside the OSR (open space) — the park the 2D plan only hatches
  const osr = layout.osr?.points;
  if (osr && validatePolygon(osr).ok) {
    const world = osr.map(projector.toWorld);
    const xs = world.map((p) => p[0]);
    const zs = world.map((p) => p[1]);
    const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
    const target = clamp(Math.round(((x1 - x0) * (z1 - z0)) / 1.2), 3, 40);
    for (let i = 0, tries = 0; i < target && tries < target * 12; tries++) {
      const p = [x0 + r() * (x1 - x0), z0 + r() * (z1 - z0)];
      if (!pointInPolygon(p, world)) continue;
      trees.push({ x: p[0], z: p[1], s: 0.18 + r() * 0.16, tone: r() });
      i++;
    }
  }
  return { houses, trees };
}

/* One instanced mesh, matrices written once (not per frame). */
function Instances({ geometry, material, items, castShadow = false, receiveShadow = false }) {
  const ref = useRef();
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(it.p[0], it.p[1], it.p[2]);
      o.scale.set(it.s[0], it.s[1], it.s[2]);
      o.rotation.set(0, it.ry ?? 0, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      if (it.c) mesh.setColorAt(i, c.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}

/* Rises out of the ground once, then never draws another frame. */
function Rise({ children, delay = 0, reduce }) {
  const ref = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const t = useRef(reduce ? 1 : 0);
  const wait = useRef(delay);
  useFrame((_, delta) => {
    if (!ref.current || t.current >= 1) return;
    const dt = Math.min(delta, 1 / 30);
    if (wait.current > 0) wait.current -= dt;
    else t.current = Math.min(1, t.current + dt / 0.9);
    ref.current.scale.y = Math.max(0.001, ease(t.current));
    invalidate();
  });
  return (
    <group ref={ref} scale={[1, reduce ? 1 : 0.001, 1]}>
      {children}
    </group>
  );
}

function Town({ plan, geo, mats, colors, reduce }) {
  const data = useMemo(() => {
    const walls = [];
    const roofs = [];
    const slabs = [];
    const trunks = [];
    const crowns = [];
    const wallTones = [colors.paper, colors.champagne, colors.paper2, hex(colors.concreteLt, colors.paper, 0.4)];
    const crownTones = [colors.tree, colors.treeDk, colors.scrub, colors.grass];
    for (const h of plan.houses) {
      walls.push({ p: [h.x, h.h / 2, h.z], s: [h.w, h.h, h.d], c: wallTones[Math.floor(h.tone * wallTones.length)] });
      if (h.pitched) {
        const rh = 0.32 + Math.min(h.w, h.d) * 0.2;
        roofs.push({ p: [h.x, h.h + rh / 2, h.z], s: [h.w * 0.78, rh, h.d * 0.78] });
      } else {
        slabs.push({ p: [h.x, h.h + 0.04, h.z], s: [h.w * 1.04, 0.08, h.d * 1.04] });
      }
    }
    for (const t of plan.trees) {
      const th = t.s * 0.9;
      trunks.push({ p: [t.x, th / 2, t.z], s: [1, th, 1] });
      crowns.push({ p: [t.x, th + t.s * 0.7, t.z], s: [t.s, t.s * 1.2, t.s], c: crownTones[Math.floor(t.tone * crownTones.length)] });
    }
    return { walls, roofs, slabs, trunks, crowns };
  }, [plan, colors]);

  return (
    <Rise delay={0.15} reduce={reduce}>
      <Instances geometry={geo.box} material={mats.wall} items={data.walls} castShadow receiveShadow />
      <Instances geometry={geo.roof} material={mats.roof} items={data.roofs} castShadow />
      <Instances geometry={geo.box} material={mats.slab} items={data.slabs} />
      <Instances geometry={geo.trunk} material={mats.trunk} items={data.trunks} />
      <Instances geometry={geo.crown} material={mats.crown} items={data.crowns} castShadow />
    </Rise>
  );
}

/* Roads: the layout's own internal road, plus an illustrative ring road. */
function Roads({ layout, projector, mats, colors }) {
  const { halfW, halfD } = projector;
  const ring = 0.95;
  const rw = 0.8;
  const road = useMemo(() => {
    const rd = layout.road;
    if (!rd || ![rd.x, rd.y, rd.w, rd.h].every(Number.isFinite)) return null;
    const [x0, z0] = projector.toWorld([rd.x, rd.y]);
    const [x1, z1] = projector.toWorld([rd.x + rd.w, rd.y + rd.h]);
    const horizontal = x1 - x0 >= z1 - z0;
    const cx = (x0 + x1) / 2;
    const cz = (z0 + z1) / 2;
    const line = horizontal
      ? [[x0 + 0.2, 0.026, cz], [x1 - 0.2, 0.026, cz]]
      : [[cx, 0.026, z0 + 0.2], [cx, 0.026, z1 - 0.2]];
    return { cx, cz, w: x1 - x0, d: z1 - z0, line };
  }, [layout, projector]);

  const ringBars = [
    { p: [0, -(halfD + ring)], s: [2 * (halfW + ring) + rw, rw] },
    { p: [0, halfD + ring], s: [2 * (halfW + ring) + rw, rw] },
    { p: [-(halfW + ring), 0], s: [rw, 2 * (halfD + ring) - rw] },
    { p: [halfW + ring, 0], s: [rw, 2 * (halfD + ring) - rw] },
  ];

  return (
    <group>
      {/* the site pad, so the layout reads as one parcel */}
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mats.pad}>
        <planeGeometry args={[2 * halfW + 0.7, 2 * halfD + 0.7]} />
      </mesh>
      {ringBars.map((b, i) => (
        <mesh key={i} position={[b.p[0], 0.008, b.p[1]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mats.ringRoad}>
          <planeGeometry args={b.s} />
        </mesh>
      ))}
      {road && (
        <>
          <mesh position={[road.cx, 0.018, road.cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mats.road}>
            <planeGeometry args={[road.w, road.d]} />
          </mesh>
          <Line points={road.line} color={colors.paper} lineWidth={1.4} dashed dashSize={0.35} gapSize={0.3} />
        </>
      )}
    </group>
  );
}

function OpenSpace({ layout, projector, mats }) {
  const geometry = useMemo(() => {
    const v = layout.osr?.points ? validatePolygon(layout.osr.points) : { ok: false };
    if (!v.ok) return null;
    try {
      const shape = new THREE.Shape(v.points.map(projector.toWorld).map(([X, Z]) => new THREE.Vector2(X, -Z)));
      return new THREE.ShapeGeometry(shape);
    } catch {
      return null;
    }
  }, [layout, projector]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} receiveShadow material={mats.osr} />
  );
}

/* Ambient traffic on the internal road. Only runs when motion is welcome. */
function Cars({ layout, projector, geo, colors, running }) {
  const refs = useRef([]);
  const t = useRef(0);
  const invalidate = useThree((s) => s.invalidate);
  const path = useMemo(() => {
    const rd = layout.road;
    if (!rd || ![rd.x, rd.y, rd.w, rd.h].every(Number.isFinite)) return null;
    const [x0, z0] = projector.toWorld([rd.x, rd.y]);
    const [x1, z1] = projector.toWorld([rd.x + rd.w, rd.y + rd.h]);
    const horizontal = x1 - x0 >= z1 - z0;
    return horizontal
      ? { horizontal, a0: x0 + 0.4, a1: x1 - 0.4, c: (z0 + z1) / 2, lane: Math.min(0.2, (z1 - z0) / 4) }
      : { horizontal, a0: z0 + 0.4, a1: z1 - 0.4, c: (x0 + x1) / 2, lane: Math.min(0.2, (x1 - x0) / 4) };
  }, [layout, projector]);
  const cars = useMemo(
    () => [
      { off: 0.05, speed: 0.045, dir: 1, color: colors.graphite },
      { off: 0.55, speed: 0.038, dir: 1, color: colors.paper },
      { off: 0.3, speed: 0.05, dir: -1, color: colors.concrete },
      { off: 0.8, speed: 0.042, dir: -1, color: colors.champagne },
    ],
    [colors],
  );

  const place = useCallback(
    (time) => {
      if (!path) return;
      cars.forEach((car, i) => {
        const g = refs.current[i];
        if (!g) return;
        const ph = (((car.off + time * car.speed) % 1) + 1) % 1;
        const along = car.dir > 0 ? path.a0 + (path.a1 - path.a0) * ph : path.a1 - (path.a1 - path.a0) * ph;
        const across = path.c + car.dir * path.lane;
        if (path.horizontal) g.position.set(along, 0.03, across);
        else g.position.set(across, 0.03, along);
      });
    },
    [path, cars],
  );

  useLayoutEffect(() => place(t.current), [place]);
  useFrame((_, delta) => {
    if (!running || !path) return;
    t.current += Math.min(delta, 1 / 30);
    place(t.current);
    invalidate();
  });
  useEffect(() => {
    if (running) invalidate();
  }, [running, invalidate]);

  if (!path) return null;
  return cars.map((car, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)} rotation={[0, path.horizontal ? 0 : Math.PI / 2, 0]}>
      <mesh geometry={geo.box} position={[0, 0.09, 0]} scale={[0.46, 0.12, 0.22]} castShadow>
        <meshStandardMaterial color={car.color} roughness={0.6} />
      </mesh>
      <mesh geometry={geo.box} position={[-0.03, 0.19, 0]} scale={[0.24, 0.09, 0.19]}>
        <meshStandardMaterial color={colors.graphite} roughness={0.4} />
      </mesh>
    </group>
  ));
}

/* ----------------------------- the plots ----------------------------- */

const PlotMesh = memo(function PlotMesh({
  entry,
  selected,
  hovered,
  compared,
  dimmed,
  showLabel,
  showHome,
  palette,
  homeGeo,
  homeMats,
  reduce,
  introDelay,
  bias,
  onSelect,
  onHover,
  onHoverEnd,
  setCursor,
}) {
  const { item, geometry, outline } = entry;
  const { plot } = item;
  const verified = plot.status === "verified";
  const ref = useRef();
  const invalidate = useThree((s) => s.invalidate);
  const anim = useRef({ lift: 0, grow: reduce ? 1 : 0, wait: introDelay });
  const target = hovered ? 0.24 : selected ? 0.1 : 0;

  useEffect(() => invalidate(), [target, dimmed, selected, invalidate]);

  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const a = anim.current;
    const dt = Math.min(delta, 1 / 30);
    let moving = false;
    if (a.grow < 1) {
      if (a.wait > 0) a.wait -= dt;
      else a.grow = Math.min(1, a.grow + dt / 0.55);
      moving = true;
    }
    if (reduce) a.lift = target;
    else {
      a.lift += (target - a.lift) * (1 - Math.exp(-dt * 14));
      if (Math.abs(target - a.lift) > 0.0005) moving = true;
      else a.lift = target;
    }
    g.position.z = a.lift + bias; // shape space: z is up
    g.scale.z = Math.max(0.001, ease(a.grow));
    if (moving) invalidate();
  });

  const top = verified
    ? selected
      ? palette.verifiedSel
      : palette.verified
    : selected
      ? palette.pendingSel
      : palette.pending;
  const side = verified ? palette.verifiedSide : palette.pendingSide;
  const label = String(plot.no).padStart(2, "0");

  return (
    <group ref={ref}>
      <mesh
        geometry={geometry}
        castShadow={!dimmed}
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(plot.id);
          setCursor("pointer");
        }}
        onPointerOut={() => {
          onHoverEnd(plot.id);
          setCursor("");
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 6) return; // that was an orbit drag, not a pick
          onSelect(plot);
        }}
      >
        {/* keyed so toggling transparency recompiles the material */}
        <meshStandardMaterial
          key={`t${dimmed}`}
          attach="material-0"
          color={top}
          roughness={0.85}
          transparent={dimmed}
          opacity={dimmed ? 0.22 : 1}
          depthWrite={!dimmed}
          emissive={hovered ? "#ffffff" : "#000000"}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
        <meshStandardMaterial
          key={`s${dimmed}`}
          attach="material-1"
          color={side}
          roughness={0.9}
          transparent={dimmed}
          opacity={dimmed ? 0.22 : 1}
          depthWrite={!dimmed}
        />
      </mesh>

      {selected && <Line points={outline} color={verified ? palette.brickLit : palette.ink} lineWidth={3} />}
      {!selected && compared && (
        <Line points={outline} color={palette.ink} lineWidth={2} dashed dashSize={0.22} gapSize={0.14} />
      )}

      {showHome && !dimmed && <SampleHome item={item} geo={homeGeo} mats={homeMats} />}

      {showLabel && (
        <Html
          position={[item.shapeCenter[0], item.shapeCenter[1], PLOT_DEPTH + (showHome && !dimmed ? 1.5 : 0.25)]}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: "none" }}
        >
          <span
            className="u-fact"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
              padding: "3px 5px",
              whiteSpace: "nowrap",
              borderRadius: 2,
              background: selected && verified ? palette.brick : "rgba(251,245,234,0.92)",
              color: selected && verified ? palette.paper : palette.graphite,
              border: `1px solid ${selected ? (verified ? palette.brickLit : palette.ink) : "rgba(70,70,70,0.25)"}`,
              opacity: dimmed ? 0.45 : 1,
            }}
          >
            {label}
          </span>
        </Html>
      )}
    </group>
  );
});

/* A neutral massing on the plot — what a home of plausible size would look
 * like there. Scenery: it carries no listing data and never uses brick. */
function SampleHome({ item, geo, mats }) {
  const [w, d] = item.size;
  const hw = w * 0.52;
  const hd = d * 0.4;
  const h = clamp(0.35 + Math.min(w, d) * 0.3, 0.45, 0.95);
  const rh = 0.25 + Math.min(hw, hd) * 0.35;
  return (
    <group position={[item.shapeCenter[0], item.shapeCenter[1], PLOT_DEPTH]}>
      <mesh geometry={geo.box} material={mats.wall} scale={[hw, hd, h]} position={[0, 0, h / 2]} castShadow receiveShadow />
      <mesh
        geometry={geo.roof}
        material={mats.roof}
        scale={[hw * 0.78, rh, hd * 0.78]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, h + rh / 2]}
        castShadow
      />
    </group>
  );
}

/* ----------------------------- camera ----------------------------- */

function CameraRig({ resetSignal, zoomSignal, reduce, halfW, halfD, onDistance }) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const anim = useRef(null);
  const v = useMemo(
    () => ({ from: new THREE.Vector3(), to: new THREE.Vector3(), tFrom: new THREE.Vector3(), tTo: new THREE.Vector3(), off: new THREE.Vector3() }),
    [],
  );

  // Default framing: ~45° tilt, from the south, pulled back on narrow screens
  // so the whole sheet fits.
  const home = useCallback(
    (out) => {
      const aspect = size.width / Math.max(1, size.height);
      const d = clamp(HOME_DIST * Math.max(1, 1.45 / aspect), MIN_DIST, MAX_DIST);
      return out.set(0, d * Math.SQRT1_2, d * Math.SQRT1_2);
    },
    [size],
  );

  const placed = useRef(false);
  useLayoutEffect(() => {
    if (!controls || placed.current || size.width === 0) return;
    placed.current = true;
    home(camera.position);
    controls.target.set(0, 0, 0);
    controls.update();
    invalidate();
  }, [controls, camera, home, size, invalidate]);

  useEffect(() => {
    if (!controls || !resetSignal) return;
    if (reduce) {
      home(camera.position);
      controls.target.set(0, 0, 0);
      controls.update();
      invalidate();
      return;
    }
    v.from.copy(camera.position);
    home(v.to);
    v.tFrom.copy(controls.target);
    v.tTo.set(0, 0, 0);
    anim.current = { t: 0 };
    invalidate();
  }, [resetSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!controls || !zoomSignal.n) return;
    v.off.subVectors(camera.position, controls.target);
    const len = clamp(v.off.length() * (zoomSignal.dir > 0 ? 0.8 : 1.25), MIN_DIST, MAX_DIST);
    camera.position.copy(controls.target).addScaledVector(v.off.normalize(), len);
    controls.update();
    invalidate();
  }, [zoomSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the pan target over the layout, report distance for label culling.
  useEffect(() => {
    if (!controls) return;
    const limX = halfW * 1.25;
    const limZ = halfD * 1.25;
    const onChange = () => {
      const t = controls.target;
      const nx = clamp(t.x, -limX, limX);
      const nz = clamp(t.z, -limZ, limZ);
      if (nx !== t.x || nz !== t.z || t.y !== 0) {
        camera.position.x += nx - t.x;
        camera.position.y -= t.y;
        camera.position.z += nz - t.z;
        t.set(nx, 0, nz);
      }
      onDistance(camera.position.distanceTo(t));
    };
    controls.addEventListener("change", onChange);
    onChange();
    return () => controls.removeEventListener("change", onChange);
  }, [controls, camera, halfW, halfD, onDistance]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + Math.min(delta, 1 / 30) / 0.7);
    const e = ease(a.t);
    camera.position.lerpVectors(v.from, v.to, e);
    controls.target.lerpVectors(v.tFrom, v.tTo, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
    invalidate();
  });

  return null;
}

/* OrbitControls forces `touch-action: none`, which would trap page scroll on
 * phones. Until the visitor unlocks the camera, vertical swipes scroll the
 * page and taps still pick plots. */
function TouchPolicy({ active }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const id = setTimeout(() => {
      gl.domElement.style.touchAction = active ? "none" : "pan-y";
    });
    return () => clearTimeout(id);
  }, [active, gl]);
  return null;
}

function Scene({
  layout,
  projector,
  built,
  colors,
  reduce,
  shadows,
  selectedId,
  hoveredId,
  compareSet,
  dimmedSet,
  showHomes,
  ambient,
  labelsAll,
  onSelect,
  onHover,
  onHoverEnd,
}) {
  const gl = useThree((s) => s.gl);
  const setCursor = useCallback((c) => (gl.domElement.style.cursor = c), [gl]);

  const palette = useMemo(
    () => ({
      verified: hex(colors.brick, colors.paper, 0.42),
      verifiedSel: colors.brick,
      verifiedSide: colors.brickLit,
      pending: colors.concreteLt,
      pendingSel: colors.concrete,
      pendingSide: hex(colors.concrete, colors.graphite, 0.35),
      brick: colors.brick,
      brickLit: colors.brickLit,
      ink: colors.ink,
      paper: colors.paper,
      graphite: colors.graphite,
    }),
    [colors],
  );

  // Shared geometry + materials — created once, disposed on unmount.
  const geo = useMemo(() => {
    const roof = new THREE.ConeGeometry(1, 1, 4);
    roof.rotateY(Math.PI / 4); // square base, sides axis-aligned
    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      roof,
      trunk: new THREE.CylinderGeometry(0.05, 0.07, 1, 6),
      crown: new THREE.IcosahedronGeometry(1, 0),
    };
  }, []);
  const mats = useMemo(
    () => ({
      wall: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }),
      roof: new THREE.MeshStandardMaterial({ color: hex(colors.graphite, colors.concrete, 0.35), roughness: 0.8 }),
      slab: new THREE.MeshStandardMaterial({ color: colors.concrete, roughness: 0.9 }),
      trunk: new THREE.MeshStandardMaterial({ color: hex(colors.soilDk, colors.graphite, 0.4), roughness: 1 }),
      crown: new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.95, flatShading: true }),
      pad: new THREE.MeshStandardMaterial({ color: hex(colors.soil, colors.paper, 0.35), roughness: 1 }),
      road: new THREE.MeshStandardMaterial({ color: colors.road, roughness: 1 }),
      ringRoad: new THREE.MeshStandardMaterial({ color: hex(colors.road, colors.paper, 0.25), roughness: 1 }),
      osr: new THREE.MeshStandardMaterial({ color: colors.grass, roughness: 1 }),
      homeWall: new THREE.MeshStandardMaterial({ color: colors.paper, roughness: 0.85 }),
      homeRoof: new THREE.MeshStandardMaterial({ color: hex(colors.graphite, colors.paper, 0.2), roughness: 0.8 }),
    }),
    [colors],
  );
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [geo, mats],
  );
  const homeMats = useMemo(() => ({ wall: mats.homeWall, roof: mats.homeRoof }), [mats]);
  const town = useMemo(() => planTown(layout, projector, 0x4b41), [layout, projector]);

  const { halfW, halfD } = projector;
  const shadowExtent = Math.max(halfW, halfD) + 8;

  return (
    <>
      <color attach="background" args={[colors.paper]} />
      <fog attach="fog" args={[colors.paper, 38, 90]} />
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[10, 18, 9]}
        intensity={1.7}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-camera-left={-shadowExtent}
        shadow-camera-right={shadowExtent}
        shadow-camera-top={shadowExtent}
        shadow-camera-bottom={-shadowExtent}
      />

      {/* ground + soft survey grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[220, 220]} />
        <meshStandardMaterial color={hex(colors.soil, colors.paper, 0.6)} roughness={1} />
      </mesh>
      <Grid
        args={[220, 220]}
        position={[0, -0.005, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={colors.concreteLt}
        sectionSize={5}
        sectionThickness={0.9}
        sectionColor={colors.concrete}
        fadeDistance={70}
        fadeStrength={1.6}
        infiniteGrid
      />

      <Roads layout={layout} projector={projector} mats={mats} colors={colors} />
      <OpenSpace layout={layout} projector={projector} mats={mats} />
      <Town plan={town} geo={geo} mats={mats} colors={colors} reduce={reduce} />
      <Cars layout={layout} projector={projector} geo={geo} colors={colors} running={ambient} />

      {/* plots: drawn as shapes in a y-up plane, laid flat onto the ground */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, PLOT_BASE, 0]}>
        {built.map((entry, i) => {
          const id = entry.item.plot.id;
          const selected = id === selectedId;
          const hovered = id === hoveredId;
          const compared = compareSet.has(id);
          return (
            <PlotMesh
              key={id}
              entry={entry}
              selected={selected}
              hovered={hovered}
              compared={compared}
              dimmed={dimmedSet.has(id)}
              showLabel={labelsAll || selected || hovered || compared}
              showHome={showHomes}
              palette={palette}
              homeGeo={geo}
              homeMats={homeMats}
              reduce={reduce}
              introDelay={0.35 + Math.min(i, 60) * 0.035}
              // traced polygons can overlap; a hair of height stops coplanar tops z-fighting
              bias={(i % 8) * 0.003}
              onSelect={onSelect}
              onHover={onHover}
              onHoverEnd={onHoverEnd}
              setCursor={setCursor}
            />
          );
        })}
      </group>
    </>
  );
}

/* ------------------------------ shell ------------------------------ */

function CtrlButton({ children, onClick, label, pressed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className="u-fact flex h-9 min-w-9 items-center justify-center whitespace-nowrap border border-graphite/25 bg-paper/92 px-2.5 text-[0.72rem] text-graphite backdrop-blur-sm transition-colors hover:border-graphite/60 hover:bg-paper"
      style={{ borderRadius: 2 }}
    >
      {children}
    </button>
  );
}

export default function Plot3DView({
  layout,
  selectedId = null,
  hoveredId = null,
  compareIds = [],
  dimmedIds = [],
  onSelect,
  onHover,
  onHoverEnd,
  onContextLost,
  showHomes = true,
  ambient = true,
  autoRotate = false,
  className = "",
  style,
}) {
  const reduce = useReducedMotion();
  const coarse = useMemo(() => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches, []);
  // Shadows only where they're cheap: fine pointer and a few cores.
  const shadows = useMemo(
    () => !coarse && (typeof navigator === "undefined" || (navigator.hardwareConcurrency ?? 4) >= 4),
    [coarse],
  );
  const colors = useMemo(readTokens, []);

  const projector = useMemo(() => makeProjector(layout), [layout]);
  const { built, skipped } = useMemo(() => {
    const plan = planPlots(layout, projector);
    const out = [];
    const extra = [];
    for (const item of plan.items) {
      try {
        const shape = new THREE.Shape(item.shape.map(([x, y]) => new THREE.Vector2(x, y)));
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: PLOT_DEPTH, bevelEnabled: false });
        const pos = geometry.getAttribute("position");
        if (!pos || pos.count === 0 || Array.prototype.some.call(pos.array, (n) => !Number.isFinite(n))) {
          geometry.dispose();
          throw new Error("extrusion produced no usable vertices");
        }
        const z = PLOT_DEPTH + 0.012;
        const outline = [...item.shape, item.shape[0]].map(([x, y]) => [x, y, z]);
        out.push({ item, geometry, outline });
      } catch (err) {
        extra.push({ id: item.plot.id, no: item.plot.no, reason: err?.message ?? "extrusion failed" });
      }
    }
    return { built: out, skipped: [...plan.skipped, ...extra] };
  }, [layout, projector]);

  useEffect(() => () => built.forEach((b) => b.geometry.dispose()), [built]);
  useEffect(() => {
    if (skipped.length) console.warn(`[Plot3DView] ${layout.name}: plots shown in 2D only`, skipped);
  }, [skipped, layout.name]);

  const compareSet = useMemo(() => new Set(compareIds), [compareIds]);
  const dimmedSet = useMemo(() => new Set(dimmedIds), [dimmedIds]);

  // Camera unlocked = wheel / pinch / one-finger orbit. Locked keeps page
  // scroll intact; mouse drag still orbits because a drag never scrolls.
  const [active, setActive] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [zoomSignal, setZoomSignal] = useState({ n: 0, dir: 1 });
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => e.key === "Escape" && setActive(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // Label culling: past a distance only the plots you're working with keep tags.
  const [labelsAll, setLabelsAll] = useState(true);
  const threshold = built.length > 60 ? 15 : 36;
  const onDistance = useCallback((d) => setLabelsAll(d < threshold), [threshold]);

  const lostRef = useRef(onContextLost);
  lostRef.current = onContextLost;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div
        role="img"
        aria-label={`Illustrative 3D view of ${layout.name}, ${built.length} plots. Not to scale. Use the plot list or the plot record for an accessible view of each plot.`}
        className="absolute inset-0"
      >
        <Canvas
          frameloop="demand"
          dpr={coarse ? [1, 1.5] : [1, 2]}
          shadows={shadows}
          camera={{ fov: 40, near: 0.1, far: 300, position: [0, 18, 18] }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener("webglcontextlost", (e) => {
              e.preventDefault();
              lostRef.current?.();
            });
          }}
        >
          <Scene
            layout={layout}
            projector={projector}
            built={built}
            colors={colors}
            reduce={!!reduce}
            shadows={shadows}
            selectedId={selectedId}
            hoveredId={hoveredId}
            compareSet={compareSet}
            dimmedSet={dimmedSet}
            showHomes={showHomes}
            ambient={ambient && !reduce}
            labelsAll={labelsAll}
            onSelect={onSelect}
            onHover={onHover}
            onHoverEnd={onHoverEnd}
          />
          <OrbitControls
            makeDefault
            enabled={active || !coarse}
            enableZoom={active}
            enablePan
            screenSpacePanning={false}
            enableDamping
            dampingFactor={0.08}
            minDistance={MIN_DIST}
            maxDistance={MAX_DIST}
            minPolarAngle={0.18}
            maxPolarAngle={Math.PI / 2 - 0.12}
            autoRotate={autoRotate && !reduce && !active && !hoveredId}
            autoRotateSpeed={0.45}
          />
          <TouchPolicy active={active} />
          <CameraRig
            resetSignal={resetSignal}
            zoomSignal={zoomSignal}
            reduce={!!reduce}
            halfW={projector.halfW}
            halfD={projector.halfD}
            onDistance={onDistance}
          />
        </Canvas>
      </div>

      {/* honesty tag — always on the canvas */}
      <p
        className="pointer-events-none absolute right-3 top-3 z-30 border border-graphite/20 bg-paper/92 px-2.5 py-1 u-eyebrow text-graphite backdrop-blur-sm"
        style={{ fontSize: "0.54rem", borderRadius: 2 }}
      >
        Illustrative 3D view — not to scale
      </p>

      {skipped.length > 0 && (
        <p
          className="absolute bottom-3 left-3 z-30 max-w-[60%] border border-graphite/20 bg-paper/92 px-2.5 py-1.5 u-fact text-[0.68rem] text-graphite backdrop-blur-sm"
          style={{ borderRadius: 2 }}
          title={skipped.map((s) => `Plot ${s.no}: ${s.reason}`).join("\n")}
        >
          {skipped.length} plot{skipped.length === 1 ? "" : "s"} shown in 2D only (
          {skipped.map((s) => String(s.no).padStart(2, "0")).join(", ")})
        </p>
      )}

      {active && coarse && (
        <p
          className="pointer-events-none absolute left-1/2 top-12 z-30 -translate-x-1/2 border border-graphite/20 bg-paper/92 px-3 py-1.5 text-center u-fact text-[0.66rem] text-graphite"
          style={{ borderRadius: 2 }}
        >
          One finger orbits · two fingers pan &amp; zoom · tap Done to scroll again
        </p>
      )}

      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5">
        <CtrlButton label="Zoom in" onClick={() => setZoomSignal((z) => ({ n: z.n + 1, dir: 1 }))}>
          +
        </CtrlButton>
        <CtrlButton label="Zoom out" onClick={() => setZoomSignal((z) => ({ n: z.n + 1, dir: -1 }))}>
          −
        </CtrlButton>
        <CtrlButton label="Reset view" onClick={() => setResetSignal((n) => n + 1)}>
          Reset view
        </CtrlButton>
        <CtrlButton
          label={active ? "Done — lock camera" : "Unlock camera to zoom and orbit"}
          pressed={active}
          onClick={() => setActive((a) => !a)}
        >
          {active ? "Done" : coarse ? "Move camera" : "Unlock zoom"}
        </CtrlButton>
      </div>
    </div>
  );
}
