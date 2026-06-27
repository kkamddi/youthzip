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

const generatedDirs = ["policy", "region", "type", "status", "guides", "calendar"];

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

const guides = [
  {
    slug: "youth-monthly-rent-support",
    title: "청년 월세 지원·주거 지원 총정리",
    description: "청년 월세 지원, 주거비 지원, 전세·정착 지원 등 청년 주거 지원사업을 신청 대상, 기간, 공식 링크 기준으로 모아보세요.",
    intro: "월세와 주거비 부담을 줄이고 싶은 청년이라면 먼저 거주 지역, 소득 조건, 신청 기간을 함께 확인해야 합니다. 이 페이지에서는 청년 월세 지원과 주거 관련 청년 정책을 빠르게 훑어볼 수 있도록 정리했습니다.",
    sections: [
      ["먼저 확인할 조건", "대부분의 청년 주거 지원은 나이, 거주지, 소득, 무주택 여부, 임대차 계약 여부를 함께 봅니다. 같은 월세 지원이라도 지역별 예산과 접수 방식이 다르기 때문에 공식 공고의 신청 기간을 반드시 확인해야 합니다."],
      ["찾는 방법", "유형은 주거로 보고, 상태는 신청중 또는 마감임박을 먼저 확인하세요. 지역이 정해져 있다면 거주 지역 필터를 함께 적용하면 실제 신청 가능한 정책을 더 빨리 좁힐 수 있습니다."]
    ],
    related: (item) => item.type === "주거" || /월세|주거|전세|임대|정착/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["청년 월세 지원은 중복 신청할 수 있나요?", "사업마다 중복 수혜 제한이 다릅니다. 기존 주거급여, 지자체 월세 지원, 유사 주거 지원을 받고 있다면 공식 공고에서 중복 제한을 먼저 확인해야 합니다."],
      ["거주 지역과 주민등록 지역이 다르면 신청할 수 있나요?", "정책마다 기준이 다릅니다. 일부 사업은 주민등록상 주소를 기준으로 보고, 일부는 실제 거주지나 임대차 계약 주소를 함께 확인합니다."]
    ]
  },
  {
    slug: "youth-job-support",
    title: "청년 취업 지원 정책 모아보기",
    description: "청년 취업 지원, 면접 지원, 일경험, 직무교육, 구직활동 지원사업을 신청 상태와 공식 링크 기준으로 확인하세요.",
    intro: "취업 준비 중인 청년에게는 구직활동비, 면접비, 일경험, 직무교육처럼 목적이 다른 지원사업이 나뉘어 제공됩니다. 본인 상황에 맞는 정책을 고르려면 지원 내용보다 신청 대상과 진행 상태를 먼저 확인하는 것이 좋습니다.",
    sections: [
      ["먼저 확인할 조건", "미취업 여부, 졸업 여부, 재학생 가능 여부, 거주지, 소득 기준이 자주 쓰입니다. 일경험이나 직무교육은 모집 인원과 선착순 여부도 중요합니다."],
      ["찾는 방법", "유형은 취업으로 보고, 검색창에 면접, 일경험, 구직, 교육 같은 단어를 함께 입력하면 목적에 맞는 사업을 더 빠르게 찾을 수 있습니다."]
    ],
    related: (item) => item.type === "취업" || /취업|구직|면접|일경험|직무|채용|인턴/.test(`${item.title} ${item.summary} ${item.support}`),
    faq: [
      ["재학생도 청년 취업 지원을 받을 수 있나요?", "사업마다 다릅니다. 졸업예정자나 휴학생까지 허용하는 사업이 있고, 미취업 졸업자만 가능한 사업도 있습니다."],
      ["마감임박 정책은 먼저 신청해야 하나요?", "마감일이 가까운 정책은 접수 종료나 예산 소진 가능성이 있으므로 공식 링크에서 접수 가능 여부를 먼저 확인하는 편이 좋습니다."]
    ]
  },
  {
    slug: "seoul-youth-subsidy",
    title: "서울 청년 지원금·청년 정책 모아보기",
    description: "서울 청년 지원금, 서울 청년 월세 지원, 취업·주거·복지 정책을 지역별로 모아 공식 신청 링크와 함께 확인하세요.",
    intro: "서울 청년 지원사업은 주거, 취업, 복지, 문화 영역으로 나뉘어 운영되는 경우가 많습니다. 같은 서울 정책이라도 자치구별 사업과 서울시 전체 사업이 섞여 있으니 지역 조건을 함께 확인하는 것이 중요합니다.",
    sections: [
      ["서울 정책을 볼 때 중요한 점", "서울시 전체 대상인지, 특정 자치구 거주 청년 대상인지 확인해야 합니다. 신청 기간이 짧거나 모집 인원이 정해진 사업은 마감임박 상태를 먼저 보는 것이 좋습니다."],
      ["추천 확인 순서", "먼저 신청중 정책을 보고, 그다음 마감임박 정책을 확인하세요. 월세, 면접, 마음건강, 교통비처럼 목적 키워드를 검색창에 입력하면 더 정확하게 좁힐 수 있습니다."]
    ],
    related: (item) => item.regionGroup === "서울" || item.city === "서울" || String(item.region || "").includes("서울"),
    faq: [
      ["서울 청년 지원금은 서울 거주자만 신청할 수 있나요?", "대부분은 서울 거주 또는 서울 생활권 조건을 두지만 사업마다 다릅니다. 주민등록 주소, 학교·직장 소재지 기준을 각각 확인해야 합니다."],
      ["서울 자치구 사업도 함께 볼 수 있나요?", "정책 데이터에 포함된 경우 서울 지역 목록에서 함께 확인할 수 있습니다. 상세 페이지의 공식 링크에서 자치구 공고를 다시 확인하세요."]
    ]
  },
  {
    slug: "gyeonggi-youth-subsidy",
    title: "경기도 청년 지원금·청년 정책 모아보기",
    description: "경기도 청년 지원금, 청년 취업 지원, 주거·복지 정책을 지역별로 모아 신청 기간과 공식 링크 기준으로 확인하세요.",
    intro: "경기도 청년 정책은 도 단위 사업과 시·군 단위 사업이 함께 운영됩니다. 거주 중인 시·군 조건이 붙는 경우가 많으므로 제목과 상세 조건에서 지역 범위를 꼭 확인해야 합니다.",
    sections: [
      ["경기도 정책을 볼 때 중요한 점", "경기도 전체 대상인지, 특정 시·군 청년 대상인지 먼저 확인하세요. 예산 소진형 지원금은 접수 기간 안이라도 조기 종료될 수 있습니다."],
      ["추천 확인 순서", "경기도 지역 페이지에서 신청중과 마감임박 사업을 먼저 보고, 주거·취업·복지처럼 필요한 유형을 추가로 좁히는 방식이 효율적입니다."]
    ],
    related: (item) => item.regionGroup === "경기" || item.city === "경기" || String(item.region || "").includes("경기"),
    faq: [
      ["경기도 청년 지원금은 시·군이 달라도 신청할 수 있나요?", "사업마다 다릅니다. 경기도 전체 대상 사업도 있고, 특정 시·군 거주자만 가능한 사업도 있으니 공식 공고의 지역 조건을 확인해야 합니다."],
      ["경기도 청년 정책은 어디서 신청하나요?", "사업별 운영기관이 다르므로 청년혜택.zip 상세 페이지의 공식 링크에서 신청 페이지와 제출 서류를 최종 확인해야 합니다."]
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
  if (status === "마감임박") return " closing-soon";
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

function jsonLd(data) {
  return `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path)
    }))
  };
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

function pageShell({ title, description, body, path: pagePath = "/", type = "website", schema = [] }) {
  const schemaTags = schema.length ? `\n${schema.map(jsonLd).join("\n")}` : "";
  const pageScripts = [
    pagePath.startsWith("/policy/") ? `\n  <script src="/assets/saved.js" defer></script>` : "",
    pagePath === "/calendar/" ? `\n  <script src="/assets/calendar.js" defer></script>` : ""
  ].join("");
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
${seoHead({ title, description, path: pagePath, type })}
${schemaTags}
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="512x512" href="/assets/favicon.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
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
      <a href="/guides/">가이드</a>
      <a href="/calendar/">마감 캘린더</a>
    </nav>
  </header>
  <main class="content-page">
${body}
  </main>
${footer()}
${pageScripts}
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
  const isClosingSoon = item.status === "마감임박";
  return `
        <article class="policy-card compact${isClosingSoon ? " is-closing-soon" : ""}">
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

function relatedPolicies(item) {
  const itemRegion = item.regionGroup || item.region || "";
  return policies
    .filter((candidate) => candidate.id !== item.id && candidate.status !== "마감")
    .map((candidate) => ({
      candidate,
      score:
        (candidate.type === item.type ? 3 : 0) +
        ((candidate.regionGroup || candidate.region || "") === itemRegion ? 2 : 0) +
        (candidate.status === "마감임박" ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || collator.compare(a.candidate.title || "", b.candidate.title || ""))
    .slice(0, 3)
    .map(({ candidate }) => candidate);
}

function makeDetail(item) {
  const official = safeUrl(item.officialUrl);
  const related = relatedPolicies(item);
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

      <section class="detail-section">
        <h2>함께 볼 정책</h2>
        <div class="related-links">${related.map((candidate) => `<a class="related-link" href="/policy/${encodeURIComponent(candidate.id)}/"><span>${esc(candidate.regionGroup || candidate.region)} · ${esc(candidate.type)}</span><strong>${esc(candidate.title)}</strong></a>`).join("")}</div>
      </section>

      <div class="detail-actions">
        <button class="link-button favorite-button" type="button" data-favorite-button data-policy-id="${esc(item.id)}" aria-pressed="false">♡ 이 정책 찜하기</button>
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
    type: "article",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: item.regionGroup || item.region || "청년지원사업", path: `/region/${regionSlug(item)}/` },
        { name: item.title, path: detailPath }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: policySeoTitle(item),
        description,
        url: absoluteUrl(detailPath),
        dateModified: payload.updatedAt || new Date().toISOString().slice(0, 10),
        publisher: {
          "@type": "Organization",
          name: siteName,
          url: siteUrl
        },
        mainEntityOfPage: absoluteUrl(detailPath)
      }
    ]
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
    schema: [breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: heading, path: `/${kind}/` }
    ])],
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
    path: `/${kind}/${slug}/`,
    schema: [breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: kindLabels[kind], path: `/${kind}/` },
      { name: pageTitle, path: `/${kind}/${slug}/` }
    ])]
  }));
}

