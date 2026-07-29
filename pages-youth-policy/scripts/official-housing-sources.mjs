const USER_AGENT = "Mozilla/5.0 (compatible; YouthzipPolicyCollector/1.0; +https://youthzip.pages.dev/sources/)";
const MYHOME_LIST_URL = "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcList.do";
const MYHOME_DETAIL_URL = "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcDetailView.do";
const MYHOME_REFERER = "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcView.do";
const HUG_LIST_URL = "https://www.khug.or.kr/jeonse/web/s07/s070301.jsp";

const myHomeQueries = [
  { searchTyId: "FIXES100001", srchPblancNm: "" },
  { searchTyId: "", srchPblancNm: "청년" },
  { searchTyId: "", srchPblancNm: "행복주택" },
  { searchTyId: "", srchPblancNm: "든든전세" },
  { searchTyId: "", srchPblancNm: "신혼희망타운" },
  { searchTyId: "", srchPblancNm: "전세임대" }
];

const regionPatterns = [
  ["서울", /서울/],
  ["부산", /부산/],
  ["대구", /대구/],
  ["인천", /인천/],
  ["광주", /광주/],
  ["대전", /대전/],
  ["울산", /울산/],
  ["세종", /세종/],
  ["경기", /경기|김포|부천|오산|의정부|파주/],
  ["강원", /강원|철원|인제|화천/],
  ["충북", /충북|충청북도|청주|충주/],
  ["충남", /충남|충청남도|천안|당진/],
  ["전북", /전북|전북특별자치도|전주/],
  ["전남", /전남|전라남도|나주/],
  ["경북", /경북|경상북도|포항|칠곡|고령/],
  ["경남", /경남|경상남도|양산|물금/],
  ["제주", /제주/]
];

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function htmlToText(html) {
  return normalizeSpace(decodeEntities(
    String(html || "")
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ));
}

function koreaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dateKey(year, month, day) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function compactDate(value) {
  const raw = String(value || "").replace(/[^\d]/g, "");
  return raw.length >= 8 ? dateKey(raw.slice(0, 4), raw.slice(4, 6), raw.slice(6, 8)) : "";
}

function dateDiffDays(from, to) {
  const fromDate = new Date(`${from}T00:00:00+09:00`);
  const toDate = new Date(`${to}T00:00:00+09:00`);
  return Math.ceil((toDate - fromDate) / 86400000);
}

export function statusFromDates(startDate, endDate, fallback = "신청중", today = koreaDateKey()) {
  if (endDate && endDate < today) return "마감";
  if (startDate && startDate > today) return "예정";
  if (endDate && dateDiffDays(today, endDate) <= 7) return "마감임박";
  return fallback === "모집중" ? "신청중" : fallback || "신청중";
}

export function refreshPolicyStatus(item, today = koreaDateKey()) {
  if (!item?.startDate && !item?.endDate) return item;
  return {
    ...item,
    status: statusFromDates(item.startDate || "", item.endDate || "", item.status, today)
  };
}

function regionsFromText(value) {
  const text = normalizeSpace(value).replace(/전남광주통합특별시/g, "광주");
  const regions = regionPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([label]) => label);
  return [...new Set(regions)];
}

function regionFields(value) {
  const regions = regionsFromText(value);
  const regionLabel = regions.length ? regions.join("·") : "전국";
  return {
    regions,
    region: regionLabel,
    regionGroup: regionLabel,
    city: regions.join(", ") || "전국"
  };
}

async function fetchText(url, encoding = "utf-8") {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept": "text/html,application/xhtml+xml"
    }
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
}

async function fetchMyHomePage(pageIndex, query) {
  const body = new URLSearchParams({
    pageIndex: String(pageIndex),
    searchTyId: query.searchTyId || "",
    srchPrgrStts: "1",
    srchSuplyTy: "",
    srchHouseTy: "",
    srchSuplyPrvuseAr: "",
    srchBassMtRntchrg: "",
    srchbrtcCode: "",
    srchsignguCode: "",
    srchRcritPblancDeYearMtBegin: "",
    srchRcritPblancDeYearMtEnd: "",
    srchPblancNm: query.srchPblancNm || "",
    lfstsTyAt: ""
  });
  const response = await fetch(MYHOME_LIST_URL, {
    method: "POST",
    headers: {
      "user-agent": USER_AGENT,
      "referer": MYHOME_REFERER,
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "accept": "application/json"
    },
    body
  });
  if (!response.ok) throw new Error(`MyHome search returned HTTP ${response.status}`);
  return response.json();
}

