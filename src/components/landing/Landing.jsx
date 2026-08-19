import Nav from "./Nav";
import Hero from "./Hero";
import PaperTrail from "./PaperTrail";
import HowWeVerify from "./HowWeVerify";
import Agents from "./Agents";
import Footer from "./Footer";

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

export default function Landing() {
  return (
    <>
      <EdgeRuler side="left" />
      <EdgeRuler side="right" />
      <Nav />
      <main>
        <Hero />
        <PaperTrail />
        <HowWeVerify />
        <Agents />
      </main>
      <Footer />
    </>
  );
}
