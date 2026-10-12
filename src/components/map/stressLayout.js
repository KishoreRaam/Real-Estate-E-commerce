/* Synthetic layout for performance testing the 3D view (`?stress=120` on the
 * 3D explorer page). Frontend-only fixture — never shown as a real listing.
 * Two plots are broken on purpose so the "shown in 2D only" path is exercised:
 * one collapsed to a line, one with a bow-tie (self-intersecting) boundary. */

const FACINGS = ["East", "West", "North", "South"];

export function makeStressLayout(count = 120) {
  const n = Math.max(4, Math.min(400, count | 0));
  const cols = Math.ceil(Math.sqrt(n * 1.8));
  const rows = Math.ceil(n / cols);
  const cell = 60;
  const gap = 4;
  const roadEvery = 2; // a road band between every second row
  const roadH = 28;
  const margin = 30;

  const plots = [];
  let y = margin;
  let roadY = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && plots.length < n; c++) {
      const no = plots.length + 1;
      const x = margin + c * cell;
      let points = [
        [x + gap, y + gap],
        [x + cell - gap, y + gap],
        [x + cell - gap, y + cell * 1.3 - gap],
        [x + gap, y + cell * 1.3 - gap],
      ];
      if (no === 7) points = [[x, y], [x + 20, y], [x + 40, y]]; // degenerate
      if (no === 23) points = [[x + gap, y + gap], [x + cell - gap, y + cell], [x + cell - gap, y + gap], [x + gap, y + cell]]; // bow-tie
      const area = 1200 + ((no * 97) % 1400);
      const pps = 1800 + ((no * 53) % 900);
      plots.push({
        id: `s-${no}`,
        no,
        points,
        centroid: [x + cell / 2, y + (cell * 1.3) / 2],
        areaSqft: area,
        dimensions: `${30 + (no % 8)} × ${40 + (no % 15)} ft`,
        facing: FACINGS[no % 4],
        roadFt: no % 3 ? 24 : 30,
        survey: `${200 + Math.floor(no / 6)}/${(no % 6) + 1}`,
        status: no % 5 === 0 ? "pending" : "verified",
        pricePerSqft: pps,
        guidePrice: `₹${((area * pps) / 100000).toFixed(1)} L`,
        confidence: 0.9,
        tier: "high",
      });
    }
    y += cell * 1.3;
    if ((r + 1) % roadEvery === 0 && r < rows - 1) {
      if (roadY === null) roadY = y;
      y += roadH;
    }
  }
  const width = margin * 2 + cols * cell;
  const height = y + margin + 40;
  return {
    id: `stress-${n}`,
    name: `Stress test · ${n} plots`,
    place: "Synthetic fixture",
    dtcp: "—",
    approvedOn: "—",
    scale: "n/a",
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    north: { x: width - 40, y: 40, r: 18 },
    road: { label: "TEST ROAD", x: margin, y: roadY ?? y, w: width - margin * 2, h: roadH },
    osr: {
      label: "OSR",
      points: [
        [margin, y + 6],
        [margin + 200, y + 6],
        [margin + 200, y + 36],
        [margin, y + 36],
      ],
    },
    plots,
    featuredId: "s-1",
  };
}
