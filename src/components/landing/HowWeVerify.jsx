import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const STEPS = [
  {
    n: "01",
    title: "Sketch sourced",
    body: "We start from the actual DTCP-approved layout on file — not a redraw from memory, not a broker's photocopy.",
    icon: <path d="M4 3h9l4 4v14H4z M13 3v4h4 M8 12h6 M8 16h6" />,
  },
  {
    n: "02",
    title: "Georeferenced",
    body: "Each boundary is placed against the survey grid, so the shape you see is true to the record, not an approximation.",
    icon: <path d="M3 21 L21 3 M6 6l1.5 1.5 M10 6l1.5 1.5 M14 10l1.5 1.5 M10 14l1.5 1.5 M6 18l1.5 1.5" />,
  },
  {
    n: "03",
    title: "Rendered clickable",
    body: "Every plot becomes something you can open, measure, and check against its own survey number.",
    icon: <path d="M5 3 L5 19 L9.3 15.4 L12.3 21 L15 19.6 L12 14 L18 14 Z" strokeLinejoin="round" />,
  },
];

export default function HowWeVerify() {
  const trackRef = useRef(null);
  // tied to actual scroll position through the timeline, not a viewport trigger —
  // the spine fills exactly as far as the user has scrolled, never ahead of them.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.82", "end 0.6"],
  });
  const markerTop = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="verify" className="relative scroll-mt-20 bg-paper bg-survey-grid">
      {/* blend: eases in from the champagne section above instead of cutting hard */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-champagne) 0%, color-mix(in srgb, var(--color-champagne) 45%, transparent) 55%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <div className="max-w-xl lg:sticky lg:top-28">
            <p className="u-eyebrow text-brick-lit">How we verify</p>
            <h2
              className="mt-4 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              From a filed sketch to a plot you can click.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-graphite/85">
              Three checks, run in order, before a plot ever goes live. Scroll down — the line
              traces the same sequence the plot itself goes through.
            </p>
          </div>

          <ol ref={trackRef} className="relative mt-16 flex flex-col lg:mt-0">
          {/* track: the full-length rule, always present */}
          <div aria-hidden="true" className="absolute left-6 top-6 bottom-6 w-px bg-graphite/15" />
          {/* spine fill: grows exactly with scroll position, not a pre-triggered animation */}
          <motion.div
            aria-hidden="true"
            className="absolute left-6 top-6 bottom-6 w-px origin-top"
            style={{
              scaleY: scrollYProgress,
              backgroundImage:
                "linear-gradient(to bottom, var(--color-brick), color-mix(in srgb, var(--color-brick) 25%, var(--color-graphite)))",
            }}
          />
          {/* the arrow riding down the spine, in step with the user's own scroll */}
          <motion.span
            aria-hidden="true"
            className="absolute left-6 z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ top: markerTop }}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full bg-brick text-paper shadow-[0_0_0_5px_var(--color-paper)]"
            >
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M5 1 V9 M5 9 L2 6 M5 9 L8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </motion.span>

          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative z-10 flex gap-6 pb-14 last:pb-0"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-brick bg-paper font-mono text-[0.9rem] font-bold text-brick-lit shadow-[0_2px_6px_-2px_rgba(70,70,70,0.25)]"
                style={{ borderRadius: "999px" }}
              >
                {s.n}
              </span>

              <div className="pt-1.5">
                <div className="flex items-center gap-3">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brick-lit"
                    aria-hidden="true"
                  >
                    {s.icon}
                  </svg>
                  <h3 className="font-display text-xl font-bold text-graphite">{s.title}</h3>
                </div>
                <p className="mt-3 max-w-md text-[1.02rem] leading-relaxed text-graphite/88">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}