async function searchMyHome(query) {
  const first = await fetchMyHomePage(1, query);
  const items = [...(first.resultList || [])];
  const pages = Math.max(1, Math.ceil(Number(first.resultCnt || items.length) / 5));
  for (let page = 2; page <= pages; page += 1) {
    const payload = await fetchMyHomePage(page, query);
    items.push(...(payload.resultList || []));
  }
  return items;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function section(text, startLabel, endLabel) {
  const start = text.indexOf(startLabel);
  if (start < 0) return "";
  const end = text.indexOf(endLabel, start + startLabel.length);
  return text.slice(start + startLabel.length, end > start ? end : undefined).trim();
}

function koreanDates(value) {
  return [...String(value || "").matchAll(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g)]
    .map((match) => dateKey(match[1], match[2], match[3]));
}

function cleanMyHomeTitle(value) {
  return normalizeSpace(value)
    .replace(/(?:\[정정공고\]){2,}/g, "[정정공고]")
    .replace(/^\[신규모집\]\s*/g, "");
}

function myHomeAge(targets, title) {
  const text = `${targets} ${title}`;
  if (/청년|대학생/.test(text)) return "청년·대학생 등 공고별 공급대상 기준";
  if (/신혼/.test(text)) return "신혼부부·예비신혼부부 등 공고별 기준";
  return "연령 제한 없음 또는 공급유형별 기준";
}

function cleanMyHomeTargets(value, title) {
  const targets = normalizeSpace(value)
    .split(/(?:공급기관|문의기관|해당기관|대상지역|공급정보|공고문|일정 정보)/)[0]
    .replace(/[.,\s]+$/, "");
  if (targets && targets.length <= 140) return targets;
  if (/청년/.test(title)) return "청년 등 공고별 공급대상";
  if (/행복주택|신혼희망타운/.test(title)) {
    return "대학생, 청년, 신혼부부 등 공고별 공급대상";
  }
  return "공고별 공급대상";
}

async function mapMyHomePolicy(item) {
  const detailUrl = `${MYHOME_DETAIL_URL}?pblancId=${encodeURIComponent(item.pblancId)}`;
  const text = htmlToText(await fetchText(detailUrl));
  const title = cleanMyHomeTitle(item.pblancNm);
  const targets = cleanMyHomeTargets(section(text, "입주대상", "주택유형"), title);
  const applicationSection = section(text, "접수 일정", "당첨자 발표일");
  const dates = koreanDates(applicationSection);
  const startDate = dates[0] || "";
  const endDate = dates.at(-1) || "";
  const period = startDate && endDate
    ? `${startDate} ~ ${endDate}`
    : /상시모집/.test(item.pblancNm || "") ? "상시" : "공식 공고 확인";
  const regionSource = item.brtcCodeNm === "전남광주통합특별시"
    ? title
    : `${item.brtcCodeNm || ""} ${title}`;
  const regionData = regionFields(regionSource);
  const status = statusFromDates(startDate, endDate, item.prgrStts === "모집중" ? "신청중" : item.prgrStts);
  const supplyType = item.suplyTyNm || "공공임대주택";
  const organization = item.suplyInsttNm || "공공주택 공급기관";
  const officialUrl = /^https:\/\//.test(item.url || "") ? item.url : detailUrl;
  return {
    id: `myhome-${item.pblancId}`,
    title,
    ...regionData,
    type: "주거",
    status,
    support: `${organization}의 ${supplyType} 입주자 모집 공고입니다. 신청 전 공급 주택, 임대 조건, 제출 서류를 공식 공고문에서 확인해야 합니다.`,
    period,
    startDate,
    endDate,
    age: myHomeAge(targets, title),
    income: "소득·자산 기준은 모집 공고문 확인",
    residence: regionData.regions.length
      ? `${regionData.regions.join(", ")} 소재 주택 및 공고별 거주 조건`
      : "공고별 공급지역과 거주 조건 확인",
    summary: `입주대상은 ${targets}입니다. ${organization}의 ${supplyType} 모집 일정과 신청 조건을 확인하세요.`,
    officialUrl,
    tistoryUrl: "",
    sourceKey: "myhome",
    sourceName: "마이홈·공급기관 공식 공고",
    sourceItemId: String(item.pblancId),
    sourceUpdatedAt: compactDate(item.lastUpdtDt || item.rcritPblancDe)
  };
}

export async function fetchMyHomePolicies() {
  const queryResults = await Promise.all(myHomeQueries.map(searchMyHome));
  const byId = new Map();
  for (const item of queryResults.flat()) {
    const title = normalizeSpace(item.pblancNm);
    if (!item.pblancId || /고령자|다자녀|신생아|기존임차인/.test(title)) continue;
    byId.set(String(item.pblancId), item);
  }
  const mapped = await mapWithConcurrency([...byId.values()], 4, mapMyHomePolicy);
  return mapped.filter((item) => item.status !== "마감");
}

function hugArticleLinks(html) {
  const links = [];
  const pattern = /<a[^>]+href="([^"]*articleId=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    const title = htmlToText(match[3]);
    if (!/든든전세주택.*(?:입주자 모집공고|수시 입주자 모집공고)/.test(title)) continue;
    if (/경쟁률|매뉴얼|갱신|저리 대출|연간 공고계획/.test(title)) continue;
    links.push({
      articleId: match[2],
      title,
      url: new URL(decodeEntities(match[1]), HUG_LIST_URL).href
    });
  }
  return [...new Map(links.map((item) => [item.articleId, item])).values()];
}

