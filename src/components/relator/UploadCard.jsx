import { Link } from "react-router-dom";
import PlotOverlay from "../shared/PlotOverlay";
import VerifiedStamp from "../shared/VerifiedStamp";
import { layout as sampleLayout } from "../shared/plotData";
import { EXTRACTION_LABELS, extractionStamp } from "./relatorData";

/* Tenure split. Luminance carries the reading — sold is solid chalk (gone),
 * reserved is concrete (held), available is the open track. Every band is
 * labelled below, so the bar never has to carry meaning alone. */
function TenureBar({ sold, reserved, available }) {
  const total = sold + reserved + available || 1;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div>
      <div
        className="flex h-1.5 w-full overflow-hidden border border-graphite/15"
        style={{ borderRadius: "1px" }}
        role="img"
        aria-label={`${sold} sold, ${reserved} reserved, ${available} available of ${total} plots`}
      >
        <span style={{ width: pct(sold), background: "var(--color-graphite)" }} />
        <span style={{ width: pct(reserved), background: "var(--color-concrete)" }} />
        <span style={{ width: pct(available), background: "color-mix(in srgb, var(--color-graphite) 10%, transparent)" }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 u-fact text-[0.66rem] text-graphite/84">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-graphite" /> {sold} sold
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 bg-concrete" /> {reserved} reserved
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 border border-graphite/40" /> {available} available
        </span>
      </div>
    </div>
  );
}

export default function UploadCard({ item }) {
  const processing = item.extraction === "processing";
  const needsReview = item.extraction === "needs-review";

  // Where the card takes you depends on what the layout still needs.
  const to = processing
    ? null
    : needsReview
      ? `/relator/layouts/${item.id}/confirm`
      : `/plots/${item.id}`;

  const Wrapper = to ? Link : "div";
  const wrapperProps = to ? { to } : { "aria-disabled": true };

  return (
    <Wrapper
      {...wrapperProps}
      className={
        "group flex flex-col border border-graphite/15 bg-paper-2 transition-colors " +
        (to ? "hover:border-graphite/35" : "opacity-70")
      }
      style={{ borderRadius: "3px" }}
    >
      <div className="relative overflow-hidden border-b border-graphite/12 bg-paper px-3 pb-1 pt-3">
        <PlotOverlay layout={sampleLayout} mode="browse" showDimensionLeader={false} />
        {processing && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper/70">
            <span className="u-eyebrow text-graphite/85" style={{ fontSize: "0.56rem" }}>
              Extracting boundaries…
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold leading-tight text-graphite">{item.name}</h3>
            <p className="mt-0.5 text-sm text-graphite/84">{item.place}</p>
          </div>
          <VerifiedStamp
            status={extractionStamp(item.extraction)}
            label={EXTRACTION_LABELS[item.extraction]}
            className="shrink-0"
          />
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-extrabold leading-none text-graphite">
            {item.plotsTotal}
          </span>
          <span className="u-fact text-xs text-graphite/84">plots</span>
        </div>

        <TenureBar sold={item.sold} reserved={item.reserved} available={item.available} />

        {needsReview && (
          <p className="u-fact text-[0.68rem] text-graphite">
            {item.flagged} {item.flagged === 1 ? "boundary needs" : "boundaries need"} your confirmation
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-graphite/12 pt-3">
          <span className="u-fact text-[0.64rem] text-graphite/84">{item.dtcp}</span>
          <span className="u-fact text-[0.64rem] text-graphite/84">{item.uploadedOn}</span>
        </div>
      </div>
    </Wrapper>
  );
}
