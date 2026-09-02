// One-off: repaint the transparent W mark with the wave palettes so the swell
// continues through the W into "erkles". The lockup is designed on one 520x80
// canvas: the W owns x 0..120, the word owns x 120..520, and the seam path is
// continuous across the handoff at x=120 (y=54, matching the word gradients).
// The W's own luminance is reused as shading so the 3D gloss survives.
import sharp from "sharp";

const W_SRC = "C:/Users/Ben Leak/github/Werkles/public/assets/werkles-w-mark-transparent.png";
const OUT_DIR = "C:/Users/Ben Leak/github/Werkles/public/assets/draft/brand-rebrand";

// Continuous swell across W + word. Word segment (120..520) matches the
// existing word SVGs exactly (their 0,54 start shifted right by 120).
const SEAM = "M0,56 C35,64 70,36 120,54 C170,62 210,16 290,20 C360,24 370,66 440,60 C475,57 500,50 520,52";
const FILL = `${SEAM} L520,0 L0,0 Z`;

const DEFS = `<defs>
  <linearGradient id='p' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#6a35f2'/><stop offset='1' stop-color='#4520c9'/>
  </linearGradient>
  <linearGradient id='p4' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#17131f'/><stop offset='0.4' stop-color='#3d16ca'/><stop offset='1' stop-color='#5b2be0'/>
  </linearGradient>
  <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#0aa38c'/><stop offset='1' stop-color='#027665'/>
  </linearGradient>
  <linearGradient id='g4' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#08a58c'/><stop offset='1' stop-color='#035c4e'/>
  </linearGradient>
  <linearGradient id='w2v' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#18c5ae'/><stop offset='0.3' stop-color='#06957f'/><stop offset='0.64' stop-color='#5b2be0'/><stop offset='1' stop-color='#3d16ca'/>
  </linearGradient>
  <linearGradient id='w2vi' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#6a35f2'/><stop offset='0.3' stop-color='#4b1fd6'/><stop offset='0.64' stop-color='#0aa38c'/><stop offset='1' stop-color='#027665'/>
  </linearGradient>
  <linearGradient id='gB' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#2fe0c2'/><stop offset='1' stop-color='#08a58c'/>
  </linearGradient>
  <linearGradient id='pB' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#6a35f2'/><stop offset='1' stop-color='#4b1fd6'/>
  </linearGradient>
  <linearGradient id='gD' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#0f9d84'/><stop offset='1' stop-color='#076a58'/>
  </linearGradient>
  <linearGradient id='pD' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#341bb0'/><stop offset='1' stop-color='#241075'/>
  </linearGradient>
  <linearGradient id='gP' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#5fdcc4'/><stop offset='1' stop-color='#24b89b'/>
  </linearGradient>
  <linearGradient id='pP' x1='0' y1='0' x2='0' y2='1'>
    <stop offset='0' stop-color='#8a63f0'/><stop offset='1' stop-color='#6a44db'/>
  </linearGradient>
</defs>`;

