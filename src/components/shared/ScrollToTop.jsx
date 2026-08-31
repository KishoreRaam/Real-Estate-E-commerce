import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/* React Router doesn't reset scroll position on navigation the way a full
 * page load does — without this, clicking a link while scrolled down one
 * page lands you at that same scroll offset on the next page instead of
 * its top, which reads as "nothing happened" until you scroll up. */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
