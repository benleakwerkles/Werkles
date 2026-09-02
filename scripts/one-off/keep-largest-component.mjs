// Remove stray opaque islands (AI text artifacts) from an icon by keeping
// only the largest connected opaque component.
import sharp from "sharp";
import { renameSync } from "node:fs";

const FILE = process.argv[2];
const { data, info } = await sharp(FILE).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

const label = new Int32Array(w * h).fill(-1);
const sizes = [];
for (let start = 0; start < w * h; start++) {
  if (label[start] !== -1 || data[start * 4 + 3] === 0) continue;
  const id = sizes.length;
  let size = 0;
  const stack = [start];
  label[start] = id;
  while (stack.length) {
    const p = stack.pop();
    size++;
    const x = p % w, y = (p / w) | 0;
    for (const n of [p - 1, p + 1, p - w, p + w]) {
      if (n < 0 || n >= w * h) continue;
      const nx = n % w;
      if (Math.abs(nx - x) > 1) continue;
      if (label[n] === -1 && data[n * 4 + 3] !== 0) { label[n] = id; stack.push(n); }
    }
  }
  sizes.push(size);
}
const keep = sizes.indexOf(Math.max(...sizes));
let removed = 0;
for (let p = 0; p < w * h; p++) {
  if (label[p] !== -1 && label[p] !== keep) { data[p * 4 + 3] = 0; removed++; }
}
await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(FILE + ".tmp");
renameSync(FILE + ".tmp", FILE);
console.log(`components: ${sizes.length}, kept ${sizes[keep]}px, removed ${removed}px`);