function writeStaticPages() {
  for (const page of staticPages) {
    const paragraphs = page.body.map((text) => `<p class="detail-summary">${esc(text)}</p>`).join("\n      ");
    writePage(`${page.slug}/index.html`, pageShell({
      title: page.title,
      description: page.description,
      path: `/${page.slug}/`,
      schema: [breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: page.title, path: `/${page.slug}/` }
      ])],
      body: `    <article class="detail-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">${esc(page.title)}</h1>
      ${paragraphs}
    </article>`
    }));
  }
}

function guideCard(guide) {
  return `<a class="category-link guide-link" href="/guides/${guide.slug}/"><strong>${esc(guide.title)}</strong><span>보기</span></a>`;
}

function guideFaqSchema(guide) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer
      }
    }))
  };
}

function makeGuideIndex() {
  const body = `    <section class="list-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <p class="eyebrow">Guides</p>
      <h1 class="page-title">청년 혜택 검색 가이드</h1>
      <p class="detail-summary">청년 월세 지원, 청년 취업 지원, 서울 청년 지원금, 경기도 청년 지원금처럼 검색 수요가 큰 주제를 따로 정리했습니다.</p>
      <div class="category-grid guide-grid">${guides.map(guideCard).join("")}</div>
    </section>`;
  writePage("guides/index.html", pageShell({
    title: "청년 혜택 검색 가이드",
    description: "청년 월세 지원, 청년 취업 지원, 서울 청년 지원금, 경기도 청년 지원금을 주제별로 쉽게 찾아보세요.",
    body,
    path: "/guides/",
    schema: [breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "청년 혜택 검색 가이드", path: "/guides/" }
    ])]
  }));
}

