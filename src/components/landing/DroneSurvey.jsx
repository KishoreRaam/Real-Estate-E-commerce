import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* Drone Survey — one pinned, scroll-scrubbed story in four beats:
 * capture → stitch → trace → match.
 *
 * The markup renders the FINAL frame by default (every strip revealed and
 * stitched, every plot traced, the matched plot lit, drone gone). The GSAP
 * timeline only ever rewinds from there with fromTo/from tweens. So reduced
 * motion, a failed chunk of JS, and gsap.matchMedia reverting on a breakpoint
 * change all land on the same correct static picture with no extra code.
 *
 * Brick shows up exactly once in this section, on the matched plot and its
 * tag in beat 4. Everything else is ink, graphite and terrain. */

const BEATS = [
  { title: "Capture", body: "Aerial imagery of a layout, shot in a single flight." },
  { title: "Stitch", body: "Frames merge into one continuous view of the site." },
  { title: "Trace", body: "Plot boundaries are extracted and numbered automatically." },
  {
    title: "Match",
    body: "Each plot is tied back to its sanctioned DTCP layout, so what you see is what was approved.",
  },
];

/* ---- stage geometry (SVG user units, viewBox 800 × 600) ---------------- */

const VB_X = 0;
const VB_Y = 60;
const VB_W = 800;
const VB_H = 500;
const TILE = { x: 40, y: 95, w: 720, h: 410 };
const STRIPS = [
  { y: 95, h: 137, offset: { x: -7, y: 4 } },
  { y: 232, h: 136, offset: { x: 6, y: -3 } },
  { y: 368, h: 137, offset: { x: -5, y: 3 } },
];

// Main road centreline, gently falling west → east; plots sit 22u off it.
const roadY = (x) => 305 - ((x - 60) * 20) / 680;
const SETBACK = 22;

const TOP_ROAD_X = [92, 196, 298, 402, 506, 608, 708];
const TOP_BACK_X = [100, 206, 304, 414, 512, 620, 714];
const TOP_BACK_Y = [112, 118, 108, 115, 104, 110, 116];
const BOT_ROAD_X = [92, 200, 302, 404, 510, 612, 708];
const BOT_BACK_X = [86, 190, 296, 398, 498, 604, 712];
const BOT_BACK_Y = [490, 496, 486, 498, 490, 484, 494];

const MATCHED_PLOT = 9;

