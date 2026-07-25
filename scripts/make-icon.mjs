import fs from "fs";
import sharp from "sharp";

const svg = fs.readFileSync("public/index.svg", "utf8");
// White glyph on charcoal — matches app dark theme
const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#0a0a0a"/>
  <g fill="#ffffff">
    ${svg.replace(/<\/?svg[^>]*>/g, "").replace(/fill="white"/g, 'fill="#ffffff"')}
  </g>
</svg>`;

const buf = Buffer.from(wrapped);
await sharp(buf).png().toFile("public/index.png");
await sharp(buf).resize(256, 256).png().toFile("public/index-256.png");
await sharp(buf).resize(128, 128).png().toFile("public/index-128.png");
await sharp(buf).resize(32, 32).png().toFile("public/index-32.png");
// also for dist
fs.copyFileSync("public/index.png", "dist/index.png");
fs.copyFileSync("public/index.svg", "dist/index.svg");
console.log("Wrote public/index.png (+ sizes) and dist/index.png");
