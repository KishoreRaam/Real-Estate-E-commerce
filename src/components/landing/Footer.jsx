import { Link } from "react-router-dom";
import Wordmark from "../shared/Wordmark";
import Button from "../shared/Button";

const COLS = [
  { head: "Explore", links: [["Plots", "/plots"], ["Agents", "/#agents"], ["How we verify", "/#verify"]] },
  { head: "Company", links: [["About Kaani", "#"], ["List your layout", "/relator"], ["Contact", "#"]] },
  { head: "Legal", links: [["Terms", "#"], ["Privacy", "#"], ["Disclaimer", "#"]] },
];

export default function Footer() {
  return (
    <footer className="relative bg-paper">
      {/* blend: eases in from the champagne section above instead of cutting hard */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-champagne) 0%, color-mix(in srgb, var(--color-champagne) 45%, transparent) 55%, transparent 100%)",
        }}
      />

      {/* closing CTA */}
      <div className="relative z-10 border-t border-graphite/12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start gap-6 px-5 py-16 sm:px-8 md:flex-row md:items-center md:justify-between">
          <h2
            className="font-display font-extrabold text-graphite"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            Start with the map.
          </h2>
          <Button as={Link} to="/plots" arrow>
            Open a live layout
          </Button>
        </div>
      </div>

      <div className="border-t border-graphite/12">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-graphite/84">
              Interactive plot maps from approved DTCP layouts, and verified agents, for land
              buyers in Coimbatore.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.head}>
              <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.58rem" }}>{col.head}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    {href.startsWith("/") ? (
                      <Link to={href} className="text-sm text-graphite/85 transition-colors hover:text-graphite">
                        {label}
                      </Link>
                    ) : (
                      <a href={href} className="text-sm text-graphite/85 transition-colors hover:text-graphite">
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* coordinate baseline */}
      <div className="border-t border-graphite/12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex flex-col gap-2">
            <span className="u-fact text-[0.68rem] text-graphite/84">
              11.0168° N · 76.9558° E — Coimbatore, Tamil Nadu
            </span>
            <span className="u-fact text-[0.68rem] text-graphite/84">
              © {new Date().getFullYear()} Kaani · Plot data pending survey pipeline
            </span>
          </div>
          <div className="flex items-center">
            <a 
              href="https://www.lifeofraam.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="u-eyebrow inline-flex items-center gap-2 rounded-full border border-brick/20 bg-brick/5 px-3 py-1.5 text-brick transition-colors hover:bg-brick/10" 
              style={{ fontSize: "0.62rem" }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brick opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brick"></span>
              </span>
              Created By Raam
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
