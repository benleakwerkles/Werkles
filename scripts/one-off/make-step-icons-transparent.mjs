// One-off: flood-fill the white backgrounds of the three lady-jessica-style
// step icons into alpha, matching the product-icon family treatment.
import sharp from "sharp";
import path from "node:path";

const SRC_DIR = "C:/Users/Ben Leak/.cursor/projects/c-Users-Ben-Leak-Desktop-github-Werkles/assets";
const OUT_DIR = "C:/Users/Ben Leak/github/Werkles/public/assets/brand/product-icons/lady-jessica-v1";

const FILES = [
  ["werkles-step-dossier-lj-v1-raw.png", "werkles-step-dossier-v1.png"],
  ["werkles-step-fit-lj-v1-raw.png", "werkles-step-fit-v1.png"],
  ["werkles-step-knock-lj-v1-raw.png", "werkles-step-knock-v1.png"],
  ["werkles-icon-armory-lj-v1-raw.png", "werkles-armory-v1.png"],
  ["werkles-check-funds-lj-v1-raw.png", "werkles-check-funds-v1.png"],
  ["werkles-nav-proof-lj-v1-raw.png", "werkles-proof-shield-v1.png"],
  ["werkles-icon-dossier-lj-v1-raw.png", "werkles-dossier-folder-v1.png"],
  ["werkles-lane-spark-lj-v1-raw.png", "werkles-lane-spark-v1.png"],
  ["werkles-lane-builder-lj-v1-raw.png", "werkles-lane-builder-v1.png"],
  ["werkles-lane-worker-lj-v1-raw.png", "werkles-lane-worker-v1.png"],
  ["werkles-lane-operator-lj-v1-raw.png", "werkles-lane-operator-v1.png"],
  ["werkles-lane-backer-lj-v1-raw.png", "werkles-lane-backer-v1.png"],
  ["werkles-lane-connector-lj-v1-raw.png", "werkles-lane-connector-v1.png"]
];

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
  for (let x = 0; x < width; x++) stack.push([x, 0], [x, height - 1]);
  for (let y = 0; y < height; y++) stack.push([0, y], [width - 1, y]);

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
      if (nearCut) data[ai] = 140;
    }
  }

  const out = path.join(OUT_DIR, outName);
  await sharp(data, { raw: { width, height, channels } })
    .resize(512, 512, { fit: "inside" })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log("wrote", out);
}
