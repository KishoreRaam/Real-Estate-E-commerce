import VerifiedStamp from "./VerifiedStamp";
import TypeIn from "./TypeIn";

/* A survey drawing's title block — the record docked to the bottom of the sheet,
 * horizontal so it never occludes the plots. Same data as PlotRecordCard, laid
 * out as a strip. `typing` runs the hero reveal treatment. */
function Cell({ label, value, className = "" }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 px-4 py-2.5 ${className}`}>
      <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
        {label}
      </span>
      <span className="u-fact truncate text-[0.9rem] text-graphite">{value}</span>
    </div>
  );
}

export default function PlotTitleBlock({ plot, layout, typing = false }) {
  if (!plot) return null;
  const area = plot.areaSqft.toLocaleString("en-IN");

  return (
    <div className="mt-3 border border-graphite/15 bg-champagne/80" style={{ borderRadius: "3px" }}>
      <div className="flex flex-wrap items-stretch divide-x divide-graphite/12">
        {/* identity */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="flex flex-col">
            <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
              Plot
            </span>
            <span className="font-display text-xl font-extrabold leading-none text-graphite">
              {String(plot.no).padStart(2, "0")}
            </span>
          </div>
          <VerifiedStamp status={plot.status} animate={typing} />
        </div>

        {/* headline area */}
        <div className="flex items-center px-4 py-2.5">
          <span className="font-display text-2xl font-extrabold leading-none text-graphite">
            <TypeIn text={area} start={typing} delay={1600} caret={typing} />
          </span>
          <span className="u-fact ml-1.5 text-xs text-graphite/84">sq ft</span>
        </div>

        <Cell label="Dimensions" value={plot.dimensions} />
        <Cell label="Facing" value={plot.facing} />
        <Cell label="Survey no." value={plot.survey} className="hidden sm:flex" />
        <Cell label="Guide price" value={plot.guidePrice} className="hidden md:flex lg:flex" />
      </div>

      <div className="flex items-center justify-between border-t border-graphite/12 px-4 py-2">
        <span className="u-fact text-[0.66rem] text-graphite/84">{layout?.dtcp}</span>
        <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.52rem" }}>
          {layout?.name} · {layout?.place}
        </span>
      </div>
    </div>
  );
}
