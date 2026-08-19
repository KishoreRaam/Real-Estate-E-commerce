import { lazy, Suspense } from "react";
import Nav from "./Nav";
import Hero from "./Hero";
import Differentiation from "./Differentiation";
import PaperTrail from "./PaperTrail";
import HowWeVerify from "./HowWeVerify";
import Agents from "./Agents";
import FAQ from "./FAQ";
import Footer from "./Footer";

// Heaviest section on the page (a full PlotOverlay + sample layout) — split
// into its own chunk so the hero paints before this ships to the client.
const LiveDemo = lazy(() => import("./LiveDemo"));

/* On very wide screens, the centered 1180px column leaves the flanks bare.
 * Rather than leave them empty, they carry the same tick-ruler language used
 * at the top of Nav — the page reads as one continuous drafting sheet. */
function EdgeRuler({ side }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-y-0 ${side}-0 z-30 hidden w-3 2xl:block`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(180deg, color-mix(in srgb, var(--color-graphite) 22%, transparent) 0 1px, transparent 1px 24px)",
      }}
    />
  );
}

// Kept minimal on purpose: same background/rhythm as the section it's
// standing in for, so the lazy-load swap doesn't read as a layout jolt.
function LiveDemoFallback() {
  return (
    <section className="relative bg-paper bg-survey-grid">
      <div className="mx-auto flex min-h-[520px] max-w-[1180px] items-center justify-center px-5 py-20 sm:px-8">
        <p className="u-fact text-[0.72rem] text-graphite/84">Loading the live plot map…</p>
      </div>
    </section>
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
