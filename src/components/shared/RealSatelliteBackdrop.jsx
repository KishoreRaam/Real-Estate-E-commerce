/* ------------------------------------------------------------------ *
 * RealSatelliteBackdrop — an actual aerial photo standing in for
 * SatelliteTerrain on the one layout that has one (`layout.satelliteImage`).
 *
 * Same slot as SatelliteTerrain: rendered under the plot boundaries at
 * layout.width x layout.height in the shared SVG coordinate space. A photo
 * is busier than the procedural terrain, so a light scrim sits over it to
 * keep boundary strokes and on-terrain text legible.
 *
 * Licensing note: the shipped image (public/satellite/vadasithur-plots-01.jpg)
 * is a crop of "Vadasithur Village.jpg" (Wikimedia Commons, CC BY-SA 4.0,
 * © Keyantkarthi) — free to reuse with attribution and share-alike. Fine for
 * this demo; swap for a licensed/owned aerial capture before any commercial
 * production use.
 * ------------------------------------------------------------------ */
export default function RealSatelliteBackdrop({ layout }) {
  return (
    <g aria-hidden="true">
      <image
        href={layout.satelliteImage}
        x="0"
        y="0"
        width={layout.width}
        height={layout.height}
        preserveAspectRatio="xMidYMid slice"
      />
      <rect
        x="0"
        y="0"
        width={layout.width}
        height={layout.height}
        fill="var(--color-graphite)"
        opacity="0.1"
      />
    </g>
  );
}
