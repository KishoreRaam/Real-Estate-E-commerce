import VerifiedStamp from "../shared/VerifiedStamp";
import Button from "../shared/Button";
import Field from "../shared/Field";
import { DOC_TYPE_LABELS } from "../shared/documentData";

const TIER_COPY = {
  confirmed: {
    label: "Confirmed by you",
    body: "Buyers will see this entry as recorded in the Encumbrance Certificate.",
  },
  high: {
    label: "Entry looks clean",
    body: "This entry came through clearly. Check it if you like — you don't have to.",
  },
  review: {
    label: "Worth a look",
    body: "Part of this entry was faint on the certificate. Check it against your copy.",
  },
  low: {
    label: "Entry is unreliable",
    body: "Kaani couldn't read this entry properly. Correct it before publishing.",
  },
  unverified: {
    label: "Self-uploaded, not a government record",
    body: "This came from a document you attached yourself, not from the Encumbrance Certificate. It can never be shown as government-confirmed.",
  },
};

export default function EventEditPanel({ event, doc, tier, draft, confirmed, onChange, onConfirm, onUnconfirm }) {
  if (!event) {
    return (
      <div
        className="flex h-full min-h-[300px] flex-col items-center justify-center border border-dashed border-graphite/20 px-6 py-12 text-center"
        style={{ borderRadius: "3px" }}
      >
        <p className="font-display text-lg font-bold text-graphite">Pick an entry to check</p>
        <p className="mt-2 max-w-xs text-sm text-graphite/84">
          Click any entry on the register, or work through the flagged list below.
        </p>
      </div>
    );
  }

  const copy = TIER_COPY[tier] ?? TIER_COPY.high;
  const unverified = tier === "unverified";
  const canEarnBrick = !unverified;

  return (
    <div className="border border-graphite/15 bg-champagne" style={{ borderRadius: "3px" }}>
      {/* header */}
      <div className="flex items-start justify-between gap-3 border-b border-graphite/12 px-5 py-3.5">
        <div>
          <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.56rem" }}>
            Editing entry
          </span>
          <div className="font-display text-lg font-extrabold leading-snug text-graphite">{event.event_date}</div>
          <p className="mt-1 u-fact text-[0.66rem] text-graphite/84">
            Source: {DOC_TYPE_LABELS[doc?.doc_type] ?? "Document"}
          </p>
        </div>
        {confirmed && canEarnBrick ? (
          <VerifiedStamp status="verified" label="Confirmed" />
        ) : unverified ? (
          <VerifiedStamp status="pending" label="Self-uploaded" />
        ) : (
          <VerifiedStamp status={tier === "high" ? "pending" : "action"} label={tier === "high" ? "Unchecked" : "Needs check"} />
        )}
      </div>

      {/* confidence read-out */}
      <div className="border-b border-graphite/12 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-sm font-bold text-graphite">{copy.label}</span>
          {event.confidence != null && (
            <span className="u-fact text-[0.7rem] text-graphite/84">{Math.round(event.confidence * 100)}% match</span>
          )}
        </div>
        {event.confidence != null && (
          <div className="mt-2 h-1 w-full overflow-hidden bg-graphite/10" style={{ borderRadius: "1px" }} aria-hidden="true">
            <span
              className="block h-full"
              style={{
                width: `${event.confidence * 100}%`,
                background: confirmed && canEarnBrick ? "var(--color-brick-lit)" : "var(--color-graphite)",
              }}
            />
          </div>
        )}
        <p className="mt-2.5 text-sm leading-relaxed text-graphite/84">{copy.body}</p>
      </div>

      {/* fields */}
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Field id="evt-from" label="From" value={draft.from_party} onChange={(v) => onChange("from_party", v)} />
          <Field id="evt-to" label="To" value={draft.to_party} onChange={(v) => onChange("to_party", v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field id="evt-date" label="Date" value={draft.event_date} onChange={(v) => onChange("event_date", v)} />
          <Field id="evt-extent" label="Extent" value={draft.extent} onChange={(v) => onChange("extent", v)} />
        </div>
      </div>

      {/* confirm */}
      <div className="border-t border-graphite/12 px-5 py-4">
        {unverified ? (
          <p className="u-fact text-[0.7rem] leading-relaxed text-graphite/84">
            Self-uploaded entries are shown to buyers as stated by the uploader. Confirming
            corrects the text, but never marks it as a government record.
          </p>
        ) : confirmed ? (
          <div className="flex flex-col gap-3">
            <p className="u-fact text-[0.7rem] text-graphite/84">
              Confirmed by you. Buyers will see this as recorded in the certificate.
            </p>
            <Button variant="ghost" onClick={onUnconfirm} className="w-full">
              Undo confirmation
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="u-fact text-[0.7rem] leading-relaxed text-graphite/84">
              {tier === "high"
                ? "Optional — this entry isn't blocking publication."
                : "Confirming says this matches your copy of the certificate."}
            </p>
            <Button onClick={onConfirm} className="w-full">
              Confirm this entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