const PLOTS = (() => {
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
const MATCHED = PLOTS[MATCHED_PLOT - 1];

/* Flight plan: a lawnmower survey, three passes joined by curved turns, then
 * an exit off the east edge. Segment lengths are measured off these exact
 * curves, so each strip's reveal can be placed at the moment the drone's
 * camera footprint (±75u wide) actually covers it. */
const FLIGHT_D =
  "M-80 163 L690 163 C775 163 775 300 690 300 L110 300 C25 300 25 437 110 437 L690 437 C780 437 820 380 900 330";
const LEN = {
  pass1: [0, 770],
  turn1: [770, 979.8],
  pass2: [979.8, 1559.8],
  turn2: [1559.8, 1769.6],
  pass3: [1769.6, 2349.6],
  total: 2590,
};
const FOOT_HALF_W = 75;

/* Timeline is 4 units long, one per beat, with the flight spanning
 * 0.05 → 3.35 at constant speed, so a length along the path maps to a time. */
const FLIGHT_START = 0.05;
const FLIGHT_DUR = 3.3;
const tAt = (len) => FLIGHT_START + (FLIGHT_DUR * len) / LEN.total;
// time at which the drone is at x during pass 3 (west → east from x=110)
const tPass3X = (x) => tAt(LEN.pass3[0] + Math.min(580, Math.max(0, x - 110)));

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

function SurveyStage({ uid }) {
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

function Beat({ beat, index, stacked }) {
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

const SR_DESCRIPTION =
  "Illustration: a drone flies three passes over a land layout, the captured strips merge into one aerial view, twelve plot boundaries are traced and numbered, and plot 09 is highlighted as verified against the DTCP layout.";

const H2_STYLE = { fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" };

function Header({ className = "" }) {
  return (
    <div className={className}>
      <p className="u-eyebrow text-graphite/88">Drone Survey Layer</p>
      <h2 className="mt-4 font-display font-extrabold text-graphite" style={H2_STYLE}>
        Every plot, seen from above. Verified from the record.
      </h2>
    </div>
  );
}

function FooterChip({ className = "" }) {
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

function StaticDroneSurvey({ uid }) {
  return (
    <section id="drone-survey" className="relative scroll-mt-24 bg-paper bg-survey-grid">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <Header className="max-w-2xl" />
        <div className="mt-12 grid gap-10 lg:grid-cols-[3fr_2fr] lg:gap-14">
          <div aria-hidden="true" className="aspect-[8/5] w-full">
            <SurveyStage uid={uid} />
          </div>
          <p className="sr-only">{SR_DESCRIPTION}</p>
          <div>
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

/* ---- motion: pinned, scrubbed --------------------------------------- */

export default function DroneSurvey() {
  const reduce = useReducedMotion();
  const uid = `ds${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const pinBodyRef = useRef(null);

  useEffect(() => {
    if (reduce) return undefined;
    const section = sectionRef.current;
    const q = gsap.utils.selector(section);

    // The sticky Nav sits over the page; pin just below it, and size the
    // pinned frame to the space left. Re-measured before every refresh
    // because the header's height changes across breakpoints.
    let navH = 76;
    const measureNav = () => {
      navH = document.querySelector("header.sticky")?.offsetHeight ?? 76;
      section.style.setProperty("--nav-h", `${navH}px`);
    };
    measureNav();
    ScrollTrigger.addEventListener("refreshInit", measureNav);

    const mm = gsap.matchMedia();
    mm.add(
      {
        isDesktop: "(min-width: 1024px)",
        isMobile: "(max-width: 1023.98px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { isDesktop, reduce: reduceNow } = ctx.conditions;
        if (reduceNow) return; // React swaps to the static layout on the next render

        // Desktop pins the whole two-column frame (headline stays in view);
        // mobile lets the headline scroll away and pins only stage + beats,
        // which is what keeps the pinned area legible on a 568px-tall phone.
        const pinTarget = isDesktop ? frameRef.current : pinBodyRef.current;
        const beatShift = isDesktop ? 24 : 12;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: pinTarget,
            start: () => `top ${navH}px`,
            end: () => `+=${window.innerHeight * 3}`,
            pin: pinTarget,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        const [clip0, clip1, clip2] = q("[data-strip-clip]");
        const strips = q("[data-strip]");
        const seams = q("[data-seam]");
        const drone = q("[data-drone]")[0];

        /* 1 · CAPTURE --------------------------------------------------- */
        tl.fromTo(q("[data-grid]"), { opacity: 1 }, { opacity: 0.35, duration: 1 }, 0);
        tl.to(drone, { motionPath: { path: FLIGHT_D }, duration: FLIGHT_DUR, immediateRender: true }, FLIGHT_START);
        // strip 1 (west → east): revealed as the footprint's leading edge
        // (drone x + 75) crosses the tile, x = 40 → 760. The pass starts at
        // x = -80, so that's 45 → 765 along the path.
        const s1From = LEN.pass1[0] + TILE.x - FOOT_HALF_W + 80;
        const s1To = s1From + TILE.w;
        tl.fromTo(clip0, { attr: { width: 0 } }, { attr: { width: TILE.w }, duration: tAt(s1To) - tAt(s1From) }, tAt(s1From));
        // strip 2 (east → west): the turn already sweeps its east end
        tl.fromTo(
          clip1,
          { attr: { x: TILE.x + TILE.w, width: 0 } },
          { attr: { x: 615, width: 145 }, duration: tAt(LEN.turn1[1]) - tAt(LEN.turn1[0]) },
          tAt(LEN.turn1[0]),
        );
        tl.to(clip1, { attr: { x: TILE.x, width: TILE.w }, duration: tAt(LEN.pass2[0] + 575) - tAt(LEN.pass2[0]) }, tAt(LEN.pass2[0]));
        // strip 3 (west → east)
        tl.fromTo(
          clip2,
          { attr: { width: 0 } },
          { attr: { width: 145 }, duration: tAt(LEN.turn2[1]) - tAt(LEN.turn2[0]) },
          tAt(LEN.turn2[0]),
        );
        tl.to(clip2, { attr: { width: TILE.w }, duration: tAt(LEN.pass3[0] + 575) - tAt(LEN.pass3[0]) }, tAt(LEN.pass3[0]));

        /* 2 · STITCH ---------------------------------------------------- */
        // frames arrive slightly misregistered with visible edges, then
        // merge into one tile: strips 1–2 during beat 2, strip 3 as it lands
        STRIPS.forEach((s, i) => {
          const at = i < 2 ? 1.45 : 2.55;
          const ease = "power1.inOut";
          tl.fromTo(strips[i], { x: s.offset.x, y: s.offset.y }, { x: 0, y: 0, duration: 0.5, ease }, at);
          tl.fromTo(seams[i], { opacity: 1 }, { opacity: 0, duration: 0.5 }, at);
        });

        /* 3 · TRACE ----------------------------------------------------- */
        // boundaries draw as the final pass sweeps over each column
        q("[data-trace-road]").forEach((el) => {
          const len = el.getTotalLength();
          tl.fromTo(
            el,
            { strokeDasharray: len, strokeDashoffset: len },
            { strokeDashoffset: 0, duration: tPass3X(700) - tPass3X(110) },
            tPass3X(110),
          );
        });
        PLOTS.forEach((p) => {
          const el = q(`[data-plot="${p.n}"]`)[0];
          const label = q(`[data-label="${p.n}"]`)[0];
          const len = el.getTotalLength();
          const at = tPass3X(p.cx) - 0.12;
          tl.fromTo(
            el,
            { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 },
            { strokeDashoffset: 0, fillOpacity: 0.28, duration: 0.3, ease: "power1.out" },
            at,
          );
          tl.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.15 }, at + 0.22);
        });

        /* 4 · MATCH ----------------------------------------------------- */
        tl.fromTo(q("[data-match]"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 3.3);
        tl.fromTo(q("[data-match-tag]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, 3.45);

        /* copy beats: opacity only (never visibility) so screen readers
           always get all four, whatever the scroll position */
        const beats = q("[data-beat]");
        beats.forEach((el, i) => {
          if (i > 0) {
            tl.fromTo(el, { opacity: 0, y: beatShift }, { opacity: 1, y: 0, duration: 0.2, ease: "power1.out" }, i + 0.03);
          }
          if (i < beats.length - 1) {
            tl.fromTo(el, { opacity: 1, y: 0 }, { opacity: 0, y: -beatShift, duration: 0.2, ease: "power1.in", immediateRender: false }, i + 1 - 0.2);
          }
        });

        // short hold on the final frame before the pin releases
        tl.to({}, { duration: 0.4 }, 4);
      },
    );

    // Pin lengths depend on text height; re-measure once webfonts swap in.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ScrollTrigger.removeEventListener("refreshInit", measureNav);
      mm.revert(); // kills the timeline, its ScrollTrigger and the pin-spacer
    };
  }, [reduce]);

  if (reduce) return <StaticDroneSurvey uid={uid} />;

  return (
    <section
      id="drone-survey"
      ref={sectionRef}
      className="relative bg-paper bg-survey-grid"
      style={{ "--nav-h": "76px" }}
    >
      <div className="mx-auto max-w-[1440px] px-5 pb-16 sm:px-8">
        <div
          ref={frameRef}
          className="lg:grid lg:h-[calc(100svh_-_var(--nav-h))] lg:grid-cols-[3fr_2fr] lg:grid-rows-[1fr_auto_1fr] lg:gap-x-14 lg:py-10"
        >
          {/* scrolls away on mobile; pinned with the frame on desktop */}
          <Header className="max-w-2xl pt-20 pb-6 lg:col-start-2 lg:row-start-1 lg:self-end lg:pt-0 lg:pb-8" />

          <div
            ref={pinBodyRef}
            className="flex h-[calc(100svh_-_var(--nav-h))] flex-col py-4 lg:contents"
          >
            <div
              aria-hidden="true"
              className="h-[45svh] w-full shrink-0 max-lg:[@media(max-height:620px)]:h-[38svh] lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:h-full"
            >
              <SurveyStage uid={uid} />
            </div>
            <p className="sr-only">{SR_DESCRIPTION}</p>

            {/* all four beats share one grid cell: the cell is as tall as the
                longest beat, so the crossfade never shifts layout */}
            <ol className="mt-5 grid min-h-0 lg:col-start-2 lg:row-start-2 lg:mt-0">
              {BEATS.map((b, i) => (
                <Beat key={b.title} beat={b} index={i} />
              ))}
            </ol>

            <FooterChip className="mt-auto pt-4 lg:col-start-2 lg:row-start-3 lg:mt-0 lg:self-end" />
          </div>
        </div>
      </div>
    </section>
  );
}
