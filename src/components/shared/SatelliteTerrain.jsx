/* ------------------------------------------------------------------ *
 * SatelliteTerrain — an aerial read of the site, drawn beneath the plot
 * boundaries so a layout looks like land rather than a line drawing.
 *
 * Everything is procedural and deterministic (seeded from the layout id), so
 * it renders identically every time and needs no imagery. Roads use Concrete
 * and rooftops use Brick straight from the palette; only soil and vegetation
 * are added, muted to sit beside those rather than shout over them.
 *
 * Sun is up-left throughout, so every shadow falls down-right — that single
 * consistent light direction is most of what makes an aerial read as real.
 *
 * detail="simple" is for thumbnails: fewer trees, no sway, no cloud.
 * ------------------------------------------------------------------ */

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    // xorshift32 — cheap and stable across renders
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function bboxOf(points) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/* A broadleaf canopy seen from above: overlapping blobs, lit from the up-left.
 * Deliberately static — vegetation that sways at this scale looks like it's
 * under a microscope, not on a plot of land. */
function Tree({ x, y, r }) {
  return (
    <g>
      <ellipse cx={x + r * 0.55} cy={y + r * 0.5} rx={r * 1.0} ry={r * 0.52} fill="var(--terrain-shadow)" />
      <circle cx={x} cy={y} r={r} fill="var(--terrain-tree-dk)" />
      <circle cx={x - r * 0.22} cy={y - r * 0.2} r={r * 0.74} fill="var(--terrain-tree)" />
      <circle cx={x - r * 0.34} cy={y - r * 0.34} r={r * 0.34} fill="var(--terrain-tree)" opacity="0.75" />
    </g>
  );
}

/* A coconut palm crown from above. Fronds are short and tightly packed around
 * a solid core — long thin radiating spokes read as a micro-organism. */
