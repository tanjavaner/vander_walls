import { useEffect, useMemo, useState } from 'react';

function getFiniteExtent(values, fallback = [0, 1]) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return fallback;

  let lo = Math.min(...finite);
  let hi = Math.max(...finite);
  if (Math.abs(hi - lo) < 1e-9) {
    const pad = Math.max(Math.abs(lo) * 0.05, 1);
    lo -= pad;
    hi += pad;
  }
  return [lo, hi];
}

function normalizeRange(a, b) {
  return a <= b ? [a, b] : [b, a];
}

function getActiveXValue(event, xKey) {
  if (Number.isFinite(event?.activeLabel)) return event.activeLabel;

  const payloadValue = event?.activePayload?.[0]?.payload?.[xKey];
  return Number.isFinite(payloadValue) ? payloadValue : null;
}

export function useChartZoom(data, xKey) {
  const fullXDomain = useMemo(
    () => getFiniteExtent(data.map((point) => point[xKey])),
    [data, xKey]
  );

  const [zoomXDomain, setZoomXDomain] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);

  const minSpan = useMemo(
    () => Math.max((fullXDomain[1] - fullXDomain[0]) * 0.01, 1e-6),
    [fullXDomain]
  );

  useEffect(() => {
    setZoomXDomain(null);
    setDragStart(null);
    setDragEnd(null);
  }, [xKey]);

  useEffect(() => {
    setZoomXDomain((current) => {
      if (!current) return current;

      const [lo, hi] = normalizeRange(current[0], current[1]);
      const nextLo = Math.max(lo, fullXDomain[0]);
      const nextHi = Math.min(hi, fullXDomain[1]);
      return nextHi - nextLo > minSpan ? [nextLo, nextHi] : null;
    });
  }, [fullXDomain, minSpan]);

  const xDomain = zoomXDomain ?? fullXDomain;

  const visibleData = useMemo(
    () =>
      data.filter((point) => {
        const x = point[xKey];
        return Number.isFinite(x) && x >= xDomain[0] && x <= xDomain[1];
      }),
    [data, xDomain, xKey]
  );

  const selectionDomain = useMemo(() => {
    if (!Number.isFinite(dragStart) || !Number.isFinite(dragEnd)) return null;
    return normalizeRange(dragStart, dragEnd);
  }, [dragEnd, dragStart]);

  const clearSelection = () => {
    setDragStart(null);
    setDragEnd(null);
  };

  const resetZoom = () => {
    setZoomXDomain(null);
    clearSelection();
  };

  const onMouseDown = (event) => {
    const value = getActiveXValue(event, xKey);
    if (!Number.isFinite(value)) return;
    setDragStart(value);
    setDragEnd(value);
  };

  const onMouseMove = (event) => {
    if (!Number.isFinite(dragStart)) return;
    const value = getActiveXValue(event, xKey);
    if (!Number.isFinite(value)) return;
    setDragEnd(value);
  };

  const finishZoom = () => {
    if (!selectionDomain) {
      clearSelection();
      return;
    }

    const [lo, hi] = selectionDomain;
    clearSelection();
    if (hi - lo <= minSpan) return;
    setZoomXDomain([lo, hi]);
  };

  return {
    xDomain,
    visibleData,
    selectionDomain,
    isZoomed: zoomXDomain !== null,
    resetZoom,
    chartHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: finishZoom,
      onMouseLeave: finishZoom,
      onDoubleClick: resetZoom,
    },
  };
}
