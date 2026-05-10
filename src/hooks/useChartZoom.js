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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function clampDomain([lo, hi], fullDomain, minSpan) {
  let nextLo = lo;
  let nextHi = hi;
  const span = nextHi - nextLo;

  if (span <= minSpan) return null;

  if (nextLo < fullDomain[0]) {
    nextHi += fullDomain[0] - nextLo;
    nextLo = fullDomain[0];
  }

  if (nextHi > fullDomain[1]) {
    nextLo -= nextHi - fullDomain[1];
    nextHi = fullDomain[1];
  }

  nextLo = Math.max(nextLo, fullDomain[0]);
  nextHi = Math.min(nextHi, fullDomain[1]);
  return nextHi - nextLo > minSpan ? [nextLo, nextHi] : null;
}

export function useChartZoom(data, xKey, { domainData = data, resetKey = null, wheelEnabled = false } = {}) {
  const fullXDomain = useMemo(
    () => getFiniteExtent(domainData.map((point) => point[xKey]), getFiniteExtent(data.map((point) => point[xKey]))),
    [data, domainData, xKey]
  );

  const [zoomXDomain, setZoomXDomain] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [panStart, setPanStart] = useState(null);

  const minSpan = useMemo(
    () => Math.max((fullXDomain[1] - fullXDomain[0]) * 0.01, 1e-6),
    [fullXDomain]
  );

  useEffect(() => {
    setZoomXDomain(null);
    setDragStart(null);
    setDragEnd(null);
    setPanStart(null);
  }, [resetKey, xKey]);

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
    setPanStart(null);
  };

  const resetZoom = () => {
    setZoomXDomain(null);
    clearSelection();
  };

  const setClampedZoom = (nextDomain) => {
    const [lo, hi] = normalizeRange(nextDomain[0], nextDomain[1]);
    const clamped = clampDomain([lo, hi], fullXDomain, minSpan);

    if (!clamped) return;
    if (clamped[0] <= fullXDomain[0] && clamped[1] >= fullXDomain[1]) {
      setZoomXDomain(null);
      return;
    }

    setZoomXDomain(clamped);
  };

  const zoomAround = (anchor, factor) => {
    if (!Number.isFinite(anchor) || !Number.isFinite(factor) || factor <= 0) return;

    const [lo, hi] = xDomain;
    const span = hi - lo;
    const nextSpan = Math.max(minSpan, Math.min(fullXDomain[1] - fullXDomain[0], span * factor));
    const ratio = span > 0 ? (anchor - lo) / span : 0.5;
    const nextLo = anchor - nextSpan * ratio;
    const nextHi = nextLo + nextSpan;
    setClampedZoom([nextLo, nextHi]);
  };

  const panBy = (delta) => {
    if (!Number.isFinite(delta) || Math.abs(delta) < 1e-12) return;
    const [lo, hi] = xDomain;
    setClampedZoom([lo + delta, hi + delta]);
  };

  const onMouseDown = (event) => {
    const value = getActiveXValue(event, xKey);
    if (!Number.isFinite(value)) return;
    if (wheelEnabled) {
      setPanStart({ value, domain: xDomain });
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    setDragStart(value);
    setDragEnd(value);
  };

  const onMouseMove = (event) => {
    const value = getActiveXValue(event, xKey);
    if (!Number.isFinite(value)) return;
    if (panStart) {
      const delta = panStart.value - value;
      setClampedZoom([panStart.domain[0] + delta, panStart.domain[1] + delta]);
      return;
    }

    if (!Number.isFinite(dragStart)) return;
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
    setClampedZoom([lo, hi]);
  };

  const onContainerWheel = (event) => {
    if (!wheelEnabled) return;

    event.preventDefault();
    const span = xDomain[1] - xDomain[0];
    if (span <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp01((event.clientX - rect.left) / rect.width) : 0.5;
    const anchor = xDomain[0] + ratio * span;
    const deltaX = Number(event.deltaX ?? 0);
    const deltaY = Number(event.deltaY ?? 0);

    if (event.shiftKey || Math.abs(deltaX) > Math.abs(deltaY)) {
      panBy((deltaX || deltaY) * (span / 700));
      return;
    }

    zoomAround(anchor, Math.exp(deltaY * 0.0015));
  };

  return {
    xDomain,
    visibleData,
    selectionDomain,
    isZoomed: zoomXDomain !== null,
    isPanning: panStart !== null,
    resetZoom,
    chartHandlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp: finishZoom,
      onMouseLeave: finishZoom,
      onDoubleClick: resetZoom,
    },
    containerHandlers: {
      onWheel: onContainerWheel,
    },
  };
}
