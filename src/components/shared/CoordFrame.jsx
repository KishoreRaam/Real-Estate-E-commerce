/* Draughting frame: E ruler on top, N ruler on the left — the sheet Kaani
 * draws on. Decorative, so hidden from assistive tech. */
export default function CoordFrame({ children }) {
  const ticks = [0, 100, 200, 300, 400];
  return (
    <div className="relative">
      <div aria-hidden="true" className="mb-1 flex justify-between px-6 u-fact text-[0.58rem] text-graphite/84">
        {ticks.map((t) => (
          <span key={t}>E:{t}</span>
        ))}
      </div>
      <div className="flex">
        <div aria-hidden="true" className="mr-1 flex flex-col justify-between py-6 u-fact text-[0.58rem] text-graphite/84">
          {ticks.map((t) => (
            <span key={t}>N:{t}</span>
          ))}
        </div>
        <div className="relative flex-1 border border-graphite/15" style={{ borderRadius: "3px" }}>
          {/* corner crosshair ticks */}
          {["-top-px -left-px", "-top-px -right-px", "-bottom-px -left-px", "-bottom-px -right-px"].map((pos) => (
            <span
              key={pos}
              aria-hidden="true"
              className={`absolute ${pos} h-2.5 w-2.5 border-graphite/40`}
              style={{
                borderTopWidth: pos.includes("top") ? 1 : 0,
                borderBottomWidth: pos.includes("bottom") ? 1 : 0,
                borderLeftWidth: pos.includes("left") ? 1 : 0,
                borderRightWidth: pos.includes("right") ? 1 : 0,
              }}
            />
          ))}
          {children}
        </div>
      </div>
    </div>
  );
}
