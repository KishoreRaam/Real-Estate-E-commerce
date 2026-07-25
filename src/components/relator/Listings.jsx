import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import Button from "../shared/Button";
import { layout } from "../shared/plotData";
import { uploads } from "./relatorData";

/* Plot-level view. The dashboard is about layouts; this is about the individual
 * plots inside them — what's gone, what's held, what a buyer can still get. */

const TENURE = {
  sold: { label: "Sold", cls: "text-graphite", dot: "bg-graphite" },
  reserved: { label: "Reserved", cls: "text-graphite/84", dot: "bg-concrete" },
  available: { label: "Available", cls: "text-graphite/84", dot: "border border-graphite/40" },
};

/* Geometry only exists for the traced layout, so rows are built from it. Tenure
 * is assigned from the upload's counts — placeholder, like the geometry. */
function buildRows(upload) {
  let sold = upload.sold;
  let reserved = upload.reserved;
  return layout.plots.map((p) => {
    let tenure = "available";
    if (sold > 0) {
      tenure = "sold";
      sold -= 1;
    } else if (reserved > 0) {
      tenure = "reserved";
      reserved -= 1;
    }
    return { ...p, tenure, layoutName: upload.name, layoutId: upload.id };
  });
}

const FILTERS = [
  { id: "all", label: "All plots" },
  { id: "available", label: "Available" },
  { id: "reserved", label: "Reserved" },
  { id: "sold", label: "Sold" },
];

export default function Listings() {
  const [filter, setFilter] = useState("all");

  // Only layouts whose boundaries have been traced have plot rows to show.
  const traced = uploads.filter((u) => u.extraction !== "processing" && u.id === layout.id);

  const rows = useMemo(() => traced.flatMap(buildRows), [traced]);
  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.tenure === filter)),
    [rows, filter],
  );

  const pending = uploads.filter((u) => !traced.some((t) => t.id === u.id));

  return (
    <>
      <RelatorNav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
          <p className="u-eyebrow text-brick-lit">Relator workspace</p>
          <h1
            className="mt-4 font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            My listings
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-graphite/80">
            Every plot you have on Kaani, and where it stands.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2" role="group" aria-label="Filter plots">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  aria-pressed={active}
                  className={
                    "u-fact border px-3.5 py-2 text-[0.72rem] uppercase transition-colors " +
                    (active
                      ? "border-graphite bg-graphite text-paper"
                      : "border-graphite/25 text-graphite/80 hover:border-graphite/50 hover:text-graphite")
                  }
                  style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
                >
                  {f.label}
                </button>
              );
            })}
            <span className="ml-auto u-fact text-[0.72rem] text-graphite/84">
              {visible.length} {visible.length === 1 ? "plot" : "plots"}
            </span>
          </div>

          {visible.length > 0 ? (
            <div className="mt-6 overflow-x-auto border border-graphite/15" style={{ borderRadius: "3px" }}>
              <table className="w-full min-w-[680px] border-collapse">
                <thead>
                  <tr className="border-b border-graphite/12">
                    {["Plot", "Layout", "Dimensions", "Area", "₹ / sq ft", "Status"].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-4 py-3 text-left u-eyebrow text-graphite/84"
                        style={{ fontSize: "0.54rem" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const t = TENURE[r.tenure];
                    return (
                      <tr key={`${r.layoutId}-${r.id}`} className="border-b border-graphite/8 last:border-b-0">
                        <td className="px-4 py-3 u-fact text-sm text-graphite">
                          {String(r.no).padStart(2, "0")}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/plots/${r.layoutId}`}
                            className="text-sm text-graphite/85 transition-colors hover:text-graphite"
                          >
                            {r.layoutName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 u-fact text-sm text-graphite/85">{r.dimensions}</td>
                        <td className="px-4 py-3 u-fact text-sm text-graphite/85">
                          {r.areaSqft.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 u-fact text-sm text-graphite/85">
                          ₹{r.pricePerSqft.toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-2 u-fact text-[0.7rem] ${t.cls}`}>
                            <span className={`h-2 w-2 ${t.dot}`} />
                            {t.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              className="mt-6 border border-dashed border-graphite/25 px-6 py-14 text-center"
              style={{ borderRadius: "3px" }}
            >
              <p className="font-display text-lg font-bold text-graphite">No plots with that status</p>
              <p className="mt-2 text-graphite/84">Clear the filter to see every plot you list.</p>
              <button
                onClick={() => setFilter("all")}
                className="mt-5 u-fact border border-graphite/35 px-4 py-2.5 text-[0.72rem] uppercase text-graphite transition-colors hover:bg-graphite/5"
                style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
              >
                Show all plots
              </button>
            </div>
          )}

          {/* layouts without traced geometry yet */}
          {pending.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-graphite">Not traced yet</h2>
              <ul className="mt-4 flex flex-col gap-2">
                {pending.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-graphite/12 px-4 py-3"
                    style={{ borderRadius: "3px" }}
                  >
                    <div>
                      <p className="font-display text-sm font-bold text-graphite">{u.name}</p>
                      <p className="mt-0.5 u-fact text-[0.68rem] text-graphite/84">
                        {u.plotsTotal} plots · {u.dtcp}
                      </p>
                    </div>
                    {u.extraction === "processing" ? (
                      <span className="u-fact text-[0.68rem] text-graphite/84">Extracting boundaries…</span>
                    ) : (
                      <Button
                        as={Link}
                        to={`/relator/layouts/${u.id}/confirm`}
                        variant="ghost"
                        className="!px-3 !py-2"
                      >
                        Check the trace
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Plot rows and tenure are placeholder pending the survey pipeline.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
