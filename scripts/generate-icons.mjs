import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const svgBuffer = readFileSync(resolve('public/icon.svg'));
const sizes = [192, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(resolve(`public/icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
}

generate().catch(console.error);
