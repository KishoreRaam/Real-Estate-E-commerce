import VerifiedStamp from "./VerifiedStamp";
import TypeIn from "./TypeIn";

function Fact({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>
        {label}
      </span>
      <span className="u-fact text-[0.95rem] text-graphite">{value}</span>
    </div>
  );
}

/* The record behind a plot — reused in the hero and the detail view.
 * `typing` runs the reveal treatment (hero only). */
export default function PlotRecordCard({ plot, layout, typing = false, className = "" }) {
  if (!plot) return null;
  const area = plot.areaSqft.toLocaleString("en-IN");

  return (
    <div
      className={`border border-graphite/15 bg-champagne/90 backdrop-blur-sm ${className}`}
      style={{ borderRadius: "3px" }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-graphite/12 px-5 py-3.5">
        <div className="flex flex-col">
          <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>
            Plot
          </span>
          <span className="font-display text-2xl font-extrabold leading-none text-graphite">
            {String(plot.no).padStart(2, "0")}
          </span>
        </div>
        <VerifiedStamp status={plot.status} animate={typing} />
      </div>

      <div className="px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-extrabold text-graphite">
            <TypeIn text={area} start={typing} delay={1900} caret={typing} />
          </span>
          <span className="u-fact text-sm text-graphite/84">sq ft</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Fact label="Dimensions" value={plot.dimensions} />
          <Fact label="Facing" value={plot.facing} />
          <Fact label="Road width" value={`${plot.roadFt} ft`} />
          <Fact label="Survey no." value={plot.survey} />
          <Fact label="Guide price" value={plot.guidePrice} />
          <Fact label="₹ / sq ft" value={`₹${plot.pricePerSqft.toLocaleString("en-IN")}`} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-graphite/12 px-5 py-3">
        <span className="u-fact text-[0.7rem] text-graphite/84">{layout?.dtcp}</span>
        <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.55rem" }}>
          {layout?.name}
        </span>
      </div>
    </div>
  );
}
