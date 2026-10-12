import { useId, useState } from "react";
import { FACINGS, facingWord, isFilterActive } from "../shared/plotInsights";

/* Buyer plot filters: facing (multi-select) + corner-only. Same pill pattern
 * as the layout filters on Browse — aria-pressed buttons, graphite fill when
 * on — so there's no new vocabulary. Never brick: brick means verified.
 *
 * Desktop: one inline bar. Mobile: a collapsible bar (toggle shows the
 * active count) so the map isn't pushed below the fold by eight buttons. */

function Pill({ pressed, onClick, children, label }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={
        "border px-2.5 py-1 u-fact text-[0.68rem] transition-colors " +
        (pressed
          ? "border-graphite bg-graphite text-paper"
          : "border-graphite/25 text-graphite/85 hover:border-graphite/50 hover:text-graphite")
      }
      style={{ borderRadius: "2px" }}
    >
      {children}
    </button>
  );
}

export default function PlotFilters({ plots, filters, onChange, matchCount }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const active = isFilterActive(filters);
  const activeCount = filters.facing.length + (filters.corner ? 1 : 0);

  // offer only facings that occur in this layout; keep any that a shared
  // link selected even if absent here, so the user can see and clear them
  const present = new Set(plots.map((p) => p.facing).filter(Boolean));
  const options = FACINGS.filter((f) => present.has(f) || filters.facing.includes(f));
  const hasCorners = plots.some((p) => p.is_corner === true);

  if (options.length === 0 && !hasCorners && !active) return null;

  const toggleFacing = (f) =>
    onChange({
      ...filters,
      facing: filters.facing.includes(f) ? filters.facing.filter((x) => x !== f) : [...filters.facing, f],
    });

  return (
    <div className="mt-3">
      {/* mobile: collapsible bar */}
      <div className="flex items-center justify-between gap-3 border border-graphite/15 px-3 py-2 md:hidden" style={{ borderRadius: "2px" }}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 u-fact text-[0.72rem] text-graphite"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4.5 L6 8 L10 4.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Filter plots{activeCount ? ` · ${activeCount} on` : ""}
        </button>
        {active && (
          <span className="u-fact text-[0.66rem] text-graphite/84">
            {matchCount} of {plots.length} match
          </span>
        )}
      </div>

      <div
        id={panelId}
        className={`${open ? "flex" : "hidden"} mt-2 flex-col gap-3 md:mt-0 md:flex md:flex-row md:flex-wrap md:items-center md:gap-x-5 md:gap-y-2`}
      >
        {options.length > 0 && (
          <div role="group" aria-label="Facing" className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
              Facing
            </span>
            {options.map((f) => (
              <Pill key={f} pressed={filters.facing.includes(f)} onClick={() => toggleFacing(f)} label={`${facingWord(f)}-facing`}>
                {f}
              </Pill>
            ))}
          </div>
        )}

        {hasCorners && (
          <div className="self-start md:self-auto">
            <Pill pressed={filters.corner} onClick={() => onChange({ ...filters, corner: !filters.corner })}>
              Corner plots only
            </Pill>
          </div>
        )}

        {active && (
          <div className="flex items-center gap-3 md:ml-auto">
            <span className="hidden u-fact text-[0.66rem] text-graphite/84 md:inline">
              {matchCount} of {plots.length} match
            </span>
            <button
              type="button"
              onClick={() => onChange({ facing: [], corner: false })}
              className="u-fact text-[0.66rem] text-graphite/85 underline underline-offset-2 hover:text-graphite"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* Shown when filters are on but nothing passes. The map below still shows
 * every plot (dimmed), so this explains the empty result and offers a way
 * out — same dashed treatment as Browse's empty state. */
export function NoPlotsMatch({ onReset }) {
  return (
    <div
      role="status"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-dashed border-graphite/25 px-4 py-3"
      style={{ borderRadius: "3px" }}
    >
      <p className="text-[0.92rem] text-graphite">
        <span className="font-display font-bold">No plots match</span>
        <span className="text-graphite/84"> — every plot is still drawn below, faded.</span>
      </p>
      <button
        type="button"
        onClick={onReset}
        className="u-fact border border-graphite/35 px-3 py-1.5 text-[0.68rem] uppercase text-graphite transition-colors hover:bg-graphite/5"
        style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
      >
        Reset filters
      </button>
    </div>
  );
}
