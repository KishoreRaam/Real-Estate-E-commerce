import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../shared/Button";
import PlotMapExplorer from "../map/PlotMapExplorer";
import usePlotMapState from "../map/usePlotMapState";
import { layout } from "../shared/plotData";

/* Landing teaser for the 3D explorer. The canvas (and the three.js chunk)
 * only mounts once the section is near the viewport, and its idle motion
 * pauses whenever it scrolls out of view. */
export default function Town3DPreview() {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const map = usePlotMapState(layout, { initialSelectedId: layout.featuredId });

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const height = "clamp(340px, 56vh, 560px)";

  return (
    <section id="explore-3d" className="relative scroll-mt-24 bg-paper bg-survey-grid">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p className="u-eyebrow text-brick-lit">New · Illustrative 3D</p>
            <h2
              className="mt-4 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              Walk the layout before you visit it.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-graphite/85">
              The same traced plots, raised into a neighbourhood. Hover any plot to read its facts,
              then open the explorer to filter and compare plots side by side.
            </p>
          </div>
          <Button as={Link} to={`/plots/${layout.id}/3d`} arrow className="self-start lg:self-end">
            Open the 3D explorer
          </Button>
        </div>

        <div ref={ref} className="mt-10">
          {near ? (
            <PlotMapExplorer layout={layout} map={map} initialView="3d" variant="preview" height={height} paused={!visible} />
          ) : (
            <div className="border border-graphite/15 bg-paper-2" style={{ height, borderRadius: 3 }} />
          )}
        </div>
      </div>
    </section>
  );
}
