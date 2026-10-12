import {
  BEATS,
  FLIGHT_D,
  MATCHED,
  PLOTS,
  SR_DESCRIPTION,
  STRIPS,
  TILE,
  VB_H,
  VB_W,
  VB_X,
  VB_Y,
  roadY,
  useStageId,
} from "./droneSurveyData";

/* Drone Survey — static half. The SVG stage and the copy blocks, with no
 * GSAP dependency, so the landing page can paint this immediately and only
 * pull in the scroll-scrubbed version (DroneSurvey.jsx) when it's worth it.
 *
 * The markup renders the FINAL frame by default (every strip revealed and
 * stitched, every plot traced, the matched plot lit, drone gone). The GSAP
 * timeline only ever rewinds from there with fromTo/from tweens. So reduced
 * motion, a failed chunk of JS, and gsap.matchMedia reverting on a breakpoint
 * change all land on the same correct static picture with no extra code.
 *
 * Brick shows up exactly once in this section, on the matched plot and its
 * tag in beat 4. Everything else is ink, graphite and terrain. */

/* ---- drawing ----------------------------------------------------------- */

function Quadcopter() {
  const rotors = [
    [-22, -22],
    [22, -22],
    [-22, 22],
    [22, 22],
  ];
  return (
    <g>
      {/* camera footprint + the "cone" read top-down as a frustum */}
      <g data-cone>
        <path
          d="M0 0 L-75 -68 M0 0 L75 -68 M0 0 L75 68 M0 0 L-75 68"
          stroke="var(--color-graphite)"
          strokeOpacity="0.22"
          strokeWidth="1"
        />
        <rect
          x="-75"
          y="-68"
          width="150"
          height="136"
          fill="var(--color-graphite)"
          fillOpacity="0.06"
          stroke="var(--color-graphite)"
          strokeOpacity="0.4"
          strokeDasharray="4 4"
        />
        <line className="drone-scan" x1="-75" x2="75" y1="0" y2="0" stroke="var(--color-graphite)" strokeOpacity="0.55" strokeWidth="1.5" />
      </g>
      {/* ground shadow */}
      <ellipse cx="6" cy="9" rx="30" ry="26" fill="var(--color-ink)" fillOpacity="0.08" />
      {/* arms */}
      <path d="M-22 -22 L22 22 M22 -22 L-22 22" stroke="var(--color-graphite)" strokeWidth="4" strokeLinecap="round" />
      {rotors.map(([x, y]) => (
        <g key={`${x},${y}`} transform={`translate(${x} ${y})`}>
          <circle r="12.5" fill="var(--color-paper)" fillOpacity="0.7" stroke="var(--color-graphite)" strokeOpacity="0.55" strokeWidth="1.2" />
          <g className="drone-rotor">
            <path d="M-11 0 L11 0" stroke="var(--color-ink)" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
          </g>
          <circle r="2.2" fill="var(--color-ink)" />
        </g>
      ))}
      {/* body + camera */}
      <rect x="-9" y="-9" width="18" height="18" rx="4" fill="var(--color-ink)" />
      <circle r="3.4" fill="var(--color-paper)" fillOpacity="0.85" />
      <circle r="1.6" fill="var(--color-ink)" />
    </g>
  );
}

/* A simplified aerial: soil, a few vegetation patches and the road. Terrain tokens only — no roofs, so no brick. */
function AerialTile() {
  return (
    <g>
      <rect x={TILE.x} y={TILE.y} width={TILE.w} height={TILE.h} fill="var(--terrain-soil)" />
      <path d="M40 95 L250 95 L210 170 L120 205 L40 190 Z" fill="var(--terrain-grass)" fillOpacity="0.55" />
      <path d="M520 95 L760 95 L760 230 L660 200 L570 160 Z" fill="var(--terrain-scrub)" fillOpacity="0.4" />
      <path d="M40 400 L170 380 L260 430 L230 505 L40 505 Z" fill="var(--terrain-grass)" fillOpacity="0.45" />
      <path d="M470 505 L520 420 L640 400 L760 450 L760 505 Z" fill="var(--terrain-soil-dk)" fillOpacity="0.6" />
      <path d="M330 150 C380 130 450 140 470 175 C440 210 360 215 330 190 Z" fill="var(--terrain-soil-dk)" fillOpacity="0.45" />
      <line
        x1={TILE.x}
        y1={roadY(TILE.x)}
        x2={TILE.x + TILE.w}
        y2={roadY(TILE.x + TILE.w)}
        stroke="var(--terrain-road)"
        strokeWidth="34"
      />
      <line
        x1={TILE.x}
        y1={roadY(TILE.x)}
        x2={TILE.x + TILE.w}
        y2={roadY(TILE.x + TILE.w)}
        stroke="var(--color-paper)"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        strokeDasharray="14 12"
      />
    </g>
  );
}

