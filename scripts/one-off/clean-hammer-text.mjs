// Remove AI-artifact gold micro-text from the hammer handle's lower-left
// region by recoloring gold-ish pixels to the surrounding handle purple.
import sharp from "sharp";

const FILE = "public/assets/brand/product-icons/clear-v1/icon-builder-hammer.png";
const { data, info } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

const HANDLE_PURPLE = [58, 42, 78];
let cleaned = 0;
for (let y = 330; y < 490 && y < h; y++) {
  for (let x = 30; x < 175 && x < w; x++) {
    const i = (y * w + x) * 4;
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    // Anything lighter than the dark handle in this strip is text residue
    // (or stripe leftovers — the stripe already ends above this region).
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum > 90) {
      data[i] = HANDLE_PURPLE[0];
      data[i + 1] = HANDLE_PURPLE[1];
      data[i + 2] = HANDLE_PURPLE[2];
      cleaned++;
    }
  }
}
await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(FILE + ".tmp.png");
const fs = await import("node:fs");
fs.renameSync(FILE + ".tmp.png", FILE);
console.log(`cleaned ${cleaned} pixels`);