function makeGuide(guide) {
  const guidePath = `/guides/${guide.slug}/`;
  const related = sortPolicies(policies.filter(guide.related)).slice(0, 12);
  const sections = guide.sections.map(([heading, text]) => `      <section class="detail-section">
        <h2>${esc(heading)}</h2>
        <p>${esc(text)}</p>
      </section>`).join("\n");
  const faq = guide.faq.map(([question, answer]) => `        <article>
          <h3>${esc(question)}</h3>
          <p>${esc(answer)}</p>
        </article>`).join("\n");
  const body = `    <article class="detail-page guide-page">
      <a class="back-link" href="/guides/">← 가이드 목록으로 돌아가기</a>
      <p class="eyebrow">Guide</p>
      <h1 class="page-title">${esc(guide.title)}</h1>
      <p class="detail-summary">${esc(guide.intro)}</p>
${sections}
      <section class="detail-section">
        <h2>관련 청년지원사업</h2>
        <p>${related.length.toLocaleString("ko-KR")}개 정책을 먼저 추려봤습니다. 실제 신청 전에는 상세 페이지와 공식 링크에서 최신 공고를 확인하세요.</p>
        <div class="card-grid list-grid">${related.map(policyCard).join("")}</div>
      </section>
      <section class="detail-section faq-section">
        <h2>자주 묻는 질문</h2>
        <div class="faq-list">${faq}</div>
      </section>
    </article>`;
  writePage(`guides/${guide.slug}/index.html`, pageShell({
    title: guide.title,
    description: guide.description,
    body,
    path: guidePath,
    type: "article",
    schema: [
      breadcrumbSchema([
        { name: "홈", path: "/" },
        { name: "청년 혜택 검색 가이드", path: "/guides/" },
        { name: guide.title, path: guidePath }
      ]),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        url: absoluteUrl(guidePath),
        dateModified: payload.updatedAt || new Date().toISOString().slice(0, 10),
        publisher: {
          "@type": "Organization",
          name: siteName,
          url: siteUrl
        },
        mainEntityOfPage: absoluteUrl(guidePath)
      },
      guideFaqSchema(guide)
    ]
  }));
}

