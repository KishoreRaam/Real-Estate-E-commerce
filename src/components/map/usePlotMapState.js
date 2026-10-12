import { useCallback, useEffect, useMemo, useState } from "react";

export const MAX_COMPARE = 3;

/* The one source of map state. The 2D plan and the 3D view are two renderers
 * over this — selecting, hovering, filtering and comparing all live here, so
 * toggling views can never lose or fork a selection. */
export default function usePlotMapState(layout, { initialSelectedId = null } = {}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [hoveredId, setHoveredId] = useState(null);
  const [filters, setFilters] = useState({ facing: "any", status: "any" });
  const [compareIds, setCompareIds] = useState([]);

  // A different layout is a different sheet — start clean.
  useEffect(() => {
    setSelectedId(initialSelectedId);
    setHoveredId(null);
    setCompareIds([]);
    setFilters({ facing: "any", status: "any" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.id]);

  const matches = useCallback(
    (p) =>
      (filters.facing === "any" || p.facing === filters.facing) &&
      (filters.status === "any" || p.status === filters.status),
    [filters],
  );

  const dimmedIds = useMemo(
    () => layout.plots.filter((p) => !matches(p)).map((p) => p.id),
    [layout, matches],
  );

  // The same handler both renderers call — the detail panel can't tell them apart.
  const select = useCallback((plot) => setSelectedId(plot.id), []);
  const hover = useCallback((id) => setHoveredId(id), []);
  const endHover = useCallback((id) => setHoveredId((cur) => (cur === id ? null : cur)), []);

  const toggleCompare = useCallback((id) => {
    setCompareIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-MAX_COMPARE),
    );
  }, []);
  const clearCompare = useCallback(() => setCompareIds([]), []);

  const byId = useMemo(() => new Map(layout.plots.map((p) => [p.id, p])), [layout]);

  return {
    selectedId,
    setSelectedId,
    selected: byId.get(selectedId) ?? null,
    hoveredId,
    hovered: byId.get(hoveredId) ?? null,
    select,
    hover,
    endHover,
    filters,
    setFilters,
    matches,
    dimmedIds,
    compareIds,
    comparePlots: compareIds.map((id) => byId.get(id)).filter(Boolean),
    toggleCompare,
    clearCompare,
  };
}
