import { motion, useReducedMotion } from "framer-motion";

/* An ink-stamp mark. Mauve is reserved for "verified" across the whole app,
 * so this is the only place the accent means what it says.
 *
 *   verified  brick   — confirmed by a person
 *   pending   concrete   — recessive; waiting, nothing to do
 *   action    chalk   — bright, because it needs the relator to act
 *
 * Salience is carried by luminance, not hue: concrete recedes on the ink ground,
 * chalk steps forward. */
const STYLES = {
  verified: "border-brick/60 text-brick-lit-lit",
  pending: "border-concrete/70 text-graphite/84",
  action: "border-graphite/70 text-graphite",
};

const LABELS = {
  verified: "Verified",
  pending: "Pending",
  action: "Action required",
};

function Glyph({ status }) {
  if (status === "verified") {
    return (
      <path
        d="M2 6.4 L4.8 9 L10 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }
  if (status === "action") {
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 2.6 V6.6" />
        <path d="M6 9.1 V9.2" />
      </g>
    );
  }
  return <circle cx="6" cy="6" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2.2" />;
}

export default function VerifiedStamp({
  status = "verified",
  date,
  label,
  animate = false,
  className = "",
}) {
  const reduce = useReducedMotion();
  const kind = STYLES[status] ? status : "pending";

  const inner = (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 u-fact text-[0.68rem] uppercase ${STYLES[kind]} ${className}`}
      style={{ letterSpacing: "0.16em", borderRadius: "2px" }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="shrink-0">
        <Glyph status={kind} />
      </svg>
      {label ?? LABELS[kind]}
      {date && <span className="opacity-60">· {date}</span>}
    </span>
  );

  if (!animate || reduce || kind !== "verified") return inner;

  return (
    <motion.span
      className="inline-block"
      initial={{ opacity: 0, scale: 1.25, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: -3 }}
      transition={{ duration: 0.34, delay: 1.75, ease: [0.2, 1.4, 0.4, 1] }}
    >
      {inner}
    </motion.span>
  );
}
