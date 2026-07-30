// One-off icon generator: renders the Ritual mark (two overlapping circles,
// warm day / cool night) to the four PWA PNG sizes required by manifest.json.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const BG = '#F7F3EB';
const DAY = '#C97B4A';
const NIGHT = '#7C8F63';

// size: full canvas px. inset: background rounded-square inset from edge (maskable needs safe-zone padding).
// circleScale: circle radius as a fraction of the (size - 2*inset) content box.
function markSvg({ size, inset, circleScale, cornerRadius }) {
  const box = size - inset * 2;
  const r = (box * circleScale) / 2;
  const cy = inset + box / 2;
  const cxLeft = inset + box / 2 - r * 0.42;
  const cxRight = inset + box / 2 + r * 0.42;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" fill="${BG}"/>
  <circle cx="${cxLeft}" cy="${cy}" r="${r}" fill="${DAY}" fill-opacity="0.88"/>
  <circle cx="${cxRight}" cy="${cy}" r="${r}" fill="${NIGHT}" fill-opacity="0.88"/>
</svg>`;
}

const targets = [
  { file: 'icon-192.png', size: 192, inset: 0, circleScale: 0.66, cornerRadius: 42 },
  { file: 'icon-512.png', size: 512, inset: 0, circleScale: 0.66, cornerRadius: 112 },
  // Maskable: keep the mark inside the ~80% safe-zone circle so OS masking never clips it.
  { file: 'icon-maskable-192.png', size: 192, inset: 30, circleScale: 0.66, cornerRadius: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 80, circleScale: 0.66, cornerRadius: 0 },
];

for (const t of targets) {
  const svg = Buffer.from(markSvg(t));
  const outPath = path.join(OUT_DIR, t.file);
  await sharp(svg, { density: 384 }).resize(t.size, t.size).png().toFile(outPath);
  console.log('wrote', t.file);
}
