import qrcode from 'qrcode-generator';

import type { TOC } from '@ember/component/template-only';

/**
 * QR output is deterministic per (url, watermark) pair, so data URIs
 * are memoized — closing and reopening a disclosure never regenerates.
 */
const QR_CACHE = new Map<string, string>();

/**
 * Renders the QR as an SVG data URI for an <img> tag, so it can be
 * right-clicked and saved — with the watermark baked into the saved
 * file for free-plan codes.
 *
 * Error correction 'H' (30% redundancy) so the free-plan center
 * watermark never prevents scanning.
 */
function qrDataUri(data: string, watermark: boolean): string {
  const key = `${watermark}:${data}`;
  const cached = QR_CACHE.get(key);

  if (cached) return cached;

  const qr = qrcode(0, 'H');

  qr.addData(data);
  qr.make();

  const count = qr.getModuleCount();
  const margin = 2;
  const size = count + margin * 2;

  let path = '';

  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        path += `M${col + margin} ${row + margin}h1v1h-1z`;
      }
    }
  }

  let watermarkMarkup = '';

  if (watermark) {
    /**
     * Bottom-right corner placement. The nearest alignment pattern
     * ("control box") spans modules [count-9, count-5], so its bottom
     * edge is at svg y = size - margin - 4. The label must start below
     * that: height + inset <= margin + 4. The cap keeps that true for
     * dense codes from long URLs.
     */
    const inset = 0.5;
    const height = Math.min(size * 0.14, margin + 4 - inset);
    const fontSize = height * 0.62;
    // Same ~4px of white left/right of the text as above/below it
    const width = fontSize * 3.4 + (height - fontSize);
    const x = size - width - inset;
    const y = size - height - inset;

    watermarkMarkup =
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#fff"/>` +
      `<text x="${x + width / 2}" y="${y + height / 2}" text-anchor="middle" dominant-baseline="central"` +
      ` font-size="${fontSize}" font-family="ui-sans-serif, sans-serif" fill="#000">nvp.gg</text>`;
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">` +
    `<rect width="100%" height="100%" fill="#fff"/>` +
    `<path d="${path}" fill="#000"/>` +
    watermarkMarkup +
    `</svg>`;

  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  QR_CACHE.set(key, uri);

  return uri;
}

interface Signature {
  Args: {
    data: string;
    watermark: boolean;
  };
}

export const QrCode: TOC<Signature> = <template>
  <img
    class="qr-code"
    src={{qrDataUri @data @watermark}}
    alt="QR code for {{@data}}"
  />

  <style scoped>
    .qr-code {
      display: block;
      width: 10rem;
      height: 10rem;
    }
  </style>
</template>;
