import fs from 'node:fs/promises';
import path from 'node:path';

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : '';
}

function decodeHtml(value = '') {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, name) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const nameMatch = tag.match(/\bname\s*=\s*(["'])?([^\s"'>]+)\1?/i);
    if (nameMatch?.[2]?.toLowerCase() !== name.toLowerCase()) continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
    if (contentMatch) return decodeHtml(contentMatch[2]);
  }
  return '';
}

const articlePath = argument('article');
if (!articlePath || !/^blog\/[^/]+\.html$/.test(articlePath)) {
  throw new Error('Use --article with a published path such as blog/030-example.html');
}

const html = await fs.readFile(articlePath, 'utf8');
const title = decodeHtml(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? 'مقال من Daoline Digital');
const desc = extractMeta(html, 'description') || 'مقال جديد من مكتبة Daoline Digital.';
const link = path.basename(articlePath);
const numberMatch = link.match(/^(\d+)/);
const number = numberMatch ? Number(numberMatch[1]) : 0;
const indexPath = 'blog/articles.json';
const current = JSON.parse(await fs.readFile(indexPath, 'utf8'));

const entry = { title, desc, link, number };
const updated = [entry, ...current.filter(item => item.link !== link)];
await fs.writeFile(indexPath, `${JSON.stringify(updated, null, 2)}\n`);
console.log(JSON.stringify(entry));
