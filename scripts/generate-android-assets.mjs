// Theme source of truth: src/theme.ts
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const foregroundSvg = readFileSync(resolve('public/icon-foreground.svg'));
const iconSvg = readFileSync(resolve('public/icon.svg'));
const splashSvg = readFileSync(resolve('public/splash.svg'));

const iconSizes = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192,
};

const splashSizes = {
  'drawable-land-mdpi': { width: 480, height: 320 },
  'drawable-land-hdpi': { width: 800, height: 480 },
  'drawable-land-xhdpi': { width: 1280, height: 720 },
  'drawable-land-xxhdpi': { width: 1920, height: 1080 },
  'drawable-land-xxxhdpi': { width: 2560, height: 1440 },
  'drawable-port-mdpi': { width: 320, height: 480 },
  'drawable-port-hdpi': { width: 480, height: 800 },
  'drawable-port-xhdpi': { width: 720, height: 1280 },
  'drawable-port-xxhdpi': { width: 1080, height: 1920 },
  'drawable-port-xxxhdpi': { width: 1440, height: 2560 },
  'drawable': { width: 1080, height: 1920 },
};

const backgroundColor = '#050805';

async function generateIcon(size, outPath, iconBuffer) {
  await sharp(iconBuffer)
    .resize(size, size)
    .png()
    .toFile(outPath);
}

async function generateSplash(dir, { width, height }) {
  await sharp(splashSvg)
    .resize(width, height)
    .png()
    .toFile(resolve(`android/app/src/main/res/${dir}/splash.png`));
}

async function generate() {
  for (const [density, size] of Object.entries(iconSizes)) {
    const dir = `android/app/src/main/res/mipmap-${density}`;
    await generateIcon(size, resolve(`${dir}/ic_launcher.png`), iconSvg);
    await generateIcon(size, resolve(`${dir}/ic_launcher_round.png`), iconSvg);
    await generateIcon(size, resolve(`${dir}/ic_launcher_foreground.png`), foregroundSvg);
    console.log(`Generated mipmap-${density} icons`);
  }

  for (const [dir, spec] of Object.entries(splashSizes)) {
    await generateSplash(dir, spec);
    console.log(`Generated ${dir}/splash.png`);
  }
}

generate().catch(console.error);
