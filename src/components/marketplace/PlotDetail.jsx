import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Nav from "../landing/Nav";
import Footer from "../landing/Footer";
import PlotOverlay from "../shared/PlotOverlay";
import PlotRecordCard from "../shared/PlotRecordCard";
import Button from "../shared/Button";
import VerifiedStamp from "../shared/VerifiedStamp";
import { layout, layouts, fullLayouts } from "../shared/plotData";
import { publicRelators } from "../relator/relatorData";

export default function PlotDetail() {
  const { layoutId } = useParams();
  const meta = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  const listedBy =
    publicRelators.find((r) => r.listingIds.includes(meta.id)) ?? publicRelators[0];

  // Geometry falls back to the shared placeholder sheet until a layout has
  // its own real trace registered in `fullLayouts`.
  const activeLayout = fullLayouts[meta.id] ?? layout;

  const [selectedId, setSelectedId] = useState(activeLayout.featuredId);
  const [hoveredId, setHoveredId] = useState(null);

  const selected = useMemo(
    () => activeLayout.plots.find((p) => p.id === selectedId) ?? null,
    [selectedId, activeLayout],
  );

  return (
    <>
      <Nav />
      <main className="bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
          {/* breadcrumb */}
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/plots" className="transition-colors hover:text-graphite">
              Layouts
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">{meta.name}</span>
          </nav>

          {/* header */}
          <div className="mt-5 flex flex-col gap-5 border-b border-graphite/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <h1
                className="font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {meta.name}
              </h1>
              <p className="mt-2 text-graphite/84">{meta.place}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>DTCP approval</div>
                <div className="u-fact text-sm text-graphite">{meta.dtcp}</div>
              </div>
              <div>
                <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>Approved</div>
                <div className="u-fact text-sm text-graphite">{activeLayout.approvedOn}</div>
              </div>
              {meta.plotsVerified === meta.plotsTotal ? (
                <VerifiedStamp status="verified" />
              ) : (
                <div>
                  <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                    Plots verified
                  </div>
                  <div className="u-fact text-sm text-brick-lit-lit">
                    {meta.plotsVerified} of {meta.plotsTotal}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* map + record */}
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex items-center justify-between">
                <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>
                  <span className="text-brick-lit">◈</span> Click a plot to open its record
                </p>
                <p className="u-fact text-[0.66rem] text-graphite/84">Scale {activeLayout.scale}</p>
              </div>
              <div
                className="mt-3 border border-graphite/15 p-2"
                style={{ borderRadius: "3px" }}
              >
                <PlotOverlay
                  layout={activeLayout}
                  mode="detail"
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  onSelect={(p) => setSelectedId(p.id)}
                  onHover={setHoveredId}
                />
              </div>

              {/* legend — states carry meaning, so they're spelled out */}
              <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 u-fact text-[0.66rem] text-graphite/84">
                <li className="flex items-center gap-2">
                  <span className="h-3 w-4 border-2 border-brick-lit" style={{ background: "color-mix(in srgb, var(--color-brick) 20%, transparent)" }} />
                  Verified · selected
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-4 border border-graphite/50" />
                  Available
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-4 border-2 border-concrete" style={{ background: "color-mix(in srgb, var(--color-concrete) 30%, transparent)" }} />
                  Verification pending
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-4 border border-concrete/60" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--color-concrete) 0 1px, transparent 1px 4px)" }} />
                  Open space (not for sale)
                </li>
              </ul>
            </div>

            {/* record + plot list */}
            <div className="flex flex-col gap-5">
              <PlotRecordCard plot={selected} layout={activeLayout} />

              {selected && (
                <div className="flex flex-col gap-2.5">
                  <Button as="a" href="#enquire" arrow>
                    Ask about plot {String(selected.no).padStart(2, "0")}
                  </Button>
                  <p className="u-fact text-[0.66rem] leading-relaxed text-graphite/84">
                    You&rsquo;ll be connected to{" "}
                    <Link
                      to={`/agents/${listedBy.id}`}
                      className="text-graphite/85 underline underline-offset-2 transition-colors hover:text-graphite"
                    >
                      {listedBy.name}
                    </Link>
                    , the verified agent listing this layout. No payment happens on Kaani.
                  </p>
                </div>
              )}

              {/* plot list — mirrors the map selection both ways */}
              <div className="border border-graphite/15" style={{ borderRadius: "3px" }}>
                <p className="border-b border-graphite/12 px-4 py-2.5 u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
                  All plots · {activeLayout.plots.length}
                </p>
                <ul className="max-h-[320px] overflow-y-auto">
                  {activeLayout.plots.map((p) => {
                    const active = p.id === selectedId;
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => setSelectedId(p.id)}
                          onMouseEnter={() => setHoveredId(p.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          aria-pressed={active}
                          className={
                            "flex w-full items-center justify-between gap-3 border-b border-graphite/8 px-4 py-2.5 text-left transition-colors " +
                            (active ? "bg-graphite/10" : "hover:bg-graphite/5")
                          }
                        >
                          <span className="flex items-center gap-3">
                            <span className={"u-fact text-sm " + (active ? "text-brick-lit-lit" : "text-graphite/85")}>
                              {String(p.no).padStart(2, "0")}
                            </span>
                            <span className="u-fact text-[0.72rem] text-graphite/84">{p.dimensions}</span>
                          </span>
                          <span className="flex items-center gap-3">
                            <span className="u-fact text-[0.72rem] text-graphite/84">
                              {p.areaSqft.toLocaleString("en-IN")} sq ft
                            </span>
                            <span
                              className={
                                "h-1.5 w-1.5 rounded-full " +
                                (p.status === "verified" ? "bg-brick" : "bg-concrete")
                              }
                              aria-label={p.status}
                            />
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Plot geometry shown is placeholder pending the survey pipeline. Measurements are
            examples, not survey figures.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
