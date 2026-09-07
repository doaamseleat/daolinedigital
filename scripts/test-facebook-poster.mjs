import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractArticleMetadata, generatePoster } from './generate-facebook-poster.mjs';

const articlePath = process.env.TEST_ARTICLE || 'blog/018.html';
const outputPath = 'tmp/test-018-facebook-poster.png';
const html = await fs.readFile(articlePath, 'utf8');
const metadata = extractArticleMetadata(html, articlePath);
const generatorSource = await fs.readFile('scripts/generate-facebook-poster.mjs', 'utf8');

assert.ok(metadata.title.length > 5, 'Article title was not extracted');
assert.ok(metadata.description.length > 20, 'Meta description was not extracted');
assert.ok(!metadata.title.includes('| Daoline Digital'), 'Brand suffix should not repeat in poster title');
assert.ok(!generatorSource.includes('DejaVu Sans'), 'Poster must not use the old fallback font');
assert.match(generatorSource, /font-family="Changa"[^>]+font-weight="800"[^>]+text-anchor="middle"[^>]+direction="rtl"/);
assert.match(generatorSource, /font-family="Tajawal"[^>]+font-weight="500"[^>]+text-anchor="middle"[^>]+direction="rtl"/);
assert.match(generatorSource, /font-family="Tajawal"[^>]+font-weight="700"[^>]+text-anchor="middle"[^>]+direction="rtl"/);
assert.match(generatorSource, /font-family="Montserrat"[^>]+font-weight="600"/);
assert.match(generatorSource, /loadSystemFonts: false/);
for (const fontFile of [
  'assets/fonts/Changa-Variable.ttf',
  'assets/fonts/Tajawal-Medium.ttf',
  'assets/fonts/Tajawal-Bold.ttf',
  'assets/fonts/Montserrat-Variable.ttf'
]) {
  const font = await fs.stat(fontFile);
  assert.ok(font.size > 50_000, `Local font is missing or invalid: ${fontFile}`);
}

await generatePoster({ articlePath, outputPath, logoPath: 'logo-daoline.png' });
const png = await fs.readFile(outputPath);
assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
assert.equal(width, 1080);
assert.equal(height, 1350);

console.log(JSON.stringify({ articlePath, outputPath, metadata, image: { width, height, format: 'PNG' } }, null, 2));
