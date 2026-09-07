import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { extractArticleMetadata, generatePoster } from './generate-facebook-poster.mjs';

const articlePath = process.env.TEST_ARTICLE || 'blog/018.html';
const outputPath = 'tmp/test-018-facebook-poster.png';
const html = await fs.readFile(articlePath, 'utf8');
const metadata = extractArticleMetadata(html, articlePath);

assert.ok(metadata.title.length > 5, 'Article title was not extracted');
assert.ok(metadata.description.length > 20, 'Meta description was not extracted');
assert.ok(!metadata.title.includes('| Daoline Digital'), 'Brand suffix should not repeat in poster title');

await generatePoster({ articlePath, outputPath, logoPath: 'logo-daoline.png' });
const png = await fs.readFile(outputPath);
assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
assert.equal(width, 1080);
assert.equal(height, 1350);

console.log(JSON.stringify({ articlePath, outputPath, metadata, image: { width, height, format: 'PNG' } }, null, 2));
