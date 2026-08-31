import { motion, useReducedMotion } from "framer-motion";
import PlotOverlay from "../shared/PlotOverlay";
import CoordFrame from "../shared/CoordFrame";
import { layout } from "../shared/plotData";

/* The land-visualization anchor for the auth pages. Reuses the same
 * procedural, already-animated aerial terrain (PlotOverlay + SatelliteTerrain)
 * that Hero.jsx uses for the landing sheet — no new animation system, just a
 * second place this one gets composed.
 *
 * compact = the mobile treatment: a short cropped band above the form
 * instead of a full side column, with a cheaper terrain detail level. */
export default function AuthSidePanel({ compact = false }) {
  const reduce = useReducedMotion();

  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] },
        };

  if (compact) {
    return (
      <div className="h-40 w-full overflow-hidden border-b border-graphite/15 sm:h-48" aria-hidden="true">
        <PlotOverlay layout={layout} mode="browse" terrainDetail="simple" showDimensionLeader={false} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center">
      <motion.p {...rise(0)} className="u-eyebrow text-brick-lit">
        DTCP-Approved Layouts · Coimbatore
      </motion.p>
      <motion.h2
        {...rise(0.08)}
        className="mt-4 font-display font-extrabold text-graphite"
        style={{ fontSize: "clamp(1.7rem, 2.6vw, 2.3rem)", lineHeight: 1.06, letterSpacing: "-0.02em" }}
      >
        This is the land<br />you&rsquo;re signing up to see.
      </motion.h2>
      <motion.p {...rise(0.16)} className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-graphite/80">
        Every plot here is measured, matched to its survey number, and checked before it&rsquo;s
        called verified — not a broker&rsquo;s photocopy.
      </motion.p>

      <motion.div {...rise(0.24)} className="mt-6" aria-hidden="true">
        <CoordFrame>
          <PlotOverlay layout={layout} mode="browse" terrainDetail="full" showDimensionLeader={false} />
        </CoordFrame>
      </motion.div>
      <p className="mt-3 u-fact text-[0.72rem] text-graphite/84">
        {layout.name} · {layout.place} · Scale {layout.scale}
      </p>
    </div>
  );
}
