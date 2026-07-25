import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import PlotOverlay from "../shared/PlotOverlay";
import PlotTitleBlock from "../shared/PlotTitleBlock";
import Button from "../shared/Button";
import { layout } from "../shared/plotData";

function CoordFrame({ children }) {
  // Draughting frame: E ruler on top, N ruler on the left — the sheet Kaani
  // draws on. Decorative, so hidden from assistive tech.
  const ticks = [0, 100, 200, 300, 400];
  return (
    <div className="relative">
      <div aria-hidden="true" className="mb-1 flex justify-between px-6 u-fact text-[0.58rem] text-graphite/84">
        {ticks.map((t) => (
          <span key={t}>E:{t}</span>
        ))}
      </div>
      <div className="flex">
        <div aria-hidden="true" className="mr-1 flex flex-col justify-between py-6 u-fact text-[0.58rem] text-graphite/84">
          {ticks.map((t) => (
            <span key={t}>N:{t}</span>
          ))}
        </div>
        <div className="relative flex-1 border border-graphite/15" style={{ borderRadius: "3px" }}>
          {/* corner crosshair ticks */}
          {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`absolute ${pos} h-2.5 w-2.5 border-graphite/40`}
              style={{
                borderTopWidth: pos.includes("top") ? 1 : 0,
                borderBottomWidth: pos.includes("bottom") ? 1 : 0,
                borderLeftWidth: pos.includes("left") ? 1 : 0,
                borderRightWidth: pos.includes("right") ? 1 : 0,
              }}
            />
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const activePlot = useMemo(
    () => layout.plots.find((p) => p.id === (selectedId ?? layout.featuredId)),
    [selectedId],
  );

  // Copy fades in on mount — decoupled from the plot reveal so the headline is
  // never held blank waiting on the sketch to resolve. Reduced motion = instant.
  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] },
        };

  return (
    <section className="relative overflow-hidden bg-paper bg-survey-grid">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-20">
        {/* ---- copy ---- */}
        <div className="max-w-xl">
          <motion.p {...rise(0)} className="u-eyebrow text-brick-lit">
            DTCP-Approved Layouts · Coimbatore
          </motion.p>

          <motion.h1
            {...rise(0.08)}
            className="mt-5 font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(2.6rem, 6vw, 4.4rem)", lineHeight: 0.98, letterSpacing: "-0.02em" }}
          >
            See the exact shape<br className="hidden sm:block" /> of your land.
          </motion.h1>

          <motion.p {...rise(0.16)} className="mt-6 text-lg leading-relaxed text-graphite/85">
            Buying a plot here still means trusting a broker&rsquo;s word and a photocopied
            sketch. Kaani redraws the approved DTCP layout exactly as it was filed — every
            plot clickable, measured, and matched to its survey number. Check the land before
            you call anyone.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={() => navigate("/plots")} arrow>
              Open a live layout
            </Button>
            <Button as="a" href="#verify" variant="ghost">
              How we verify
            </Button>
          </motion.div>

          <motion.p {...rise(0.32)} className="mt-8 u-fact text-[0.72rem] text-graphite/84">
            {layout.name} · {layout.place} · Scale {layout.scale}
          </motion.p>
        </div>

        {/* ---- the sheet ---- */}
        <div className="relative">
          <p className="mb-3 u-eyebrow text-graphite/84" style={{ fontSize: "0.6rem" }}>
            <span className="text-brick-lit">◈</span> Hover or tap a plot to open its record
          </p>

          <CoordFrame>
            <PlotOverlay
              mode="hero"
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
              className="p-2"
            />
          </CoordFrame>

          {/* record docked below the sheet as a title block — never occludes plots */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <PlotTitleBlock plot={activePlot} layout={layout} typing={selectedId === null} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
