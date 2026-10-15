const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'design/index.html'];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

for (const page of pages) {
  const html = read(page);
  const imageTags = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+\.jpg)"[^>]*>/g)];
  const eagerImages = html.match(/\sloading="eager"/g) || [];

  assert.ok(imageTags.length > 0, `${page} should contain JPEG fallback images`);
  assert.equal(eagerImages.length, 0, `${page}: below-the-fold images must not block the first screen`);
  assert.match(html, /<img\b[^>]*\bsrc="(?:\.\.\/)?research\/assets\/041\.jpg"[^>]*\bfetchpriority="high"/, `${page}: hero image should be prioritized`);

  for (const match of imageTags) {
    const imagePath = match[1];
    const webpPath = imagePath.replace(/\.jpg$/, '.webp');
    const filePath = path.resolve(path.dirname(path.join(root, page)), webpPath);
    assert.ok(fs.existsSync(filePath), `${page}: missing WebP companion for ${imagePath}`);

    const pictureStart = html.lastIndexOf('<picture', match.index);
    const pictureEnd = html.indexOf('</picture>', match.index);
    assert.ok(pictureStart !== -1 && pictureEnd !== -1, `${page}: ${imagePath} must be wrapped in picture`);
    const picture = html.slice(pictureStart, pictureEnd);
    assert.match(
      picture,
      new RegExp(`<source\\s+type="image/webp"\\s+srcset="${webpPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
      `${page}: ${imagePath} must offer WebP before JPEG fallback`,
    );
  }
}

const motion = read('design/motion-source.js');
assert.match(motion, /\.webp/, 'hero scene switching should preload WebP images');
console.log('image delivery: WebP sources and JPEG fallbacks are present');
