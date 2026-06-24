import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "policies.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const policies = payload.policies || [];
const collator = new Intl.Collator("ko-KR");
const siteUrl = "https://youthzip.pages.dev";

const regions = [
  ["all", "전체"],
  ["national", "전국"],
  ["seoul", "서울"],
  ["busan", "부산"],
  ["daegu", "대구"],
  ["incheon", "인천"],
  ["gwangju", "광주"],
  ["daejeon", "대전"],
  ["ulsan", "울산"],
  ["sejong", "세종"],
  ["gyeonggi", "경기"],
  ["gangwon", "강원"],
  ["chungbuk", "충북"],
  ["chungnam", "충남"],
  ["jeonbuk", "전북"],
  ["jeonnam", "전남"],
  ["gyeongbuk", "경북"],
  ["gyeongnam", "경남"],
  ["jeju", "제주"]
];

const types = [
  ["all", "전체"],
  ["housing", "주거"],
  ["job", "취업"],
  ["finance", "금융"],
  ["education", "교육"],
  ["transport", "교통"],
  ["culture", "문화"],
  ["welfare", "복지"],
  ["startup", "창업"]
];

const statuses = [
  ["all", "전체"],
  ["open", "신청중"],
  ["closing-soon", "마감임박"],
  ["scheduled", "예정"],
  ["closed", "마감"]
];

const generatedDirs = ["policy", "region", "type", "status"];

function assertInsideRoot(target) {
  const resolved = path.resolve(target);
  if (!resolved.startsWith(rootDir + path.sep)) {
    throw new Error(`Refusing to write outside site root: ${resolved}`);
  }
}

