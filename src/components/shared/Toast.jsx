import { useEffect } from "react";

/* Minimal status toast. role="status" so screen readers announce it without
 * stealing focus; dismisses itself after a few seconds. */
export default function Toast({ message, onDone, duration = 6000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [message, onDone, duration]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-5">
      {message && (
        <p
          className="pointer-events-auto max-w-md bg-graphite px-4 py-2.5 text-[0.9rem] leading-snug text-paper shadow-lg"
          style={{ borderRadius: "3px" }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
