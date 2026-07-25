/* Kaani wordmark. The "i" dot is replaced by a north-arrow tick — the mark is
 * literally a surveyor's bearing. Mauve on the arrow ties the logo to the one
 * accent that means "verified". */
export default function Wordmark({ className = "", showPlace = false }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="inline-flex items-center">
        <svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true" className="mr-1.5">
          <line x1="8" y1="20" x2="8" y2="6" stroke="currentColor" strokeWidth="1.4" opacity="0.5" />
          <path d="M8 0 L12 9 L8 6 L4 9 Z" fill="var(--color-brick)" />
        </svg>
        <span
          className="font-display font-extrabold tracking-tight text-graphite"
          style={{ fontSize: "1.35rem", lineHeight: 1 }}
        >
          Kaani
        </span>
      </span>
      {showPlace && (
        <span className="u-eyebrow text-graphite/84" style={{ fontSize: "0.6rem" }}>
          Coimbatore
        </span>
      )}
    </span>
  );
}
