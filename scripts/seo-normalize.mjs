import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const base = "https://daolinedigital.com";

const descriptions = new Map([
  [
    "blog/016.html",
    "دليل عملي لأهم تحديثات Meta في 2026 وتأثيرها على المحتوى والإعلانات وإدارة حسابات السوشيال ميديا، مع خطوات واضحة للتطبيق.",
  ],
  [
    "blog/article-2.html",
    "دليل عملي لبناء الهوكات والسرد في محتوى السوشيال ميديا، مع قوالب وأمثلة تساعدك على جذب الانتباه وتحويل الفكرة إلى محتوى أقوى.",
  ],
]);

const canonicalOverrides = new Map([
  ["blog/article-5.html", `${base}/blog/article-8.html`],
]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules", "queue"].includes(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function publicUrl(relativePath) {
  if (relativePath === "index.html") return `${base}/`;
  if (relativePath.endsWith("/index.html")) {
    return `${base}/${relativePath.slice(0, -"index.html".length)}`;
  }
  return `${base}/${relativePath}`;
}

for (const file of walk(root).filter((item) => item.endsWith(".html"))) {
  const relativePath = path.relative(root, file).split(path.sep).join("/");
  let html = fs.readFileSync(file, "utf8");
  const eol = html.includes("\r\n") ? "\r\n" : "\n";
  const noindex = /<meta\s+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);

  if (!noindex && !/<link\s+rel=["']canonical["']/i.test(html)) {
    const canonical = canonicalOverrides.get(relativePath) ?? publicUrl(relativePath);
    const tag = `  <link rel="canonical" href="${canonical}" />`;
    const viewport = /(<meta\s+name=["']viewport["'][^>]*>)/i;
    if (!viewport.test(html)) throw new Error(`No viewport insertion point: ${relativePath}`);
    html = html.replace(viewport, `$1${eol}${tag}`);
  }

  if (!noindex && !/<meta\s+name=["']description["']/i.test(html)) {
    const description = descriptions.get(relativePath);
    if (!description) throw new Error(`Missing curated description: ${relativePath}`);
    const title = /(<title>[\s\S]*?<\/title>)/i;
    if (!title.test(html)) throw new Error(`No title insertion point: ${relativePath}`);
    html = html.replace(title, `$1${eol}  <meta name="description" content="${description}" />`);
  }

  fs.writeFileSync(file, html, "utf8");
}
