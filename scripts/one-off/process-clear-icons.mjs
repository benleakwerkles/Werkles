// Process clear-v1 icon raws: strip background via edge flood-fill,
// trim to content, pad to square, resize to 512, save transparent PNGs.
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const RAW_DIR = "public/assets/brand/product-icons/clear-v1/raw";
const OUT_DIR = "public/assets/brand/product-icons/clear-v1";

// Per-file tolerance overrides (0-255 color distance). Default 42.
// Higher = eats more background (needed for soft shadows / halos).
const TOLERANCE = {
  "icon-backer-coins-raw.png": 50, // soft drop shadow in cream bg
  "icon-verify-stamp-raw.png": 30, // white bg, cream imprint plate must survive
  "icon-move-opensign-raw.png": 34, // purple bg vs purple board - keep tight
  "icon-spark-match-raw.png": 46 // cream bg + white sticker halo
};

// Also always allow removal of near-white halo pixels reached by the fill.
const WHITE = [255, 255, 255];
const WHITE_TOL = 34;

function dist(r1, g1, b1, [r2, g2, b2]) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

async function processIcon(file) {
  const inPath = join(RAW_DIR, file);
  const img = sharp(inPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const tol = TOLERANCE[file] ?? 42;

  // Sample the four corners; average them as the background reference.
  const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  const bg = [0, 0, 0];
  for (const c of corners) { bg[0] += data[c] / 4; bg[1] += data[c + 1] / 4; bg[2] += data[c + 2] / 4; }

  const removable = (i) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    return dist(r, g, b, bg) <= tol || dist(r, g, b, WHITE) <= WHITE_TOL;
  };

  // BFS from all edge pixels.
  const visited = new Uint8Array(w * h);
  const queue = [];
  for (let x = 0; x < w; x++) { queue.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { queue.push(y * w, y * w + (w - 1)); }
  while (queue.length) {
    const p = queue.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    if (!removable(p * 4)) continue;
    data[p * 4 + 3] = 0; // transparent
    const x = p % w, y = (p / w) | 0;
    if (x > 0) queue.push(p - 1);
    if (x < w - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - w);
    if (y < h - 1) queue.push(p + w);
  }

  // Soften 1px fringe: any opaque pixel adjacent to transparent gets alpha 200.
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (data[p * 4 + 3] === 0) continue;
      const nbrs = [p - 1, p + 1, p - w, p + w];
      if (nbrs.some((n) => data[n * 4 + 3] === 0)) data[p * 4 + 3] = 200;
    }
  }

  const outName = file.replace("-raw", "");
  const stripped = sharp(data, { raw: { width: w, height: h, channels: 4 } });
  const trimmed = await stripped.png().toBuffer();
  // Trim to content, then pad to square with 8% margin, resize 512.
  const t = sharp(trimmed).trim({ threshold: 10 });
  const tb = await t.png().toBuffer();
  const meta = await sharp(tb).metadata();
  const side = Math.ceil(Math.max(meta.width, meta.height) * 1.16);
  // Two separate passes: sharp internally runs resize BEFORE extend,
  // so padding and resizing must not share a pipeline.
  const squared = await sharp(tb)
    .extend({
      top: Math.floor((side - meta.height) / 2),
      bottom: Math.ceil((side - meta.height) / 2),
      left: Math.floor((side - meta.width) / 2),
      right: Math.ceil((side - meta.width) / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  await sharp(squared).resize(512, 512).png().toFile(join(OUT_DIR, outName));
  console.log(`ok ${outName} (bg rgb(${bg.map(Math.round)}) tol ${tol})`);
}

for (const f of readdirSync(RAW_DIR).filter((f) => f.endsWith(".png"))) {
  await processIcon(f);
}
console.log("done");
