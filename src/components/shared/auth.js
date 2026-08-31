/* Mock session store — there is no backend yet, so "signed in" just means a
 * small record sits in localStorage. The custom event lets same-tab
 * listeners (Nav, RelatorNav, route guards) react immediately; the native
 * "storage" event covers other tabs. */
const KEY = "kaani.session";
const EVENT = "kaani-auth-change";

export function getSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(EVENT));
}

export function clearSession() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export const AUTH_EVENT = EVENT;

/* "senthil.kumar@x.com" -> "Senthil Kumar" — there's no real name to look up
 * with only email + password on the login form. */
export function nameFromEmail(email) {
  const local = email.split("@")[0] || "";
  return local
    .split(/[.\-_]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || "Kaani user";
}
