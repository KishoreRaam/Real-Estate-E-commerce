import { useEffect, useState } from "react";

/* Thin bar under the navbar tracking scroll position as % of total scrollable
 * height. A ResizeObserver on <body> — not a one-time measurement — is what
 * keeps this correct: the plot-map demo section is lazy-loaded and changes
 * document height well after first paint, and a mount-time-only calculation
 * would leave the bar under-reporting progress until the next resize/scroll
 * happened to fire a recompute. */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      const scrollable = root.scrollHeight - root.clientHeight;
      const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
      setProgress(Math.min(1, Math.max(0, pct)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    const ro = new ResizeObserver(update);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="h-[2px] w-full bg-graphite/12 sm:h-[3px]">
      <div
        className="h-full origin-left bg-graphite"
        style={{ transform: `scaleX(${progress})`, transition: "transform 100ms linear" }}
      />
    </div>
  );
}
