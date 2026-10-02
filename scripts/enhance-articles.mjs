import fs from "node:fs/promises";
import path from "node:path";

const ADSENSE = '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9549277321717950" crossorigin="anonymous"></script>';
const ENHANCEMENTS = '<script defer src="/assets/article-enhancements.js"></script>';
const AD_PLACEMENTS = '<script defer src="/assets/ad-placements.js"></script>';
const ENHANCEMENT_STYLES = '<link rel="stylesheet" href="/assets/article-enhancements.css">';
const MANAGED_START = '<!-- ARTICLE_DISCOVERY_START -->';
const MANAGED_END = '<!-- ARTICLE_DISCOVERY_END -->';
const TOC_START = '<!-- ARTICLE_TOC_START -->';
const TOC_END = '<!-- ARTICLE_TOC_END -->';

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value, index) {
  const slug = value
    .replace(/<[^>]+>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 70);
  return slug || `section-${index + 1}`;
}

function injectHead(html, tag) {
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function discoveryBlock(items, currentIndex) {
  const related = [];
  for (let offset = 1; related.length < 4 && offset < items.length; offset += 1) {
    const candidate = items[(currentIndex + offset) % items.length];
    if (candidate && !related.some((item) => item.link === candidate.link)) related.push(candidate);
  }

  return `${MANAGED_START}
  <aside class="article-author" aria-label="عن الكاتبة">
    <img src="/doaa-photo.jpg" alt="دعاء سليط - خبيرة تسويق رقمي" width="72" height="72" loading="lazy">
    <div><strong>كتابة ومراجعة: دعاء سليط</strong><p>خبيرة سوشيال ميديا ومدربة تسويق رقمي بخبرة عملية في الاستراتيجية والمحتوى والإعلانات.</p></div>
  </aside>
  <section class="related-articles" aria-label="مقالات مرتبطة">
    <h2>كمّلي القراءة</h2>
    <ul>${related.map((item) => `<li><a href="/blog/${encodeURIComponent(item.link)}">${escapeHtml(item.title)} ←</a></li>`).join("")}</ul>
  </section>
  ${MANAGED_END}`;
}

function tocBlock(headings) {
  if (headings.length < 3) return "";
  return `${TOC_START}
  <nav class="article-toc" aria-label="فهرس المقال">
    <strong>في هذا المقال</strong>
    <ol>${headings.map((heading) => `<li><a href="#${heading.id}">${escapeHtml(heading.title)}</a></li>`).join("")}</ol>
  </nav>
  ${TOC_END}`;
}

const items = JSON.parse(await fs.readFile("blog/articles.json", "utf8"));
let changed = 0;

for (let currentIndex = 0; currentIndex < items.length; currentIndex += 1) {
  const item = items[currentIndex];
  const file = path.join("blog", item.link);
  let html;
  try {
    html = await fs.readFile(file, "utf8");
  } catch {
    continue;
  }

  const original = html;
  if (!/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/i.test(html)) {
    html = injectHead(html, ADSENSE);
  }
  if (!/\/assets\/article-enhancements\.css/i.test(html)) {
    html = injectHead(html, ENHANCEMENT_STYLES);
  }
  if (!/\/assets\/article-enhancements\.js/i.test(html)) {
    html = html.replace(/<\/body>/i, `${ENHANCEMENTS}\n</body>`);
  }
  if (!/\/assets\/ad-placements\.js/i.test(html)) {
    html = html.replace(/<\/body>/i, `${AD_PLACEMENTS}\n</body>`);
  }

  const headings = [];
  const headingIds = new Set();
  let headingIndex = 0;
  html = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (match, attrs = "", inner) => {
    if (/\bid\s*=/.test(attrs)) {
      const existing = attrs.match(/\bid\s*=\s*["']([^"']+)/i)?.[1];
      if (existing) {
        headingIds.add(existing);
        headings.push({ id: existing, title: inner.replace(/<[^>]+>/g, " ").trim() });
      }
      return match;
    }
    const title = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!title || /كمّلي القراءة|اقرأ أيضًا|المصادر|أسئلة شائعة/.test(title)) return match;
    const baseId = slugify(title, headingIndex++);
    let id = baseId;
    let suffix = 2;
    while (headingIds.has(id)) id = `${baseId}-${suffix++}`;
    headingIds.add(id);
    headings.push({ id, title });
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });

  const managedPattern = /\s*<!-- ARTICLE_DISCOVERY_START -->[\s\S]*?<!-- ARTICLE_DISCOVERY_END -->\s*/;
  const block = discoveryBlock(items, currentIndex);
  if (managedPattern.test(html)) {
    html = html.replace(managedPattern, `\n${block}\n`);
  } else if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, `${block}\n</main>`);
  } else {
    html = html.replace(/<\/body>/i, `${block}\n</body>`);
  }

  const tocPattern = /\s*<!-- ARTICLE_TOC_START -->[\s\S]*?<!-- ARTICLE_TOC_END -->\s*/;
  html = html.replace(tocPattern, "");
  const toc = tocBlock(headings.slice(0, 12));
  if (toc && /<main\b[^>]*>/i.test(html)) {
    html = html.replace(/(<main\b[^>]*>)/i, `$1\n${toc}\n`);
  }

  if (html !== original) {
    await fs.writeFile(file, html);
    changed += 1;
  }
}

console.log(`Enhanced ${changed} article pages.`);
