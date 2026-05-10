function finiteNumbers(values) {
  return values.map(Number).filter(Number.isFinite);
}

function quantile(sortedValues, q) {
  if (!sortedValues.length) return NaN;
  if (sortedValues.length === 1) return sortedValues[0];

  const pos = (sortedValues.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedValues[lo];

  const weight = pos - lo;
  return sortedValues[lo] * (1 - weight) + sortedValues[hi] * weight;
}

export function getRobustDomain(values, {
  fallback = [0, 1],
  lowerQuantile = 0.02,
  upperQuantile = 0.98,
  padRatio = 0.08,
  minPad = 1,
  floor,
} = {}) {
  const sorted = finiteNumbers(values).sort((a, b) => a - b);
  if (!sorted.length) return fallback;

  let lo = quantile(sorted, lowerQuantile);
  let hi = quantile(sorted, upperQuantile);

  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return fallback;
  if (Math.abs(hi - lo) < 1e-9) {
    const pad = Math.max(Math.abs(lo) * padRatio, minPad);
    lo -= pad;
    hi += pad;
  } else {
    const pad = Math.max((hi - lo) * padRatio, minPad);
    lo -= pad;
    hi += pad;
  }

  if (Number.isFinite(floor)) lo = Math.max(floor, lo);
  if (hi <= lo) hi = lo + Math.max(Math.abs(lo) * padRatio, minPad);

  return [lo, hi];
}

export function getFullDomain(values, {
  fallback = [0, 1],
  padRatio = 0.08,
  minPad = 1,
  floor,
} = {}) {
  const finite = finiteNumbers(values);
  if (!finite.length) return fallback;

  let lo = Math.min(...finite);
  let hi = Math.max(...finite);

  if (Math.abs(hi - lo) < 1e-9) {
    const pad = Math.max(Math.abs(lo) * padRatio, minPad);
    lo -= pad;
    hi += pad;
  } else {
    const pad = Math.max((hi - lo) * padRatio, minPad);
    lo -= pad;
    hi += pad;
  }

  if (Number.isFinite(floor)) lo = Math.max(floor, lo);
  if (hi <= lo) hi = lo + Math.max(Math.abs(lo) * padRatio, minPad);

  return [lo, hi];
}

export function getRowsWithinAnyYDomain(data, yKeys, yDomain) {
  const [lo, hi] = yDomain;
  const rows = data.filter((point) =>
    yKeys.some((key) => {
      const value = point[key];
      return Number.isFinite(value) && value >= lo && value <= hi;
    })
  );

  return rows.length ? rows : data;
}
