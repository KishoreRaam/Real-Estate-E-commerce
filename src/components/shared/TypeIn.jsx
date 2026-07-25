import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* Reveals text character-by-character, like a plotter typing a dimension.
 * Respects reduced motion (renders whole string, no caret). */
export default function TypeIn({ text, start = true, delay = 0, cps = 34, caret = false, className = "" }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce || !start ? text.length : 0);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce || !start) {
      setN(text.length);
      return;
    }
    setN(0);
    const startAt = performance.now() + delay;
    const step = (now) => {
      if (now < startAt) {
        raf.current = requestAnimationFrame(step);
        return;
      }
      const chars = Math.min(text.length, Math.floor(((now - startAt) / 1000) * cps));
      setN(chars);
      if (chars < text.length) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [text, start, reduce, delay, cps]);

  const done = n >= text.length;
  return <span className={`${caret && !done ? "caret " : ""}${className}`}>{text.slice(0, n)}</span>;
}
