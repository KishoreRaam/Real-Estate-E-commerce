import VerifiedStamp from "./VerifiedStamp";
import TypeIn from "./TypeIn";
import { facingFact, facingWord } from "./plotInsights";

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

/* Neutral chip — the PaperTrail "source" chip, never brick (brick = verified). */
function Chip({ children, muted = false }) {
  return (
    <span
      className={
        "inline-flex items-center border px-2 py-1 u-fact text-[0.64rem] " +
        (muted ? "border-dashed border-concrete/70 text-graphite/72" : "border-concrete/70 text-graphite/90")
      }
      style={{ borderRadius: "2px", letterSpacing: "0.04em" }}
    >
      {children}
    </span>
  );
}

/* Facts read off the sketch. Each chip is driven by its own field and only
 * renders when that field is present — a plot extraction never reached has
 * none of them, and gets no chips at all. Text always carries the meaning;
 * the border style is decoration. Printed-vs-drawn dimension checks are
 * deliberately NOT read here: they're relator-only (PlotEditPanel). */
function InsightChips({ plot }) {
  const chips = [];
  if (plot.facing === null) {
    chips.push(
      <Chip key="facing" muted>
        Orientation not on sketch
      </Chip>,
    );
  } else if (facingWord(plot.facing)) {
    chips.push(<Chip key="facing">{facingWord(plot.facing)}-facing</Chip>);
  }
  if (plot.is_corner === true) chips.push(<Chip key="corner">Corner plot</Chip>);
  if (Number.isInteger(plot.road_edge_count) && plot.road_edge_count > 0) {
    chips.push(
      <Chip key="roads">
        {plot.road_edge_count} road side{plot.road_edge_count === 1 ? "" : "s"}
      </Chip>,
    );
  }
  if (!chips.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="From the sketch">
      {chips.map((c) => (
        <li key={c.key}>{c}</li>
      ))}
    </ul>
  );
}

/* The record behind a plot — reused in the hero and the detail view.
 * `typing` runs the reveal treatment (hero only). */
export default function PlotRecordCard({ plot, layout, typing = false, sampleInsights = false, className = "" }) {
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

        <InsightChips plot={plot} />

        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
          <Fact label="Dimensions" value={plot.dimensions} />
          <Fact label="Facing" value={facingFact(plot)} />
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
      {/* while insights are mocked, say so on the panel itself */}
      {sampleInsights && (
        <p className="border-t border-dashed border-graphite/15 px-5 py-2 u-fact text-[0.62rem] text-graphite/72">
          Sample insights — facing, corner and road sides are example data, not yet read from the sketch.
        </p>
      )}
    </div>
  );
}
