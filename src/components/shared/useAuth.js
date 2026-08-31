import { useCallback, useEffect, useState } from "react";
import { AUTH_EVENT, clearSession, getSession } from "./auth";

export default function useAuth() {
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => {
    const sync = () => setSessionState(getSession());
    window.addEventListener(AUTH_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signOut = useCallback(() => {
    clearSession();
  }, []);

  return {
    session,
    role: session?.role ?? null,
    isAuthenticated: Boolean(session),
    signOut,
  };
}
