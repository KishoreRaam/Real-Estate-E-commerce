import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, Line, OrbitControls } from "@react-three/drei";
import { Color, EdgesGeometry, TOUCH, Vector3 } from "three";
import { buildScene, PLOT_DEPTH, SCENE_SIZE } from "./plotGeometry";

/* ------------------------------------------------------------------ *
 * Plot3DView — a SECOND RENDERER over the same plot state as PlotOverlay.
 * It owns no selection, hover or filter state: everything comes in as
 * props from the page and every interaction goes out through the same
 * onSelect / onHover callbacks the 2D map uses. 2D is the source of truth;
 * this is an illustrative view of it.
 *
 * Render loop is on demand: nothing draws unless the camera moves or a prop
 * changes, so an idle 3D view costs nothing on a phone.
 * ------------------------------------------------------------------ */

const BASE_Z = 0.012; // plots sit just above the road plane
const ROAD_Z = 0.004;
const HOVER_LIFT = 0.08;
const DEFAULT_POLAR = Math.PI / 4; // ~45° tilt
const MIN_DISTANCE = 5;
const MAX_DISTANCE = 24;
const cameraAt = (d) => [0, d * Math.cos(DEFAULT_POLAR), d * Math.sin(DEFAULT_POLAR)];

/* Distance at which the whole sheet fits the canvas at the default tilt.
 * Depends on the canvas aspect, so a narrow phone box backs the camera off
 * instead of cropping the outer plots. */
function fitDistance(camera, scene) {
  const { halfW, halfD } = scene.transform;
  const vHalf = (camera.fov * Math.PI) / 360;
  const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
  const byWidth = halfW / Math.tan(hHalf);
  // at 45° the sheet's depth is foreshortened, but its near edge also comes
  // toward the camera — 0.9 of the half-depth is a good empirical fit
  const byDepth = (halfD * 0.9) / Math.tan(vHalf) + halfD * Math.sin(DEFAULT_POLAR);
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, Math.max(byWidth, byDepth) * 1.08));
}

/* Design tokens are CSS custom properties; WebGL can't read var(), so resolve
 * them once from :root. Fallbacks are the same hexes as index.css. */
function readTokens() {
  const css = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const t = (name, fallback) => css?.getPropertyValue(name).trim() || fallback;
  const graphite = new Color(t("--color-graphite", "#464646"));
  const paper2 = new Color(t("--color-paper-2", "#f4ecdd"));
  const brick = new Color(t("--color-brick", "#a35e47"));
  const concrete = new Color(t("--color-concrete", "#9c9a9a"));
  return {
    ground: new Color(t("--color-paper", "#fbf5ea")).lerp(new Color(t("--color-concrete-lt", "#c3c0bb")), 0.35),
    plot: paper2,
    // 2D hover fill is graphite at 8% over the plot
    plotHover: paper2.clone().lerp(graphite, 0.08),
    // selected + verified: brick, softened toward the plot body like the
    // 2D 20% brick fill. The ONLY brick in the scene, as in 2D.
    selectedVerified: paper2.clone().lerp(brick, 0.55),
    // selected + pending: concrete, as in 2D
    selectedPending: paper2.clone().lerp(concrete, 0.45),
    edge: graphite,
    outlineVerified: t("--color-brick-lit", "#8f4e39"),
    outlinePending: t("--color-graphite", "#464646"),
    road: new Color(t("--color-concrete-lt", "#c3c0bb")),
    osr: new Color(t("--terrain-grass", "#9aa383")),
    gridCell: t("--color-concrete-lt", "#c3c0bb"),
    gridSection: t("--color-concrete", "#9c9a9a"),
  };
}

function PlotMesh({ item, edges, palette, selected, hovered, dimmed, onSelect, onHover, shadows }) {
  const { plot } = item;
  const lift = hovered ? HOVER_LIFT : 0;
  const color = selected
    ? plot.status === "verified"
      ? palette.selectedVerified
      : palette.selectedPending
    : hovered
      ? palette.plotHover
      : palette.plot;

  return (
    <group position={[0, 0, BASE_Z + lift]}>
      <mesh
        geometry={item.geometry}
        castShadow={shadows}
        receiveShadow={shadows}
        onClick={(e) => {
          e.stopPropagation();
          // an orbit drag that happens to end on a plot isn't a click
          if (e.delta > 6) return;
          onSelect?.(plot);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover?.(plot.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover?.(null);
        }}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.92}
          metalness={0}
          transparent={dimmed}
          opacity={dimmed ? 0.28 : 1}
          depthWrite={!dimmed}
        />
      </mesh>
      <lineSegments geometry={edges} raycast={() => null}>
        <lineBasicMaterial color={palette.edge} transparent opacity={dimmed ? 0.18 : 0.55} />
      </lineSegments>
    </group>
  );
}

