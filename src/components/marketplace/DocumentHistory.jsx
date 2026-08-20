import { Link, useParams } from "react-router-dom";
import Nav from "../landing/Nav";
import Footer from "../landing/Footer";
import DocumentTimeline from "../shared/DocumentTimeline";
import { documentsByPlot, eventsByPlot, EMPTY } from "../shared/documentData";
import { layouts } from "../shared/plotData";

export default function DocumentHistory() {
  const { layoutId } = useParams();
  const meta = layouts.find((l) => l.id === layoutId) ?? layouts[0];

  const documents = documentsByPlot[meta.id] ?? EMPTY;
  const events = eventsByPlot[meta.id] ?? EMPTY;
  const hasEC = documents.some((d) => d.doc_type === "encumbrance_certificate");

  return (
    <>
      <Nav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[860px] px-5 py-10 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to={`/plots/${meta.id}`} className="transition-colors hover:text-graphite">
              {meta.name}
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">Document history</span>
          </nav>

          <div className="mt-5 border-b border-graphite/12 pb-7">
            <p className="u-eyebrow text-brick-lit">Document history</p>
            <h1
              className="mt-3 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.7rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              {meta.name}
            </h1>
            <p className="mt-2 max-w-xl text-graphite/84">{meta.place}</p>
            {hasEC && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-graphite/84">
                This is a plain-language read of what the Encumbrance Certificate for this plot
                states — the registered sales, mortgages, gifts and releases the Sub-Registrar
                has on file. It is not a certification of clear title; confirm the certificate
                itself before you rely on it for a purchase decision.
              </p>
            )}
          </div>

          <div className="mt-8">
            <DocumentTimeline documents={documents} events={events} mode="view" />
          </div>

          {documents.length > 0 && (
            <p className="mt-8 u-fact text-[0.68rem] text-graphite/84">
              Extraction shown here is simulated pending the real OCR pipeline. Dates, names and
              extents are placeholder.
            </p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