function writeGuides() {
  makeGuideIndex();
  for (const guide of guides) makeGuide(guide);
}

function koreaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function calendarMonthKeys(count = 6) {
  const [year, month] = koreaDateKey().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 + index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function calendarMonth(monthKey, isActive = false) {
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const todayKey = koreaDateKey();
  const events = policies
    .filter((item) => item.status !== "마감" && item.endDate?.startsWith(monthKey) && item.endDate >= todayKey)
    .sort((a, b) => String(a.endDate).localeCompare(String(b.endDate)) || collator.compare(a.title || "", b.title || ""));
  const byDate = new Map();
  for (const item of events) {
    if (!byDate.has(item.endDate)) byDate.set(item.endDate, []);
    byDate.get(item.endDate).push(item);
  }
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"]
    .map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  const blanks = Array.from({ length: firstWeekday }, () => `<div class="calendar-day is-empty" aria-hidden="true"></div>`).join("");
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;
    const dayEvents = byDate.get(dateKey) || [];
    const visible = dayEvents.slice(0, 3).map((item) =>
      `<a class="calendar-event" href="/policy/${encodeURIComponent(item.id)}/" title="${esc(item.title)}">${esc(item.title)}</a>`
    ).join("");
    const more = dayEvents.length > 3
      ? `<button class="calendar-more" type="button" data-agenda-target="agenda-${dateKey}">${dayEvents.length}개 전체 목록</button>`
      : "";
    const mobileCount = dayEvents.length
      ? `<button class="calendar-day-count" type="button" data-agenda-target="agenda-${dateKey}" aria-label="${year}년 ${month}월 ${day}일 마감 정책 ${dayEvents.length}개 보기">${dayEvents.length}개</button>`
      : "";
    return `<div class="calendar-day"><span class="calendar-date">${day}</span>${visible}${more}${mobileCount}</div>`;
  }).join("");
  const agenda = events.length
    ? [...byDate.entries()].map(([dateKey, items]) => `        <section class="agenda-day" id="agenda-${dateKey}">
          <h3>${Number(dateKey.slice(-2))}일 · ${items.length}개 마감</h3>
          ${items.map((item) => `<a href="/policy/${encodeURIComponent(item.id)}/">${esc(item.title)}</a>`).join("\n          ")}
        </section>`).join("\n")
    : `        <p class="empty">확인된 마감 일정이 없습니다.</p>`;
  return `      <section class="calendar-month" id="month-${monthKey}" role="tabpanel" aria-labelledby="tab-${monthKey}"${isActive ? "" : " hidden"}>
        <h2>${year}년 ${month}월</h2>
        <div class="calendar-grid" aria-label="${year}년 ${month}월 정책 마감 일정">${weekdays}${blanks}${days}</div>
        <div class="calendar-agenda">${agenda}</div>
      </section>`;
}

