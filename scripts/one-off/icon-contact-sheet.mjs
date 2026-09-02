// Contact sheet of processed icons on a slate background to verify alpha cuts.
import sharp from "sharp";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/assets/brand/product-icons/clear-v1";
const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));
const CELL = 220, COLS = 4;
const rows = Math.ceil(files.length / COLS);

const composites = [];
for (let i = 0; i < files.length; i++) {
  const buf = await sharp(join(DIR, files[i])).resize(CELL - 20, CELL - 20).png().toBuffer();
  composites.push({ input: buf, left: (i % COLS) * CELL + 10, top: ((i / COLS) | 0) * CELL + 10 });
}
await sharp({
  create: { width: COLS * CELL, height: rows * CELL, channels: 4, background: { r: 90, g: 100, b: 115, alpha: 1 } }
})
  .composite(composites)
  .png()
  .toFile("icon-contact-sheet.png");
console.log(files.join("\n"));
