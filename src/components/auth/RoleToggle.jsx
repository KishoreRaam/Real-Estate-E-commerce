const ROLES = [
  { id: "buyer", label: "Buyer" },
  { id: "relator", label: "Agent / relator" },
];

/* A two-segment control, not a pill — reuses Button's own primary/ghost
 * vocabulary (solid graphite vs. graphite text) instead of inventing a new
 * "selected" color. */
export default function RoleToggle({ role, onChange }) {
  return (
    <div
      role="radiogroup"
      aria-label="I am a"
      className="inline-flex border border-graphite/20 bg-paper p-1"
      style={{ borderRadius: "2px" }}
    >
      {ROLES.map((r) => {
        const active = role === r.id;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(r.id)}
            className={`u-fact px-4 py-2 text-[0.78rem] uppercase transition-colors ${
              active ? "bg-graphite text-paper" : "text-graphite/85 hover:text-graphite"
            }`}
            style={{ borderRadius: "1px", letterSpacing: "0.08em" }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}