/* Fat outline around the selected plot's top face — WebGL lines are 1px, so
 * the "distinct outline" needs drei's screen-space Line. */
function SelectedOutline({ item, palette, hovered }) {
  const z = BASE_Z + PLOT_DEPTH + (hovered ? HOVER_LIFT : 0) + 0.003;
  const points = useMemo(() => [...item.outline, item.outline[0]].map(([x, y]) => [x, y, z]), [item, z]);
  return (
    <Line
      points={points}
      lineWidth={3}
      color={item.plot.status === "verified" ? palette.outlineVerified : palette.outlinePending}
      raycast={() => null}
    />
  );
}

function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/* Camera rig: limits, pan clamp, label budget and the imperative reset.
 * Everything here reacts to OrbitControls events — nothing runs per frame. */
const CameraRig = forwardRef(function CameraRig({ scene, onLabelSet }, ref) {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls);
  const invalidate = useThree((s) => s.invalidate);

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (!controls) return;
        // instant, never animated: reduced motion is respected by construction
        camera.position.set(...cameraAt(fitDistance(camera, scene)));
        controls.target.set(0, 0, 0);
        controls.update();
        invalidate();
      },
    }),
    [camera, controls, invalidate, scene],
  );

  // frame the sheet once the controls exist (and when the layout changes)
  useEffect(() => {
    if (!controls) return;
    camera.position.set(...cameraAt(fitDistance(camera, scene)));
    controls.target.set(0, 0, 0);
    controls.update();
    invalidate();
  }, [camera, controls, invalidate, scene]);

  useEffect(() => {
    if (!controls) return undefined;
    const { halfW, halfD, sheetCentre } = scene.transform;
    // sheet bounds in world XZ (world z = -plane y)
    const minX = sheetCentre[0] - halfW;
    const maxX = sheetCentre[0] + halfW;
    const minZ = -sheetCentre[1] - halfD;
    const maxZ = -sheetCentre[1] + halfD;

    const clampPan = () => {
      const t = controls.target;
      const nx = Math.min(maxX, Math.max(minX, t.x));
      const nz = Math.min(maxZ, Math.max(minZ, t.z));
      const dx = nx - t.x;
      const dz = nz - t.z;
      if (dx !== 0 || dz !== 0) {
        t.x = nx;
        t.z = nz;
        camera.position.x += dx;
        camera.position.z += dz;
      }
    };

    // Label budget: the further out the camera, the fewer labels — nearest
    // to the orbit target win. Recomputed when a gesture ends, not per frame.
    const computeLabels = () => {
      const d = camera.position.distanceTo(controls.target);
      const cap = d < 9 ? 60 : d < 13 ? 32 : d < 18 ? 18 : 8;
      const tx = controls.target.x;
      const ty = -controls.target.z;
      const ranked = scene.plots
        .map((it) => [it.plot.id, (it.label[0] - tx) ** 2 + (it.label[1] - ty) ** 2])
        .sort((a, b) => a[1] - b[1])
        .slice(0, cap);
      onLabelSet(new Set(ranked.map((r) => r[0])));
    };

    controls.addEventListener("change", clampPan);
    controls.addEventListener("end", computeLabels);
    computeLabels();
    return () => {
      controls.removeEventListener("change", clampPan);
      controls.removeEventListener("end", computeLabels);
    };
  }, [camera, controls, scene, onLabelSet]);

  return null;
});

/* Labels are plain DOM in one layer OVER the canvas (outside the WebGL
 * tree), not drei <Html>: <Html> mounts a separate React root per label and
 * tears it down synchronously, which throws when the whole view unmounts.
 * The projector below lives inside the canvas and moves the label elements
 * on rendered frames only — no React render, and no allocation unless a
 * label actually moved on screen. */
