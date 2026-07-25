/* ------------------------------------------------------------------ *
 * PLACEHOLDER RELATOR DATA — example values, not real registrations.
 *
 * TNRERA numbers, agency details and document states below are mock. Nothing
 * here is validated against a government API; the verification screens render
 * states only. Wire these to the real registry when that integration lands.
 * ------------------------------------------------------------------ */

export const relator = {
  id: "senthil-kumar",
  name: "Senthil Kumar",
  agency: "SK Properties",
  phone: "+91 98430 11224",
  email: "senthil@skproperties.in",
  areas: ["Thudiyalur", "Saravanampatti"],
  since: "2021",
  // Shown to buyers masked — never render the full number on a public page.
  tnrera: "TN/AGENT/0142/2021",
  verification: "verified", // "verified" | "pending" | "action"
  verifiedOn: "14 Jul 2026",
  photo: null, // no stock portrait; the UI falls back to initials
};

export function maskRera(no) {
  // Keep the prefix and year, mask the serial: TN/AGENT/••••/2021
  const parts = no.split("/");
  if (parts.length < 4) return no;
  return [parts[0], parts[1], "•".repeat(parts[2].length), parts[3]].join("/");
}

/* Relators as a buyer sees them. The landing page's agent section and the
 * public profile both read from here, so a name shown to a buyer always has a
 * real profile behind it. `listingIds` point at entries in plotData's layouts. */
export const publicRelators = [
  {
    id: "senthil-kumar",
    name: "Senthil Kumar",
    agency: "SK Properties",
    areas: "Thudiyalur · Saravanampatti",
    layouts: 14,
    since: "2021",
    tnrera: "TN/AGENT/0142/2021",
    verification: "verified",
    verifiedOn: "14 Jul 2026",
    listingIds: ["kovai-gv-01", "kovai-sp-02"],
  },
  {
    id: "lakshmi-realtors",
    name: "Lakshmi Realtors",
    agency: "Lakshmi Realtors",
    areas: "Kovaipudur · Vadavalli",
    layouts: 22,
    since: "2019",
    tnrera: "TN/AGENT/0819/2019",
    verification: "verified",
    verifiedOn: "02 Mar 2026",
    listingIds: ["kovai-kp-03"],
  },
  {
    id: "r-anand",
    name: "R. Anand",
    agency: null,
    areas: "Peelamedu · Singanallur",
    layouts: 9,
    since: "2023",
    tnrera: "TN/AGENT/3307/2023",
    verification: "verified",
    verifiedOn: "21 Jun 2026",
    listingIds: ["kovai-sp-02"],
  },
];

export const documents = [
  {
    id: "rera",
    label: "TNRERA certificate",
    hint: "PDF or photo of your registration certificate",
    file: "tnrera-cert-2021.pdf",
    status: "verified",
    checkedOn: "14 Jul 2026",
  },
  {
    id: "pan",
    label: "PAN card",
    hint: "Used to confirm your identity. Never shown to buyers.",
    file: "pan-scan.jpg",
    status: "verified",
    checkedOn: "14 Jul 2026",
  },
];

/* Layouts this relator has uploaded. `extraction` drives the dashboard badge:
 *   processing    — pipeline is still tracing boundaries
 *   needs-review  — traced, but some boundaries are flagged
 *   ready         — every flagged boundary confirmed, not yet published
 *   published     — live for buyers
 */
export const uploads = [
  {
    id: "kovai-gv-01",
    name: "Green Valley Nagar",
    place: "Thudiyalur, Coimbatore",
    dtcp: "DTCP/LP/0472/2019",
    uploadedOn: "18 Jul 2026",
    plotsTotal: 12,
    sold: 3,
    reserved: 2,
    available: 7,
    flagged: 5,
    extraction: "needs-review",
  },
  {
    id: "kovai-sp-02",
    name: "Saravana Gardens",
    place: "Saravanampatti, Coimbatore",
    dtcp: "DTCP/LP/0611/2021",
    uploadedOn: "02 Jun 2026",
    plotsTotal: 34,
    sold: 12,
    reserved: 4,
    available: 18,
    flagged: 0,
    extraction: "published",
  },
  {
    id: "kovai-kp-03",
    name: "Kovai Pudur Enclave",
    place: "Kovaipudur, Coimbatore",
    dtcp: "DTCP/LP/0288/2018",
    uploadedOn: "24 Jul 2026",
    plotsTotal: 18,
    sold: 0,
    reserved: 0,
    available: 18,
    flagged: 0,
    extraction: "processing",
  },
];

export const EXTRACTION_LABELS = {
  processing: "Extracting",
  "needs-review": "Needs review",
  ready: "Ready to publish",
  published: "Published",
};

/* Which stamp tone each extraction state gets. Mauve stays reserved for
 * "a person confirmed this", so only published earns it. */
export function extractionStamp(state) {
  if (state === "published") return "verified";
  if (state === "needs-review") return "action";
  return "pending";
}
