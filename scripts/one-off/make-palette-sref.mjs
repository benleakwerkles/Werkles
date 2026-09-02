import sharp from "sharp";

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">
  <rect width="900" height="600" fill="#FDF8EE"/>
  <rect x="40" y="40" width="250" height="520" fill="#2A0E8C"/>
  <rect x="325" y="40" width="250" height="520" fill="#02917E"/>
  <rect x="610" y="40" width="250" height="320" fill="#FDF8EE" stroke="#C9A227" stroke-width="6"/>
  <rect x="610" y="400" width="250" height="160" fill="#C9A227"/>
</svg>`);

await sharp(svg).png().toFile("public/assets/draft/icons-pop-v1/werkles-palette-sref.png");
console.log("swatch done");
