import { motion } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Sketch sourced",
    body: "We start from the actual DTCP-approved layout on file — not a redraw from memory, not a broker's photocopy.",
  },
  {
    n: "02",
    title: "Georeferenced",
    body: "Each boundary is placed against the survey grid, so the shape you see is true to the record, not an approximation.",
  },
  {
    n: "03",
    title: "Rendered clickable",
    body: "Every plot becomes something you can open, measure, and check against its own survey number.",
  },
];

export default function HowWeVerify() {
  return (
    <section id="verify" className="scroll-mt-20 bg-paper bg-survey-grid">
      <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-brick-lit">How we verify</p>
          <h2
            className="mt-4 font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            From a filed sketch to a plot you can click.
          </h2>
        </div>

        <ol className="mt-16 grid gap-y-12 sm:grid-cols-3 sm:gap-x-10">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              className="relative"
            >
              {/* connector line with a survey node — a real sequence, so it's drawn */}
              <div aria-hidden="true" className="mb-6 flex items-center">
                <span className="h-2.5 w-2.5 shrink-0 rotate-45 border border-brick" />
                <span className="h-px flex-1 bg-graphite/15" style={{ backgroundImage: "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-graphite) 24%, transparent) 0 4px, transparent 4px 10px)", backgroundColor: "transparent" }} />
              </div>
              <div className="flex items-baseline gap-4">
                <span className="font-display text-5xl font-extrabold leading-none text-graphite/84">{s.n}</span>
                <h3 className="font-display text-xl font-bold text-graphite">{s.title}</h3>
              </div>
              <p className="mt-4 max-w-sm text-[1.02rem] leading-relaxed text-graphite/80">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
