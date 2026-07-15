import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://youthzip.pages.dev";
const payload = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "policies.json"), "utf8"));
const errors = [];
const warnings = [];

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.name.endsWith(".html") ? [target] : [];
  });
}

function firstMatch(html, pattern) {
  return html.match(pattern)?.[1]?.trim() || "";
}

function pageUrl(file) {
  const relative = path.relative(rootDir, file).replaceAll(path.sep, "/");
  return relative === "index.html" ? `${siteUrl}/` : `${siteUrl}/${relative.replace(/index\.html$/, "")}`;
}

const sitemap = fs.readFileSync(path.join(rootDir, "sitemap.xml"), "utf8");
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]));
const pages = htmlFiles(rootDir).filter((file) => {
  const name = path.basename(file);
  return !/^(google|naver)[a-z0-9]+\.html$/i.test(name);
});
const titleOwners = new Map();
const descriptionOwners = new Map();
let indexableCount = 0;
let noindexCount = 0;

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const url = pageUrl(file);
  const title = firstMatch(html, /<title>([^<]+)<\/title>/i);
  const description = firstMatch(html, /<meta name="description" content="([^"]*)"/i);
  const robots = firstMatch(html, /<meta name="robots" content="([^"]*)"/i);
  const canonical = firstMatch(html, /<link rel="canonical" href="([^"]*)"/i);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const missingAlt = [...html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)];
  const requiredSocialMeta = [
    ["og:title", /<meta property="og:title" content="[^"]+"/i],
    ["og:description", /<meta property="og:description" content="[^"]+"/i],
    ["og:image", /<meta property="og:image" content="[^"]+"/i],
    ["og:url", /<meta property="og:url" content="[^"]+"/i],
    ["og:type", /<meta property="og:type" content="[^"]+"/i],
    ["twitter:card", /<meta name="twitter:card" content="[^"]+"/i],
    ["twitter:title", /<meta name="twitter:title" content="[^"]+"/i],
    ["twitter:description", /<meta name="twitter:description" content="[^"]+"/i],
    ["twitter:image", /<meta name="twitter:image" content="[^"]+"/i]
  ];

  if (!title) errors.push(`${url}: title 누락`);
  if (!description) errors.push(`${url}: meta description 누락`);
  if (!robots) errors.push(`${url}: robots meta 누락`);
  if (canonical !== url) errors.push(`${url}: canonical 불일치 (${canonical || "없음"})`);
  if (h1Count !== 1) errors.push(`${url}: H1 ${h1Count}개`);
  if (missingAlt.length) errors.push(`${url}: alt 없는 이미지 ${missingAlt.length}개`);
  for (const [name, pattern] of requiredSocialMeta) {
    if (!pattern.test(html)) errors.push(`${url}: ${name} 누락`);
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch {
      errors.push(`${url}: JSON-LD 문법 오류`);
    }
  }

  if (title) {
    if (!titleOwners.has(title)) titleOwners.set(title, []);
    titleOwners.get(title).push(url);
  }
  if (description) {
    if (!descriptionOwners.has(description)) descriptionOwners.set(description, []);
    descriptionOwners.get(description).push(url);
  }

  if (robots.startsWith("noindex")) {
    noindexCount += 1;
    if (sitemapUrls.has(url)) errors.push(`${url}: noindex 페이지가 sitemap에 포함됨`);
  } else if (robots.startsWith("index")) {
    indexableCount += 1;
    if (!sitemapUrls.has(url)) errors.push(`${url}: index 페이지가 sitemap에서 누락됨`);
  }
}

for (const [title, owners] of titleOwners) {
  if (owners.length > 1) warnings.push(`중복 title ${owners.length}개: ${title}`);
}
for (const [description, owners] of descriptionOwners) {
  if (owners.length > 1) warnings.push(`중복 description ${owners.length}개: ${description}`);
}

for (const url of sitemapUrls) {
  const pathname = new URL(url).pathname;
  const file = pathname === "/"
    ? path.join(rootDir, "index.html")
    : path.join(rootDir, pathname.slice(1), "index.html");
  if (!fs.existsSync(file)) errors.push(`${url}: sitemap 대상 파일 없음`);
}

const policyUrls = [...sitemapUrls].filter((url) => url.includes("/policy/"));
const closedIds = new Set(payload.policies.filter((item) => item.status === "마감").map((item) => encodeURIComponent(item.id)));
const closedInSitemap = policyUrls.filter((url) => closedIds.has(new URL(url).pathname.split("/").filter(Boolean).at(-1)));
if (closedInSitemap.length) errors.push(`마감 정책 ${closedInSitemap.length}개가 sitemap에 포함됨`);

const home = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const homeBlock = firstMatch(home, /HOME_POLICY_STATIC_START([\s\S]*?)HOME_POLICY_STATIC_END/);
const homeStaticCards = (homeBlock.match(/class="policy-card/g) || []).length;
if (homeStaticCards !== 30) errors.push(`메인 정적 정책 카드가 ${homeStaticCards}개임 (기대값 30)`);
if (!home.includes("현재 확인할 청년지원사업")) errors.push("메인 ItemList 구조화 데이터 누락");

const largeLists = ["region/all/index.html", "type/all/index.html", "status/all/index.html"]
  .map((relative) => ({ relative, bytes: fs.statSync(path.join(rootDir, relative)).size }));
for (const page of largeLists) {
  if (page.bytes > 150_000) errors.push(`${page.relative}: ${page.bytes} bytes로 과도하게 큼`);
}

console.log(JSON.stringify({
  htmlPages: pages.length,
  sitemapUrls: sitemapUrls.size,
  sitemapPolicyUrls: policyUrls.length,
  indexableHtmlPages: indexableCount,
  noindexHtmlPages: noindexCount,
  homeStaticCards,
  closedInSitemap: closedInSitemap.length,
  listPageBytes: largeLists,
  errors: errors.slice(0, 30),
  warnings: warnings.slice(0, 20)
}, null, 2));

if (errors.length) process.exitCode = 1;