const STYLES = {
  inkseam: {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#14121f' stroke-width='8' stroke-linecap='round'/>",
  },
  "inkseam-inverted": {
    bottom: "url(#p)",
    top: "url(#g)",
    seam: "<path d='SEAM' fill='none' stroke='#14121f' stroke-width='8' stroke-linecap='round'/>",
  },
  deepwater: {
    bottom: "url(#g4)",
    top: "url(#p4)",
    seam: "",
  },
  amber: {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#f2a33c' stroke-width='10' stroke-linecap='round'/>",
  },
  // Subtle set: same swell, quieter accent — thin band instead of a loud stripe.
  "amber-subtle": {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#e0a458' stroke-width='4' stroke-linecap='round'/>",
  },
  "sunset-subtle": {
    bottom: "url(#p)",
    top: "url(#g)",
    seam: "<path d='SEAM' fill='none' stroke='#e8933a' stroke-width='4' stroke-linecap='round'/>",
  },
  "copper-subtle": {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#b87333' stroke-width='4' stroke-linecap='round'/>",
  },
  "cream-subtle": {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#f2e8d5' stroke-width='4' stroke-linecap='round'/>",
  },
  "rose-subtle": {
    bottom: "url(#g)",
    top: "url(#p)",
    seam: "<path d='SEAM' fill='none' stroke='#e26d5c' stroke-width='4' stroke-linecap='round'/>",
  },
  // W2 pushed: green crest over purple deep, curved, no seam / foam thread.
  "green-over-purple": {
    bottom: "url(#p)",
    top: "url(#g)",
    seam: "",
  },
  "green-over-purple-foam": {
    bottom: "url(#p)",
    top: "url(#g)",
    seam: "<path d='SEAM' fill='none' stroke='#f2e8d5' stroke-width='4' stroke-linecap='round'/>",
  },
  // GT4 comparison set (Ben 2026-07-26): softer gloss transfer so the paint
  // stops swinging too dark/too light, across four palettes — plus the W2
  // straight blend itself continued through the W (no curve, no seam).
  "w2-straight": {
    straight: "url(#w2v)",
    shade: { base: 0.75, range: 0.45 },
  },
  "w2-straight-inverted": {
    straight: "url(#w2vi)",
    shade: { base: 0.75, range: 0.45 },
  },
  "gt4-soft": {
    bottom: "url(#p)",
    top: "url(#g)",
    seam: "",
    shade: { base: 0.75, range: 0.45 },
  },
  "gt4-bright": {
    bottom: "url(#pB)",
    top: "url(#gB)",
    seam: "",
    shade: { base: 0.75, range: 0.45 },
  },
  "gt4-deep": {
    bottom: "url(#pD)",
    top: "url(#gD)",
    seam: "",
    shade: { base: 0.75, range: 0.45 },
  },
  "gt4-pastel": {
    bottom: "url(#pP)",
    top: "url(#gP)",
    seam: "",
    shade: { base: 0.75, range: 0.45 },
  },
};

function waveSvg(style, viewBox, pxW, pxH) {
  const s = STYLES[style];
  const body = s.straight
    ? `<rect x='-10' y='-10' width='540' height='100' fill='${s.straight}'/>`
    : `<rect x='-10' y='-10' width='540' height='100' fill='${s.bottom}'/>
<path d='${FILL}' fill='${s.top}'/>
${s.seam.replace("SEAM", SEAM)}`;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${viewBox}' width='${pxW}' height='${pxH}' preserveAspectRatio='none'>
${DEFS}
${body}
</svg>`;
}

const wMark = sharp(W_SRC).ensureAlpha();
const { data: wPx, info } = await wMark.raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

for (const style of Object.keys(STYLES)) {
  const svg = waveSvg(style, "0 0 120 80", width, height);
  const { data: gPx } = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const wi = i * channels;
    const a = wPx[wi + 3];
    if (a === 0) continue;
    const lum = 0.2126 * wPx[wi] + 0.7152 * wPx[wi + 1] + 0.0722 * wPx[wi + 2];
    // Gloss transfer: dark W pixels darken the wave color, highlights lift it.
    const { base = 0.5, range = 0.85 } = STYLES[style].shade || {};
    const f = base + (lum / 255) * range;
    for (let c = 0; c < 3; c++) {
      const g = gPx[i * 4 + c];
      out[i * 4 + c] = f <= 1 ? Math.round(g * f) : Math.min(255, Math.round(g + (255 - g) * (f - 1)));
    }
    out[i * 4 + 3] = a;
  }

  const outPath = `${OUT_DIR}/werkles-w-wave-${style}.png`;
  await sharp(out, { raw: { width, height, channels: 4 } }).png().toFile(outPath);
  console.log(`OK werkles-w-wave-${style}.png`);
}
