/* ------------------------------------------------------------------ *
 * PLACEHOLDER DOCUMENT DATA — example values, not real registrations.
 *
 * Shape mirrors the future Appwrite collections field-for-field (snake_case,
 * matching the contract agreed with the extraction pipeline), unlike the rest
 * of this app's camelCase mock modules — keep it that way so wiring the real
 * collections later is a drop-in, not a rename.
 *
 * Document.verification_tier is the trust boundary the whole feature turns
 * on: "government_sourced" means the row came out of a parsed Encumbrance
 * Certificate; "self_uploaded_unverified" means a seller attached something
 * themselves (a spare copy of a deed, a tax receipt) that Kaani has not
 * cross-checked against any registry. The two must never look alike.
 *
 * OwnershipEvent.confidence is the OCR pipeline's own trace confidence for
 * that row (same 0–1 scale, same tiers, as plotData's boundary confidence).
 * human_confirmed is the seller's attestation, gathered on the confirm
 * screen — it does not upgrade a self-uploaded row to government-sourced.
 * ------------------------------------------------------------------ */

/* Same thresholds as plotData.confidenceTier, so a relator who has already
 * learned "dashed means look at this" from the boundary trace doesn't have
 * to learn a second scale here. */
export function confidenceTier(conf) {
  if (conf >= 0.9) return "high";
  if (conf >= 0.6) return "review";
  return "low";
}

/* The one function the whole visual system hangs off. Brick is earned only
 * by a row that is BOTH sourced from a government record AND confirmed by a
 * person — self-attestation on a self-uploaded document never earns it, no
 * matter how confident the OCR was or whether the seller ticked it off. */
export function trustTier(document, event) {
  if (!document || document.verification_tier !== "government_sourced") return "unverified";
  if (event.human_confirmed) return "confirmed";
  return confidenceTier(event.confidence);
}

export function isFlagged(document, event) {
  const tier = trustTier(document, event);
  return tier === "review" || tier === "low";
}

export const DOC_TYPE_LABELS = {
  encumbrance_certificate: "Encumbrance Certificate",
  tax_receipt: "Tax receipt",
  sale_deed: "Sale deed",
  other: "Document",
};

// Stable empty array so callers can fall back without creating a new
// reference every render (`documentsByPlot[id] ?? EMPTY`, not `?? []`).
export const EMPTY = [];

export const TRANSACTION_LABELS = {
  sale: "Sold to",
  mortgage: "Mortgaged to",
  gift: "Gifted to",
  release: "Mortgage released by",
  other: "Recorded with",
};

/* ------------------------------------------------------------------ *
 * Scenario A — kovai-gv-01, Green Valley Nagar, Thudiyalur.
 * A clean five-entry chain straight out of a government-sourced EC, every
 * row confirmed, PLUS one supplementary self-uploaded sale deed the seller
 * attached because the latest sale hasn't shown up in the EC yet (a real
 * and common registration lag) — the one place in the fixtures where a
 * government-sourced and a self-uploaded row sit side by side, so the
 * "must be distinguishable at a glance" rule has something to prove itself
 * against.
 * ------------------------------------------------------------------ */
const gv01Document = {
  id: "doc-gv-01-ec",
  plot_id: "kovai-gv-01",
  uploader_id: "senthil-kumar",
  doc_type: "encumbrance_certificate",
  upload_date: "18 Jul 2026",
  ocr_status: "complete",
  ocr_confidence: 0.96,
  verification_tier: "government_sourced",
};

const gv01SupplementaryDoc = {
  id: "doc-gv-01-supp",
  plot_id: "kovai-gv-01",
  uploader_id: "senthil-kumar",
  doc_type: "sale_deed",
  upload_date: "03 Aug 2026",
  ocr_status: "complete",
  ocr_confidence: 0.88,
  verification_tier: "self_uploaded_unverified",
};