export function SurveyStage({ uid }) {
  const tileId = `${uid}-tile`;
  const gridId = `${uid}-grid`;
  const matchedLeftPct = ((MATCHED.cx - VB_X) / VB_W) * 100;
  const tagTopPct = ((MATCHED.bottom + 22 - VB_Y) / VB_H) * 100;

  return (
    // Container-query box: the inner sheet always keeps the viewBox's 8:5 and as large
    // as the cell allows, so HTML overlays positioned in % land on the SVG.
    <div className="flex h-full w-full items-center justify-center" style={{ containerType: "size" }}>
      <div className="relative" style={{ width: `min(100cqw, calc(100cqh * ${VB_W} / ${VB_H}))`, aspectRatio: `${VB_W} / ${VB_H}` }}>
        <svg
          viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
          className="absolute inset-0 h-full w-full"
          fill="none"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <pattern id={gridId} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0 L0 0 0 20" stroke="var(--color-graphite)" strokeOpacity="0.14" strokeWidth="1" />
            </pattern>
            <g id={tileId}>
              <AerialTile />
            </g>
            {STRIPS.map((s, i) => (
              <clipPath key={i} id={`${uid}-clip${i}`} clipPathUnits="userSpaceOnUse">
                <rect data-strip-clip={i} x={TILE.x} y={s.y} width={TILE.w} height={s.h} />
              </clipPath>
            ))}
          </defs>

          {/* faint drafting grid + terrain contours, before capture */}
          <g data-grid>
            <rect x={VB_X} y={VB_Y} width={VB_W} height={VB_H} fill={`url(#${gridId})`} />
            <g stroke="var(--color-graphite)" strokeOpacity="0.16" strokeWidth="1">
              <path d="M0 140 C160 110 300 180 470 130 S720 90 800 120" />
              <path d="M0 260 C180 230 320 300 480 250 S700 220 800 240" />
              <path d="M0 470 C150 440 340 510 500 460 S720 430 800 455" />
            </g>
          </g>

          {/* captured strips: each a clipped copy of the aerial tile with its
              own frame edge; stitching = offsets → 0 and edges fade out */}
          {STRIPS.map((s, i) => (
            <g key={i} data-strip={i}>
              <g clipPath={`url(#${uid}-clip${i})`}>
                <use href={`#${tileId}`} />
              </g>
              <rect
                data-seam
                x={TILE.x}
                y={s.y}
                width={TILE.w}
                height={s.h}
                stroke="var(--color-ink)"
                strokeOpacity="0.35"
                strokeDasharray="6 4"
                opacity="0"
              />
            </g>
          ))}

          {/* flight plan */}
          <path d={FLIGHT_D} stroke="var(--color-ink)" strokeOpacity="0.2" strokeWidth="1.25" strokeDasharray="2 6" strokeLinecap="round" />

          {/* traced road edges + plot boundaries */}
          <g stroke="var(--color-ink)" strokeOpacity="0.55" strokeWidth="1.25">
            {[-17, 17].map((o) => (
              <path
                key={o}
                data-trace-road
                d={`M${TILE.x} ${(roadY(TILE.x) + o).toFixed(1)} L${TILE.x + TILE.w} ${(roadY(TILE.x + TILE.w) + o).toFixed(1)}`}
              />
            ))}
          </g>
          <g strokeLinejoin="round">
            {PLOTS.map((p) => (
              <path
                key={p.n}
                data-plot={p.n}
                d={p.d}
                fill="var(--color-paper)"
                fillOpacity="0.28"
                stroke="var(--color-ink)"
                strokeOpacity="0.8"
                strokeWidth="1.6"
              />
            ))}
          </g>
          <g fontFamily="var(--font-mono)" fontSize="15" fontWeight="500" textAnchor="middle" fill="var(--color-ink)">
            {PLOTS.map((p) => (
              <text key={p.n} data-label={p.n} x={p.cx} y={p.cy + 5} fillOpacity="0.85">
                {String(p.n).padStart(2, "0")}
              </text>
            ))}
          </g>

          {/* beat 4 — the matched plot, the section's only brick */}
          <g data-match>
            <path d={MATCHED.d} fill="var(--color-brick)" fillOpacity="0.2" stroke="var(--color-brick)" strokeWidth="2.6" strokeLinejoin="round" />
            <text x={MATCHED.cx} y={MATCHED.cy + 5} fontFamily="var(--font-mono)" fontSize="15" fontWeight="600" textAnchor="middle" fill="var(--color-brick-lit)">
              {String(MATCHED.n).padStart(2, "0")}
            </text>
            <line x1={MATCHED.cx} y1={MATCHED.bottom - 6} x2={MATCHED.cx} y2={MATCHED.bottom + 22} stroke="var(--color-brick)" strokeWidth="1.5" />
          </g>

          {/* drone parks past the east edge in the final frame */}
          <g data-drone transform="translate(900 330)">
            <Quadcopter />
          </g>
        </svg>

        {/* tag is HTML (not SVG text) so it stays legible when the sheet
            scales down to phone width */}
        <span
          data-match-tag
          className="absolute inline-flex items-center gap-1.5 whitespace-nowrap bg-brick px-2 py-1 u-fact text-[0.62rem] text-white"
          style={{ left: `${matchedLeftPct}%`, top: `${tagTopPct}%`, translate: "-50% 0", borderRadius: "2px", letterSpacing: "0.04em" }}
        >
          <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2 6.4 L4.8 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Verified against DTCP layout
        </span>

        {/* sheet corner ticks, same grammar as CoordFrame */}
        {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos) => (
          <span
            key={pos}
            className={`absolute ${pos} h-2.5 w-2.5 border-graphite/40`}
            style={{
              borderTopWidth: pos.includes("top") ? 1 : 0,
              borderBottomWidth: pos.includes("bottom") ? 1 : 0,
              borderLeftWidth: pos.includes("left") ? 1 : 0,
              borderRightWidth: pos.includes("right") ? 1 : 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function Beat({ beat, index, stacked }) {
  return (
    <li
      data-beat={index}
      className={stacked ? "border-t border-graphite/14 pt-5" : "[grid-area:1/1] self-start"}
    >
      <span className="u-fact text-[0.62rem] text-graphite/72">
        {String(index + 1).padStart(2, "0")}/04
      </span>
      <h3 className="mt-2 font-display text-2xl font-bold text-graphite">{beat.title}</h3>
      <p className="mt-2 text-[1.02rem] leading-relaxed text-graphite/85">{beat.body}</p>
    </li>
  );
}

const H2_STYLE = { fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" };

export function Header({ className = "" }) {
  return (
    <div className={className}>
      <p className="u-eyebrow text-graphite/88">Drone Survey Layer</p>
      <h2 className="mt-4 font-display font-extrabold text-graphite" style={H2_STYLE}>
        Every plot, seen from above. Verified from the record.
      </h2>
    </div>
  );
}

export function FooterChip({ className = "" }) {
  return (
    <p className={className}>
      <span
        className="inline-block border border-concrete/60 px-2 py-1 u-fact text-[0.62rem] leading-snug text-graphite/90"
        style={{ borderRadius: "2px" }}
      >
        Accepts drone-captured imagery · Roadmap: in-app georeferencing
      </span>
    </p>
  );
}

/* ---- reduced motion: no pin, no scrub, final frame + stacked beats ----- */

export default function StaticDroneSurvey() {
  const uid = useStageId();
  return (
    <section id="drone-survey" className="relative scroll-mt-24 bg-paper bg-survey-grid">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <Header className="max-w-2xl" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr] lg:gap-14">
          <div aria-hidden="true" className="aspect-[8/5] w-full min-w-0">
            <SurveyStage uid={uid} />
          </div>
          <div className="min-w-0">
            <p className="sr-only">{SR_DESCRIPTION}</p>
            <ol className="grid gap-6">
              {BEATS.map((b, i) => (
                <Beat key={b.title} beat={b} index={i} stacked />
              ))}
            </ol>
            <FooterChip className="mt-8" />
          </div>
        </div>
      </div>
    </section>
  );
}

