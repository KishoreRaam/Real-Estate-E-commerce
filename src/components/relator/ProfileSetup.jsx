import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import RelatorNav from "./RelatorNav";
import Footer from "../landing/Footer";
import Button from "../shared/Button";
import VerifiedStamp from "../shared/VerifiedStamp";
import { relator, documents as seedDocs } from "./relatorData";

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Field({ id, label, value, onChange, placeholder, optional, hint, type = "text" }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
        {label}
        {optional && <span className="ml-1.5 normal-case tracking-normal text-graphite/84">optional</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border border-graphite/20 bg-paper px-3 py-2.5 u-fact text-sm text-graphite transition-colors placeholder:text-graphite/84 focus:border-graphite/60"
        style={{ borderRadius: "2px" }}
      />
      {hint && <p className="u-fact text-[0.66rem] text-graphite/84">{hint}</p>}
    </div>
  );
}

function DocumentRow({ doc, onReplace }) {
  const inputRef = useRef(null);
  return (
    <div className="flex flex-col gap-3 border-b border-graphite/10 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 text-graphite/84">
            <path d="M4 3h9l4 4v14H4z" strokeLinejoin="round" />
            <path d="M13 3v4h4" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-sm font-bold text-graphite">{doc.label}</span>
        </div>
        {doc.file ? (
          <p className="mt-1.5 u-fact text-[0.68rem] text-graphite/84">
            {doc.file}
            {doc.checkedOn && ` · checked ${doc.checkedOn}`}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-graphite/84">{doc.hint}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <VerifiedStamp status={doc.status} />
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          className="sr-only"
          id={`doc-${doc.id}`}
          onChange={(e) => e.target.files?.[0] && onReplace(doc.id, e.target.files[0].name)}
        />
        <Button as="label" htmlFor={`doc-${doc.id}`} variant="ghost" className="cursor-pointer !px-3 !py-2">
          {doc.file ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  const [name, setName] = useState(relator.name);
  const [phone, setPhone] = useState(relator.phone);
  const [agency, setAgency] = useState(relator.agency);
  const [rera, setRera] = useState(relator.tnrera);
  const [docs, setDocs] = useState(seedDocs);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef(null);
  const [photoName, setPhotoName] = useState(null);

  const replaceDoc = (id, file) =>
    setDocs((d) => d.map((x) => (x.id === id ? { ...x, file, status: "pending", checkedOn: null } : x)));

  return (
    <>
      <RelatorNav />
      <main className="min-h-[70vh] bg-paper bg-survey-grid">
        <div className="mx-auto max-w-[820px] px-5 py-12 sm:px-8">
          <nav aria-label="Breadcrumb" className="u-fact text-[0.72rem] text-graphite/84">
            <Link to="/relator" className="transition-colors hover:text-graphite">
              Dashboard
            </Link>
            <span className="mx-2 text-graphite/84">/</span>
            <span className="text-graphite/85">My profile</span>
          </nav>

          <div className="mt-6">
            <p className="u-eyebrow text-brick-lit">Your profile</p>
            <h1
              className="mt-4 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(2rem, 4.5vw, 2.9rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}
            >
              How buyers will know you.
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-graphite/80">
              Buyers are making the largest purchase of their lives. What you put here is what
              they check you against.
            </p>
          </div>

          {/* ---- basic info ---- */}
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-graphite">Your details</h2>

            <div className="mt-5 border border-graphite/15" style={{ borderRadius: "3px" }}>
              {/* photo */}
              <div className="flex items-center gap-5 border-b border-graphite/10 px-5 py-5">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center border border-graphite/25 font-display text-xl font-bold text-graphite"
                  style={{ borderRadius: "3px" }}
                  aria-hidden="true"
                >
                  {initials(name || "K")}
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-graphite">Photo</p>
                  <p className="mt-1 text-sm text-graphite/84">
                    {photoName ?? "A clear photo of your face. Buyers see this before they call."}
                  </p>
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  id="photo-file"
                  onChange={(e) => e.target.files?.[0] && setPhotoName(e.target.files[0].name)}
                />
                <Button as="label" htmlFor="photo-file" variant="ghost" className="ml-auto shrink-0 cursor-pointer !px-3 !py-2">
                  {photoName ? "Replace" : "Upload"}
                </Button>
              </div>

              <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
                <Field id="rp-name" label="Full name" value={name} onChange={setName} placeholder="As on your ID" />
                <Field id="rp-phone" label="Phone" value={phone} onChange={setPhone} placeholder="+91 " type="tel" />
                <div className="sm:col-span-2">
                  <Field
                    id="rp-agency"
                    label="Agency name"
                    value={agency}
                    onChange={setAgency}
                    optional
                    placeholder="Leave blank if you work independently"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ---- verification ---- */}
          <section id="verification" className="mt-12 scroll-mt-24">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold text-graphite">Verification</h2>
              <VerifiedStamp status={relator.verification} date={relator.verifiedOn} />
            </div>
            <p className="mt-3 max-w-xl leading-relaxed text-graphite/80">
              Kaani checks every relator against their TNRERA registration before their listings
              go live. This is the step buyers are trusting.
            </p>

            {/* the panel carries a heavier frame than anything else on the page —
                the structure itself says this part matters */}
            <div
              className="mt-6 border-2 border-graphite/30 bg-paper-2"
              style={{ borderRadius: "3px" }}
            >
              <div className="border-b border-graphite/12 px-5 py-5">
                <Field
                  id="rp-rera"
                  label="TNRERA registration number"
                  value={rera}
                  onChange={setRera}
                  placeholder="TN/AGENT/0000/2024"
                  hint="Buyers see this masked. We check the full number against the TNRERA register."
                />
              </div>

              {docs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onReplace={replaceDoc} />
              ))}
            </div>

            {/* what the states mean — legible, since a badge alone doesn't teach */}
            <div className="mt-5 flex flex-col gap-3 border border-graphite/12 px-5 py-4" style={{ borderRadius: "3px" }}>
              <p className="u-eyebrow text-graphite/84" style={{ fontSize: "0.54rem" }}>
                What these mean
              </p>
              <ul className="flex flex-col gap-3">
                <li className="flex flex-wrap items-center gap-3">
                  <VerifiedStamp status="pending" />
                  <span className="text-sm text-graphite/84">We have your documents and are checking them.</span>
                </li>
                <li className="flex flex-wrap items-center gap-3">
                  <VerifiedStamp status="verified" />
                  <span className="text-sm text-graphite/84">
                    Checked against the register. Your listings can go live.
                  </span>
                </li>
                <li className="flex flex-wrap items-center gap-3">
                  <VerifiedStamp status="action" />
                  <span className="text-sm text-graphite/84">
                    Something didn&rsquo;t match — re-upload the document we flagged.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button onClick={() => setSaved(true)}>Save profile</Button>
            <Button as={Link} to={`/agents/${relator.id}`} variant="ghost" arrow>
              See your public profile
            </Button>
            {saved && (
              <span className="u-fact text-[0.7rem] text-brick-lit-lit" role="status">
                Profile saved
              </span>
            )}
          </div>

          <p className="mt-10 u-fact text-[0.68rem] text-graphite/84">
            Verification states are UI only — no government API is called yet.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
