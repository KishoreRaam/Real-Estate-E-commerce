import { Link } from "react-router-dom";
import PlotOverlay from "../shared/PlotOverlay";
import { layout, fullLayouts } from "../shared/plotData";

/* Browse card. The thumbnail is the SAME PlotOverlay in "browse" mode —
 * non-interactive, no per-plot hover, so the card itself is the hit target. */
export default function LayoutCard({ item }) {
  const allVerified = item.plotsVerified === item.plotsTotal;
  const cardLayout = fullLayouts[item.id] ?? layout;

  return (
    <Link
      to={`/plots/${item.id}`}
      className="group flex flex-col border border-graphite/15 bg-paper-2 transition-colors hover:border-graphite/35"
      style={{ borderRadius: "3px" }}
    >
      {/* sheet thumbnail */}
      <div className="relative overflow-hidden border-b border-graphite/12 bg-paper px-3 pb-1 pt-3">
        <PlotOverlay layout={cardLayout} mode="browse" showDimensionLeader={false} />
        <span className="pointer-events-none absolute right-3 top-3 u-fact text-[0.6rem] text-graphite/84">
          {cardLayout.scale}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight text-graphite">{item.name}</h3>
            <p className="mt-0.5 text-sm text-graphite/84">{item.place}</p>
          </div>
          <span
            className={
              "shrink-0 border px-2 py-1 u-fact text-[0.6rem] uppercase " +
              (allVerified ? "border-brick/60 text-brick-lit-lit" : "border-concrete/70 text-graphite/84")
            }
            style={{ borderRadius: "2px", letterSpacing: "0.12em" }}
          >
            {allVerified ? "All verified" : `${item.plotsVerified}/${item.plotsTotal}`}
          </span>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 border-t border-graphite/12 pt-3">
          <div>
            <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>Plots</div>
            <div className="u-fact text-sm text-graphite">{item.plotsTotal}</div>
          </div>
          <div>
            <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>From</div>
            <div className="u-fact text-sm text-graphite">
              ₹{item.fromPricePerSqft.toLocaleString("en-IN")}/sq ft
            </div>
          </div>
        </div>

        <span className="u-fact text-[0.64rem] text-graphite/84">{item.dtcp}</span>
      </div>
    </Link>
  );
}