function writeCalendar() {
  const months = calendarMonthKeys();
  const monthNav = months.map((monthKey, index) => {
    const [year, month] = monthKey.split("-").map(Number);
    const selected = index === 0;
    return `<button id="tab-${monthKey}" type="button" role="tab" aria-controls="month-${monthKey}" aria-selected="${selected}" tabindex="${selected ? "0" : "-1"}" class="${selected ? "is-active" : ""}" data-month-target="month-${monthKey}">${year}년 ${month}월</button>`;
  }).join("");
  const body = `    <article class="detail-page calendar-page">
      <a class="back-link" href="/">← 정책 찾기로 돌아가기</a>
      <h1 class="page-title">청년지원사업 마감 캘린더</h1>
      <p class="detail-summary">신청 가능한 청년 정책의 마감일을 월별로 확인하세요. 일정은 변동될 수 있으므로 신청 전 공식 공고를 다시 확인해야 합니다.</p>
      <nav class="month-nav" aria-label="월 선택" role="tablist">${monthNav}</nav>
${months.map((monthKey, index) => calendarMonth(monthKey, index === 0)).join("\n")}
      <dialog class="calendar-dialog" data-calendar-dialog aria-labelledby="calendar-dialog-title">
        <div class="calendar-dialog-head">
          <h2 id="calendar-dialog-title" data-calendar-dialog-title>마감 정책</h2>
          <button class="calendar-dialog-close" type="button" data-calendar-dialog-close aria-label="팝업 닫기">×</button>
        </div>
        <div class="calendar-dialog-list" data-calendar-dialog-list></div>
      </dialog>
    </article>`;
  writePage("calendar/index.html", pageShell({
    title: "청년지원사업 마감 캘린더",
    description: "청년 지원금, 청년 월세 지원, 취업·주거 지원사업의 신청 마감일을 월별 캘린더에서 확인하세요.",
    body,
    path: "/calendar/",
    schema: [breadcrumbSchema([
      { name: "홈", path: "/" },
      { name: "청년지원사업 마감 캘린더", path: "/calendar/" }
    ])]
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
    sitemapEntry("/guides/", "0.8"),
    sitemapEntry("/calendar/", "0.8"),
    ...regions.map(([slug]) => sitemapEntry(`/region/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...types.map(([slug]) => sitemapEntry(`/type/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...statuses.map(([slug]) => sitemapEntry(`/status/${slug}/`, slug === "all" ? "0.8" : "0.7")),
    ...guides.map((guide) => sitemapEntry(`/guides/${guide.slug}/`, "0.75")),
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
writeGuides();
writeCalendar();
writeSitemap();

console.log(`Generated ${policies.length} policy pages, ${regions.length + types.length + statuses.length + 3} category pages, ${guides.length + 1} guide pages, calendar, sitemap.xml, and robots.txt.`);
