import { motion } from "framer-motion";

/* Light "record" ground. brick = verified stays true here too, but on chalk it
 * has to be a solid fill (brick text on light gray fails contrast), so verified
 * reads as a filled badge, pending/source as an concrete outline. */

function StatusChip({ kind, label }) {
  if (kind === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 bg-brick px-2 py-1 u-fact text-[0.62rem] uppercase text-white" style={{ borderRadius: "2px", letterSpacing: "0.12em" }}>
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 6.4 L4.8 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 border border-concrete/50 px-2 py-1 u-fact text-[0.62rem] uppercase text-graphite/84" style={{ borderRadius: "2px", letterSpacing: "0.12em" }}>
      {label}
    </span>
  );
}

const ICONS = {
  sketch: (
    <path d="M4 3h9l4 4v14H4z M13 3v4h4 M8 12h6 M8 16h6" />
  ),
  survey: (
    <path d="M3 21 L21 3 M6 6l1.5 1.5 M10 6l1.5 1.5 M14 10l1.5 1.5 M10 14l1.5 1.5 M6 18l1.5 1.5" />
  ),
  id: (
    <path d="M3 5h18v14H3z M7 10a2 2 0 104 0 2 2 0 10-4 0 M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5 M15 10h4 M15 14h4" />
  ),
  visit: (
    <path d="M12 21s7-6.4 7-11a7 7 0 10-14 0c0 4.6 7 11 7 11z M12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
  ),
};

const RECORDS = [
  {
    icon: "sketch",
    title: "Layout sketch",
    body: "The original DTCP-approved drawing, redrawn to scale — not a photocopy of a photocopy.",
    chip: { kind: "source", label: "Filed · 22 Aug 2019" },
  },
  {
    icon: "survey",
    title: "Survey cross-check",
    body: "Every boundary is matched to its survey and subdivision numbers before a plot goes live.",
    chip: { kind: "verified", label: "Verified" },
  },
  {
    icon: "id",
    title: "Agent identity",
    body: "Whoever lists the plot is checked against a government ID. You see who you're talking to.",
    chip: { kind: "verified", label: "Verified" },
  },
  {
    icon: "visit",
    title: "Last site visit",
    body: "When someone from Kaani last stood on the plot, so the ground matches the paper.",
    chip: { kind: "source", label: "Visited · 14 Jul 2026" },
  },
];

export default function PaperTrail() {
  return (
    <section className="bg-champagne text-ink">
      <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-graphite/84">Provenance</p>
          <h2
            className="mt-4 font-display font-extrabold text-ink"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            Every plot carries its paper trail.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink/78">
            Nothing here is a claim you have to take on faith. Each plot links the document
            behind it, the record it was checked against, and the date someone confirmed it —
            in the open, next to the map.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden border border-ink/12 bg-paper/12 sm:grid-cols-2 lg:grid-cols-4" style={{ borderRadius: "4px" }}>
          {RECORDS.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col gap-4 bg-paper p-6"
            >
              <div className="flex items-center justify-between">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="text-ink/75">
                  {ICONS[r.icon]}
                </svg>
                <span className="u-fact text-[0.62rem] text-ink/65">
                  {String(i + 1).padStart(2, "0")}/04
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{r.title}</h3>
              <p className="text-[0.95rem] leading-relaxed text-ink/74">{r.body}</p>
              <div className="mt-auto pt-1">
                <StatusChip kind={r.chip.kind} label={r.chip.label} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
