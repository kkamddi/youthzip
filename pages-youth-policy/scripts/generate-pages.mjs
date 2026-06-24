import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "policies.json");
const payload = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const policies = payload.policies || [];
const policyTitleCounts = policies.reduce((counts, item) => {
  const title = String(item.title || "청년지원사업");
  counts.set(title, (counts.get(title) || 0) + 1);
  return counts;
}, new Map());
const collator = new Intl.Collator("ko-KR");
const siteUrl = "https://youthzip.pages.dev";
const siteName = "청년혜택.zip";
const defaultOgImage = `${siteUrl}/assets/og-image.svg`;

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

const staticPages = [
  {
    slug: "about",
    title: "소개",
    description: "청년혜택.zip은 청년지원사업을 조건별로 빠르게 찾을 수 있도록 정리한 안내 사이트입니다.",
    body: [
      "청년혜택.zip은 지역, 지원 유형, 신청 상태를 기준으로 청년지원사업을 한눈에 살펴볼 수 있도록 만든 정보 안내 사이트입니다.",
      "각 정책의 신청 여부와 세부 자격은 운영기관의 공식 공고가 최종 기준입니다."
    ]
  },
  {
    slug: "editorial-policy",
    title: "편집 방침",
    description: "청년혜택.zip의 정책 정보 정리 기준과 편집 원칙입니다.",
    body: [
      "정책명, 지역, 분야, 신청기간, 지원내용, 대상 조건은 공식 정책 데이터와 공고 내용을 기준으로 정리합니다.",
      "정보 전달을 위해 긴 문장은 요약할 수 있으며, 신청 전에는 반드시 공식 링크에서 최신 공고와 제출 서류를 확인해야 합니다."
    ]
  },
  {
    slug: "sources",
    title: "이미지 출처",
    description: "청년혜택.zip에서 사용하는 이미지와 자료 출처 안내입니다.",
    body: [
      "현재 정책 목록과 상세 페이지는 별도 정책 이미지를 사용하지 않고 텍스트 정보 중심으로 구성합니다.",
      "향후 이미지가 추가되는 경우 공공누리, 공식 보도자료, 직접 제작 이미지 등 사용 가능한 자료를 기준으로 출처를 함께 표기합니다."
    ]
  },
  {
    slug: "notice",
    title: "면책·공지",
    description: "청년혜택.zip 이용 전 확인해야 할 공지와 면책 안내입니다.",
    body: [
      "본 사이트의 정보는 청년지원사업 탐색을 돕기 위한 참고 자료입니다. 모집 일정, 예산 소진, 자격 조건, 제출 서류는 운영기관 사정에 따라 변경될 수 있습니다.",
      "신청 및 계약 등 중요한 결정 전에는 각 정책의 공식 링크와 담당 기관 안내를 최종 확인해 주세요."
    ]
  },
  {
    slug: "privacy",
    title: "개인정보처리방침",
    description: "청년혜택.zip의 개인정보 처리 안내입니다.",
    body: [
      "청년혜택.zip은 현재 회원가입, 댓글, 직접 신청 기능을 제공하지 않으며 이용자의 주민등록번호, 연락처, 계좌번호 등 민감한 개인정보를 직접 수집하지 않습니다.",
      "외부 공식 신청 사이트로 이동한 뒤 입력하는 개인정보는 해당 기관의 개인정보처리방침을 따릅니다."
    ]
  },
  {
    slug: "contact",
    title: "연락처",
    description: "청년혜택.zip 문의와 제보 안내입니다.",
    body: [
      "정책 정보 오류, 링크 오류, 제휴 문의가 있는 경우 운영자가 확인할 수 있는 연락 채널을 준비해 반영할 예정입니다.",
      "정확한 신청 상담은 각 정책 상세 페이지의 공식 링크 또는 담당 기관 연락처를 이용해 주세요."
    ]
  }
];

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

function teaser(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > 95 ? `${text.slice(0, 95)}...` : text;
}

function policySeoTitle(item) {
  const title = String(item.title || "청년지원사업");
  if ((policyTitleCounts.get(title) || 0) <= 1) return title;
  const region = item.regionGroup || item.region || "전국";
  return `${title} - ${region} 정책 ${String(item.id || "").slice(-6)}`;
}

