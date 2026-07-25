/* Buttons never use brick — brick is reserved for the "verified" state alone.
 * On the light ground the dark values do the work: primary is solid graphite,
 * ghost is a graphite outline. Dark blends in as UI rather than as a surface. */
const base =
  "inline-flex items-center justify-center gap-2 u-fact text-[0.8rem] uppercase transition-colors duration-200 focus-visible:outline-2 disabled:opacity-40";

const styles = {
  primary: "bg-graphite text-paper px-5 py-3 hover:bg-ink",
  ghost:
    "border border-graphite/35 text-graphite px-5 py-3 hover:border-graphite/70 hover:bg-graphite/5",
  link: "text-graphite/85 hover:text-graphite px-1 py-1",
};

export default function Button({ as = "button", variant = "primary", className = "", children, arrow = false, ...props }) {
  const Comp = as;
  return (
    <Comp
      className={`${base} ${styles[variant]} ${className}`}
      style={{ borderRadius: "2px", letterSpacing: "0.1em" }}
      {...props}
    >
      {children}
      {arrow && (
        <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true" className="translate-y-px">
          <path d="M1 5 H12 M8 1 L12 5 L8 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </Comp>
  );
}
