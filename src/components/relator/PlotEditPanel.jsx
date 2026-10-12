import VerifiedStamp from "../shared/VerifiedStamp";
import Button from "../shared/Button";

const TIER_COPY = {
  high: {
    label: "Trace looks clean",
    body: "This boundary came through clearly. Check it if you like — you don't have to.",
  },
  review: {
    label: "Worth a look",
    body: "Part of this boundary was faint on the sheet. Check the numbers against your copy.",
  },
  low: {
    label: "Trace is unreliable",
    body: "Kaani couldn't read this boundary properly. Correct the measurements before publishing.",
  },
};

function Field({ label, value, onChange, suffix, id, inputMode = "numeric" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          value={value}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-graphite/20 bg-paper px-2.5 py-2 u-fact text-sm text-graphite transition-colors focus:border-graphite/60"
          style={{ borderRadius: "2px" }}
        />
        {suffix && <span className="u-fact text-xs text-graphite/84">{suffix}</span>}
      </div>
    </div>
  );
}

/* Printed-vs-drawn dimension check. RELATOR VIEW ONLY — buyers never see
 * it (PlotRecordCard doesn't read the field). Neutral by design: it's a
 * prompt to compare against the sheet, not a judgement on the plot, so the
 * copy never says invalid / wrong / fraud / illegal, and it uses the
 * "action" stamp's graphite + glyph, never brick. */
function DimensionNote({ plot }) {
  if (plot.dimension_check === "mismatch") {
    const pct = Number.isFinite(plot.dimension_delta_pct) ? ` (${plot.dimension_delta_pct.toFixed(1)}%)` : "";
    return (
      <div className="border-b border-graphite/12 px-5 py-3.5">
        <p className="flex items-start gap-2 border border-graphite/45 bg-paper px-3 py-2.5" style={{ borderRadius: "2px" }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="mt-1 shrink-0 text-graphite">
            <circle cx="6" cy="6" r="5.2" fill="none" stroke="currentColor" strokeWidth="1.1" />
            <path d="M6 3.2 V6.6 M6 8.7 V8.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span className="flex flex-col gap-1">
            <span className="text-sm text-graphite">
              Printed dimensions differ from drawn shape<span className="u-fact">{pct}</span>
            </span>
            <span className="text-[0.82rem] leading-relaxed text-graphite/84">
              Compare the boundary lengths below with your copy of the sheet before confirming.
            </span>
          </span>
        </p>
      </div>
    );
  }
  if (plot.dimension_check === "unreadable") {
    return (
      <p className="border-b border-graphite/12 px-5 py-2.5 u-fact text-[0.68rem] text-graphite/80">
        Printed dimensions couldn&rsquo;t be read on the sketch for this plot.
      </p>
    );
  }
  return null;
}

export default function PlotEditPanel({ plot, draft, confirmed, onChange, onConfirm, onUnconfirm, sampleInsights = false }) {
  if (!plot) {
    return (
      <div
        className="flex h-full min-h-[300px] flex-col items-center justify-center border border-dashed border-graphite/20 px-6 py-12 text-center"
        style={{ borderRadius: "3px" }}
      >
        <p className="font-display text-lg font-bold text-graphite">Pick a plot to check</p>
        <p className="mt-2 max-w-xs text-sm text-graphite/84">
          Click any boundary on the sheet, or work through the flagged list below.
        </p>
      </div>
    );
  }

  const tier = TIER_COPY[plot.tier] ?? TIER_COPY.high;
  const flagged = plot.tier !== "high";
  const area = Number(draft.n || 0) * Number(draft.e || 0);

  return (
    <div className="border border-graphite/15 bg-champagne" style={{ borderRadius: "3px" }}>
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-graphite/12 px-5 py-3.5">
        <div>
          <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
            Editing plot
          </span>
          <div className="font-display text-2xl font-extrabold leading-none text-graphite">
            {String(plot.no).padStart(2, "0")}
          </div>
        </div>
        {confirmed ? (
          <VerifiedStamp status="verified" label="Confirmed" />
        ) : (
          <VerifiedStamp status={flagged ? "action" : "pending"} label={flagged ? "Needs check" : "Unchecked"} />
        )}
      </div>

      {/* confidence read-out */}
      <div className="border-b border-graphite/12 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-sm font-bold text-graphite">{tier.label}</span>
          <span className="u-fact text-[0.7rem] text-graphite/84">
            {Math.round(plot.confidence * 100)}% match
          </span>
        </div>
        {/* confidence as a measured bar, not a colour */}
        <div
          className="mt-2 h-1 w-full overflow-hidden bg-graphite/10"
          style={{ borderRadius: "1px" }}
          aria-hidden="true"
        >
          <span
            className="block h-full"
            style={{
              width: `${plot.confidence * 100}%`,
              background: confirmed ? "var(--color-brick-lit)" : "var(--color-graphite)",
            }}
          />
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-graphite/84">{tier.body}</p>
      </div>

      <DimensionNote plot={plot} />

      {/* fields */}
      <div className="flex flex-col gap-4 px-5 py-4">
        <Field
          id="plot-no"
          label="Plot number"
          value={draft.no}
          onChange={(v) => onChange("no", v)}
        />

        <div>
          <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
            Boundary lengths
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Field id="dim-n" label="North" value={draft.n} onChange={(v) => onChange("n", v)} suffix="ft" />
            <Field id="dim-s" label="South" value={draft.s} onChange={(v) => onChange("s", v)} suffix="ft" />
            <Field id="dim-e" label="East" value={draft.e} onChange={(v) => onChange("e", v)} suffix="ft" />
            <Field id="dim-w" label="West" value={draft.w} onChange={(v) => onChange("w", v)} suffix="ft" />
          </div>
          <p className="mt-2 u-fact text-[0.68rem] text-graphite/84">
            Works out to {area ? area.toLocaleString("en-IN") : "—"} sq ft
          </p>
        </div>

        <Field
          id="plot-price"
          label="Price per sq ft"
          value={draft.price}
          onChange={(v) => onChange("price", v)}
          suffix="₹"
        />
      </div>

      {sampleInsights && (
        <p className="border-b border-dashed border-graphite/15 px-5 py-2 u-fact text-[0.62rem] text-graphite/72">
          Sample insights — dimension checks are example data until sketch extraction lands.
        </p>
      )}

      {/* confirm */}
      <div className="border-t border-graphite/12 px-5 py-4">
        {confirmed ? (
          <div className="flex flex-col gap-3">
            <p className="u-fact text-[0.7rem] text-graphite/84">
              Confirmed by you. Buyers will see this as a verified boundary.
            </p>
            <Button variant="ghost" onClick={onUnconfirm} className="w-full">
              Undo confirmation
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="u-fact text-[0.7rem] leading-relaxed text-graphite/84">
              {flagged
                ? "Confirming says these measurements match your approved sheet."
                : "Optional — this boundary isn't blocking publication."}
            </p>
            <Button onClick={onConfirm} className="w-full">
              Confirm this boundary
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