function LabelProjector({ registry, hoveredRef }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  useFrame(() => {
    registry.forEach((entry) => {
      const { el, item, offsetY = 0 } = entry;
      if (!el) return;
      const lift = item.plot.id === hoveredRef.current ? HOVER_LIFT : 0;
      // plane (x, y, z) → world (x, z, -y): the plan group is rotated -90° on X
      v.set(item.label[0], BASE_Z + PLOT_DEPTH + lift + 0.01, -item.label[1]).project(camera);
      const hidden = v.z > 1;
      const x = Math.round(((v.x + 1) / 2) * size.width);
      const y = Math.round(((1 - v.y) / 2) * size.height) + offsetY;
      if (entry.x !== x || entry.y !== y || entry.hidden !== hidden) {
        entry.x = x;
        entry.y = y;
        entry.hidden = hidden;
        el.style.transform = `translate(${x}px, ${y}px)`;
        el.style.visibility = hidden ? "hidden" : "visible";
      }
    });
  });
  return null;
}

function LabelLayer({ items, registry, selectedId, hoveredId, palette, invalidateRef }) {
  // a changed label set needs one frame so the projector can place new nodes
  useEffect(() => {
    invalidateRef.current?.();
  });
  const hovered = items.find((it) => it.plot.id === hoveredId);
  const bind = (key, item, offsetY) => (el) => {
    if (el) registry.set(key, { el, item, offsetY });
    else registry.delete(key);
  };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((it) => {
        const { plot } = it;
        const selected = plot.id === selectedId;
        return (
          <div key={plot.id} ref={bind(plot.id, it, 0)} className="absolute left-0 top-0" style={{ visibility: "hidden" }}>
            <div
              className="-translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-center leading-tight"
              style={{ textShadow: "0 0 3px var(--color-paper), 0 0 3px var(--color-paper)" }}
            >
              <span
                className="u-fact text-[0.7rem]"
                style={{
                  color: selected && plot.status === "verified" ? palette.outlineVerified : "var(--color-graphite)",
                  fontWeight: selected ? 600 : 500,
                }}
              >
                {String(plot.no).padStart(2, "0")}
              </span>
              {/* names stay in their native script — rendered by the browser,
                  which is why labels are DOM overlays, not 3D text meshes */}
              {plot.nameTa && (
                <span lang="ta" className="block font-body text-[0.68rem] text-graphite/85">
                  {plot.nameTa}
                </span>
              )}
            </div>
          </div>
        );
      })}
      {hovered && (
        <div key={`tip-${hovered.plot.id}`} ref={bind("__tip", hovered, -26)} className="absolute left-0 top-0" style={{ visibility: "hidden" }}>
          <div
            className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap border border-graphite/20 bg-paper px-2 py-1 u-fact text-[0.66rem] text-graphite shadow-sm"
            style={{ borderRadius: "2px" }}
          >
            Plot {String(hovered.plot.no).padStart(2, "0")} · {hovered.plot.areaSqft?.toLocaleString("en-IN")} sq ft ·{" "}
            {hovered.plot.status === "verified" ? "Verified" : "Pending"}
          </div>
        </div>
      )}
    </div>
  );
}

