import { useMemo, useState } from "react";
import Nav from "../landing/Nav";
import Footer from "../landing/Footer";
import LayoutCard from "./LayoutCard";
import { layouts } from "../shared/plotData";

const FILTERS = [
  { id: "all", label: "All layouts" },
  { id: "verified", label: "Fully verified" },
  { id: "partial", label: "Verification in progress" },
];

export default function Browse() {
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => {
    if (filter === "all") return layouts;
    return layouts.filter((l) => l.status === filter);
  }, [filter]);

  return (
    <>
      <Nav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-14 sm:px-8">
          <p className="u-eyebrow text-brick-lit">Layouts · Coimbatore</p>
          <h1
            className="mt-4 max-w-2xl font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(2.1rem, 4.5vw, 3.2rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            Approved layouts, drawn to scale.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-graphite/80">
            Open any layout to see its plots as they were filed — click one to read its
            measurements and survey number.
          </p>

          {/* filters */}
          <div className="mt-9 flex flex-wrap items-center gap-2" role="group" aria-label="Filter layouts">
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
              {visible.length} {visible.length === 1 ? "layout" : "layouts"}
            </span>
          </div>

          {/* grid */}
          {visible.length > 0 ? (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <LayoutCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div
              className="mt-8 border border-dashed border-graphite/25 px-6 py-16 text-center"
              style={{ borderRadius: "3px" }}
            >
              <p className="font-display text-xl font-bold text-graphite">No layouts match that filter</p>
              <p className="mt-2 text-graphite/84">
                Clear the filter to see every approved layout we&rsquo;ve drawn.
              </p>
              <button
                onClick={() => setFilter("all")}
                className="mt-5 u-fact border border-graphite/35 px-4 py-2.5 text-[0.72rem] uppercase text-graphite transition-colors hover:bg-graphite/5"
                style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
              >
                Show all layouts
              </button>
            </div>
          )}

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Plot geometry shown is placeholder pending the survey pipeline.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
