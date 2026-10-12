import { Component, lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PlotOverlay from "../shared/PlotOverlay";
import PlotCompare from "./PlotCompare";
import { MAX_COMPARE } from "./usePlotMapState";
import { webglAvailable } from "./webgl";

// three.js + drei live only in this chunk; nothing loads until 3D is opened.
const Plot3DView = lazy(() => import("./Plot3DView"));

/* If the 3D chunk fails to load or the scene throws, drop back to the plan. */
class ThreeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    console.error("[PlotMapExplorer] 3D view failed", err);
    this.props.onFail?.();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Fact({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.5rem" }}>
        {label}
      </span>
      <span className="u-fact text-[0.78rem] text-graphite">{value}</span>
    </div>
  );
}

/* What a plot is, at a glance — shown while hovering in either view. */
export function PlotHoverCard({ plot, compared }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {plot && (
        <motion.div
          key={plot.id}
          initial={reduce ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -4 }}
          transition={{ duration: 0.16 }}
          className="pointer-events-none absolute left-3 top-3 z-30 w-[min(15.5rem,calc(100%-1.5rem))] border border-graphite/20 bg-champagne/95 backdrop-blur-sm"
          style={{ borderRadius: 3 }}
          aria-hidden="true"
        >
          <div className="flex items-center justify-between gap-3 border-b border-graphite/12 px-3.5 py-2">
            <span className="font-display text-xl font-extrabold leading-none text-graphite">
              Plot {String(plot.no).padStart(2, "0")}
            </span>
            <span
              className={
                "u-eyebrow " + (plot.status === "verified" ? "text-brick-lit" : "text-graphite/84")
              }
              style={{ fontSize: "0.52rem" }}
            >
              {plot.status === "verified" ? "◈ Verified" : "Pending"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-3.5 py-2.5">
            <Fact label="Area" value={`${plot.areaSqft.toLocaleString("en-IN")} sq ft`} />
            <Fact label="Dimensions" value={plot.dimensions} />
            <Fact label="Facing" value={plot.facing} />
            <Fact label="Road" value={`${plot.roadFt} ft`} />
            <Fact label="₹ / sq ft" value={`₹${plot.pricePerSqft.toLocaleString("en-IN")}`} />
            <Fact label="Guide price" value={plot.guidePrice} />
          </div>
          <p className="border-t border-graphite/12 px-3.5 py-1.5 u-fact text-[0.62rem] text-graphite/84">
            {compared ? "In your comparison" : "Click to select · add it to compare"}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Segmented({ value, onChange, options, label }) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-graphite/25" style={{ borderRadius: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={
            "u-fact whitespace-nowrap px-3 py-1.5 text-[0.72rem] transition-colors " +
            (value === o.value ? "bg-graphite text-paper" : "text-graphite/85 hover:bg-graphite/5 hover:text-graphite")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2">
      <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.52rem" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="u-fact border border-graphite/25 bg-paper px-2 py-1.5 text-[0.72rem] text-graphite"
        style={{ borderRadius: 2 }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 u-fact text-[0.72rem] text-graphite/85">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-graphite" />
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * PlotMapExplorer — the plot map with a 2D / illustrative-3D switch.
 * `map` is usePlotMapState(): owned by the page, so the record panel, plot
 * list and both renderers all read one selection.
 *   variant="full"     toolbar, filters, compare
 *   variant="preview"  3D teaser for the landing page; no toolbar
 * ------------------------------------------------------------------ */
export default function PlotMapExplorer({
  layout,
  map,
  initialView = "2d",
  variant = "full",
  height = "clamp(380px, 62vh, 640px)",
  paused = false,
}) {
  const full = variant === "full";
  const [view, setView] = useState(() => (initialView === "3d" && webglAvailable() ? "3d" : "2d"));
  const [toast, setToast] = useState(() =>
    initialView === "3d" && !webglAvailable() ? "3D needs WebGL, which this browser doesn’t offer — showing the 2D plan." : null,
  );
  const [showHomes, setShowHomes] = useState(true);
  const [ambient, setAmbient] = useState(true);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const fallback = useCallback((msg) => {
    setView("2d");
    setToast(msg);
  }, []);

  const choose = (v) => {
    if (v === "3d" && !webglAvailable()) {
      fallback("3D needs WebGL, which this browser doesn’t offer — staying on the 2D plan.");
      return;
    }
    setView(v);
  };

  const facings = [...new Set(layout.plots.map((p) => p.facing))].sort();
  const filtered = map.filters.facing !== "any" || map.filters.status !== "any";
  const shown = layout.plots.length - map.dimmedIds.length;
  const sel = map.selected;
  const inCompare = sel && map.compareIds.includes(sel.id);

  return (
    <div>
      {full && (
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Segmented
            label="Map view"
            value={view}
            onChange={choose}
            options={[
              { value: "2d", label: "2D plan" },
              { value: "3d", label: "3D · illustrative" },
            ]}
          />
          <Select
            label="Facing"
            value={map.filters.facing}
            onChange={(facing) => map.setFilters((f) => ({ ...f, facing }))}
            options={[{ value: "any", label: "Any" }, ...facings.map((f) => ({ value: f, label: f }))]}
          />
          <Select
            label="Status"
            value={map.filters.status}
            onChange={(status) => map.setFilters((f) => ({ ...f, status }))}
            options={[
              { value: "any", label: "Any" },
              { value: "verified", label: "Verified" },
              { value: "pending", label: "Pending" },
            ]}
          />
          {filtered && (
            <span className="u-fact text-[0.68rem] text-graphite/84" aria-live="polite">
              {shown} of {layout.plots.length} match
            </span>
          )}
          {view === "3d" && (
            <div className="flex items-center gap-4">
              <Toggle checked={showHomes} onChange={setShowHomes}>
                Sample homes
              </Toggle>
              <Toggle checked={ambient} onChange={setAmbient}>
                Street life
              </Toggle>
            </div>
          )}
        </div>
      )}

      <div className="relative border border-graphite/15" style={{ borderRadius: 3 }}>
        {view === "2d" ? (
          <div className="p-2">
            <PlotOverlay
              layout={layout}
              mode="detail"
              selectedId={map.selectedId}
              hoveredId={map.hoveredId}
              dimmedIds={map.dimmedIds}
              onSelect={map.select}
              onHover={map.hover}
            />
          </div>
        ) : (
          <ThreeBoundary onFail={() => fallback("The 3D view couldn’t start here — showing the 2D plan.")}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center bg-paper-2" style={{ height }}>
                  <p className="u-fact text-[0.72rem] text-graphite/84">Building the 3D view…</p>
                </div>
              }
            >
              <Plot3DView
                layout={layout}
                selectedId={map.selectedId}
                hoveredId={map.hoveredId}
                compareIds={map.compareIds}
                dimmedIds={map.dimmedIds}
                onSelect={map.select}
                onHover={map.hover}
                onHoverEnd={map.endHover}
                onContextLost={() => fallback("The 3D view lost its graphics context — switched back to the 2D plan.")}
                showHomes={showHomes}
                ambient={ambient && !paused}
                autoRotate={!full && !paused}
                style={{ height }}
              />
            </Suspense>
          </ThreeBoundary>
        )}

        <PlotHoverCard plot={map.hovered} compared={map.hovered && map.compareIds.includes(map.hovered.id)} />

        <AnimatePresence>
          {toast && (
            <motion.div
              role="status"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-3 left-1/2 z-40 w-[min(26rem,calc(100%-1.5rem))] -translate-x-1/2 bg-graphite px-4 py-2.5 u-fact text-[0.72rem] text-paper"
              style={{ borderRadius: 2 }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* selected plot strip — the keyboard path into compare */}
      {sel && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-graphite/15 bg-paper-2/60 px-4 py-2.5" style={{ borderRadius: 3 }}>
          <span className="u-fact text-[0.75rem] text-graphite">
            Plot {String(sel.no).padStart(2, "0")} · {sel.areaSqft.toLocaleString("en-IN")} sq ft · {sel.facing} facing ·{" "}
            {sel.guidePrice}
          </span>
          {full && (
            <button
              type="button"
              onClick={() => map.toggleCompare(sel.id)}
              aria-pressed={!!inCompare}
              className="u-fact whitespace-nowrap border border-graphite/30 px-3 py-1.5 text-[0.72rem] text-graphite transition-colors hover:border-graphite/70 hover:bg-graphite/5"
              style={{ borderRadius: 2 }}
            >
              {inCompare ? "− Remove from compare" : `+ Add to compare (${map.compareIds.length}/${MAX_COMPARE})`}
            </button>
          )}
        </div>
      )}

      {view === "3d" && full && (
        <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 u-fact text-[0.66rem] text-graphite/84">
          <li className="flex items-center gap-2">
            <span className="h-3 w-4" style={{ background: "var(--color-brick)" }} /> Verified
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-4" style={{ background: "var(--color-concrete-lt)" }} /> Verification pending
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-4 border-2 border-dashed border-ink" /> In comparison
          </li>
          <li className="flex items-center gap-2">
            <span className="h-3 w-4 opacity-30" style={{ background: "var(--color-concrete)" }} /> Filtered out
          </li>
          <li>Homes, trees, traffic: scenery, not part of the listing</li>
        </ul>
      )}

      {full && map.comparePlots.length > 0 && (
        <PlotCompare
          className="mt-5"
          plots={map.comparePlots}
          onRemove={map.toggleCompare}
          onClear={map.clearCompare}
          onSelect={map.select}
          selectedId={map.selectedId}
        />
      )}
    </div>
  );
}
