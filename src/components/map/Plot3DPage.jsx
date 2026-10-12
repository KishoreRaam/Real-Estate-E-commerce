import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Nav from "../landing/Nav";
import Footer from "../landing/Footer";
import PlotRecordCard from "../shared/PlotRecordCard";
import Button from "../shared/Button";
import PlotMapExplorer from "./PlotMapExplorer";
import usePlotMapState from "./usePlotMapState";
import { makeStressLayout } from "./stressLayout";
import { fullLayouts, layout as fallbackLayout, layouts } from "../shared/plotData";

/* Standalone 3D explorer: /plots/:layoutId/3d. Same state, same record card,
 * same compare as the detail page — it just opens on the 3D view and gives it
 * the full width. `?stress=120` swaps in a synthetic layout for perf testing. */
export default function Plot3DPage() {
  const { layoutId } = useParams();
  const [params] = useSearchParams();
  const stress = Number(params.get("stress")) || 0;

  const meta = layouts.find((l) => l.id === layoutId) ?? layouts[0];
  const activeLayout = useMemo(
    () => (stress ? makeStressLayout(stress) : (fullLayouts[meta.id] ?? fallbackLayout)),
    [stress, meta.id],
  );
  const map = usePlotMapState(activeLayout, { initialSelectedId: activeLayout.featuredId });
  const switchable = layouts.filter((l) => fullLayouts[l.id]);

  return (
    <>
      <Nav />
      <main className="bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/plots" className="transition-colors hover:text-graphite">
              Layouts
            </Link>
            <span className="mx-2">/</span>
            <Link to={`/plots/${meta.id}`} className="transition-colors hover:text-graphite">
              {meta.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-graphite/85">3D explorer</span>
          </nav>

          <div className="mt-5 flex flex-col gap-5 border-b border-graphite/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="u-eyebrow text-brick-lit" style={{ fontSize: "0.6rem" }}>
                Illustrative 3D
              </p>
              <h1
                className="mt-3 font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {activeLayout.name}, as a neighbourhood
              </h1>
              <p className="mt-3 text-graphite/85">
                Hover a plot for its facts, click to open its record, add up to three to compare. Plot
                boundaries come from the same trace as the 2D plan; homes, trees and traffic are scenery.
              </p>
            </div>
            {!stress && switchable.length > 1 && (
              <div role="group" aria-label="Layout" className="flex flex-wrap gap-2">
                {switchable.map((l) => (
                  <Link
                    key={l.id}
                    to={`/plots/${l.id}/3d`}
                    aria-current={l.id === meta.id ? "page" : undefined}
                    className={
                      "u-fact border px-3 py-1.5 text-[0.72rem] transition-colors " +
                      (l.id === meta.id
                        ? "border-graphite bg-graphite text-paper"
                        : "border-graphite/25 text-graphite/85 hover:border-graphite/60")
                    }
                    style={{ borderRadius: 2 }}
                  >
                    {l.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            <PlotMapExplorer layout={activeLayout} map={map} initialView="3d" height="clamp(420px, 70vh, 760px)" />

            <aside className="flex flex-col gap-5">
              <PlotRecordCard plot={map.selected} layout={activeLayout} />
              <Button as={Link} to={`/plots/${meta.id}`} variant="ghost" arrow>
                Open the full plot record
              </Button>
              {/* the accessible path: every plot, as a list, in sync with the canvas */}
              <div className="border border-graphite/15" style={{ borderRadius: 3 }}>
                <p className="border-b border-graphite/12 px-4 py-2.5 u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
                  All plots · {activeLayout.plots.length}
                </p>
                <ul className="max-h-[300px] overflow-y-auto">
                  {activeLayout.plots.map((p) => {
                    const active = p.id === map.selectedId;
                    const dim = map.dimmedIds.includes(p.id);
                    return (
                      <li key={p.id}>
                        <button
                          onClick={() => map.select(p)}
                          onMouseEnter={() => map.hover(p.id)}
                          onMouseLeave={() => map.endHover(p.id)}
                          aria-pressed={active}
                          className={
                            "flex w-full items-center justify-between gap-3 border-b border-graphite/8 px-4 py-2 text-left transition-colors " +
                            (active ? "bg-graphite/10" : "hover:bg-graphite/5") +
                            (dim ? " opacity-45" : "")
                          }
                        >
                          <span className="u-fact text-sm text-graphite">{String(p.no).padStart(2, "0")}</span>
                          <span className="u-fact text-[0.72rem] text-graphite/84">
                            {p.areaSqft.toLocaleString("en-IN")} sq ft · {p.facing}
                          </span>
                          <span
                            className={"h-1.5 w-1.5 rounded-full " + (p.status === "verified" ? "bg-brick" : "bg-concrete")}
                            aria-label={p.status}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          </div>

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Illustrative view, not to scale. Plot heights are uniform and carry no meaning; surrounding
            buildings are generated scenery. The 2D plan is the record.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
