import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PlotOverlay from "../shared/PlotOverlay";
import PlotTitleBlock from "../shared/PlotTitleBlock";
import CoordFrame from "../shared/CoordFrame";
import Button from "../shared/Button";
import { vadasithurLayout } from "../shared/plotData";

/* The one non-hero, fully-interactive embed of PlotOverlay on the landing
 * page — same component, `mode="detail"` instead of `"hero"`, so there's no
 * reveal choreography, just a plot map you can click right now. Uses the
 * real-aerial-photo sample layout (Vadasithur Fields) rather than Hero's
 * layout, so this doesn't just repeat what's already above the fold. */
export default function LiveDemo() {
  const layout = vadasithurLayout;
  const [selectedId, setSelectedId] = useState(null);

  const activePlot = useMemo(
    () => layout.plots.find((p) => p.id === (selectedId ?? layout.featuredId)),
    [layout, selectedId],
  );

  return (
    <section id="live-demo" className="relative scroll-mt-24 bg-paper bg-survey-grid">
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-brick-lit">Try it</p>
          <h2
            className="mt-4 font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            This is the actual component. Click a plot.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-graphite/85">
            No screenshot — this is the same map every buyer sees on a live layout. Boundaries
            below are hand-traced against a real aerial photo of {layout.place}.
          </p>
        </div>

        <div className="relative mt-12">
          <CoordFrame>
            <PlotOverlay
              mode="detail"
              layout={layout}
              selectedId={selectedId}
              onSelect={(p) => setSelectedId(p.id)}
              className="p-2"
            />
          </CoordFrame>

          <div className="mt-3">
            <PlotTitleBlock plot={activePlot} layout={layout} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button as={Link} to="/plots" arrow>
            Browse live layouts
          </Button>
          <span className="u-fact text-[0.68rem] text-graphite/84">
            Sample layout — trace is a demo, not a licensed survey
          </span>
        </div>
      </div>
    </section>
  );
}