const gv01Events = [
  {
    id: "evt-gv-01-1",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-ec",
    event_date: "12 Mar 1998",
    from_party: "Muthusamy Gounder",
    to_party: "Palaniswamy s/o Kaliyaperumal",
    transaction_type: "sale",
    extent: "36 cents",
    confidence: 0.95,
    human_confirmed: true,
  },
  {
    id: "evt-gv-01-2",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-ec",
    event_date: "04 Nov 2011",
    from_party: "Palaniswamy s/o Kaliyaperumal",
    to_party: "Rajeswari & Selvam",
    transaction_type: "sale",
    extent: "36 cents",
    confidence: 0.97,
    human_confirmed: true,
  },
  {
    id: "evt-gv-01-3",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-ec",
    event_date: "22 Jul 2018",
    from_party: "Rajeswari & Selvam",
    to_party: "K. Bhuvaneswari",
    transaction_type: "gift",
    extent: "36 cents",
    confidence: 0.94,
    human_confirmed: true,
  },
  {
    id: "evt-gv-01-4",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-ec",
    event_date: "09 Feb 2021",
    from_party: "K. Bhuvaneswari",
    to_party: "Indian Bank, Thudiyalur Branch",
    transaction_type: "mortgage",
    extent: "36 cents",
    confidence: 0.98,
    human_confirmed: true,
  },
  {
    id: "evt-gv-01-5",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-ec",
    event_date: "15 Jun 2023",
    from_party: "Indian Bank, Thudiyalur Branch",
    to_party: "K. Bhuvaneswari",
    transaction_type: "release",
    extent: "36 cents",
    confidence: 0.96,
    human_confirmed: true,
  },
  {
    id: "evt-gv-01-6",
    plot_id: "kovai-gv-01",
    source_document_id: "doc-gv-01-supp",
    event_date: "02 Aug 2026",
    from_party: "K. Bhuvaneswari",
    to_party: "R. Meenakshi Sundaram",
    transaction_type: "sale",
    extent: "36 cents",
    confidence: 0.88,
    human_confirmed: true,
  },
];

/* ------------------------------------------------------------------ *
 * Scenario B — kovai-sp-02, Saravana Gardens, Saravanampatti.
 * Government-sourced EC, needs review: the second entry's party name and
 * extent came off the scan unclear, so it's flagged and blocks publishing
 * until the seller corrects and confirms it.
 * ------------------------------------------------------------------ */
const sp02Document = {
  id: "doc-sp-02-ec",
  plot_id: "kovai-sp-02",
  uploader_id: "senthil-kumar",
  doc_type: "encumbrance_certificate",
  upload_date: "26 Jul 2026",
  ocr_status: "needs_review",
  ocr_confidence: 0.79,
  verification_tier: "government_sourced",
};

const sp02Events = [
  {
    id: "evt-sp-02-1",
    plot_id: "kovai-sp-02",
    source_document_id: "doc-sp-02-ec",
    event_date: "03 Jan 2005",
    from_party: "Karuppasamy",
    to_party: "Vijayalakshmi w/o Karuppasamy",
    transaction_type: "sale",
    extent: "40 cents",
    confidence: 0.95,
    human_confirmed: true,
  },
  {
    id: "evt-sp-02-2",
    plot_id: "kovai-sp-02",
    source_document_id: "doc-sp-02-ec",
    event_date: "19 Sep 2014",
    from_party: "Vijayalakshmi w/o Karuppasamy",
    to_party: "S. Anbarasu",
    transaction_type: "sale",
    extent: "unclear on scan",
    confidence: 0.58,
    human_confirmed: false,
  },
  {
    id: "evt-sp-02-3",
    plot_id: "kovai-sp-02",
    source_document_id: "doc-sp-02-ec",
    event_date: "27 Apr 2021",
    from_party: "S. Anbarasu",
    to_party: "TN State Apex Co-operative Bank",
    transaction_type: "mortgage",
    extent: "40 cents",
    confidence: 0.93,
    human_confirmed: true,
  },
];

/* ------------------------------------------------------------------ *
 * Scenario C — kovai-kp-03, Kovai Pudur Enclave. Uploaded, still processing:
 * a Document row exists but extraction hasn't produced any events yet.
 * ------------------------------------------------------------------ */
const kp03Document = {
  id: "doc-kp-03-ec",
  plot_id: "kovai-kp-03",
  uploader_id: "senthil-kumar",
  doc_type: "encumbrance_certificate",
  upload_date: "20 Aug 2026",
  ocr_status: "pending",
  ocr_confidence: null,
  verification_tier: "government_sourced",
};

/* kovai-vs-04 (Vadasithur Fields) deliberately has no entry below — that
 * absence IS the fourth state: no document uploaded yet. */

export const documentsByPlot = {
  "kovai-gv-01": [gv01Document, gv01SupplementaryDoc],
  "kovai-sp-02": [sp02Document],
  "kovai-kp-03": [kp03Document],
};

export const eventsByPlot = {
  "kovai-gv-01": gv01Events,
  "kovai-sp-02": sp02Events,
  "kovai-kp-03": [],
};

export const documentsById = Object.fromEntries(
  Object.values(documentsByPlot).flat().map((d) => [d.id, d]),
);
