import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../shared/Button";
import { publicRelators, maskRera } from "../relator/relatorData";

const AGENTS = publicRelators;

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Agents() {
  return (
    <section id="agents" className="scroll-mt-20 bg-champagne text-ink">
      <div className="mx-auto max-w-[1180px] px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="u-eyebrow text-graphite/84">Agents</p>
            <h2
              className="mt-4 font-display font-extrabold text-ink"
              style={{ fontSize: "clamp(1.9rem, 4vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              Work with agents who&rsquo;ve shown their papers.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink/78">
              Every agent on Kaani is checked against a government ID, and their listings are
              tied to real approved layouts. You know who you&rsquo;re dealing with before you
              pick up the phone.
            </p>
          </div>
          <Button as={Link} to="/plots" variant="ghost" arrow className="!border-ink/25 !text-ink hover:!bg-paper/5 self-start whitespace-nowrap md:self-auto">
            Browse verified agents
          </Button>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {AGENTS.map((a, i) => (
            <motion.article
              key={a.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col gap-5 border border-ink/12 bg-paper p-6"
              style={{ borderRadius: "4px" }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex h-12 w-12 items-center justify-center border border-ink/20 font-display text-lg font-bold text-ink"
                  style={{ borderRadius: "3px" }}
                >
                  {initials(a.name)}
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink">{a.name}</h3>
                  <p className="text-sm text-ink/68">{a.areas}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 bg-brick px-2 py-1 u-fact text-[0.62rem] uppercase text-white" style={{ borderRadius: "2px", letterSpacing: "0.12em" }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                    <path d="M2 6.4 L4.8 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  ID verified
                </span>
                <span className="u-fact text-[0.66rem] text-ink/65">{maskRera(a.tnrera)}</span>
              </div>

              <div className="mt-auto grid grid-cols-2 gap-4 border-t border-ink/12 pt-4">
                <div>
                  <div className="font-display text-2xl font-extrabold text-ink">{a.layouts}</div>
                  <div className="u-eyebrow text-ink/60" style={{ fontSize: "0.55rem" }}>Layouts listed</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-extrabold text-ink">{a.since}</div>
                  <div className="u-eyebrow text-ink/60" style={{ fontSize: "0.55rem" }}>On Kaani since</div>
                </div>
              </div>

              <Link
                to={`/agents/${a.id}`}
                className="u-fact text-[0.7rem] uppercase text-ink/78 underline-offset-4 transition-colors hover:text-ink hover:underline"
                style={{ letterSpacing: "0.1em" }}
              >
                See profile &amp; listings →
              </Link>
            </motion.article>
          ))}
        </div>

        {/* The other side of the marketplace. Sits on the ink ground inside the
            light record section — ink is the drawing surface, and putting a
            layout on Kaani is drawing work, not record-keeping. */}
        <div
          id="list-your-layout"
          className="mt-16 flex scroll-mt-24 flex-col gap-7 bg-paper px-6 py-10 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
          style={{ borderRadius: "4px" }}
        >
          <div className="max-w-xl">
            <p className="u-eyebrow text-brick-lit">For layout owners &amp; agents</p>
            <h3
              className="mt-4 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Own a layout? Put it on the map.
            </h3>
            <p className="mt-4 leading-relaxed text-graphite/80">
              Upload the approved DTCP sketch. Kaani traces every plot boundary, you confirm
              the ones it wasn&rsquo;t sure about, and buyers click through your layout instead
              of squinting at a photocopy.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-3">
            <Button as={Link} to="/relator" arrow>
              List your layout
            </Button>
            <span className="u-fact text-[0.66rem] text-graphite/84">
              TNRERA-registered agents only
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
