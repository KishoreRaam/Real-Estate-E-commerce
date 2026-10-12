import { MAX_COMPARE } from "./usePlotMapState";

/* Side-by-side plot comparison. The "best" marks are arithmetic (largest area,
 * lowest rate, widest road) — not advice — and use ink, never brick, because
 * brick only ever means verified. */
const ROWS = [
  { key: "status", label: "Status", render: (p) => (p.status === "verified" ? "◈ Verified" : "Pending") },
  { key: "area", label: "Area", render: (p) => `${p.areaSqft.toLocaleString("en-IN")} sq ft`, best: (ps) => Math.max(...ps.map((p) => p.areaSqft)), value: (p) => p.areaSqft },
  { key: "dim", label: "Dimensions", render: (p) => p.dimensions },
  { key: "facing", label: "Facing", render: (p) => p.facing },
  { key: "road", label: "Road width", render: (p) => `${p.roadFt} ft`, best: (ps) => Math.max(...ps.map((p) => p.roadFt)), value: (p) => p.roadFt },
  { key: "pps", label: "₹ / sq ft", render: (p) => `₹${p.pricePerSqft.toLocaleString("en-IN")}`, best: (ps) => Math.min(...ps.map((p) => p.pricePerSqft)), value: (p) => p.pricePerSqft },
  { key: "price", label: "Guide price", render: (p) => p.guidePrice },
  { key: "survey", label: "Survey no.", render: (p) => p.survey },
];

export default function PlotCompare({ plots, onRemove, onClear, onSelect, selectedId, className = "" }) {
  const many = plots.length > 1;
  return (
    <section aria-label="Plot comparison" className={`border border-graphite/15 bg-paper ${className}`} style={{ borderRadius: 3 }}>
      <div className="flex items-center justify-between gap-3 border-b border-graphite/12 px-4 py-2.5">
        <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
          Compare · {plots.length} of {MAX_COMPARE}
        </p>
        <button type="button" onClick={onClear} className="u-fact text-[0.7rem] text-graphite/84 underline underline-offset-2 hover:text-graphite">
          Clear
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="w-28 px-4 py-2.5" />
              {plots.map((p) => (
                <th key={p.id} scope="col" className="border-l border-graphite/10 px-4 py-2.5 align-top">
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelect(p)}
                      aria-pressed={p.id === selectedId}
                      className="font-display text-lg font-extrabold leading-none text-graphite hover:underline"
                    >
                      Plot {String(p.no).padStart(2, "0")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(p.id)}
                      aria-label={`Remove plot ${p.no} from comparison`}
                      className="u-fact px-1 text-[0.8rem] leading-none text-graphite/84 hover:text-graphite"
                    >
                      ×
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              // no "best" when every plot ties — that would mark them all
              const tied = row.value && plots.every((p) => row.value(p) === row.value(plots[0]));
              const best = many && row.best && !tied ? row.best(plots) : null;
              return (
                <tr key={row.key} className="border-t border-graphite/8">
                  <th scope="row" className="px-4 py-2 u-eyebrow font-medium text-graphite/84" style={{ fontSize: "0.52rem" }}>
                    {row.label}
                  </th>
                  {plots.map((p) => {
                    const isBest = best !== null && row.value(p) === best;
                    return (
                      <td
                        key={p.id}
                        className={
                          "border-l border-graphite/10 px-4 py-2 u-fact text-[0.78rem] " +
                          (row.key === "status" && p.status === "verified" ? "text-brick-lit" : "text-graphite")
                        }
                      >
                        {row.render(p)}
                        {isBest && <span className="ml-1.5 text-[0.62rem] font-semibold text-ink">▲ best</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {plots.length < 2 && (
        <p className="border-t border-graphite/12 px-4 py-2 u-fact text-[0.68rem] text-graphite/84">
          Select another plot and add it to compare side by side.
        </p>
      )}
    </section>
  );
}
