import { useState } from "react";
import { motion } from "framer-motion";

/* Honest answers, including the ones that undersell the product — the same
 * "no claim without a document behind it" standard as PaperTrail applies to
 * plots applies to marketing copy: v1 constraints stay named as v1
 * constraints, not smoothed over. */
const ITEMS = [
  {
    q: "Is this live government data?",
    a: "Not yet. What you see today is a UI-state preview of what a DigiLocker / TNRERA integration would look like once it's wired up — the plot boundaries and records on this site are sample data, not a live feed from any government system.",
  },
  {
    q: "How is this different from a listing site like Housing.com or 99acres?",
    a: "Listing sites show you photos and a written description of a plot for sale. Kaani shows the plot's actual boundary, clickable, inside the real DTCP-approved layout it belongs to — you click the shape instead of reading about it.",
  },
  {
    q: "How is this different from a record-lookup site like TNREGINET or Landeed?",
    a: "Those sites check whether a document is genuine — encumbrance, patta, title chain. Kaani doesn't verify title, and isn't a substitute for that check. It answers a different question: where exactly the boundaries sit inside the approved layout.",
  },
  {
    q: "Which areas or districts are covered?",
    a: "Coimbatore only, right now. This is a pilot in one city — there's no coverage in other districts yet, and we're not going to claim otherwise.",
  },
  {
    q: "How is the plot map generated?",
    a: "The pipeline uses OpenCV contour extraction to trace plot boundaries from the DTCP sketch, plus Claude Vision to read plot numbers and labels off the sheet. In this v1, that pipeline has been run against a small set of sample images ahead of time — it isn't yet a live, on-demand upload-to-map pipeline.",
  },
];

function ChevronIcon({ open }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M3.5 6 L8 10.5 L12.5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FAQItem({ item, open, onToggle, index }) {
  const panelId = `faq-panel-${index}`;
  const buttonId = `faq-button-${index}`;
  return (
    <div className="border-b border-ink/14 last:border-b-0">
      <h3>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-brick-lit"
        >
          <span className="font-display text-lg font-bold text-ink">{item.q}</span>
          <ChevronIcon open={open} />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="max-w-2xl pb-5 text-[0.98rem] leading-relaxed text-ink/85">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="relative scroll-mt-24 bg-champagne bg-survey-grid text-ink">
      <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <p className="u-eyebrow text-graphite/88">Questions</p>
          <h2
            className="mt-4 font-display font-extrabold text-ink"
            style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
          >
            Before you ask a broker, ask this.
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 border-t border-ink/14 bg-paper px-6 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.25)] sm:px-8"
          style={{ borderRadius: "4px" }}
        >
          {ITEMS.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              index={i}
              open={openIndex === i}
              onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