function trimMeta(value, max = 155) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function absoluteUrl(urlPath = "/") {
  const urlPathText = String(urlPath || "/");
  if (/^https?:\/\//.test(urlPathText)) return urlPathText;
  return `${siteUrl}${urlPathText.startsWith("/") ? urlPathText : `/${urlPathText}`}`;
}

function seoHead({ title, description, path: pagePath = "/", type = "website" }) {
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const metaDescription = trimMeta(description);
  const canonicalUrl = absoluteUrl(pagePath);
  return `  <title>${esc(fullTitle)}</title>
  <meta name="description" content="${esc(metaDescription)}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${esc(canonicalUrl)}">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:title" content="${esc(fullTitle)}">
  <meta property="og:description" content="${esc(metaDescription)}">
  <meta property="og:image" content="${esc(defaultOgImage)}">
  <meta property="og:image:alt" content="청년 혜택과 청년 지원사업을 찾는 청년혜택.zip">
  <meta property="og:url" content="${esc(canonicalUrl)}">
  <meta property="og:type" content="${esc(type)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(fullTitle)}">
  <meta name="twitter:description" content="${esc(metaDescription)}">
  <meta name="twitter:image" content="${esc(defaultOgImage)}">`;
}

function footer() {
  return `  <footer class="site-footer">
    <nav class="footer-links" aria-label="사이트 안내">
      <a href="/about/">소개</a>
      <a href="/editorial-policy/">편집 방침</a>
      <a href="/sources/">이미지 출처</a>
      <a href="/notice/">면책·공지</a>
      <a href="/privacy/">개인정보처리방침</a>
      <a href="/contact/">연락처</a>
    </nav>
    <p>본 사이트는 광고·제휴 수익으로 운영될 수 있습니다. 게시 정보는 공식 공고 기준이며 변동될 수 있습니다. © 2026 청년혜택.zip</p>
  </footer>`;
}

function pageShell({ title, description, body, path: pagePath = "/", type = "website" }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${seoHead({ title, description, path: pagePath, type })}
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
${footer()}
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
          <p class="summary">${esc(teaser(item.summary || item.support))}</p>
          <dl class="meta brief">
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
  const detailPath = `/policy/${encodeURIComponent(item.id)}/`;
  const description = trimMeta(`${item.regionGroup || item.region || "전국"} ${item.type || "청년"} 정책(${item.id}): ${item.title}. 신청기간 ${item.period || "공식 공고 확인"}, 지원내용, 대상 조건과 공식 링크를 확인하세요.`);
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
    title: policySeoTitle(item),
    description,
    body,
    path: detailPath,
    type: "article"
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
    path: `/${kind}/`,
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
  const kindLabels = { region: "지역별", type: "유형별", status: "상태별" };
  const pageTitle = label === "전체" ? `${kindLabels[kind]} 전체 청년지원사업` : `${label} 청년지원사업`;
  const pageDescription = label === "전체"
    ? `${kindLabels[kind]} 전체 청년 지원금, 청년 정책, 청년지원사업 목록입니다. 신청기간과 공식 링크를 확인하세요.`
    : `${label} 조건에 맞는 청년 지원금, 청년 정책, 청년지원사업 목록입니다. 신청기간과 공식 링크를 확인하세요.`;
  const body = `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <p class="eyebrow">${kind}</p>
      <h1 class="page-title">${esc(pageTitle)}</h1>
      <p class="detail-summary">${sorted.length.toLocaleString("ko-KR")}개 정책을 한눈에 확인할 수 있게 묶었습니다.</p>
      <div class="card-grid list-grid">${sorted.map(policyCard).join("")}</div>
    </section>`;
  writePage(`${kind}/${slug}/index.html`, pageShell({
    title: pageTitle,
    description: pageDescription,
    body,
    path: `/${kind}/${slug}/`
  }));
}

function writeStaticPages() {
  for (const page of staticPages) {
    const paragraphs = page.body.map((text) => `<p class="detail-summary">${esc(text)}</p>`).join("\n      ");
    writePage(`${page.slug}/index.html`, pageShell({
      title: page.title,
      description: page.description,
      path: `/${page.slug}/`,
      body: `    <article class="detail-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">${esc(page.title)}</h1>
      ${paragraphs}
    </article>`
    }));
  }
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
    ...staticPages.map((page) => sitemapEntry(`/${page.slug}/`, "0.5")),
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

writeStaticPages();
writeSitemap();

console.log(`Generated ${policies.length} policy pages, ${regions.length + types.length + statuses.length + 3} category pages, sitemap.xml, and robots.txt.`);
