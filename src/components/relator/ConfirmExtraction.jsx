import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import PlotOverlay from "../shared/PlotOverlay";
import PlotEditPanel from "./PlotEditPanel";
import Button from "../shared/Button";
import { layout, isFlagged } from "../shared/plotData";
import { uploads } from "./relatorData";

/* Seed an editable draft from the trace. Dimensions arrive as "30 × 50 ft";
 * the relator edits them as four boundary lengths, so split them out. */
function seedDraft(plot) {
  const [a, b] = plot.dimensions.replace(/[^\d×]/g, "").split("×");
  return {
    no: String(plot.no),
    n: a ?? "",
    s: a ?? "",
    e: b ?? "",
    w: b ?? "",
    price: String(plot.pricePerSqft),
  };
}

export default function ConfirmExtraction() {
  const { layoutId } = useParams();
  const meta = uploads.find((u) => u.id === layoutId) ?? uploads[0];

  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [published, setPublished] = useState(false);
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(layout.plots.map((p) => [p.id, seedDraft(p)])),
  );

  const flaggedPlots = useMemo(() => layout.plots.filter(isFlagged), []);
  const outstanding = useMemo(
    () => flaggedPlots.filter((p) => !confirmedIds.includes(p.id)),
    [flaggedPlots, confirmedIds],
  );

  // THE GATE. Every flagged boundary must be confirmed by a person.
  const canPublish = outstanding.length === 0;

  const selected = layout.plots.find((p) => p.id === selectedId) ?? null;

  const updateDraft = (key, value) => {
    if (!selectedId) return;
    setDrafts((d) => ({ ...d, [selectedId]: { ...d[selectedId], [key]: value } }));
  };

  const confirmPlot = (id) => setConfirmedIds((c) => (c.includes(id) ? c : [...c, id]));
  const unconfirmPlot = (id) => setConfirmedIds((c) => c.filter((x) => x !== id));

  const publish = () => {
    // Re-check here as well as on the control. The disabled attribute is a UI
    // affordance; this is the actual rule, so re-enabling the button in
    // devtools still can't push an unconfirmed trace live.
    if (outstanding.length > 0) return;
    setPublished(true);
  };

  const confirmedFlagged = flaggedPlots.length - outstanding.length;

  return (
    <>
      <RelatorNav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-10 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/relator" className="transition-colors hover:text-graphite">
              Dashboard
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">{meta.name}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-5 border-b border-graphite/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="u-eyebrow text-brick-lit">Check the trace</p>
              <h1
                className="mt-3 font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {meta.name}
              </h1>
              <p className="mt-2 text-graphite/84">{meta.place}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div>
                <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                  DTCP approval
                </div>
                <div className="u-fact text-sm text-graphite">{meta.dtcp}</div>
              </div>
              <div>
                <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                  Boundaries traced
                </div>
                <div className="u-fact text-sm text-graphite">{layout.plots.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            {/* the sheet */}
            <div>
              <div className="flex items-center justify-between">
                <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>
                  <span className="text-brick-lit">◈</span> Click a boundary to check it
                </p>
                <p className="u-fact text-[0.66rem] text-graphite/84">Traced over your upload</p>
              </div>

              <div className="mt-3 border border-graphite/15 p-2" style={{ borderRadius: "3px" }}>
                <PlotOverlay
                  mode="edit"
                  selectedId={selectedId}
                  hoveredId={hoveredId}
                  confirmedIds={confirmedIds}
                  onSelect={(p) => setSelectedId(p.id)}
                  onHover={setHoveredId}
                />
              </div>

              {/* legend — line type carries confidence, so it must be spelled out */}
              <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 u-fact text-[0.66rem] text-graphite/84">
                <li className="flex items-center gap-2">
                  <span
                    className="h-3 w-5 border-2 border-brick-lit"
                    style={{ background: "color-mix(in srgb, var(--color-brick) 20%, transparent)" }}
                  />
                  Confirmed by you
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-3 w-5 border border-graphite/50" />
                  Clean trace
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="h-3 w-5 border border-dashed border-graphite"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-graphite) 28%, transparent) 0 1px, transparent 1px 5px)",
                    }}
                  />
                  Needs a look
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className="h-3 w-5 border-2 border-dashed border-graphite"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(45deg, color-mix(in srgb, var(--color-graphite) 42%, transparent) 0 1px, transparent 1px 3px)",
                    }}
                  />
                  Unreliable
                </li>
              </ul>
            </div>

            {/* edit panel + flagged checklist */}
            <div className="flex flex-col gap-5">
              <PlotEditPanel
                plot={selected}
                draft={selected ? drafts[selected.id] : null}
                confirmed={selected ? confirmedIds.includes(selected.id) : false}
                onChange={updateDraft}
                onConfirm={() => selected && confirmPlot(selected.id)}
                onUnconfirm={() => selected && unconfirmPlot(selected.id)}
              />

              {/* the gate, made legible */}
              <div className="border border-graphite/15" style={{ borderRadius: "3px" }}>
                <div className="flex items-center justify-between border-b border-graphite/12 px-4 py-2.5">
                  <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
                    Flagged boundaries
                  </p>
                  <span className="u-fact text-[0.7rem] text-graphite/84">
                    {confirmedFlagged}/{flaggedPlots.length} confirmed
                  </span>
                </div>
                <ul className="max-h-[220px] overflow-y-auto">
                  {flaggedPlots.map((p) => {
                    const done = confirmedIds.includes(p.id);
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
                            <span className={"u-fact text-sm " + (done ? "text-brick-lit-lit" : "text-graphite")}>
                              {String(p.no).padStart(2, "0")}
                            </span>
                            <span className="u-fact text-[0.7rem] text-graphite/84">
                              {Math.round(p.confidence * 100)}% match
                            </span>
                          </span>
                          <span className="u-fact text-[0.68rem]">
                            {done ? (
                              <span className="text-brick-lit-lit">Confirmed</span>
                            ) : (
                              <span className="text-graphite/85">Check</span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* publish bar */}
          <div
            className="mt-8 flex flex-col gap-4 border border-graphite/15 bg-paper-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderRadius: "3px" }}
          >
            <div>
              {published ? (
                <>
                  <p className="font-display text-base font-bold text-brick-lit-lit">Listing published</p>
                  <p className="mt-1 text-sm text-graphite/84">
                    Buyers can now open {meta.name} and click through every plot.
                  </p>
                </>
              ) : canPublish ? (
                <>
                  <p className="font-display text-base font-bold text-graphite">Every flagged boundary is confirmed</p>
                  <p className="mt-1 text-sm text-graphite/84">
                    Publishing puts this layout in front of buyers with your name on it.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-display text-base font-bold text-graphite">
                    {outstanding.length} {outstanding.length === 1 ? "boundary" : "boundaries"} still
                    to confirm
                  </p>
                  <p className="mt-1 text-sm text-graphite/84">
                    Plot{outstanding.length === 1 ? " " : "s "}
                    {outstanding.map((p) => String(p.no).padStart(2, "0")).join(", ")} — confirm these
                    and you can publish.
                  </p>
                </>
              )}
            </div>

            {published ? (
              <Button as={Link} to={`/plots/${meta.id}`} variant="ghost" arrow className="shrink-0">
                View as a buyer
              </Button>
            ) : (
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                <Button
                  onClick={publish}
                  disabled={!canPublish}
                  aria-disabled={!canPublish}
                  aria-describedby="publish-gate-note"
                  className={!canPublish ? "cursor-not-allowed" : ""}
                >
                  Publish listing
                </Button>
                {!canPublish && (
                  <span id="publish-gate-note" className="u-fact text-[0.64rem] text-graphite/84">
                    Locked until all {flaggedPlots.length} are confirmed
                  </span>
                )}
              </div>
            )}
          </div>

          <p className="mt-8 u-fact text-[0.68rem] text-graphite/84">
            Plot geometry and confidence scores are placeholder pending the survey pipeline.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
