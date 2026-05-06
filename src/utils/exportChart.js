const XMLNS = 'http://www.w3.org/2000/svg';

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

function serializeSvg(svg, { background = '#ffffff' } = {}) {
  const clone = svg.cloneNode(true);
  const box = svg.getBoundingClientRect();
  const width = Number(svg.getAttribute('width')) || box.width || 900;
  const height = Number(svg.getAttribute('height')) || box.height || 520;

  clone.setAttribute('xmlns', XMLNS);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('viewBox', clone.getAttribute('viewBox') || `0 0 ${width} ${height}`);

  const rect = document.createElementNS(XMLNS, 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('fill', background);
  clone.insertBefore(rect, clone.firstChild);

  return new XMLSerializer().serializeToString(clone);
}

export function exportSvgFromElement(element, filename) {
  const svg = element?.querySelector('svg');
  if (!svg) return;

  const source = serializeSvg(svg);
  downloadBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export function exportPngFromElement(element, filename, { scale = 3 } = {}) {
  const svg = element?.querySelector('svg');
  if (!svg) return;

  const source = serializeSvg(svg);
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
