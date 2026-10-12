import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Nav from "./Nav";
import Hero from "./Hero";
import Differentiation from "./Differentiation";
import PaperTrail from "./PaperTrail";
import HowWeVerify from "./HowWeVerify";
import Agents from "./Agents";
import FAQ from "./FAQ";
import Footer from "./Footer";
import StaticDroneSurvey from "./DroneSurveyStage";

// Heaviest section on the page (a full PlotOverlay + sample layout) — split
// into its own chunk so the hero paints before this ships to the client.
const LiveDemo = lazy(() => import("./LiveDemo"));
// Scroll-scrubbed drone story (pulls in GSAP + ScrollTrigger + MotionPath,
// ~58 KB gz). The static final frame ships in the main bundle and renders
// immediately; the animated version is an upgrade — see DroneSurveySlot.
let droneSurveyChunk;
const loadDroneSurvey = () => (droneSurveyChunk ??= import("./DroneSurvey"));
const DroneSurvey = lazy(loadDroneSurvey);

/* On wide screens, the centered 1440px column leaves the flanks bare. Every
 * section already paints its own bg-survey-grid edge-to-edge (sections have
 * no max-width of their own — only their inner content div does), so the
 * gutter already carries the page's texture; drawing a second, differently
 * spaced grid on top of it was what created a visible seam. All this needs
 * to add is the ruled "sheet edge" line marking where the content column
 * starts — one thin rule, not a competing pattern — so it blends into
 * whatever section/background is currently underneath instead of fighting
 * it. Width tracks the actual leftover gutter (100vw minus the content
 * column, halved) so the line always lands exactly at the column's edge. */
function EdgeRuler({ side }) {
  const edge = side === "left" ? "borderRight" : "borderLeft";
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-y-0 ${side}-0 z-30 hidden md:block`}
      style={{
        width: "max(0px, calc((100vw - 1440px) / 2))",
        [edge]: "1px solid color-mix(in srgb, var(--color-graphite) 14%, transparent)",
      }}
    />
  );
}

// Kept minimal on purpose: same background/rhythm as the section it's
// standing in for, so the lazy-load swap doesn't read as a layout jolt.
function LiveDemoFallback() {
  return (
    <section className="relative bg-paper bg-survey-grid">
      <div className="mx-auto flex min-h-[520px] max-w-[1440px] items-center justify-center px-5 py-20 sm:px-8">
        <p className="u-fact text-[0.72rem] text-graphite/84">Loading the live plot map…</p>
      </div>
    </section>
  );
}

/* Progressive enhancement, never a blank gap: the static section (final
 * frame + all four beats as text) is what renders first. The GSAP chunk is
 * fetched when the browser is idle or the reader gets within ~1.5 screens,
 * and the pinned version is swapped in only if the section is still entirely
 * BELOW the viewport at that moment. The two versions differ in height by
 * a few screens; swapping while the reader is in or past the section would
 * jump the page (Safari has no scroll anchoring to absorb it), so in that
 * case — slow network, deep link, fast scroller — the static one just stays.
 * Reduced motion never loads the chunk at all. */
function DroneSurveySlot() {
  const ref = useRef(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let done = false;
    const upgrade = () => {
      if (done) return;
      done = true;
      loadDroneSurvey().then(
        () => {
          const el = ref.current;
          if (el && el.getBoundingClientRect().top > window.innerHeight) setAnimated(true);
        },
        () => {}, // chunk failed (offline, deploy swap): static version stays
      );
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(upgrade, { timeout: 2500 })
      : window.setTimeout(upgrade, 1200);

    let io;
    if (typeof IntersectionObserver !== "undefined" && ref.current) {
      io = new IntersectionObserver(([e]) => e.isIntersecting && upgrade(), { rootMargin: "150% 0px" });
      io.observe(ref.current);
    }

    return () => {
      done = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      io?.disconnect();
    };
  }, []);

  return (
    <div ref={ref}>
      {animated ? (
        <Suspense fallback={<StaticDroneSurvey />}>
          <DroneSurvey />
        </Suspense>
      ) : (
        <StaticDroneSurvey />
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <EdgeRuler side="left" />
      <EdgeRuler side="right" />
      <Nav />
      <main>
        <Hero />
        <Differentiation />
        <DroneSurveySlot />
        <PaperTrail />
        <HowWeVerify />
        <Suspense fallback={<LiveDemoFallback />}>
          <LiveDemo />
        </Suspense>
        <Agents />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