function SceneContents({
  scene,
  palette,
  selectedId,
  hoveredId,
  matchIds,
  onSelect,
  onHover,
  shadows,
  rigRef,
  reduce,
  onLabelSet,
  registry,
  hoveredRef,
}) {
  // edges are derived per scene and disposed with it
  const edges = useMemo(() => scene.plots.map((it) => new EdgesGeometry(it.geometry)), [scene]);
  useEffect(() => () => edges.forEach((g) => g.dispose()), [edges]);

  const selectedItem = scene.plots.find((it) => it.plot.id === selectedId);
  const hoveredItem = scene.plots.find((it) => it.plot.id === hoveredId);
  const extent = SCENE_SIZE * 1.6;

  return (
    <>
      {/* Lambert diffuse divides by π, so (ambient + directional·cos) ≈ π puts
          top faces at exactly the token colour; sides fall off for depth */}
      <ambientLight intensity={0.55 * Math.PI} />
      <directionalLight
        position={[5, 10, 6]}
        intensity={0.56 * Math.PI}
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0005}
      />

      {/* ground + soft drafting grid */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.002, 0]} receiveShadow={shadows} raycast={() => null}>
        <planeGeometry args={[extent, extent]} />
        <meshStandardMaterial color={palette.ground} roughness={1} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[extent, extent]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor={palette.gridCell}
        sectionSize={1.25}
        sectionThickness={0.9}
        sectionColor={palette.gridSection}
        fadeDistance={34}
        fadeStrength={1.5}
        raycast={() => null}
      />

      {/* the plan: shape plane → XZ, north = -Z (see plotGeometry.js) */}
      <group rotation-x={-Math.PI / 2}>
        {scene.road && (
          <mesh geometry={scene.road} position={[0, 0, ROAD_Z]} receiveShadow={shadows} raycast={() => null}>
            <meshStandardMaterial color={palette.road} roughness={1} />
          </mesh>
        )}
        {scene.osr && (
          <mesh geometry={scene.osr} position={[0, 0, ROAD_Z]} raycast={() => null}>
            <meshStandardMaterial color={palette.osr} roughness={1} transparent opacity={0.75} />
          </mesh>
        )}

        {scene.plots.map((it, i) => (
          <PlotMesh
            key={it.plot.id}
            item={it}
            edges={edges[i]}
            palette={palette}
            selected={it.plot.id === selectedId}
            hovered={it.plot.id === hoveredId}
            dimmed={matchIds ? !matchIds.has(it.plot.id) : false}
            onSelect={onSelect}
            onHover={onHover}
            shadows={shadows}
          />
        ))}

        {selectedItem && <SelectedOutline item={selectedItem} palette={palette} hovered={selectedItem === hoveredItem} />}

      </group>

      <OrbitControls
        makeDefault
        enableDamping={!reduce}
        dampingFactor={0.12}
        autoRotate={false}
        screenSpacePanning={false}
        minDistance={MIN_DISTANCE}
        maxDistance={MAX_DISTANCE}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.15} // never at or below the ground
        touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
      />
      <CameraRig ref={rigRef} scene={scene} onLabelSet={onLabelSet} />
      <LabelProjector registry={registry} hoveredRef={hoveredRef} />
    </>
  );
}

/* Gesture gate. A canvas that always captures touch would trap the page
 * scroll on phones, and one that always captures the wheel traps it on
 * desktop. So:
 *   mouse  — orbit/pan while hovering; wheel-zoom only after a click inside
 *   touch  — inert (page scrolls through it, taps still select plots) until
 *            tapped; then one-finger orbit, two-finger pan/zoom, and a Done
 *            button (or a tap outside) hands scrolling back to the page. */