function Palm({ x, y, r }) {
  const fronds = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <g>
      <ellipse cx={x + r * 0.55} cy={y + r * 0.45} rx={r * 0.8} ry={r * 0.4} fill="var(--terrain-shadow)" />
      <circle cx={x} cy={y} r={r * 0.82} fill="var(--terrain-tree-dk)" />
      {fronds.map((a) => (
        <ellipse
          key={a}
          cx={x}
          cy={y - r * 0.5}
          rx={r * 0.3}
          ry={r * 0.5}
          fill="var(--terrain-tree)"
          opacity="0.9"
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.24} fill="var(--terrain-tree-dk)" />
    </g>
  );
}

/* Traffic on the internal road. Each vehicle gets its own duration and delay,
 * so they arrive at irregular intervals rather than in convoy. */
function Car({ tone }) {
  return (
    <g>
      <rect x="-14" y="-5.5" width="28" height="12" rx="2.6" fill="var(--terrain-shadow)" transform="translate(1.8 2.2)" />
      <rect x="-14" y="-6" width="28" height="12" rx="3" fill={tone} />
      {/* cabin, read from above */}
      <rect x="-5.5" y="-4.4" width="11" height="8.8" rx="1.8" fill="var(--color-graphite)" opacity="0.5" />
      {/* windscreen glint at the nose */}
      <rect x="9.5" y="-4" width="2.6" height="8" rx="1" fill="var(--color-paper)" opacity="0.55" />
    </g>
  );
}

function Bike({ tone }) {
  return (
    <g>
      <rect x="-6.5" y="-2" width="13" height="4" rx="1.8" fill="var(--terrain-shadow)" transform="translate(1.2 1.8)" />
      <rect x="-6.5" y="-2.4" width="13" height="4.8" rx="2.2" fill={tone} />
      {/* rider */}
      <circle cx="-1.2" cy="0" r="2" fill="var(--color-graphite)" opacity="0.65" />
    </g>
  );
}

function Traffic({ layout, animate }) {
  if (!animate) return null;
  const midY = layout.road.y + layout.road.h / 2;
  const laneUp = midY - layout.road.h * 0.22; // travels right
  const laneDown = midY + layout.road.h * 0.22; // travels left

  // Irregular on purpose: durations and delays are co-prime-ish, so vehicles
  // never settle into a repeating convoy.
  const fleet = [
    { kind: "car", dir: "r", lane: laneUp, dur: 13, delay: 0, tone: "var(--color-paper)" },
    { kind: "bike", dir: "r", lane: laneUp + 6, dur: 9.5, delay: 6.5, tone: "var(--color-graphite)" },
    { kind: "car", dir: "r", lane: laneUp, dur: 17, delay: 15, tone: "var(--terrain-roof)" },
    { kind: "bike", dir: "r", lane: laneUp + 5, dur: 11, delay: 24, tone: "var(--color-concrete)" },
    { kind: "car", dir: "l", lane: laneDown, dur: 15, delay: 3.5, tone: "var(--color-concrete)" },
    { kind: "bike", dir: "l", lane: laneDown - 5, dur: 10.5, delay: 11, tone: "var(--color-graphite)" },
    { kind: "car", dir: "l", lane: laneDown, dur: 19, delay: 20, tone: "var(--color-graphite)" },
    { kind: "bike", dir: "l", lane: laneDown - 6, dur: 12.5, delay: 29, tone: "var(--terrain-roof)" },
  ];

  return (
    <g aria-hidden="true">
      {fleet.map((v, i) => (
        <g key={`v-${i}`} transform={`translate(0 ${v.lane})`}>
          <g
            className={v.dir === "r" ? "drive-r" : "drive-l"}
            style={{ animationDuration: `${v.dur}s`, animationDelay: `${v.delay}s` }}
          >
            {/* left-bound vehicles are mirrored so they face their direction */}
            <g transform={v.dir === "l" ? "scale(-1 1)" : undefined}>
              {v.kind === "car" ? <Car tone={v.tone} /> : <Bike tone={v.tone} />}
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

/* A built plot: compound wall, house footprint with a brick roof, a little
 * yard. Only some plots get one, so the layout reads as partly developed. */
function Building({ box, rng }) {
  const pad = Math.min(box.w, box.h) * 0.16;
  const bw = box.w * (0.44 + rng() * 0.16);
  const bh = box.h * (0.3 + rng() * 0.14);
  const bx = box.x + pad + rng() * (box.w - bw - pad * 2);
  const by = box.y + pad + rng() * (box.h - bh - pad * 2);
  const ridge = bh * 0.34;
  return (
    <g>
      {/* swept yard around the house — compacted earth, lighter than scrub */}
      <rect
        x={box.x + pad * 0.5}
        y={box.y + pad * 0.5}
        width={box.w - pad}
        height={box.h - pad}
        fill="var(--terrain-soil)"
        opacity="0.55"
        rx="2"
      />
      {/* cast shadow */}
      <rect x={bx + 4} y={by + 5} width={bw} height={bh} fill="var(--terrain-shadow)" rx="1" />
      {/* roof planes — two pitches so it isn't a flat slab */}
      <rect x={bx} y={by} width={bw} height={bh} fill="var(--terrain-roof-dk)" rx="1" />
      <rect x={bx} y={by} width={bw} height={ridge} fill="var(--terrain-roof)" rx="1" />
      <line
        x1={bx}
        y1={by + ridge}
        x2={bx + bw}
        y2={by + ridge}
        stroke="var(--terrain-roof-dk)"
        strokeWidth="0.8"
        opacity="0.8"
      />
      {/* compound wall — what actually marks a built plot on the ground */}
      <rect
        x={box.x + pad * 0.5}
        y={box.y + pad * 0.5}
        width={box.w - pad}
        height={box.h - pad}
        fill="none"
        stroke="var(--color-paper)"
        strokeWidth="1.6"
        opacity="0.55"
        rx="2"
      />
    </g>
  );
}

export default function SatelliteTerrain({ layout, detail = "full", animate = true }) {
  const rng = makeRng(hashString(layout.id || "kaani"));
  const full = detail === "full";
  const W = layout.width;
  const H = layout.height;

  // Which plots are built on — deterministic, roughly a third.
  const built = new Set();
  layout.plots.forEach((p, i) => {
    if (i % 3 === 1) built.add(p.id);
  });

  // Scatter vegetation inside plots that have no building, plus along edges.
  const trees = [];
  layout.plots.forEach((p, pi) => {
    const box = bboxOf(p.points);
    const n = built.has(p.id) ? (full ? 3 : 1) : full ? 6 : 2;
    for (let i = 0; i < n; i += 1) {
      const r = (full ? 11 : 8) + rng() * 7;
      // Inside plots everything is a broadleaf canopy. Palms are reserved for
      // the road verge, which is where they're actually planted.
      trees.push({
        x: box.x + r + rng() * (box.w - r * 2),
        y: box.y + r + rng() * (box.h - r * 2),
        r,
        palm: false,
      });
    }
    void pi;
  });
  // A row of palms along the road, the way TN layouts are planted.
  if (full) {
    const count = 9;
    for (let i = 0; i < count; i += 1) {
      const x = layout.road.x + 24 + (i * (layout.road.w - 48)) / (count - 1);
      trees.push({ x, y: layout.road.y - 13, r: 7.5 + rng() * 2, palm: true });
    }
  }

  return (
    <g aria-hidden="true">
      {/* soil base */}
      <rect x="0" y="0" width={W} height={H} fill="var(--terrain-soil)" />

      {/* Ground cover. Many small irregular patches rather than a few big soft
       * ellipses — real ground is mottled, and broad gradients read as blur. */}
      <g>
        {Array.from({ length: full ? 34 : 14 }, (_, i) => {
          const px = rng() * W;
          const py = rng() * H;
          const pr = 22 + rng() * 62;
          const kind = rng();
          return (
            <ellipse
              key={`p-${i}`}
              cx={px}
              cy={py}
              rx={pr}
              ry={pr * (0.5 + rng() * 0.4)}
              transform={`rotate(${rng() * 180} ${px} ${py})`}
              fill={
                kind > 0.62
                  ? "var(--terrain-grass)"
                  : kind > 0.34
                    ? "var(--terrain-scrub)"
                    : "var(--terrain-soil-dk)"
              }
              opacity={0.3 + rng() * 0.3}
            />
          );
        })}
      </g>

      {/* worn dirt tracks crossing the site */}
      <g opacity="0.5">
        <path
          d={`M${W * 0.08} ${H * 0.02} Q ${W * 0.2} ${H * 0.3} ${W * 0.14} ${H * 0.55}`}
          fill="none"
          stroke="var(--terrain-soil-dk)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d={`M${W * 0.62} ${H * 0.58} Q ${W * 0.72} ${H * 0.8} ${W * 0.66} ${H * 0.99}`}
          fill="none"
          stroke="var(--terrain-soil-dk)"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </g>

      {/* the internal road: asphalt, kerbs, centre dashes */}
      <g>
        <rect
          x={layout.road.x - 6}
          y={layout.road.y - 2}
          width={layout.road.w + 12}
          height={layout.road.h + 4}
          fill="var(--terrain-road-dk)"
          opacity="0.55"
        />
        <rect
          x={layout.road.x}
          y={layout.road.y}
          width={layout.road.w}
          height={layout.road.h}
          fill="var(--terrain-road)"
        />
        <line
          x1={layout.road.x}
          y1={layout.road.y + layout.road.h / 2}
          x2={layout.road.x + layout.road.w}
          y2={layout.road.y + layout.road.h / 2}
          stroke="var(--color-paper)"
          strokeWidth="1.6"
          strokeDasharray="14 12"
          opacity="0.75"
        />
      </g>

      {/* buildings, then vegetation on top so canopies overhang roofs */}
      {layout.plots.map((p) =>
        built.has(p.id) ? <Building key={`b-${p.id}`} box={bboxOf(p.points)} rng={rng} /> : null,
      )}

      {trees.map((t, i) =>
        t.palm ? <Palm key={`t-${i}`} {...t} /> : <Tree key={`t-${i}`} {...t} />,
      )}

      {/* traffic runs above the ground but below the plot boundaries */}
      <Traffic layout={layout} animate={animate && full} />

      {/* a cloud shadow drifting over the site — the only ambient motion */}
      {full && animate && (
        <g className="cloud-shadow" opacity="0.09">
          <ellipse cx={W * 0.18} cy={H * 0.44} rx={W * 0.17} ry={H * 0.34} fill="var(--color-graphite)" />
          <ellipse cx={W * 0.27} cy={H * 0.32} rx={W * 0.1} ry={H * 0.2} fill="var(--color-graphite)" />
        </g>
      )}
    </g>
  );
}
