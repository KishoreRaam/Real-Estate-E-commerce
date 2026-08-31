import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../shared/Button";
import Field from "../shared/Field";
import Wordmark from "../shared/Wordmark";
import VerifiedStamp from "../shared/VerifiedStamp";
import RoleToggle from "./RoleToggle";
import AuthSidePanel from "./AuthSidePanel";
import { nameFromEmail, setSession } from "../shared/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(params.get("role") === "relator" ? "relator" : "buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [rera, setRera] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 10) next.phone = "Enter a 10-digit phone number.";
    if (password.length < 6) next.password = "Must be at least 6 characters.";
    if (role === "relator" && !rera.trim()) next.rera = "Enter your TNRERA registration number.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSession({ name: name.trim() || nameFromEmail(email), email, role });
    navigate(role === "relator" ? "/relator" : "/plots");
  };

  return (
    <main className="min-h-screen bg-paper bg-survey-grid">
      <header className="border-b border-graphite/12 px-5 py-4 sm:px-8">
        <Link to="/" aria-label="Kaani home">
          <Wordmark />
        </Link>
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="order-1 lg:hidden">
          <AuthSidePanel compact />
        </div>

        <div className="order-2 flex items-center justify-center px-5 py-12 sm:px-8 lg:order-1">
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-[440px]">
            <RoleToggle role={role} onChange={setRole} />

            <p className="mt-6 u-eyebrow text-brick-lit">Create an account</p>
            <h1
              className="mt-3 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              {role === "relator" ? "List land buyers can trust." : "Start with the map."}
            </h1>
            <p className="mt-3 text-[0.95rem] text-graphite/80">
              {role === "relator"
                ? "Sign up as a relator to upload layouts and get verified against TNRERA."
                : "Sign up to save plots, track price changes, and message verified relators."}
            </p>

            <div className="mt-8 flex flex-col gap-5">
              <Field
                id="su-name"
                label="Full name"
                autoComplete="name"
                value={name}
                onChange={setName}
                placeholder="As on your ID"
                error={errors.name}
              />
              <Field
                id="su-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                error={errors.email}
              />
              <Field
                id="su-phone"
                label="Phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={setPhone}
                placeholder="+91 "
                error={errors.phone}
              />

              {role === "relator" && (
                <>
                  <Field
                    id="su-agency"
                    label="Agency name"
                    optional
                    value={agency}
                    onChange={setAgency}
                    placeholder="Leave blank if you work independently"
                  />
                  <Field
                    id="su-rera"
                    label="TNRERA registration number"
                    value={rera}
                    onChange={setRera}
                    placeholder="TN/AGENT/0000/2024"
                    error={errors.rera}
                    hint={!errors.rera ? "We'll check this against the TNRERA register after you sign up." : undefined}
                  />
                </>
              )}

              <Field
                id="su-password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                placeholder="At least 6 characters"
                error={errors.password}
              />
            </div>

            {role === "relator" && (
              <div className="mt-6 flex items-start gap-3 border border-graphite/12 px-4 py-3.5" style={{ borderRadius: "3px" }}>
                <VerifiedStamp status="pending" />
                <p className="text-[0.82rem] leading-relaxed text-graphite/80">
                  Right after this, you&rsquo;ll upload your TNRERA certificate and PAN so buyers see you
                  as verified.
                </p>
              </div>
            )}

            <Button type="submit" className="mt-8 w-full">
              Create account
            </Button>

            <p className="mt-6 u-fact text-[0.78rem] text-graphite/84">
              Already have an account?{" "}
              <Link to={`/login?role=${role}`} className="text-graphite underline underline-offset-2 hover:text-ink">
                Sign in
              </Link>
            </p>

            <p className="mt-10 u-fact text-[0.66rem] text-graphite/84">
              This is a demo sign-up — no account or document is checked against a real record yet.
            </p>
          </form>
        </div>

        <div className="hidden border-l border-graphite/12 bg-paper-2 px-10 py-14 lg:order-2 lg:flex lg:items-center xl:px-16">
          <AuthSidePanel />
        </div>
      </div>
    </main>
  );
}
