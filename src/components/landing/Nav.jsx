import { useState } from "react";
import { Link } from "react-router-dom";
import Wordmark from "../shared/Wordmark";
import Button from "../shared/Button";

/* Buyer-side links. Hash targets stay as plain anchors so they scroll; real
 * paths use Link so navigation stays client-side instead of reloading. */
const LINKS = [
  { label: "Plots", to: "/plots" },
  { label: "Agents", href: "/#agents" },
  { label: "How we verify", href: "/#verify" },
];

function NavItem({ item, className, onClick }) {
  if (item.href) {
    return (
      <a href={item.href} className={className} onClick={onClick}>
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.to} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const deskLink = "u-fact text-[0.78rem] text-graphite/80 transition-colors hover:text-graphite";

  return (
    <header className="sticky top-0 z-40 border-b border-graphite/12 bg-paper/85 backdrop-blur-md">
      {/* survey tick ruler along the very top edge */}
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-graphite) 22%, transparent) 0 1px, transparent 1px 24px)",
        }}
      />
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3.5 sm:px-8">
        <Link to="/" className="rounded-sm" aria-label="Kaani home">
          <Wordmark />
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <ul className="flex items-center gap-7">
            {LINKS.map((l) => (
              <li key={l.label}>
                <NavItem item={l} className={deskLink} />
              </li>
            ))}
          </ul>

          {/* the other side of the marketplace — divided off, because it speaks
              to layout owners rather than buyers */}
          <span aria-hidden="true" className="h-4 w-px bg-graphite/25" />
          <Link
            to="/relator"
            className="u-fact text-[0.78rem] text-graphite/80 transition-colors hover:text-graphite"
          >
            List your layout
          </Link>

          <Button as={Link} to="/plots" variant="ghost" arrow className="!px-4 !py-2.5">
            Open a layout
          </Button>
        </div>

        {/* mobile */}
        <button
          className="flex flex-col gap-1.5 p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`h-px w-6 bg-graphite transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-px w-6 bg-graphite transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-px w-6 bg-graphite transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </nav>

      {open && (
        <div className="border-t border-graphite/12 px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <li key={l.label}>
                <NavItem
                  item={l}
                  onClick={() => setOpen(false)}
                  className="block py-2.5 font-body text-lg text-graphite/80"
                />
              </li>
            ))}
          </ul>

          <div className="mt-3 border-t border-graphite/12 pt-3">
            <Link
              to="/relator"
              onClick={() => setOpen(false)}
              className="block py-2.5 font-body text-lg text-graphite/80"
            >
              List your layout
            </Link>
          </div>

          <Button as={Link} to="/plots" variant="primary" arrow className="mt-3 w-full" onClick={() => setOpen(false)}>
            Open a layout
          </Button>
        </div>
      )}
    </header>
  );
}