function resetDir(name) {
  const dir = path.join(rootDir, name);
  assertInsideRoot(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function writePage(relativePath, html) {
  const target = path.join(rootDir, relativePath);
  assertInsideRoot(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, html, "utf8");
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function safeUrl(value) {
  const url = String(value || "");
  return /^https?:\/\//.test(url) ? url : "";
}

function statusClass(status) {
  if (status === "마감") return " closed";
  if (status === "예정") return " scheduled";
  return "";
}

function pageShell({ title, description, body }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} - 청년혜택.zip</title>
  <meta name="description" content="${esc(description)}">
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="/" aria-label="청년혜택.zip 홈">
      <strong>청년혜택.zip</strong>
      <span>청년지원사업 찾기</span>
    </a>
    <nav class="top-nav" aria-label="주요 메뉴">
      <a href="/">정책 찾기</a>
      <a href="/region/">지역별</a>
      <a href="/type/">유형별</a>
      <a href="/status/">상태별</a>
    </nav>
  </header>
  <main class="content-page">
${body}
  </main>
</body>
</html>
`;
}

function metaRows(item) {
  return [
    ["지원내용", item.support],
    ["신청기간", item.period],
    ["대상연령", item.age],
    ["소득/조건", item.income],
    ["지역/거주", item.residence],
    ["분야", item.type],
    ["상태", item.status]
  ].filter(([, value]) => value).map(([label, value]) => `
          <div>
            <dt>${esc(label)}</dt>
            <dd>${esc(value)}</dd>
          </div>`).join("");
}

function policyCard(item) {
  const official = safeUrl(item.officialUrl);
  return `
        <article class="policy-card compact">
          <div class="labels">
            <span>${esc(item.regionGroup || item.region)}</span>
            <span>${esc(item.type)}</span>
            <b class="status${statusClass(item.status)}">${esc(item.status)}</b>
          </div>
          <h3><a href="/policy/${encodeURIComponent(item.id)}/">${esc(item.title)}</a></h3>
          <p class="summary">${esc(item.summary || item.support)}</p>
          <dl class="meta">
            <div><dt>지원</dt><dd>${esc(item.support)}</dd></div>
            <div><dt>기간</dt><dd>${esc(item.period)}</dd></div>
          </dl>
          <div class="card-actions">
            <a class="link-button" href="/policy/${encodeURIComponent(item.id)}/">상세보기</a>
            ${official ? `<a class="link-button primary" href="${esc(official)}" target="_blank" rel="noopener noreferrer">공식 링크</a>` : ""}
          </div>
        </article>`;
}

function sortPolicies(items) {
  return [...items].sort((a, b) =>
    collator.compare(a.regionGroup || a.region || "", b.regionGroup || b.region || "") ||
    collator.compare(a.type || "", b.type || "") ||
    collator.compare(a.title || "", b.title || "")
  );
}

function makeDetail(item) {
  const official = safeUrl(item.officialUrl);
  const description = item.summary || `${item.title} 지원내용, 신청기간, 대상 조건을 정리했습니다.`;
  const body = `    <article class="detail-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <div class="labels">
        <span>${esc(item.regionGroup || item.region)}</span>
        <span>${esc(item.type)}</span>
        <b class="status${statusClass(item.status)}">${esc(item.status)}</b>
      </div>
      <h1 class="page-title">${esc(item.title)}</h1>
      <p class="detail-summary">${esc(item.summary || item.support)}</p>

      <section class="detail-section">
        <h2>핵심 정보</h2>
        <dl class="info-table">${metaRows(item)}
        </dl>
      </section>

      <section class="detail-section">
        <h2>확인할 것</h2>
        <p>신청 전 모집 공고의 접수 기간, 세부 자격, 제출 서류를 공식 페이지에서 다시 확인하세요.</p>
      </section>

      <div class="detail-actions">
        ${official ? `<a class="link-button primary" href="${esc(official)}" target="_blank" rel="noopener noreferrer">공식 사이트에서 확인</a>` : ""}
        <a class="link-button" href="/region/${regionSlug(item)}/">${esc(item.regionGroup || item.region)} 정책 더보기</a>
        <a class="link-button" href="/type/${typeSlug(item)}/">${esc(item.type)} 정책 더보기</a>
      </div>

      <p class="source-footnote">공식 공고 기준으로 정리한 정보입니다. 실제 신청은 반드시 공식 링크에서 최종 확인 후 진행하세요.</p>
    </article>`;

  writePage(`policy/${encodeURIComponent(item.id)}/index.html`, pageShell({
    title: item.title,
    description,
    body
  }));
}

function optionIndex(kind, heading, description, options) {
  const links = options.map(([slug, label]) => {
    const href = `/${kind}/${slug}/`;
    const count = countFor(kind, label);
    return `<a class="category-link" href="${href}"><strong>${esc(label)}</strong><span>${count.toLocaleString("ko-KR")}개</span></a>`;
  }).join("");
  writePage(`${kind}/index.html`, pageShell({
    title: heading,
    description,
    body: `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">${esc(heading)}</h1>
      <p class="detail-summary">${esc(description)}</p>
      <div class="category-grid">${links}</div>
    </section>`
  }));
}

function countFor(kind, label) {
  if (label === "전체") return policies.length;
  if (kind === "region") return filterRegion(policies, label).length;
  if (kind === "type") return policies.filter((item) => item.type === label).length;
  if (kind === "status") return policies.filter((item) => item.status === label).length;
  return 0;
}

function regionSlug(item) {
  const label = item.regionGroup || item.region || "전체";
  return regions.find(([, value]) => value === label)?.[0] || "all";
}

function typeSlug(item) {
  return types.find(([, value]) => value === item.type)?.[0] || "all";
}

function filterRegion(items, label) {
  return items.filter((item) =>
    item.regionGroup === label ||
    item.city === label ||
    String(item.region || "").includes(label)
  );
}

function listPage(kind, slug, label, items) {
  const sorted = sortPolicies(items);
  const body = `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <p class="eyebrow">${kind}</p>
      <h1 class="page-title">${esc(label)} 청년지원사업</h1>
      <p class="detail-summary">${sorted.length.toLocaleString("ko-KR")}개 정책을 한눈에 확인할 수 있게 묶었습니다.</p>
      <div class="card-grid list-grid">${sorted.map(policyCard).join("")}</div>
    </section>`;
  writePage(`${kind}/${slug}/index.html`, pageShell({
    title: `${label} 청년지원사업`,
    description: `${label} 조건에 맞는 청년지원사업 목록입니다.`,
    body
  }));
}

function sitemapEntry(url, priority = "0.7") {
  const lastmod = payload.updatedAt || new Date().toISOString().slice(0, 10);
  return `  <url>
    <loc>${esc(siteUrl + url)}</loc>
    <lastmod>${esc(lastmod)}</lastmod>
    <priority>${priority}</priority>
  </url>`;
}

function writeSitemap() {
  const urls = [
    sitemapEntry("/", "1.0"),
    sitemapEntry("/region/", "0.8"),
    sitemapEntry("/type/", "0.8"),
    sitemapEntry("/status/", "0.8"),
    ...regions.map(([slug]) => sitemapEntry(`/region/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...types.map(([slug]) => sitemapEntry(`/type/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...statuses.map(([slug]) => sitemapEntry(`/status/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...policies.map((item) => sitemapEntry(`/policy/${encodeURIComponent(item.id)}/`, "0.6"))
  ];
  writePage("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`);
  writePage("robots.txt", `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`);
}

for (const dir of generatedDirs) resetDir(dir);
for (const item of policies) makeDetail(item);

optionIndex("region", "지역별 청년지원사업", "살고 있거나 신청하려는 지역 기준으로 정책을 찾습니다.", regions);
optionIndex("type", "유형별 청년지원사업", "주거, 취업, 금융처럼 필요한 지원 분야 기준으로 정책을 찾습니다.", types);
optionIndex("status", "상태별 청년지원사업", "신청 가능 여부와 일정 기준으로 정책을 찾습니다.", statuses);

for (const [slug, label] of regions) {
  const items = label === "전체" ? policies : filterRegion(policies, label);
  listPage("region", slug, label, items);
}

for (const [slug, label] of types) {
  const items = label === "전체" ? policies : policies.filter((item) => item.type === label);
  listPage("type", slug, label, items);
}

for (const [slug, label] of statuses) {
  const items = label === "전체" ? policies : policies.filter((item) => item.status === label);
  listPage("status", slug, label, items);
}

writeSitemap();

console.log(`Generated ${policies.length} policy pages, ${regions.length + types.length + statuses.length + 3} category pages, sitemap.xml, and robots.txt.`);
