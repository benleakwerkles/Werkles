// One-off: turn the white background of the recolored W drafts into true alpha.
// Flood-fills from the borders so interior glossy highlights are untouched.
import sharp from "sharp";
import path from "node:path";

const SRC_DIR = "C:/Users/Ben Leak/.cursor/projects/c-Users-Ben-Leak-Desktop-github-Werkles/assets";
const OUT_DIR = "C:/Users/Ben Leak/Desktop/github/Werkles/public/assets/draft/brand-rebrand";

const FILES = [
  ["werkles-w-green-orange-white.png", "werkles-w-green-orange-transparent.png"],
  ["werkles-w-green-purple-white.png", "werkles-w-green-purple-transparent.png"],
  ["werkles-w-green-blue-white.png", "werkles-w-green-blue-transparent.png"],
  ["werkles-w-original-white.png", "werkles-w-original-transparent.png"]
];

// Near-white threshold: background is pure-ish white; W edges are saturated color.
const NEAR_WHITE = 235;

for (const [srcName, outName] of FILES) {
  const src = path.join(SRC_DIR, srcName);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isBg = (x, y) => {
    const i = (y * width + x) * channels;
    return data[i] >= NEAR_WHITE && data[i + 1] >= NEAR_WHITE && data[i + 2] >= NEAR_WHITE;
  };

  const visited = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) {
    stack.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    stack.push([0, y], [width - 1, y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const vi = y * width + x;
    if (visited[vi]) continue;
    visited[vi] = 1;
    if (!isBg(x, y)) continue;
    data[vi * channels + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Soften the cut edge: partial alpha for border-adjacent bright pixels.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const vi = y * width + x;
      const ai = vi * channels + 3;
      if (data[ai] === 0) continue;
      const nearCut =
        data[((y - 1) * width + x) * channels + 3] === 0 ||
        data[((y + 1) * width + x) * channels + 3] === 0 ||
        data[(y * width + x - 1) * channels + 3] === 0 ||
        data[(y * width + x + 1) * channels + 3] === 0;
      if (nearCut) {
        const brightness = (data[vi * channels] + data[vi * channels + 1] + data[vi * channels + 2]) / 3;
        if (brightness > 210) {
          data[ai] = Math.round(255 * (1 - (brightness - 210) / 45));
        }
      }
    }
  }

  const out = path.join(OUT_DIR, outName);
  await sharp(data, { raw: { width, height, channels } }).png().toFile(out);
  console.log(`OK ${outName}`);
}
