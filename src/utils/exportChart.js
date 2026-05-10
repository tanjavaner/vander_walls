const XMLNS = 'http://www.w3.org/2000/svg';

const EXPORT_TEXT_STYLE = `
  text,
  .recharts-text,
  .recharts-cartesian-axis-tick-value,
  .recharts-label,
  .recharts-reference-line-label {
    font-family: Arial, "Segoe UI", sans-serif !important;
    font-weight: 800 !important;
    paint-order: stroke fill;
    stroke: rgba(255,255,255,0.82);
    stroke-width: 2.4px;
    stroke-linejoin: round;
  }

  .recharts-cartesian-grid line {
    stroke-width: 1.2px;
  }

  .recharts-line-curve {
    stroke-width: 4px;
  }

  .recharts-reference-line-line {
    stroke-width: 2.2px;
  }
`;

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function readFontSize(node) {
  const attr = Number.parseFloat(node.getAttribute('font-size'));
  if (Number.isFinite(attr)) return attr;

  const inline = Number.parseFloat(node.style?.fontSize);
  return Number.isFinite(inline) ? inline : 12;
}

function makeExportTextReadable(svg) {
  const style = document.createElementNS(XMLNS, 'style');
  style.textContent = EXPORT_TEXT_STYLE;
  svg.insertBefore(style, svg.firstChild);

  svg.querySelectorAll('text').forEach((node) => {
    const current = readFontSize(node);
    const className = String(node.getAttribute('class') ?? '');
    const target = className.includes('recharts-label')
      ? Math.max(20, current * 1.55)
      : Math.max(18, current * 1.45);

    node.setAttribute('font-size', String(Math.round(target)));
    node.setAttribute('font-weight', '800');
    node.style.fontSize = `${Math.round(target)}px`;
    node.style.fontWeight = '800';
    node.style.fontFamily = 'Arial, "Segoe UI", sans-serif';
  });
}

function serializeSvg(svg, { background = '#ffffff', readableExport = false } = {}) {
  const clone = svg.cloneNode(true);
  const box = svg.getBoundingClientRect();
  const baseWidth = Number(svg.getAttribute('width')) || box.width || 900;
  const baseHeight = Number(svg.getAttribute('height')) || box.height || 520;
  const padding = readableExport ? 36 : 0;
  const width = baseWidth + padding * 2;
  const height = baseHeight + padding * 2;
  const viewBox = readableExport
    ? `${-padding} ${-padding} ${width} ${height}`
    : (clone.getAttribute('viewBox') || `0 0 ${width} ${height}`);

  clone.setAttribute('xmlns', XMLNS);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', viewBox);
  clone.setAttribute('overflow', 'visible');

  if (readableExport) makeExportTextReadable(clone);

  const rect = document.createElementNS(XMLNS, 'rect');
  rect.setAttribute('x', String(readableExport ? -padding : 0));
  rect.setAttribute('y', String(readableExport ? -padding : 0));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('fill', background);
  clone.insertBefore(rect, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

export function exportSvgFromElement(element, filename) {
  const svg = element?.querySelector('svg');
  if (!svg) return;

  const source = serializeSvg(svg, { readableExport: true });
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export function exportPngFromElement(element, filename, { scale = 4 } = {}) {
  const svg = element?.querySelector('svg');
  if (!svg) return;

  const source = serializeSvg(svg, { readableExport: true });
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      if (pngBlob) downloadBlob(pngBlob, filename);
    }, 'image/png');
  };

  image.src = url;
}

export function exportCanvasPng(canvas, filename) {
  if (!canvas) return;
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename);
  }, 'image/png');
}

function escapeCsvValue(value) {
  if (value === null || value === undefined) return '';
  if (Number.isNaN(value)) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function rowsToCsv(rows, columns) {
  const header = columns.map((column) => escapeCsvValue(column.label ?? column.key)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(',')
  );
  return [header, ...body].join('\n');
}

export function exportCsv(rows, columns, filename) {
  const csv = rowsToCsv(rows, columns);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}
