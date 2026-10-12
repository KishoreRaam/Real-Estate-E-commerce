import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import StaticDroneSurvey, { Beat, FooterChip, Header, SurveyStage } from "./DroneSurveyStage";
import {
  BEATS,
  FLIGHT_D,
  FLIGHT_DUR,
  FLIGHT_START,
  FOOT_HALF_W,
  LEN,
  PLOTS,
  SR_DESCRIPTION,
  STRIPS,
  TILE,
  tAt,
  tPass3X,
  useStageId,
} from "./droneSurveyData";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

/* Drone Survey — the pinned, scroll-scrubbed version. Geometry and markup
 * live in DroneSurveyStage.jsx (which also serves as the static fallback);
 * this file only adds the GSAP timeline on top of the same final frame. */

export default function DroneSurvey() {
  const reduce = useReducedMotion();
  const uid = useStageId();
  const sectionRef = useRef(null);
  const frameRef = useRef(null);

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
        isDesktop: "(min-width: 1024px) and (orientation: landscape)",
        isMobile: "not all and (min-width: 1024px) and (orientation: landscape)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      (ctx) => {
        const { isDesktop, reduce: reduceNow } = ctx.conditions;
        if (reduceNow) return; // React swaps to the static layout on the next render

        const pinTarget = frameRef.current;
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

  if (reduce) return <StaticDroneSurvey />;

  /* One pinned frame, exactly the viewport under the Nav. Its content is a
   * single centred group sized by content, not stretched to fill: extra
   * height on tall screens becomes even margin above and below the group
   * instead of gaps opening up between stage, copy and chip.
   *
   * Mobile: header → stage → beats → chip, stacked. On phones shorter than
   * 760px the headline would push the beats off-screen, so there it's
   * rendered once above the pinned frame instead (display:none on the other
   * copy keeps exactly one h2 in the accessibility tree).
   * Wide landscape (≥1024px): stage left (60%), header / beats / chip right
   * (40%). Portrait screens of any width use the stacked layout. */
  return (
    <section id="drone-survey" ref={sectionRef} className="relative bg-paper bg-survey-grid" style={{ "--nav-h": "76px" }}>
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <Header className="max-w-2xl pt-16 wide:hidden [@media(min-height:760px)]:hidden" />

        <div
          ref={frameRef}
          className="flex h-[calc(100svh_-_var(--nav-h))] flex-col justify-center gap-5 py-5 wide:grid wide:grid-cols-[3fr_2fr] wide:grid-rows-[1fr_auto_auto_auto_1fr] wide:gap-x-14 wide:gap-y-0 wide:py-10"
        >
          <Header className="hidden max-w-2xl wide:col-start-2 wide:row-start-2 wide:block wide:pb-8 [@media(min-height:760px)]:block" />

          <div
            aria-hidden="true"
            className="aspect-[8/5] max-h-[42svh] w-full shrink-0 wide:col-start-1 wide:row-span-full wide:aspect-auto wide:h-full wide:max-h-[min(100%,620px)] wide:self-center"
          >
            <SurveyStage uid={uid} />
          </div>
          <p className="sr-only">{SR_DESCRIPTION}</p>

          {/* all four beats share one grid cell: the cell is as tall as the
              longest beat, so the crossfade never shifts layout */}
          <ol className="grid wide:col-start-2 wide:row-start-3">
            {BEATS.map((b, i) => (
              <Beat key={b.title} beat={b} index={i} />
            ))}
          </ol>

          <FooterChip className="wide:col-start-2 wide:row-start-4 wide:pt-8" />
        </div>
      </div>
    </section>
  );
}
