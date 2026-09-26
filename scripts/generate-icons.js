import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const iconSvg = fs.readFileSync('public/icon.svg');
  const maskableSvg = fs.readFileSync('public/icon-maskable.svg');

  console.log('Rendering 192x192 PNG...');
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');

  console.log('Rendering 512x512 PNG...');
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');

  console.log('Rendering maskable 512x512 PNG...');
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-maskable-512x512.png');

  console.log('Rendering 180x180 apple-touch-icon...');
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');

  console.log('Rendering 32x32 favicon.png...');
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.png');

  // Copy favicon.png to favicon.ico as standard Chromium fallback
  fs.copyFileSync('public/favicon.png', 'public/favicon.ico');

  console.log('All PWA & Android icons generated successfully!');
}

generate().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
