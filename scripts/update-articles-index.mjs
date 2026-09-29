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

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function renderStaticIndex(items) {
  const pagePath = 'blog/index.html';
  let page = await fs.readFile(pagePath, 'utf8');
  const cards = items.map(item => `  <article class="card">
    <h2>${escapeHTML(item.title || 'مقال من Daoline Digital')}</h2>
    <p class="desc">${escapeHTML(item.desc || 'مقال جديد من مكتبة Daoline Digital.')}</p>
    <a href="/blog/${encodeURIComponent(item.link || '')}" class="btn">اقرأ المقال ←</a>
  </article>`).join('\n');
  const block = `<!-- ARTICLES_STATIC_START -->\n${cards}\n<!-- ARTICLES_STATIC_END -->`;
  const pattern = /<!-- ARTICLES_STATIC_START -->[\s\S]*?<!-- ARTICLES_STATIC_END -->/;
  if (!pattern.test(page)) throw new Error('Static article markers are missing from blog/index.html');
  page = page.replace(pattern, block);
  await fs.writeFile(pagePath, page);
}

async function ensureSitemapEntry(articleFile) {
  const sitemapPath = 'sitemap.xml';
  let sitemap = await fs.readFile(sitemapPath, 'utf8');
  const encodedName = encodeURIComponent(path.basename(articleFile));
  const url = `https://daolinedigital.com/blog/${encodedName}`;
  const today = new Date().toISOString().slice(0, 10);
  if (!sitemap.includes(`<loc>${url}</loc>`)) {
    const entry = `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    sitemap = sitemap.replace('</urlset>', `${entry}</urlset>`);
  }
  sitemap = sitemap.replace(
    /(<loc>https:\/\/daolinedigital\.com\/blog\/<\/loc>\s*<lastmod>)[^<]+/,
    `$1${today}`
  );
  await fs.writeFile(sitemapPath, sitemap);
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
await renderStaticIndex(updated);
await ensureSitemapEntry(articlePath);
console.log(JSON.stringify(entry));