function useGestureGate(wrapperRef) {
  const [engaged, setEngaged] = useState(false);
  const [mouseInside, setMouseInside] = useState(false);

  useEffect(() => {
    if (!engaged) return undefined;
    const onDown = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setEngaged(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [engaged, wrapperRef]);

  const handlers = {
    // mouse engages on press; touch only on a TAP (click), because pointerdown
    // also fires at the start of a page-scroll swipe that began on the canvas
    onPointerDown: (e) => e.pointerType === "mouse" && setEngaged(true),
    onClick: () => setEngaged(true),
    onPointerEnter: (e) => e.pointerType === "mouse" && setMouseInside(true),
    onPointerLeave: (e) => {
      if (e.pointerType === "mouse") {
        setMouseInside(false);
        setEngaged(false);
      }
    },
  };
  return { engaged, setEngaged, controlsEnabled: engaged || mouseInside, zoomEnabled: engaged, handlers };
}

function isCoarsePointer() {
  return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function Plot3DView({
  layout,
  selectedId,
  hoveredId,
  matchIds = null,
  onSelect,
  onHover,
  onContextLost,
}) {
  const wrapperRef = useRef(null);
  const rigRef = useRef(null);
  const [scene, setScene] = useState(null);
  const palette = useMemo(readTokens, []);
  const coarse = useMemo(isCoarsePointer, []);
  const reduce = useMemo(prefersReducedMotion, []);
  // Soft shadows are on for fine pointers only. In on-demand mode a phone
  // can't sustain a shadow pass while orbiting without dropping frames, and
  // the plan reads fine without them.
  const shadows = !coarse;
  const gate = useGestureGate(wrapperRef);

  const [labelIds, setLabelIds] = useState(() => new Set());
  const onLabelSet = useCallback((next) => setLabelIds((prev) => (sameSet(prev, next) ? prev : next)), []);
  const registry = useMemo(() => new Map(), []);
  const hoveredRef = useRef(hoveredId);
  hoveredRef.current = hoveredId;
  const invalidateRef = useRef(null);

  /* Build geometry in an effect, not useMemo: StrictMode mounts, disposes
   * and remounts — an effect pairs every build with its own dispose, so the
   * double-mount neither leaks nor reuses freed buffers. */
  useEffect(() => {
    const s = buildScene(layout);
    setScene(s);
    return () => s.dispose();
  }, [layout]);

  const contextCleanup = useRef(null);
  useEffect(() => () => contextCleanup.current?.(), []);

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden bg-paper"
      style={{ touchAction: gate.engaged ? "none" : "pan-y", cursor: hoveredId ? "pointer" : "grab" }}
      {...gate.handlers}
    >
      {scene && (
        <Canvas
          role="img"
          aria-label={`Illustrative 3D view of ${layout.name}, ${scene.plots.length} plots. Use the plot list or the 2D plan to select plots with a keyboard.`}
          frameloop="demand"
          dpr={coarse ? [1, 1.5] : [1, 2]}
          shadows={shadows ? "percentage" : false}
          camera={{ fov: 38, near: 0.1, far: 200, position: cameraAt(14) }}
          // no tone mapping: plot colours must read as the design tokens,
          // not as a filmic grade of them
          flat
          gl={{ antialias: true, powerPreference: "default" }}
          onCreated={({ gl, invalidate }) => {
            invalidateRef.current = invalidate;
            const el = gl.domElement;
            const lost = (e) => {
              e.preventDefault();
              onContextLost?.();
            };
            el.addEventListener("webglcontextlost", lost);
            contextCleanup.current = () => el.removeEventListener("webglcontextlost", lost);
          }}
          onPointerMissed={() => onHover?.(null)}
        >
          <SceneContents
            scene={scene}
            palette={palette}
            selectedId={selectedId}
            hoveredId={hoveredId}
            matchIds={matchIds}
            onSelect={onSelect}
            onHover={onHover}
            shadows={shadows}
            rigRef={rigRef}
            reduce={reduce}
            onLabelSet={onLabelSet}
            registry={registry}
            hoveredRef={hoveredRef}
          />
          <ControlsGate enabled={gate.controlsEnabled} zoom={gate.zoomEnabled} />
        </Canvas>
      )}

      {scene && (
        <LabelLayer
          items={scene.plots.filter((it) => labelIds.has(it.plot.id) || it.plot.id === selectedId || it.plot.id === hoveredId)}
          registry={registry}
          selectedId={selectedId}
          hoveredId={hoveredId}
          palette={palette}
          invalidateRef={invalidateRef}
        />
      )}

      {/* overlays — always DOM, never inside the WebGL scene */}
      <p className="pointer-events-none absolute left-2 top-2 bg-paper/85 px-1.5 py-0.5 u-fact text-[0.62rem] text-graphite/90" style={{ borderRadius: "2px" }}>
        Illustrative 3D view — not to scale
      </p>

      <div className="absolute right-2 top-2 flex gap-1.5">
        {coarse && gate.engaged && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // else the wrapper's tap handler re-engages
              gate.setEngaged(false);
            }}
            className="border border-graphite/25 bg-paper/95 px-2 py-1 u-fact text-[0.66rem] text-graphite"
            style={{ borderRadius: "2px" }}
          >
            Done
          </button>
        )}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            rigRef.current?.reset();
          }}
          className="border border-graphite/25 bg-paper/95 px-2 py-1 u-fact text-[0.66rem] text-graphite transition-colors hover:border-graphite/50"
          style={{ borderRadius: "2px" }}
        >
          Reset view
        </button>
      </div>

      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap items-end justify-between gap-2">
        {scene?.skipped.length ? (
          <p
            className="bg-paper/90 px-1.5 py-0.5 u-fact text-[0.62rem] text-graphite/90"
            style={{ borderRadius: "2px" }}
            title={scene.skipped.map((s) => `Plot ${s.no}: ${s.reason}`).join("\n")}
          >
            {scene.skipped.length} plot{scene.skipped.length === 1 ? "" : "s"} shown in 2D only
          </p>
        ) : (
          <span />
        )}
        {!gate.engaged && (
          <p className="bg-paper/85 px-1.5 py-0.5 u-fact text-[0.6rem] text-graphite/80" style={{ borderRadius: "2px" }}>
            {coarse ? "Tap to rotate · pinch to zoom" : "Drag to orbit · click, then scroll to zoom"}
          </p>
        )}
      </div>
    </div>
  );
}

// Applies the gesture gate to the default controls without re-creating them.
function ControlsGate({ enabled, zoom }) {
  const controls = useThree((s) => s.controls);
  useEffect(() => {
    if (!controls) return;
    controls.enabled = enabled;
    controls.enableZoom = zoom;
  }, [controls, enabled, zoom]);
  return null;
}
