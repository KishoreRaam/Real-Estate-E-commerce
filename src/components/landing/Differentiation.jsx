import { motion } from "framer-motion";

/* Honest positioning, not a superlative. Kaani doesn't compete with
 * record-lookup tools (they answer "is this document real") and it isn't a
 * listing site (they answer "what's for sale") — it answers a third
 * question neither does: "where exactly are the boundaries, inside the
 * actual approved layout." No "first/only/best" language here — we haven't
 * verified those claims, so we don't make them.
 *
 * Each card is a labelled two-row comparison ("What they do" / "What Kaani
 * does instead") rather than a paragraph-plus-bullet — a reader shouldn't
 * have to infer from formatting alone which line is the competitor and
 * which is the punchline. The Kaani row also carries the section's one
 * dose of brick: the same "this is the confirmed answer" language the rest
 * of the site already uses for verified state. */
const CATEGORIES = [
  {
    kind: "Record-lookup tools",
    examples: "TNREGINET, Landeed, LegiScore, Zona",
    icon: (
      <>
        <circle cx="10" cy="10" r="6.5" />
        <path d="M14.7 14.7 L20.5 20.5" strokeLinecap="round" />
      </>
    ),
    does: "They check whether a document is genuine — encumbrance, patta, title chain.",
    not: "Kaani doesn't verify title. If you need that check, start there — we're not a substitute for it.",
  },
  {
    kind: "Land-listing sites",
    examples: "Housing.com, 99acres, MagicBricks, Sulekha, local classifieds",
    icon: (
      <>
        <rect x="3" y="4.5" width="18" height="14" rx="1" />
        <circle cx="8.3" cy="9.5" r="1.5" />
        <path d="M3 15.5 L8.2 10.7 a1.2 1.2 0 0 1 1.7 0.05 L15 16 M13.5 16 L17.7 12.1 a1.2 1.2 0 0 1 1.7 0.05 L21 14.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    does: "They show photos and a written description of a plot for sale.",
    not: "Kaani shows the plot's actual boundary, clickable, sitting inside the real DTCP-approved layout — click the shape instead of reading about it.",
  },
];

/* A small irregular quadrilateral with a hit point — the same visual
 * grammar PlotOverlay uses for a plot boundary, so the "click the shape"
 * claim is illustrated with the shape itself rather than only described. */
function BoundaryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <polygon points="5,17 8,4 19,7 16,20" stroke="var(--color-brick-lit)" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12.5" cy="12" r="1.6" fill="var(--color-brick-lit)" />
    </svg>
  );
}

export default function Differentiation() {
  return (
    <section id="compare" className="relative scroll-mt-24 bg-paper bg-survey-grid">
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-brick-lit">Where Kaani fits</p>
          <h2
            className="mt-4 font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            Two different jobs. Kaani does neither of them.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-graphite/85">
            Two kinds of sites already exist in this space, and Kaani isn&rsquo;t trying to
            replace either. Here&rsquo;s the actual difference, mechanism by mechanism.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden border border-graphite/16 bg-graphite/10 md:grid-cols-2" style={{ borderRadius: "4px" }}>
          {CATEGORIES.map((c, i) => (
            <motion.div
              key={c.kind}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col bg-paper p-7"
            >
              {/* category header */}
              <div className="flex items-start gap-3">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-graphite/70"
                  aria-hidden="true"
                >
                  {c.icon}
                </svg>
                <div>
                  <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.6rem" }}>
                    {c.kind}
                  </span>
                  <p className="mt-1.5 u-fact text-[0.76rem] text-graphite/80">{c.examples}</p>
                </div>
              </div>

              {/* row 1 — what the competitor does, deliberately quieter */}
              <div className="mt-6 border-t border-graphite/14 pt-5">
                <span className="u-eyebrow text-graphite/80" style={{ fontSize: "0.56rem" }}>
                  What they do
                </span>
                <p className="mt-2 text-[0.92rem] leading-relaxed text-graphite/80">{c.does}</p>
              </div>

              {/* row 2 — the punchline, carrying the section's brick accent */}
              <div className="relative mt-5 flex-1 border-t border-graphite/14 py-5 pl-4">
                <span aria-hidden="true" className="absolute inset-y-0 left-0 top-5 w-0.5 bg-brick" />
                <span className="inline-flex items-center gap-1.5 u-eyebrow text-brick-lit" style={{ fontSize: "0.56rem" }}>
                  <BoundaryIcon />
                  What Kaani does instead
                </span>
                <p className="mt-2 text-[1.02rem] font-medium leading-relaxed text-graphite">{c.not}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
