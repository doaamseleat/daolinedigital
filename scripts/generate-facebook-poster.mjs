import fs from 'node:fs/promises';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1080;
const HEIGHT = 1350;

function decodeHtml(value = '') {
  const entities = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '
  };
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeXml(value = '') {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[character]);
}

function extractMeta(html, name) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const nameMatch = tag.match(/\bname\s*=\s*(["'])?([^\s"'>]+)\1?/i);
    if (nameMatch?.[2]?.toLowerCase() !== name.toLowerCase()) continue;
    const contentMatch = tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i);
    if (contentMatch) return decodeHtml(contentMatch[2]);
  }
  return '';
}

export function extractArticleMetadata(html, filename = '') {
  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle = decodeHtml(titleMatch?.[1] ?? path.basename(filename, '.html'));
  const title = rawTitle.replace(/\s*[|–—-]\s*Daoline\s*Digital\s*$/i, '').trim();
  const description = extractMeta(html, 'description');
  return { title: title || path.basename(filename, '.html'), description };
}

function wrapText(text, maxCharacters, maxLines) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharacters || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const visible = lines.slice(0, maxLines);
    visible[maxLines - 1] = `${visible[maxLines - 1].replace(/[.…]+$/, '')}…`;
    return visible;
  }
  return lines;
}

function tspans(lines, x, startY, lineHeight) {
  return lines.map((line, index) =>
    `<tspan x="${x}" y="${startY + index * lineHeight}">${escapeXml(line)}</tspan>`
  ).join('');
}

export async function generatePoster({ articlePath, outputPath, logoPath }) {
  const html = await fs.readFile(articlePath, 'utf8');
  const metadata = extractArticleMetadata(html, articlePath);
  const titleLines = wrapText(metadata.title, 18, 4);
  const description = metadata.description || 'أفكار عملية ورؤى حديثة تساعدك على تطوير حضورك ونتائجك الرقمية.';
  const descriptionLines = wrapText(description, 45, 3);
  const logoData = await fs.readFile(logoPath);
  const logoUri = `data:image/png;base64,${logoData.toString('base64')}`;

  const svg = `
  <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0f172a"/>
        <stop offset="0.58" stop-color="#17142b"/>
        <stop offset="1" stop-color="#3a0a42"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.88" cy="0.10" r="0.70">
        <stop offset="0" stop-color="#c013a6" stop-opacity="0.55"/>
        <stop offset="1" stop-color="#c013a6" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="20" stdDeviation="30" flood-opacity="0.35"/></filter>
    </defs>
    <rect width="1080" height="1350" rx="0" fill="url(#bg)"/>
    <rect width="1080" height="1350" fill="url(#glow)"/>
    <circle cx="930" cy="185" r="260" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="2"/>
    <circle cx="930" cy="185" r="190" fill="none" stroke="#ffffff" stroke-opacity="0.05" stroke-width="2"/>
    <rect x="72" y="72" width="936" height="1206" rx="42" fill="#ffffff" fill-opacity="0.035" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" filter="url(#shadow)"/>

    <image href="${logoUri}" x="824" y="105" width="150" height="150" preserveAspectRatio="xMidYMid meet"/>
    <text x="105" y="160" fill="#f8fafc" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="700" letter-spacing="1">DAOLINE DIGITAL</text>
    <rect x="105" y="198" width="170" height="7" rx="4" fill="#c013a6"/>

    <text x="540" y="390" fill="#ffffff" font-family="DejaVu Sans, sans-serif" font-size="64" font-weight="700" text-anchor="middle" direction="rtl">${tspans(titleLines, 540, 390, 94)}</text>

    <line x1="105" x2="975" y1="840" y2="840" stroke="#ffffff" stroke-opacity="0.15" stroke-width="2"/>
    <text x="960" y="920" fill="#dbe3ef" font-family="DejaVu Sans, sans-serif" font-size="33" font-weight="400" text-anchor="end" direction="rtl">${tspans(descriptionLines, 960, 920, 55)}</text>

    <rect x="680" y="1110" width="295" height="86" rx="43" fill="#c013a6"/>
    <text x="827" y="1165" fill="#ffffff" font-family="DejaVu Sans, sans-serif" font-size="32" font-weight="700" text-anchor="middle" direction="rtl">اقرأ المقال كاملًا</text>
    <text x="105" y="1163" fill="#ffffff" font-family="DejaVu Sans, sans-serif" font-size="28" font-weight="700">daolinedigital.com</text>
    <text x="105" y="1220" fill="#94a3b8" font-family="DejaVu Sans, sans-serif" font-size="22">SOCIAL MEDIA • STRATEGY • GROWTH</text>
  </svg>`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' }
  });
  await fs.writeFile(outputPath, renderer.render().asPng());
  return metadata;
}

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  const articlePath = argument('article');
  if (!articlePath) throw new Error('Missing required --article path');
  const outputPath = argument('output', 'tmp/facebook-poster.png');
  const logoPath = argument('logo', 'logo-daoline.png');
  const metadata = await generatePoster({ articlePath, outputPath, logoPath });
  console.log(JSON.stringify({ ...metadata, outputPath }));
}
