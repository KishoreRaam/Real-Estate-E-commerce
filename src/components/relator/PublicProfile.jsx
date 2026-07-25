import { Link, useParams } from "react-router-dom";
import Nav from "../landing/Nav";
import Footer from "../landing/Footer";
import LayoutCard from "../marketplace/LayoutCard";
import VerifiedStamp from "../shared/VerifiedStamp";
import Button from "../shared/Button";
import { layouts } from "../shared/plotData";
import { publicRelators, maskRera } from "./relatorData";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* What a buyer sees. Deliberately uses the buyer nav and the buyer's own
 * LayoutCard — from this side, a relator is just another verified fact
 * attached to the layouts they list. */
export default function PublicProfile() {
  const { relatorId } = useParams();
  const person = publicRelators.find((r) => r.id === relatorId);

  if (!person) {
    return (
      <>
        <Nav />
        <main className="min-h-[70vh] bg-paper bg-survey-grid">
          <div className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
            <h1 className="font-display text-3xl font-extrabold text-graphite">
              No agent at this address
            </h1>
            <p className="mt-3 max-w-md text-graphite/84">
              This profile isn&rsquo;t on Kaani. Browse the approved layouts to find the agent
              listing the plot you&rsquo;re after.
            </p>
            <Button as={Link} to="/plots" arrow className="mt-7">
              Browse layouts
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const listings = layouts.filter((l) => person.listingIds.includes(l.id));

  return (
    <>
      <Nav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/plots" className="transition-colors hover:text-graphite">
              Layouts
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">{person.name}</span>
          </nav>

          {/* identity */}
          <div className="mt-6 flex flex-col gap-7 border-b border-graphite/12 pb-9 sm:flex-row sm:items-start">
            <span
              className="flex h-24 w-24 shrink-0 items-center justify-center border border-graphite/25 font-display text-3xl font-bold text-graphite"
              style={{ borderRadius: "3px" }}
              aria-hidden="true"
            >
              {initials(person.name)}
            </span>

            <div className="min-w-0 flex-1">
              <h1
                className="font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {person.name}
              </h1>
              {person.agency && <p className="mt-2 text-lg text-graphite/80">{person.agency}</p>}
              <p className="mt-1 text-graphite/84">{person.areas}</p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <VerifiedStamp status={person.verification} date={person.verifiedOn} />
                <span className="u-fact text-[0.7rem] text-graphite/84">
                  TNRERA {maskRera(person.tnrera)}
                </span>
              </div>
            </div>

            <Button as="a" href="#enquire" arrow className="shrink-0">
              Contact {person.name.split(" ")[0]}
            </Button>
          </div>

          {/* what the badge actually means */}
          <div
            className="mt-7 grid gap-px overflow-hidden border border-graphite/15 bg-graphite/12 sm:grid-cols-3"
            style={{ borderRadius: "3px" }}
          >
            <div className="bg-paper px-5 py-4">
              <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                Identity
              </div>
              <p className="mt-1.5 text-sm text-graphite/85">
                Checked against a government ID by Kaani.
              </p>
            </div>
            <div className="bg-paper px-5 py-4">
              <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                TNRERA register
              </div>
              <p className="mt-1.5 text-sm text-graphite/85">
                Registration confirmed, last checked {person.verifiedOn}.
              </p>
            </div>
            <div className="bg-paper px-5 py-4">
              <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                On Kaani since
              </div>
              <p className="mt-1.5 text-sm text-graphite/85">{person.since}</p>
            </div>
          </div>

          {/* listings */}
          <div className="mt-12 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-graphite">Active listings</h2>
            <span className="u-fact text-[0.72rem] text-graphite/84">
              {listings.length} {listings.length === 1 ? "layout" : "layouts"}
            </span>
          </div>

          {listings.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((item) => (
                <LayoutCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div
              className="mt-5 border border-dashed border-graphite/25 px-6 py-14 text-center"
              style={{ borderRadius: "3px" }}
            >
              <p className="font-display text-lg font-bold text-graphite">No layouts listed right now</p>
              <p className="mt-2 text-graphite/84">
                {person.name.split(" ")[0]} has nothing live on Kaani at the moment.
              </p>
            </div>
          )}

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Agent details are placeholder. No payment or agreement happens on Kaani.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
