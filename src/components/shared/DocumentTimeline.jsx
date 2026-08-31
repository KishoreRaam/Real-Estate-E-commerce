import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { TRANSACTION_LABELS, DOC_TYPE_LABELS, trustTier } from "./documentData";

/* ------------------------------------------------------------------ *
 * DocumentTimeline — the one document-register component, two modes.
 *
 *   mode="view"  buyer or relator reading a published register; static
 *   mode="edit"  seller confirm screen; rows are clickable, flagged rows
 *                open in an EventEditPanel (rendered by the caller, same
 *                split as ConfirmExtraction + PlotEditPanel)
 *
 * This reads as a REGISTER, not an activity feed — because that's what an
 * Encumbrance Certificate actually is: a numbered, dated table of every
 * transaction the Sub-Registrar has on file. Sl. No. 1, 2, 3… is the one
 * numbering scheme here, because it's the only one that encodes something
 * real (chronological order of registration).
 *
 * Trust is carried on FOUR independent channels at once, not a color badge:
 * the spine tick's shape and fill, the entry's ground colour, its border
 * style, and a written label. A government-sourced, confirmed row sits on
 * Champagne (the token system's "record" ground) with a filled brick tick.
 * A self-uploaded row sits on Paper-2 (a barely-recessed panel — never the
 * record ground), gets a hollow diamond tick, and the spine itself breaks
 * around it rather than running through it: it never reads as part of the
 * government chain, confirmed or not.
 * ------------------------------------------------------------------ */

function sortByDate(events) {
  return [...events].sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
}

function eventHeadline(event) {
  if (event.transaction_type === "release") {
    return `Mortgage released by ${event.from_party}`;
  }
  const verb = TRANSACTION_LABELS[event.transaction_type] ?? TRANSACTION_LABELS.other;
  return `${verb} ${event.to_party}`;
}

function Tick({ tier }) {
  if (tier === "unverified") {
    return (
      <span
        aria-hidden="true"
        className="block h-3 w-3 rotate-45 border border-dashed border-concrete bg-paper"
      />
    );
  }
  if (tier === "confirmed") {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full bg-brick"
      >
        <svg width="9" height="9" viewBox="0 0 12 12">
          <path
            d="M2 6.4 L4.8 9 L10 3"
            fill="none"
            stroke="var(--color-paper)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (tier === "low") {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-graphite bg-graphite"
      >
        <span className="u-fact text-[9px] font-semibold leading-none text-paper">?</span>
      </span>
    );
  }
  if (tier === "review") {
    return (
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-graphite bg-paper"
      >
        <span className="u-fact text-[9px] font-semibold leading-none text-graphite">?</span>
      </span>
    );
  }
  // high, unconfirmed: quiet, not flagged
  return <span aria-hidden="true" className="block h-3 w-3 rounded-full border border-graphite/40 bg-paper" />;
}

const TIER_NOTE = {
  confirmed: "Confirmed — as recorded in this Encumbrance Certificate.",
  high: "As recorded in this Encumbrance Certificate. Not flagged.",
  review: "Part of this entry was faint on the scan. Check it against your copy.",
  low: "Kaani couldn't read this entry properly. Correct it before publishing.",
  unverified: "Self-uploaded — not a government record. Shown as stated by the uploader.",
};

function ConfidenceBar({ confidence, tone }) {
  if (confidence == null) return null;
  return (
    <div className="mt-2">
      <div className="h-1 w-full overflow-hidden bg-graphite/10" style={{ borderRadius: "1px" }} aria-hidden="true">
        <span className="block h-full" style={{ width: `${confidence * 100}%`, background: tone }} />
      </div>
      <p className="mt-1 u-fact text-[0.62rem] text-graphite/84">{Math.round(confidence * 100)}% match</p>
    </div>
  );
}

