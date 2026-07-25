import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Wordmark from "../shared/Wordmark";
import Button from "../shared/Button";

/* Same chassis as the buyer nav — tick ruler, wordmark, mono links — with a
 * workspace tag so a relator always knows which side of Kaani they're on. */
const LINKS = [
  { label: "Dashboard", to: "/relator", end: true },
  { label: "My listings", to: "/relator/listings" },
  { label: "Verification", to: "/relator/profile#verification" },
  { label: "My profile", to: "/relator/profile" },
];

export default function RelatorNav() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    "u-fact text-[0.78rem] transition-colors " +
    (isActive ? "text-graphite" : "text-graphite/84 hover:text-graphite");

  return (
    <header className="sticky top-0 z-40 border-b border-graphite/12 bg-paper/85 backdrop-blur-md">
      <div
        aria-hidden="true"
        className="h-1.5 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-graphite) 22%, transparent) 0 1px, transparent 1px 24px)",
        }}
      />
      <nav className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-3.5 sm:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="rounded-sm" aria-label="Kaani home">
            <Wordmark />
          </Link>
          <span
            className="hidden border border-graphite/25 px-2 py-0.5 u-eyebrow text-graphite/84 sm:inline-block"
            style={{ fontSize: "0.52rem", borderRadius: "2px" }}
          >
            Relator
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-6">
            {LINKS.map((l) => (
              <li key={l.label}>
                {l.to.includes("#") ? (
                  <a href={l.to} className="u-fact text-[0.78rem] text-graphite/84 transition-colors hover:text-graphite">
                    {l.label}
                  </a>
                ) : (
                  <NavLink to={l.to} end={l.end} className={linkClass}>
                    {l.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <Button as={Link} to="/relator/upload" variant="ghost" arrow className="!px-4 !py-2.5">
            Upload layout
          </Button>
        </div>

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
                {l.to.includes("#") ? (
                  <a
                    href={l.to}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 font-body text-lg text-graphite/80"
                  >
                    {l.label}
                  </a>
                ) : (
                  <NavLink
                    to={l.to}
                    end={l.end}
                    onClick={() => setOpen(false)}
                    className="block py-2.5 font-body text-lg text-graphite/80"
                  >
                    {l.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
          <Button as={Link} to="/relator/upload" variant="primary" arrow className="mt-3 w-full">
            Upload layout
          </Button>
        </div>
      )}
    </header>
  );
}
