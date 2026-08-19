import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../shared/Button";
import Field from "../shared/Field";
import Wordmark from "../shared/Wordmark";
import RoleToggle from "./RoleToggle";
import AuthSidePanel from "./AuthSidePanel";
import { nameFromEmail, setSession } from "../shared/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(params.get("role") === "relator" ? "relator" : "buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSession({ name: nameFromEmail(email), email, role });
    const redirect = params.get("redirect");
    navigate(redirect || (role === "relator" ? "/relator" : "/plots"));
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
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-[420px]">
            <RoleToggle role={role} onChange={setRole} />

            <p className="mt-6 u-eyebrow text-brick-lit">Sign in</p>
            <h1
              className="mt-3 font-display font-extrabold text-graphite"
              style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.4rem)", lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Welcome back.
            </h1>
            <p className="mt-3 text-[0.95rem] text-graphite/80">
              {role === "relator"
                ? "Sign in to manage your listings and verification."
                : "Sign in to pick up where you left off."}
            </p>

            <div className="mt-8 flex flex-col gap-5">
              <Field
                id="login-email"
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                error={errors.email}
              />
              <Field
                id="login-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                error={errors.password}
              />
            </div>

            <Button type="submit" className="mt-8 w-full">
              Sign in
            </Button>

            <p className="mt-6 u-fact text-[0.78rem] text-graphite/84">
              New to Kaani?{" "}
              <Link to={`/signup?role=${role}`} className="text-graphite underline underline-offset-2 hover:text-ink">
                Create an account
              </Link>
            </p>

            <p className="mt-10 u-fact text-[0.66rem] text-graphite/84">
              This is a demo sign-in — no password is checked against a real account yet.
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
