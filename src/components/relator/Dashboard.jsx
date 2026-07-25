import { Link } from "react-router-dom";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import UploadCard from "./UploadCard";
import VerifiedStamp from "../shared/VerifiedStamp";
import Button from "../shared/Button";
import { uploads, relator } from "./relatorData";

function Stat({ label, value }) {
  return (
    <div className="px-5 py-4">
      <div className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-extrabold leading-none text-graphite">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const totalPlots = uploads.reduce((n, u) => n + u.plotsTotal, 0);
  const totalSold = uploads.reduce((n, u) => n + u.sold, 0);
  const needsReview = uploads.filter((u) => u.extraction === "needs-review");

  return (
    <>
      <RelatorNav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
          {/* header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="u-eyebrow text-brick-lit">Relator workspace</p>
              <h1
                className="mt-4 font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                {relator.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-graphite/84">{relator.agency}</span>
                <VerifiedStamp status={relator.verification} date={relator.verifiedOn} />
              </div>
            </div>
            <Button as={Link} to="/relator/upload" arrow className="self-start md:self-auto">
              Upload new layout
            </Button>
          </div>

          {/* portfolio numbers */}
          <div
            className="mt-10 grid grid-cols-2 divide-graphite/12 border border-graphite/15 sm:grid-cols-4 sm:divide-x"
            style={{ borderRadius: "3px" }}
          >
            <Stat label="Layouts" value={uploads.length} />
            <Stat label="Plots mapped" value={totalPlots} />
            <Stat label="Sold" value={totalSold} />
            <Stat label="Needs review" value={needsReview.length} />
          </div>

          {/* the one thing that actually blocks them */}
          {needsReview.length > 0 && (
            <div
              className="mt-5 flex flex-col gap-4 border border-graphite/30 bg-paper-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderRadius: "3px" }}
            >
              <div>
                <p className="font-display text-base font-bold text-graphite">
                  {needsReview[0].name} can&rsquo;t publish yet
                </p>
                <p className="mt-1 text-sm text-graphite/84">
                  {needsReview[0].flagged} boundaries came out of the trace unclear. Confirm them
                  and the layout goes live.
                </p>
              </div>
              <Button
                as={Link}
                to={`/relator/layouts/${needsReview[0].id}/confirm`}
                arrow
                className="shrink-0"
              >
                Review boundaries
              </Button>
            </div>
          )}

          {/* uploads */}
          <div className="mt-12 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold text-graphite">Your layouts</h2>
            <span className="u-fact text-[0.72rem] text-graphite/84">
              {uploads.length} {uploads.length === 1 ? "layout" : "layouts"}
            </span>
          </div>

          {uploads.length > 0 ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((item) => (
                <UploadCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div
              className="mt-5 border border-dashed border-graphite/25 px-6 py-16 text-center"
              style={{ borderRadius: "3px" }}
            >
              <p className="font-display text-xl font-bold text-graphite">No layouts yet</p>
              <p className="mx-auto mt-2 max-w-sm text-graphite/84">
                Upload an approved DTCP layout sketch. Kaani traces the plot boundaries, you
                confirm them, and buyers can click through every plot.
              </p>
              <Button as={Link} to="/relator/upload" arrow className="mt-6">
                Upload your first layout
              </Button>
            </div>
          )}

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Plot geometry shown is placeholder pending the survey pipeline.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
