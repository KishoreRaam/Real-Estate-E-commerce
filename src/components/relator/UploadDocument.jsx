import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import Button from "../shared/Button";

/* The pipeline's real stages, named the way a seller would describe them. */
const STAGES = [
  { id: "read", label: "Reading the certificate", detail: "Straightening the scan and finding each page" },
  { id: "extract", label: "Extracting entries", detail: "Finding every registered transaction in the table" },
  { id: "match", label: "Matching parties & survey numbers", detail: "Reading names, dates and extents off each row" },
  { id: "score", label: "Scoring each entry", detail: "Flagging rows that came out unclear" },
];

// Mock pipeline always resolves here — the sheet you actually drop doesn't
// change the outcome yet, same convention LayoutUpload uses for its trace.
const TARGET_PLOT = "kovai-sp-02";

function Dropzone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={
        "relative flex flex-col items-center justify-center gap-5 border border-dashed px-6 py-16 text-center transition-colors " +
        (dragging ? "border-graphite bg-graphite/5" : "border-graphite/30")
      }
      style={{ borderRadius: "4px" }}
    >
      {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos) => (
        <span
          key={pos}
          aria-hidden="true"
          className={`absolute ${pos} h-3 w-3 border-graphite/45`}
          style={{
            borderTopWidth: pos.includes("top") ? 1 : 0,
            borderBottomWidth: pos.includes("bottom") ? 1 : 0,
            borderLeftWidth: pos.includes("left") ? 1 : 0,
            borderRightWidth: pos.includes("right") ? 1 : 0,
          }}
        />
      ))}

      <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" className="text-graphite/84">
        <path d="M4 3h9l4 4v14H4z" strokeLinejoin="round" />
        <path d="M13 3v4h4" strokeLinejoin="round" />
        <path d="M7 12h10M7 15.5h10M7 19h6" strokeLinecap="round" />
      </svg>

      <div>
        <p className="font-display text-xl font-bold text-graphite">Drop the Encumbrance Certificate here</p>
        <p className="mx-auto mt-2 max-w-md text-graphite/84">
          The full PDF or clear photos of every page, from the Sub-Registrar&rsquo;s office. Up
          to 25 MB. Kaani reads every registered entry and turns it into a plain-language
          timeline.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,application/pdf"
        className="sr-only"
        id="ec-file"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button as="label" htmlFor="ec-file" className="cursor-pointer">
        Choose a file
      </Button>

      <p className="u-fact text-[0.66rem] text-graphite/84">
        Nothing is published until you confirm every entry.
      </p>
    </div>
  );
}

function Processing({ file, stage, reduce }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr]">
      <div className="relative overflow-hidden border border-graphite/15 bg-paper p-6" style={{ borderRadius: "3px" }}>
        <div aria-hidden="true" className="flex flex-col gap-3 opacity-60">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="h-2.5 bg-graphite/12" style={{ width: `${86 - i * 4}%`, borderRadius: "1px" }} />
          ))}
        </div>
        {!reduce && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-6 top-0 h-full"
            animate={{ y: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div
              className="h-px w-full"
              style={{
                background: "var(--color-graphite)",
                boxShadow: "0 0 14px 2px color-mix(in srgb, var(--color-graphite) 45%, transparent)",
              }}
            />
          </motion.div>
        )}
      </div>

      <div>
        <p className="u-eyebrow text-brick-lit">Processing</p>
        <h2
          className="mt-4 font-display font-extrabold text-graphite"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
        >
          Extracting the register…
        </h2>
        <p className="mt-3 u-fact text-[0.72rem] text-graphite/84">{file?.name}</p>

        <ol className="mt-8 flex flex-col gap-5">
          {STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <li key={s.id} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className={
                    "mt-1 h-2.5 w-2.5 shrink-0 rotate-45 border " +
                    (done ? "border-brick bg-brick" : active ? "border-graphite bg-graphite" : "border-graphite/30")
                  }
                />
                <div>
                  <p className={"font-display text-base font-bold " + (done || active ? "text-graphite" : "text-graphite/84")}>
                    {s.label}
                    {active && <span className="u-fact ml-2 text-[0.7rem] font-normal text-graphite/84">running</span>}
                    {done && <span className="u-fact ml-2 text-[0.7rem] font-normal text-brick-lit">done</span>}
                  </p>
                  <p className="mt-1 text-sm text-graphite/84">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="mt-8 text-sm leading-relaxed text-graphite/84">
          This usually takes under a minute. You&rsquo;ll get the register next, with anything
          unclear flagged for you to confirm.
        </p>
      </div>
    </div>
  );
}

export default function UploadDocument() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(0);

  // Mock pipeline run. Replace with the real job's progress events.
  useEffect(() => {
    if (!file) return;
    if (stage >= STAGES.length) {
      const done = setTimeout(() => navigate(`/relator/layouts/${TARGET_PLOT}/history`), 600);
      return () => clearTimeout(done);
    }
    const t = setTimeout(() => setStage((s) => s + 1), 1100);
    return () => clearTimeout(t);
  }, [file, stage, navigate]);

  return (
    <>
      <RelatorNav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/relator" className="transition-colors hover:text-graphite">
              Dashboard
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">Upload encumbrance certificate</span>
          </nav>

          {!file ? (
            <div className="mt-6 max-w-3xl">
              <p className="u-eyebrow text-brick-lit">Document timeline</p>
              <h1
                className="mt-4 font-display font-extrabold text-graphite"
                style={{ fontSize: "clamp(2rem, 4.5vw, 3rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
              >
                Upload the Encumbrance Certificate.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-graphite/80">
                Kaani reads every registered sale, mortgage, gift and release off the
                certificate and lays it out as a timeline buyers can actually follow. You check
                it, fix anything it got wrong, and publish.
              </p>

              <div className="mt-9">
                <Dropzone onFile={setFile} />
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <Processing file={file} stage={stage} reduce={reduce} />
            </div>
          )}

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Extraction is simulated here — the OCR pipeline runs separately. This tool reads
            what the certificate states; it does not certify clear title.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
