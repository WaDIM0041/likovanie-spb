const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'design/index.html'];
const jpgSources = new Set();

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');

  html = html.replace(/\sloading="eager"/g, ' loading="lazy"');
  html = html.replace(/<img\b([^>]*?)\bsrc="([^"]+\.jpg)"([^>]*)>/g, (tag, before, jpgPath, after, offset, source) => {
    jpgSources.add(path.resolve(path.dirname(file), jpgPath));
    const webpPath = jpgPath.replace(/\.jpg$/, '.webp');
    const pictureStart = source.lastIndexOf('<picture', offset);
    const existingPicture = pictureStart !== -1 && source.slice(pictureStart, offset).includes(`srcset="${webpPath}"`);
    return existingPicture ? tag : `<picture><source type="image/webp" srcset="${webpPath}"><img${before}src="${jpgPath}"${after}></picture>`;
  });
  html = html.replace(/(<img\b[^>]*\bsrc="(?:\.\.\/)?research\/assets\/041\.jpg")([^>]*>)/, (tag, start, end) => {
    return /\bfetchpriority=/.test(tag) ? tag : `${start} fetchpriority="high"${end}`;
  });

  fs.writeFileSync(file, html);
}

for (const jpgFile of jpgSources) {
  const webpFile = jpgFile.replace(/\.jpg$/, '.webp');
  const result = spawnSync('magick', [jpgFile, '-strip', '-quality', '82', '-define', 'webp:method=6', webpFile], {stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Generated ${jpgSources.size} WebP images and updated ${pages.length} pages.`);
