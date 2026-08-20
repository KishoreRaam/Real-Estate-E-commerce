import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import DocumentTimeline from "../shared/DocumentTimeline";
import EventEditPanel from "./EventEditPanel";
import Button from "../shared/Button";
import { confidenceTier, trustTier, documentsByPlot, eventsByPlot, EMPTY } from "../shared/documentData";
import { layouts } from "../shared/plotData";

function governmentFlaggable(doc, event) {
  return doc?.verification_tier === "government_sourced" && confidenceTier(event.confidence) !== "high";
}

function seedDraft(event) {
  return {
    from_party: event.from_party,
    to_party: event.to_party,
    event_date: event.event_date,
    extent: event.extent,
  };
}

export default function ConfirmTimeline() {
  const { layoutId } = useParams();
  const meta = layouts.find((l) => l.id === layoutId) ?? layouts[0];

  const documents = documentsByPlot[meta.id] ?? EMPTY;
  const baseEvents = eventsByPlot[meta.id] ?? EMPTY;
  const docsById = useMemo(() => Object.fromEntries(documents.map((d) => [d.id, d])), [documents]);

  const [selectedId, setSelectedId] = useState(null);
  const [confirmedIds, setConfirmedIds] = useState(() => baseEvents.filter((e) => e.human_confirmed).map((e) => e.id));
  const [published, setPublished] = useState(false);
  const [drafts, setDrafts] = useState(() => Object.fromEntries(baseEvents.map((e) => [e.id, seedDraft(e)])));

  const events = useMemo(
    () =>
      baseEvents.map((e) => {
        const draft = drafts[e.id] ?? seedDraft(e);
        return { ...e, ...draft, human_confirmed: confirmedIds.includes(e.id) };
      }),
    [baseEvents, drafts, confirmedIds],
  );

  const flaggedEvents = useMemo(
    () => baseEvents.filter((e) => governmentFlaggable(docsById[e.source_document_id], e)),
    [baseEvents, docsById],
  );
  const outstanding = useMemo(
    () => flaggedEvents.filter((e) => !confirmedIds.includes(e.id)),
    [flaggedEvents, confirmedIds],
  );

  // THE GATE. Every flagged, government-sourced entry must be confirmed by a
  // person. Self-uploaded entries never block this — they can't be published
  // as government-confirmed no matter what, so there's nothing to gate.
  const canPublish = outstanding.length === 0;

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const selectedDoc = selected ? docsById[selected.source_document_id] : null;
  const selectedTier = selected ? trustTier(selectedDoc, { ...selected, human_confirmed: confirmedIds.includes(selected.id) }) : null;

  const updateDraft = (key, value) => {
    if (!selectedId) return;
    setDrafts((d) => ({ ...d, [selectedId]: { ...d[selectedId], [key]: value } }));
  };

  const confirmEvent = (id) => setConfirmedIds((c) => (c.includes(id) ? c : [...c, id]));
  const unconfirmEvent = (id) => setConfirmedIds((c) => c.filter((x) => x !== id));

  const publish = () => {
    if (outstanding.length > 0) return;
    setPublished(true);
  };

  const confirmedFlagged = flaggedEvents.length - outstanding.length;
  const govEventCount = baseEvents.filter((e) => docsById[e.source_document_id]?.verification_tier === "government_sourced").length;

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
            <span className="text-graphite/85">{meta.name} · document history</span>
          </nav>

          <div className="mt-5 flex flex-col gap-5 border-b border-graphite/12 pb-7 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="u-eyebrow text-brick-lit">Check the register</p>
              <h1
                className="mt-3 font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {meta.name}
              </h1>
              <p className="mt-2 text-graphite/84">{meta.place}</p>
            </div>
            {baseEvents.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div>
                  <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                    Entries found
                  </div>
                  <div className="u-fact text-sm text-graphite">
                    {baseEvents.length === 1 ? "1 transaction" : `${baseEvents.length} transactions`}
                  </div>
                </div>
                <div>
                  <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                    From this EC
                  </div>
                  <div className="u-fact text-sm text-graphite">{govEventCount}</div>
                </div>
              </div>
            )}
          </div>

          {baseEvents.length === 0 ? (
            <div className="mt-8 max-w-2xl">
              <DocumentTimeline
                documents={documents}
                events={events}
                mode="edit"
                uploadHref="/relator/documents/upload"
              />
            </div>
          ) : (
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              {/* the register */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>
                    <span className="text-brick-lit">◈</span> Click an entry to check it
                  </p>
                  <p className="u-fact text-[0.66rem] text-graphite/84">Read from your upload</p>
                </div>

                <div className="mt-3 border border-graphite/15 p-4 sm:p-5" style={{ borderRadius: "3px" }}>
                  <DocumentTimeline
                    documents={documents}
                    events={events}
                    mode="edit"
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                </div>

                {/* legend — trust is carried on shape, ground and border, so it's spelled out */}
                <ul className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 u-fact text-[0.66rem] text-graphite/84">
                  <li className="flex items-center gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brick" />
                    Confirmed, from the EC
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-graphite/40" />
                    Clean, unconfirmed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border border-dashed border-graphite" />
                    Needs a look
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-3 w-3 rotate-45 border border-dashed border-concrete" />
                    Self-uploaded, not government-sourced
                  </li>
                </ul>
              </div>

              {/* edit panel + flagged checklist */}
              <div className="flex flex-col gap-5">
                <EventEditPanel
                  event={selected}
                  doc={selectedDoc}
                  tier={selectedTier}
                  draft={selected ? drafts[selected.id] : null}
                  confirmed={selected ? confirmedIds.includes(selected.id) : false}
                  onChange={updateDraft}
                  onConfirm={() => selected && confirmEvent(selected.id)}
                  onUnconfirm={() => selected && unconfirmEvent(selected.id)}
                />

                {flaggedEvents.length > 0 && (
                  <div className="border border-graphite/15" style={{ borderRadius: "3px" }}>
                    <div className="flex items-center justify-between border-b border-graphite/12 px-4 py-2.5">
                      <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
                        Flagged entries
                      </p>
                      <span className="u-fact text-[0.7rem] text-graphite/84">
                        {confirmedFlagged}/{flaggedEvents.length} confirmed
                      </span>
                    </div>
                    <ul className="max-h-[220px] overflow-y-auto">
                      {flaggedEvents.map((e) => {
                        const done = confirmedIds.includes(e.id);
                        const active = e.id === selectedId;
                        return (
                          <li key={e.id}>
                            <button
                              onClick={() => setSelectedId(e.id)}
                              aria-pressed={active}
                              className={
                                "flex w-full items-center justify-between gap-3 border-b border-graphite/8 px-4 py-2.5 text-left transition-colors " +
                                (active ? "bg-graphite/10" : "hover:bg-graphite/5")
                              }
                            >
                              <span className="flex items-center gap-3">
                                <span className="u-fact text-[0.72rem] text-graphite">{e.event_date}</span>
                                <span className="u-fact text-[0.7rem] text-graphite/84">
                                  {Math.round(e.confidence * 100)}% match
                                </span>
                              </span>
                              <span className="u-fact text-[0.68rem]">
                                {done ? (
                                  <span className="text-brick-lit">Confirmed</span>
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
                )}
              </div>
            </div>
          )}

          {/* publish bar */}
          {baseEvents.length > 0 && (
            <div
              className="mt-8 flex flex-col gap-4 border border-graphite/15 bg-paper-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderRadius: "3px" }}
            >
              <div>
                {published ? (
                  <>
                    <p className="font-display text-base font-bold text-brick-lit">Timeline published</p>
                    <p className="mt-1 text-sm text-graphite/84">
                      Buyers can now open {meta.name} and read this history for themselves.
                    </p>
                  </>
                ) : canPublish ? (
                  <>
                    <p className="font-display text-base font-bold text-graphite">
                      {baseEvents.length} {baseEvents.length === 1 ? "transaction" : "transactions"} found — ready to
                      publish
                    </p>
                    <p className="mt-1 text-sm text-graphite/84">
                      Publishing puts this history in front of buyers with your name on it.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-base font-bold text-graphite">
                      {baseEvents.length} {baseEvents.length === 1 ? "transaction" : "transactions"} found — review
                      before publishing
                    </p>
                    <p className="mt-1 text-sm text-graphite/84">
                      {outstanding.length} {outstanding.length === 1 ? "entry needs" : "entries need"} your
                      confirmation before buyers can see this history.
                    </p>
                  </>
                )}
              </div>

              {published ? (
                <Button as={Link} to={`/plots/${meta.id}/history`} variant="ghost" arrow className="shrink-0">
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
                    Publish timeline
                  </Button>
                  {!canPublish && (
                    <span id="publish-gate-note" className="u-fact text-[0.64rem] text-graphite/84">
                      Locked until all {flaggedEvents.length} are confirmed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="mt-8 u-fact text-[0.68rem] text-graphite/84">
            This is a plain-language read of what the Encumbrance Certificate states — not a
            certification of clear title. Extraction shown here is simulated pending the real
            OCR pipeline.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
