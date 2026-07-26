import { useEffect, useId, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { layout as defaultLayout, pointsToString } from "./plotData";
import SatelliteTerrain from "./SatelliteTerrain";
import RealSatelliteBackdrop from "./RealSatelliteBackdrop";

/* ------------------------------------------------------------------ *
 * PlotOverlay — the one plot-map component, four interaction modes.
 *
 *   mode="hero"    self-revealing featured plot, fully interactive after
 *   mode="detail"  fully interactive, click any plot to open its record
 *   mode="browse"  static thumbnail; not clickable
 *   mode="edit"    relator confirm/edit; boundaries carry trace confidence
 *
 * The visual language is shared on purpose. A plot the relator has confirmed
 * in edit mode is drawn with the SAME brick fill and stroke a buyer sees on a
 * verified plot — because it is the same fact. What changes between modes is
 * the affordance, not the vocabulary.
 *
 * Confidence is encoded by LINE TYPE, not hue: the palette is near-monochrome,
 * and drafting convention already uses solid for surveyed and dashed for
 * queried. It also survives colour-blindness, which a red/amber scale doesn't.
 *
 *   high    solid, quiet         — trace is clean, safe to accept
 *   review  dashed + light hatch — draughtsman's query, needs a look
 *   low     tight dash + hatch   — trace is unreliable, must be fixed
 *
 * Coordinates are placeholder (see plotData.js). The interaction is real.
 * ------------------------------------------------------------------ */

// A slightly irregular draw — the surveyor's hand hitches, so the boundary
// reads as measured, not as a clean vector rectangle.
const HAND_DRAW = {
  pathLength: [0, 0.42, 0.52, 1],
};
const HAND_TIMES = [0, 0.4, 0.5, 1];

function bbox(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

function NorthArrow({ north, onTerrain }) {
  const { x, y, r } = north;
  return (
    <g aria-hidden="true" opacity="0.85">
      {onTerrain && <circle cx={x} cy={y} r={r + 4} fill="var(--color-graphite)" opacity="0.35" />}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={onTerrain ? "var(--color-paper)" : "currentColor"}
        strokeWidth="1"
        opacity={onTerrain ? 0.8 : 0.4}
      />
      <path
        d={`M${x} ${y - r + 3} L${x + 6} ${y + 4} L${x} ${y - 2} L${x - 6} ${y + 4} Z`}
        fill="var(--color-brick)"
      />
      <text
        x={x}
        y={y + r + 12}
        textAnchor="middle"
        className="u-fact"
        fontSize="11"
        fill={onTerrain ? "var(--color-paper)" : "currentColor"}
        stroke={onTerrain ? "var(--color-graphite)" : undefined}
        strokeWidth={onTerrain ? 2.2 : undefined}
        paintOrder={onTerrain ? "stroke" : undefined}
        opacity={onTerrain ? 0.95 : 0.55}
      >
        N
      </text>
    </g>
  );
}

/* Stand-in for the uploaded DTCP scan sitting under the trace. We don't have a
 * real sketch to show, and inventing a fake "document" would be dishonest — so
 * this renders the same geometry with a photocopy treatment (offset, blurred,
 * grainy) to represent the sheet the boundaries were traced from. Swap this for
 * an <image> of the actual upload once the pipeline stores one. */
function SketchBackdrop({ layout, uid }) {
  return (
    <g aria-hidden="true" filter={`url(#${uid}-copy)`} opacity="0.3" transform="translate(2.5 2)">
      <rect
        x="14"
        y="14"
        width={layout.width - 28}
        height={layout.height - 28}
        fill="none"
        stroke="var(--color-graphite)"
        strokeWidth="2"
      />
      {layout.plots.map((p) => (
        <polygon
          key={`bd-${p.id}`}
          points={pointsToString(p.points)}
          fill="none"
          stroke="var(--color-graphite)"
          strokeWidth="2.2"
        />
      ))}
      <rect
        x={layout.road.x}
        y={layout.road.y}
        width={layout.road.w}
        height={layout.road.h}
        fill="none"
        stroke="var(--color-graphite)"
        strokeWidth="1.6"
      />
      {layout.plots.map((p) => (
        <text
          key={`bdn-${p.id}`}
          x={p.centroid[0]}
          y={p.centroid[1] + 4}
          textAnchor="middle"
          className="u-fact"
          fontSize="14"
          fill="var(--color-graphite)"
        >
          {p.no}
        </text>
      ))}
    </g>
  );
}

function PlotShape({
  plot,
  isFeatured,
  isSelected,
  isHovered,
  interactive,
  reveal, // "draw" | "instant" | "none"
  edit, // null | { tier, confirmed }
  onTerrain, // boundaries are drawn over aerial ground, so they need casing
  uid,
  onSelect,
  onHover,
}) {
  const pts = pointsToString(plot.points);
  const [cx, cy] = plot.centroid;
  const [focusRing, setFocusRing] = useState(false);
  // isSelected already reflects the effective selection (featured is the default
  // until the visitor picks another plot), so it alone drives the resolved look.
  const selectedLike = isSelected;

  // ---- resolve stroke/fill -------------------------------------------------
  let fill;
  let stroke;
  let strokeOpacity;
  let strokeWidth;
  let dash;

  if (edit) {
    const flagged = edit.tier !== "high";
    if (edit.confirmed) {
      // identical to the buyer's verified plot — same fact, same vocabulary
      fill = "color-mix(in srgb, var(--color-brick) 20%, transparent)";
      stroke = "var(--color-brick-lit)";
      strokeOpacity = 1;
      strokeWidth = 2.2;
    } else if (edit.tier === "low") {
      fill = `url(#${uid}-hatch-dense)`;
      stroke = "var(--color-graphite)";
      strokeOpacity = 1;
      strokeWidth = 2.3;
      dash = "3 3";
    } else if (edit.tier === "review") {
      fill = `url(#${uid}-hatch)`;
      stroke = "var(--color-graphite)";
      strokeOpacity = 0.9;
      strokeWidth = 1.8;
      dash = "7 5";
    } else {
      fill = isHovered ? "color-mix(in srgb, var(--color-graphite) 8%, transparent)" : "transparent";
      stroke = "var(--color-graphite)";
      strokeOpacity = isHovered ? 0.95 : 0.5;
      strokeWidth = isHovered ? 1.7 : 1.25;
    }
    if (isHovered && !edit.confirmed && flagged) strokeOpacity = 1;
  } else {
    fill =
      selectedLike && plot.status === "verified"
        ? "color-mix(in srgb, var(--color-brick) 20%, transparent)"
        : selectedLike
          ? "color-mix(in srgb, var(--color-concrete) 30%, transparent)"
          : isHovered
            ? "color-mix(in srgb, var(--color-graphite) 8%, transparent)"
            : "transparent";

    stroke = selectedLike
      ? plot.status === "verified"
        ? "var(--color-brick-lit)"
        : "var(--color-concrete)"
      : "var(--color-graphite)";

    strokeOpacity = selectedLike ? 1 : isHovered ? 0.95 : 0.5;
    strokeWidth = selectedLike ? 2.2 : isHovered ? 1.7 : 1.25;
  }

  /* Over aerial ground the boundary becomes a cartographic cased line: a dark
   * casing underneath, a light core on top. That's what keeps a survey line
   * readable whether it crosses soil, grass or a rooftop. */
  if (onTerrain) {
    if (!edit) {
      fill = selectedLike
        ? plot.status === "verified"
          ? "color-mix(in srgb, var(--color-brick) 30%, transparent)"
          : "color-mix(in srgb, var(--color-graphite) 26%, transparent)"
        : isHovered
          ? "color-mix(in srgb, var(--color-paper) 26%, transparent)"
          : "transparent";
      stroke = selectedLike && plot.status === "verified" ? "var(--color-brick)" : "var(--color-paper)";
    } else if (!edit.confirmed) {
      stroke = "var(--color-paper)";
    }
    strokeOpacity = selectedLike || isHovered ? 1 : 0.9;
    strokeWidth = selectedLike ? 2.6 : isHovered ? 2.1 : 1.7;
  }

  const commonProps = {
    points: pts,
    fill,
    stroke,
    strokeOpacity,
    strokeWidth,
    strokeDasharray: dash,
    strokeLinejoin: "round",
    vectorEffect: "non-scaling-stroke",
    style: { transition: "fill 200ms ease, stroke 200ms ease, stroke-width 160ms ease" },
  };

  const ariaLabel = edit
    ? `Plot ${plot.no}, ${plot.areaSqft} square feet, trace confidence ${Math.round(plot.confidence * 100)} percent, ${
        edit.confirmed ? "confirmed" : edit.tier === "high" ? "not flagged" : "needs confirmation"
      }`
    : `Plot ${plot.no}, ${plot.areaSqft} square feet, ${plot.status}`;

  const handlers = interactive
    ? {
        onClick: () => onSelect?.(plot),
        onMouseEnter: () => onHover?.(plot.id),
        onMouseLeave: () => onHover?.(null),
        onFocus: (e) => {
          // only show the halo for keyboard focus, not after a mouse click
          try {
            if (e.target.matches(":focus-visible")) setFocusRing(true);
          } catch {
            setFocusRing(true);
          }
          onHover?.(plot.id);
        },
        onBlur: () => {
          setFocusRing(false);
          onHover?.(null);
        },
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(plot);
          }
        },
        tabIndex: 0,
        role: "button",
        "aria-pressed": isSelected,
        "aria-label": ariaLabel,
        // No `outline: none` here — an inline style would beat the global
        // :focus-visible rule and leave keyboard users with no indicator. The
        // dashed halo below is drawn in addition to the browser's own ring.
        style: { ...commonProps.style, cursor: "crosshair" },
      }
    : { "aria-hidden": true };

  const showQuery = edit && !edit.confirmed && edit.tier !== "high";
  const { minX, minY } = bbox(plot.points);

  return (
    <g>
      {/* dark casing under the boundary, so the light core reads over any ground */}
      {onTerrain && (
        <polygon
          points={pts}
          fill="none"
          stroke="var(--color-graphite)"
          strokeOpacity="0.55"
          strokeWidth={strokeWidth + 2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}

      {/* base boundary — always rendered, so the plot is never stuck invisible */}
      <polygon {...commonProps} {...handlers} />

      {/* the plot currently open in the edit panel */}
      {edit && isSelected && (
        <polygon
          points={pts}
          fill="none"
          stroke="var(--color-graphite)"
          strokeWidth="1"
          strokeDasharray="2 3"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          transform={`translate(${cx} ${cy}) scale(1.06) translate(${-cx} ${-cy})`}
        />
      )}

      {/* keyboard focus halo — SVG outline rendering is unreliable, so draw it */}
      {focusRing && (
        <polygon
          points={pts}
          fill="none"
          stroke="var(--color-brick-lit)"
          strokeWidth="3"
          strokeDasharray="5 4"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      )}

      {/* hero reveal: a bright brick tracer sweeps the featured boundary, then
          fades — purely additive over the resolved plot beneath it */}
      {reveal === "draw" && isFeatured && (
        <motion.polygon
          points={pts}
          fill="none"
          stroke="var(--color-brick-lit)"
          strokeWidth="2.6"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
          initial={{ pathLength: 0, opacity: 1 }}
          animate={{ pathLength: HAND_DRAW.pathLength, opacity: [1, 1, 0] }}
          transition={{
            pathLength: { duration: 1.25, times: HAND_TIMES, ease: "easeInOut", delay: 0.4 },
            opacity: { duration: 1.7, times: [0, 0.78, 1], delay: 0.4 },
          }}
        />
      )}

      {/* draughtsman's query mark on a flagged boundary */}
      {showQuery && (
        <g pointerEvents="none" aria-hidden="true">
          {/* Two legible markers: "low" is a filled dark disc with a light
              glyph, "review" is a light disc with a dark glyph. Fill and glyph
              must always be opposite, or the mark reads as a solid dot. */}
          <circle
            cx={minX + 15}
            cy={minY + 16}
            r="8"
            fill={edit.tier === "low" ? "var(--color-graphite)" : "var(--color-paper)"}
            stroke={edit.tier === "low" ? "var(--color-paper)" : "var(--color-graphite)"}
            strokeWidth="1.3"
          />
          <text
            x={minX + 15}
            y={minY + 20}
            textAnchor="middle"
            className="u-fact"
            fontSize="10"
            fontWeight="600"
            fill={edit.tier === "low" ? "var(--color-paper)" : "var(--color-graphite)"}
          >
            ?
          </text>
        </g>
      )}

      {/* confirmed tick, so "done" is legible without relying on fill alone */}
      {edit?.confirmed && (
        <g pointerEvents="none" aria-hidden="true">
          <path
            d={`M${minX + 10} ${minY + 16} l4 4 l7 -8`}
            fill="none"
            stroke="var(--color-brick-lit)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* plot number — lifts when selected to make room for the dimension.
          Over terrain it takes a dark halo, the way map labels always do. */}
      <text
        x={cx}
        y={selectedLike ? cy - 2 : cy + 4}
        textAnchor="middle"
        className="u-fact"
        fontSize="13"
        fontWeight={onTerrain ? 600 : 400}
        fill={
          onTerrain
            ? "var(--color-paper)"
            : edit
              ? edit.confirmed
                ? "var(--color-brick-lit)"
                : "currentColor"
              : selectedLike && plot.status === "verified"
                ? "var(--color-brick-lit)"
                : "currentColor"
        }
        stroke={onTerrain ? "var(--color-graphite)" : undefined}
        strokeWidth={onTerrain ? 2.6 : undefined}
        strokeLinejoin="round"
        paintOrder={onTerrain ? "stroke" : undefined}
        opacity={
          onTerrain
            ? selectedLike || isHovered
              ? 1
              : 0.9
            : selectedLike
              ? 1
              : isHovered
                ? 0.9
                : edit && edit.tier !== "high"
                  ? 0.85
                  : 0.4
        }
        pointerEvents="none"
        style={{ transition: "opacity 200ms ease" }}
      >
        {plot.no}
      </text>
    </g>
  );
}

export default function PlotOverlay({
  layout = defaultLayout,
  mode = "detail",
  selectedId = null,
  hoveredId: hoveredIdProp,
  onSelect,
  onHover,
  onReveal,
  className = "",
  showDimensionLeader = true,
  confirmedIds = [],
  showSketchBackdrop,
  terrain,
  terrainDetail,
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const isEdit = mode === "edit";
  const interactive = mode !== "browse";
  const [hoveredIdState, setHoveredIdState] = useState(null);
  const hoveredId = hoveredIdProp !== undefined ? hoveredIdProp : hoveredIdState;
  const setHovered = (id) => {
    setHoveredIdState(id);
    onHover?.(id);
  };

  const reveal = mode === "hero" ? (reduce ? "instant" : "draw") : "none";
  const backdrop = showSketchBackdrop ?? false;
  // Aerial ground by default. The photocopy backdrop is only for the upload
  // screen, where the point is the sheet itself, so the two never stack.
  const showTerrain = (terrain ?? true) && !backdrop;
  const detail = terrainDetail ?? (mode === "browse" ? "simple" : "full");

  const confirmedSet = useMemo(() => new Set(confirmedIds), [confirmedIds]);

  // Fire onReveal when the hero sequence finishes (or immediately if reduced).
  useEffect(() => {
    if (mode !== "hero") return;
    if (reveal === "instant") {
      onReveal?.();
      return;
    }
    const t = setTimeout(() => onReveal?.(), 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, reveal]);

  const featuredId = mode === "hero" ? layout.featuredId : null;
  const selected = useMemo(
    () => layout.plots.find((p) => p.id === (selectedId ?? featuredId)) ?? null,
    [layout, selectedId, featuredId],
  );

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox={layout.viewBox}
        className="block h-auto w-full text-graphite"
        role="group"
        aria-label={`${layout.name} layout — ${layout.plots.length} plots`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <pattern id={`${uid}-osr`} width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--color-concrete)" strokeWidth="1.4" opacity="0.7" />
          </pattern>
          <pattern id={`${uid}-hatch`} width="9" height="9" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="9" stroke="var(--color-graphite)" strokeWidth="1" opacity="0.28" />
          </pattern>
          <pattern id={`${uid}-hatch-dense`} width="5" height="5" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-graphite)" strokeWidth="1" opacity="0.42" />
          </pattern>
          {backdrop && (
            <>
              {/* Cheap photocopy treatment: a soft blur plus a static tiled
                  grain. feTurbulence/feDisplacementMap read better but are
                  re-rasterised on every frame of anything animating above the
                  sheet, which stalls the renderer — not worth the fidelity. */}
              <filter id={`${uid}-copy`} x="-2%" y="-2%" width="104%" height="104%">
                <feGaussianBlur stdDeviation="0.6" />
              </filter>
              <pattern id={`${uid}-grain`} width="3" height="3" patternUnits="userSpaceOnUse">
                <rect width="3" height="3" fill="transparent" />
                <rect width="1" height="1" fill="var(--color-graphite)" opacity="0.5" />
                <rect x="2" y="1" width="1" height="1" fill="var(--color-graphite)" opacity="0.28" />
              </pattern>
            </>
          )}
        </defs>

        {/* aerial ground: a real photo where the layout has one, else the
            procedural terrain read */}
        {showTerrain && (
          layout.satelliteImage ? (
            <RealSatelliteBackdrop layout={layout} />
          ) : (
            <SatelliteTerrain
              layout={layout}
              detail={detail}
              animate={!reduce && detail === "full"}
            />
          )
        )}

        {/* the uploaded sheet, sitting under the trace */}
        {backdrop && (
          <>
            <SketchBackdrop layout={layout} uid={uid} />
            <rect
              x="14"
              y="14"
              width={layout.width - 28}
              height={layout.height - 28}
              fill={`url(#${uid}-grain)`}
              opacity="0.05"
              pointerEvents="none"
              aria-hidden="true"
            />
          </>
        )}

        {/* layout outer boundary */}
        <rect
          x="14"
          y="14"
          width={layout.width - 28}
          height={layout.height - 28}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1"
        />

        {/* road band — drafting furniture; terrain draws a real road instead */}
        <g aria-hidden="true" style={{ display: showTerrain ? "none" : undefined }}>
          <rect
            x={layout.road.x}
            y={layout.road.y}
            width={layout.road.w}
            height={layout.road.h}
            fill="color-mix(in srgb, var(--color-graphite) 4%, transparent)"
            stroke="currentColor"
            strokeOpacity="0.14"
            strokeDasharray="2 6"
          />
          <line
            x1={layout.road.x}
            y1={layout.road.y + layout.road.h / 2}
            x2={layout.road.x + layout.road.w}
            y2={layout.road.y + layout.road.h / 2}
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeDasharray="10 12"
          />
          <text
            x={layout.road.x + layout.road.w / 2}
            y={layout.road.y + layout.road.h / 2 - 6}
            textAnchor="middle"
            className="u-eyebrow"
            fontSize="10"
            fill="currentColor"
            opacity="0.4"
          >
            {layout.road.label}
          </text>
        </g>

        {/* OSR (open space reservation) — never clickable. On terrain it reads
            as planted open ground with a cased label instead of a hatch. */}
        <g aria-hidden="true">
          <polygon
            points={pointsToString(layout.osr.points)}
            fill={showTerrain ? "color-mix(in srgb, var(--terrain-grass) 70%, transparent)" : `url(#${uid}-osr)`}
            stroke={showTerrain ? "var(--color-paper)" : "var(--color-concrete)"}
            strokeOpacity={showTerrain ? 0.7 : 0.5}
            strokeDasharray={showTerrain ? "5 4" : undefined}
          />
          <text
            x={layout.osr.points[0][0] + 12}
            y={layout.osr.points[0][1] + 22}
            className="u-eyebrow"
            fontSize="10"
            fill={showTerrain ? "var(--color-paper)" : "var(--color-concrete)"}
            stroke={showTerrain ? "var(--color-graphite)" : undefined}
            strokeWidth={showTerrain ? 2.2 : undefined}
            paintOrder={showTerrain ? "stroke" : undefined}
          >
            {layout.osr.label}
          </text>
        </g>

        <NorthArrow north={layout.north} onTerrain={showTerrain} />

        {/* plots — neighbours sit at their faint resting state; only the
            featured plot draws itself in (hero mode) */}
        {layout.plots.map((plot) => (
          <PlotShape
            key={plot.id}
            plot={plot}
            isFeatured={plot.id === featuredId}
            isSelected={plot.id === (selectedId ?? featuredId)}
            isHovered={plot.id === hoveredId}
            interactive={interactive}
            reveal={reveal}
            edit={isEdit ? { tier: plot.tier, confirmed: confirmedSet.has(plot.id) } : null}
            onTerrain={showTerrain}
            uid={uid}
            onSelect={onSelect}
            onHover={setHovered}
          />
        ))}

        {/* dimension annotation for the active plot */}
        {showDimensionLeader && selected && (
          <RevealLeader
            plot={selected}
            reveal={reveal}
            halo={showTerrain}
            tone={
              showTerrain
                ? "var(--color-paper)"
                : !isEdit || confirmedSet.has(selected.id)
                  ? "var(--color-brick-lit)"
                  : "var(--color-graphite)"
            }
          />
        )}
      </svg>
    </div>
  );
}

function RevealLeader({ plot, reveal, tone = "var(--color-brick-lit)", halo = false }) {
  // Survey sheets write the dimension inside the plot box, under its number —
  // so the annotation sits there rather than on a leader line that would cross
  // the plot number.
  const [cx, cy] = plot.centroid;
  const cased = halo
    ? { stroke: "var(--color-graphite)", strokeWidth: 2.4, paintOrder: "stroke", strokeLinejoin: "round" }
    : {};
  const content = (
    <g pointerEvents="none">
      <text x={cx} y={cy + 20} textAnchor="middle" className="u-fact" fontSize="11" fill={tone} {...cased}>
        {plot.dimensions}
      </text>
      <text
        x={cx}
        y={cy + 34}
        textAnchor="middle"
        className="u-fact"
        fontSize="10"
        fill={tone}
        opacity={halo ? 0.95 : 0.75}
        {...cased}
      >
        {plot.areaSqft.toLocaleString("en-IN")} sq ft
      </text>
    </g>
  );
  if (reveal === "draw") {
    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 1.85 }}>
        {content}
      </motion.g>
    );
  }
  return content;
}