function EntryCard({ event, doc, tier, mode, isSelected, onSelect }) {
  const interactive = mode === "edit";
  const unverified = tier === "unverified";
  const flagged = tier === "review" || tier === "low";
  const tone = tier === "confirmed" ? "var(--color-brick-lit)" : "var(--color-graphite)";

  const handlers = interactive
    ? {
        onClick: () => onSelect?.(event.id),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(event.id);
          }
        },
        tabIndex: 0,
        role: "button",
        "aria-pressed": isSelected,
        "aria-label": `Entry ${eventHeadline(event)}, ${event.event_date}, ${TIER_NOTE[tier]}`,
      }
    : {};

  return (
    <div
      {...handlers}
      className={
        "flex-1 border px-4 py-3.5 transition-colors sm:px-5 sm:py-4 " +
        (unverified ? "border-dashed border-concrete/70 bg-paper-2" : "border-graphite/15 bg-champagne") +
        (interactive ? " cursor-pointer" : "") +
        (isSelected ? " outline outline-2 outline-offset-2 outline-brick-lit" : "")
      }
      style={{ borderRadius: "3px" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-base font-bold leading-snug text-graphite sm:text-lg">
            {eventHeadline(event)}
          </p>
          <p className="mt-1 u-fact text-[0.72rem] text-graphite/84">
            {event.from_party}
            <span className="mx-1.5 text-graphite/84" aria-hidden="true">→</span>
            {event.to_party}
          </p>
        </div>
        <span className="u-fact shrink-0 text-[0.72rem] text-graphite/84">{event.event_date}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 u-fact text-[0.7rem] text-graphite/84">
        <span>Extent: {event.extent}</span>
        <span>
          {unverified ? "Self-uploaded" : "Government record"} · {DOC_TYPE_LABELS[doc?.doc_type] ?? "Document"}
        </span>
        {flagged && !unverified && <span className="text-graphite">Needs your review</span>}
      </div>

      {(flagged || unverified) && <ConfidenceBar confidence={event.confidence} tone={tone} />}

      <p className={"mt-2.5 text-[0.82rem] leading-relaxed " + (unverified ? "text-graphite/84" : "text-graphite/84")}>
        {TIER_NOTE[tier]}
      </p>
    </div>
  );
}

function EmptyState({ mode, uploadHref }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 border border-dashed border-graphite/25 px-6 py-14 text-center"
      style={{ borderRadius: "3px" }}
    >
      <p className="font-display text-lg font-bold text-graphite">
        {mode === "edit" ? "No document uploaded yet" : "No document uploaded yet"}
      </p>
      <p className="max-w-sm text-sm leading-relaxed text-graphite/84">
        {mode === "edit"
          ? "Upload the Encumbrance Certificate for this plot and Kaani turns it into a plain-language timeline for buyers to read."
          : "The seller hasn't uploaded an Encumbrance Certificate for this plot yet. Ask your relator for one before you rely on this page."}
      </p>
      {mode === "edit" && uploadHref && (
        <a
          href={uploadHref}
          className="mt-2 u-fact border border-graphite/35 px-5 py-3 text-[0.8rem] uppercase text-graphite transition-colors hover:border-graphite/70 hover:bg-graphite/5"
          style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
        >
          Upload encumbrance certificate
        </a>
      )}
    </div>
  );
}

function ProcessingState({ doc, reduce }) {
  const label = DOC_TYPE_LABELS[doc?.doc_type] ?? "document";
  return (
    <div className="border border-graphite/15 px-5 py-8" style={{ borderRadius: "3px" }}>
      <p className="u-eyebrow text-brick-lit">Processing</p>
      <p className="mt-3 font-display text-lg font-bold text-graphite">Reading the {label.toLowerCase()}…</p>
      <p className="mt-1 text-sm text-graphite/84">
        Kaani is extracting registered transactions from {doc?.upload_date ? `the copy uploaded ${doc.upload_date}` : "the uploaded copy"}. This usually takes under a minute.
      </p>
      <div className="mt-6 flex flex-col gap-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <span
              className={
                "h-3 w-3 shrink-0 rotate-45 border border-graphite/30 " +
                (reduce ? "" : "animate-pulse")
              }
              style={{ animationDelay: `${i * 220}ms` }}
            />
            <span className="h-2 flex-1 max-w-[220px] bg-graphite/8" style={{ borderRadius: "1px" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentTimeline({
  documents = [],
  events = [],
  mode = "view",
  selectedId = null,
  onSelect,
  uploadHref,
  className = "",
}) {
  const reduce = useReducedMotion();

  const docsById = useMemo(() => Object.fromEntries(documents.map((d) => [d.id, d])), [documents]);
  const primaryDoc = useMemo(
    () => documents.find((d) => d.doc_type === "encumbrance_certificate") ?? documents[0] ?? null,
    [documents],
  );

  const sorted = useMemo(() => sortByDate(events), [events]);

  const rows = useMemo(
    () =>
      sorted.map((event) => {
        const doc = docsById[event.source_document_id] ?? null;
        return { event, doc, tier: trustTier(doc, event) };
      }),
    [sorted, docsById],
  );

  if (documents.length === 0) {
    return (
      <div className={className}>
        <EmptyState mode={mode} uploadHref={uploadHref} />
      </div>
    );
  }

  if (rows.length === 0 && primaryDoc?.ocr_status === "pending") {
    return (
      <div className={className}>
        <ProcessingState doc={primaryDoc} reduce={reduce} />
      </div>
    );
  }

  return (
    <div className={className}>
      <ol className="relative flex flex-col" aria-label={`${rows.length} entries from this Encumbrance Certificate`}>
        {rows.map(({ event, doc, tier }, i) => {
          const prevOnChain = i > 0 && rows[i - 1].tier !== "unverified" && tier !== "unverified";
          return (
            <li key={event.id} className="relative flex gap-3 pb-6 last:pb-0 sm:gap-4">
              <div className="relative flex w-5 flex-none flex-col items-center pt-1">
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className={
                      "absolute bottom-full left-1/2 h-6 w-px -translate-x-1/2 " +
                      (prevOnChain ? "bg-graphite/25" : "bg-transparent")
                    }
                  />
                )}
                <span className="relative z-10">
                  <Tick tier={tier} />
                </span>
              </div>
              <div className="u-fact flex w-6 flex-none items-start justify-end pt-0.5 pr-1 text-[0.68rem] text-graphite/84 sm:w-8">
                {String(i + 1).padStart(2, "0")}
              </div>
              <EntryCard
                event={event}
                doc={doc}
                tier={tier}
                mode={mode}
                isSelected={mode === "edit" && event.id === selectedId}
                onSelect={onSelect}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