function hugSchedule(text, publishedDate) {
  const match = text.match(/공고일정\s*:\s*(\d{1,2})\.(\d{1,2})(?:\([^)]*\))?\s*~\s*(\d{1,2})\.(\d{1,2})/);
  if (!match) return { startDate: "", endDate: "" };
  const year = Number(String(publishedDate || koreaDateKey()).slice(0, 4));
  const startDate = dateKey(year, match[1], match[2]);
  const endYear = Number(match[3]) < Number(match[1]) ? year + 1 : year;
  return { startDate, endDate: dateKey(endYear, match[3], match[4]) };
}

async function mapHugPolicy(article) {
  const text = htmlToText(await fetchText(article.url, "euc-kr"));
  const titleIndex = text.indexOf(article.title);
  const articleText = titleIndex >= 0 ? text.slice(titleIndex) : text;
  const publishedDate = articleText.match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const { startDate, endDate } = hugSchedule(articleText, publishedDate);
  if (!startDate || !endDate) return null;
  const supply = (articleText.match(/공고호수\s*:\s*(.+?)(?=\s*공고일정)/)?.[1] || "공식 공고의 공급 주택")
    .replace(/\s+[ㅁ□■◆※]+$/, "");
  const eligibility = articleText.match(/입주자격\s*:\s*(.+?)(?=\s*※|\s*목록)/)?.[1] || "공고일 기준 무주택세대구성원";
  const regionData = regionFields(supply);
  const status = statusFromDates(startDate, endDate);
  if (status === "마감") return null;
  return {
    id: `hug-jeonse-${article.articleId}`,
    title: article.title.replace(/\s*사전 안내\s*$/, ""),
    ...regionData,
    type: "주거",
    status,
    support: `HUG 든든전세주택 ${supply} 모집입니다. 주택별 임대보증금과 세부 신청 절차는 공식 모집공고에서 확인해야 합니다.`,
    period: `${startDate} ~ ${endDate}`,
    startDate,
    endDate,
    age: "연령 제한 없음",
    income: "소득 제한 없음, 세부 자격은 공고 확인",
    residence: regionData.regions.length
      ? `${regionData.regions.join(", ")} 소재 공급주택`
      : "공급주택 소재지역 확인",
    summary: `신청자격은 ${eligibility}이며, ${supply}을 공급하는 HUG 든든전세주택 모집입니다.`,
    officialUrl: article.url,
    tistoryUrl: "",
    sourceKey: "hug",
    sourceName: "HUG 안심전세포털",
    sourceItemId: article.articleId,
    sourceUpdatedAt: publishedDate
  };
}

export async function fetchHugPolicies() {
  const html = await fetchText(`${HUG_LIST_URL}?currentPage=1&id=1295&mode=L`, "euc-kr");
  const articles = hugArticleLinks(html);
  const policies = await mapWithConcurrency(articles, 3, mapHugPolicy);
  return policies.filter(Boolean);
}
