import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchHugPolicies,
  fetchMyHomePolicies,
  refreshPolicyStatus
} from "./official-housing-sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outPath = path.join(rootDir, "data", "policies.json");
const manualPath = path.join(rootDir, "data", "manual-policies.json");
const baseUrl = "https://www.youthcenter.go.kr";
const sourceUrl = `${baseUrl}/youthPolicy/ythPlcyTotalSearch`;

const regionAliases = [
  ["전국", ["전국"]],
  ["서울", ["서울", "서울특별시"]],
  ["부산", ["부산", "부산광역시"]],
  ["대구", ["대구", "대구광역시"]],
  ["인천", ["인천", "인천광역시"]],
  ["광주", ["광주", "광주광역시"]],
  ["대전", ["대전", "대전광역시"]],
  ["울산", ["울산", "울산광역시"]],
  ["세종", ["세종", "세종특별자치시"]],
  ["경기", ["경기", "경기도"]],
  ["강원", ["강원", "강원특별자치도"]],
  ["충북", ["충북", "충청북도"]],
  ["충남", ["충남", "충청남도"]],
  ["전북", ["전북", "전라북도", "전북특별자치도"]],
  ["전남", ["전남", "전라남도"]],
  ["경북", ["경북", "경상북도"]],
  ["경남", ["경남", "경상남도"]],
  ["제주", ["제주", "제주특별자치도"]]
];

const typeAliases = [
  ["주거", ["주거", "주택", "월세", "전세", "임차", "보증금"]],
  ["취업", ["취업", "일자리", "고용", "채용", "구직", "면접", "인턴", "직무"]],
  ["금융", ["금융", "자산", "저축", "적금", "대출", "이자", "채무"]],
  ["교육", ["교육", "훈련", "학습", "장학", "대학", "역량", "자격증"]],
  ["교통", ["교통", "대중교통", "통학", "통근"]],
  ["문화", ["문화", "예술", "여가", "체험", "공연"]],
  ["복지", ["복지", "건강", "의료", "심리", "상담", "생활", "돌봄"]],
  ["창업", ["창업", "스타트업", "사업화", "기업", "벤처"]]
];

function getField(item, names) {
  for (const name of names) {
    const value = item?.[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function normalizeSpace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return normalizeSpace(String(value || "").replace(/<[^>]*>/g, " "));
}

function compactDate(value) {
  const raw = String(value || "").replace(/[^\d]/g, "");
  return raw.length >= 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : "";
}

function detectRegion(item) {
  if (Array.isArray(item.habRgnList) && item.habRgnList.length) {
    const first = item.habRgnList[0]?.stdgCtpvCdNm || "";
    if (item.habRgnList.length > 200) return "전국";
    for (const [label, aliases] of regionAliases) {
      if (aliases.some((alias) => first.includes(alias))) return label;
    }
  }
  const text = [
    getField(item, ["STDG_CTPV_NM", "stdgCtpvNm", "region", "REGION"]),
    getField(item, ["STDG_NM", "stdgNm", "zipCdNm", "sprtRgnNm"]),
    getField(item, ["plcyNm", "PLCY_NM", "plcyExplnCn", "PLCY_EXPLN_CN"])
  ].join(" ");
  for (const [label, aliases] of regionAliases) {
    if (aliases.some((alias) => text.includes(alias))) return label;
  }
  return text.includes("전국") || !text.trim() ? "전국" : "전국";
}

function detectType(item) {
  if (Array.isArray(item.userRegMclsfList) && item.userRegMclsfList.length) {
    const names = item.userRegMclsfList.map((value) => value.userLclsfNm || value.userMclsfNm || "").join(" ");
    for (const [label, aliases] of typeAliases) {
      if (aliases.some((alias) => names.includes(alias))) return label;
    }
  }
  const explicit = getField(item, ["USER_MCLSF_NM", "userMclsfNm", "lclsfNm", "mclsfNm", "policyType"]);
  const text = [
    explicit,
    getField(item, ["plcyNm", "PLCY_NM"]),
    getField(item, ["plcyExplnCn", "PLCY_EXPLN_CN"]),
    getField(item, ["sprtCn", "SPRT_CN"])
  ].join(" ");
  for (const [label, aliases] of typeAliases) {
    if (aliases.some((alias) => text.includes(alias))) return label;
  }
  return explicit || "복지";
}

function detectStatus(item) {
  const status = getField(item, ["aplyPrdSeNm", "APLY_PRD_SE_NM", "status", "plcyAplyMthdCn"]);
  const period = getField(item, ["aplyYmd", "APLY_YMD", "aplyPrdCn", "APLY_PRD_CN"]);
  const end = compactDate(getField(item, ["aplyPrdEndYmd", "APLY_PRD_END_YMD", "endDate"]));
  if (status.includes("마감")) return "마감";
  if (status.includes("예정")) return "예정";
  if (period.includes("상시") || status.includes("상시")) return "신청중";
  if (end) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(`${end}T00:00:00`);
    if (!Number.isNaN(endDate.getTime())) {
      if (endDate < today) return "마감";
      if ((endDate - today) / 86400000 <= 7) return "마감임박";
    }
  }
  return "신청중";
}

function formatAge(item) {
  const limit = getField(item, ["sprtTrgtAgeLmtYn", "SPRT_TRGT_AGE_LMT_YN"]);
  if (limit === "Y") return "제한없음";
  const minAge = getField(item, ["sprtTrgtMinAge", "SPRT_TRGT_MIN_AGE"]);
  const maxAge = getField(item, ["sprtTrgtMaxAge", "SPRT_TRGT_MAX_AGE"]);
  if (minAge && maxAge) return `만 ${minAge}세 ~ 만 ${maxAge}세`;
  return stripHtml(getField(item, ["sprtTrgtCn", "SPRT_TRGT_CN", "age"])) || "공고 확인";
}

function formatIncome(item) {
  const code = getField(item, ["earnCndSeCd", "EARN_CND_SE_CD"]);
  if (code === "0043001") return "무관";
  if (code === "0043002") {
    const min = getField(item, ["earnMinAmt", "EARN_MIN_AMT"]);
    const max = getField(item, ["earnMaxAmt", "EARN_MAX_AMT"]);
    return ["연소득", min && `${min}만원 이상`, max && `${max}만원 이하`].filter(Boolean).join(" ");
  }
  return stripHtml(getField(item, ["earnEtcCn", "EARN_ETC_CN", "earnCndSeNm", "income"])) || "공고 확인";
}

function formatResidence(item, fallback) {
  if (Array.isArray(item.habRgnList) && item.habRgnList.length) {
    if (item.habRgnList.length > 200) return "전국";
    return item.habRgnList
      .map((value) => normalizeSpace(`${value.stdgCtpvCdNm || ""} ${value.stdgSggCdNm || ""}`))
      .filter(Boolean)
      .join(", ");
  }
  return stripHtml(getField(item, ["zipCdNm", "STDG_NM", "stdgNm", "residence"])) || fallback;
}

function responseItems(payload) {
  const stack = [payload];
  const candidates = [];
  while (stack.length) {
    const value = stack.pop();
    if (Array.isArray(value)) {
      if (value.length && value.some((item) => item && typeof item === "object" && (item.plcyNo || item.PLCY_NO || item.DOCID || item.plcyNm || item.PLCY_NM))) {
        candidates.push(value);
      }
      for (const item of value) stack.push(item);
    } else if (value && typeof value === "object") {
      for (const child of Object.values(value)) stack.push(child);
    }
  }
  return candidates.sort((a, b) => b.length - a.length)[0] || [];
}

function totalCount(payload, fallback) {
  const keys = ["totalCount", "totCnt", "totalCnt", "TOT_CNT", "total"];
  const stack = [payload];
  while (stack.length) {
    const value = stack.pop();
    if (value && typeof value === "object") {
      for (const key of keys) {
        const count = Number(value[key]);
        if (Number.isFinite(count) && count > 0) return count;
      }
      for (const child of Object.values(value)) stack.push(child);
    }
  }
  return fallback;
}

function loadManualPolicies() {
  if (!fs.existsSync(manualPath)) return [];
  const payload = JSON.parse(fs.readFileSync(manualPath, "utf8"));
  return Array.isArray(payload) ? payload : payload.policies || [];
}

function loadPreviousPolicies() {
  if (!fs.existsSync(outPath)) return [];
  try {
    const payload = JSON.parse(fs.readFileSync(outPath, "utf8"));
    return Array.isArray(payload.policies) ? payload.policies : [];
  } catch {
    return [];
  }
}

function titleFingerprint(item) {
  const title = normalizeSpace(item.title)
    .replace(/^\[(?:정정공고|신규모집)\]\s*/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .toLocaleLowerCase("ko-KR");
  const regions = Array.isArray(item.regions) && item.regions.length
    ? [...item.regions].sort().join(",")
    : item.regionGroup || item.region || "";
  return `${title}|${regions}|${item.startDate || ""}|${item.endDate || ""}`;
}

function mergePolicySources(groups) {
  const ids = new Set();
  const fingerprints = new Map();
  const merged = [];
  for (const item of groups.flat()) {
    if (!item?.id || !item?.title || ids.has(String(item.id))) continue;
    const normalized = refreshPolicyStatus(item);
    const fingerprint = titleFingerprint(normalized);
    const matchingSource = fingerprints.get(fingerprint);
    if (matchingSource && matchingSource !== normalized.sourceKey) continue;
    ids.add(String(normalized.id));
    fingerprints.set(fingerprint, normalized.sourceKey);
    merged.push(normalized);
  }
  return merged;
}

async function collectOptionalSource({ key, name, url, collector, previousPolicies }) {
  try {
    const policies = await collector();
    return {
      policies,
      metadata: { key, name, url, count: policies.length, status: "ok" }
    };
  } catch (error) {
    const policies = previousPolicies
      .filter((item) => item.sourceKey === key)
      .map((item) => refreshPolicyStatus(item))
      .filter((item) => item.status !== "마감");
    console.warn(`[${name}] collection failed; preserving ${policies.length} previous policies: ${error.message}`);
    return {
      policies,
      metadata: {
        key,
        name,
        url,
        count: policies.length,
        status: policies.length ? "fallback" : "error",
        error: error.message
      }
    };
  }
}

async function getSession() {
  const response = await fetch(sourceUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Failed to open source page: HTTP ${response.status}`);
  const setCookie = response.headers.get("set-cookie") || "";
  const cookie = setCookie.split(/,(?=\s*[^;]+=)/).map((part) => part.split(";")[0]).join("; ");
  const html = await response.text();
  const csrf = html.match(/<meta name="_csrf" content="([^"]+)/)?.[1] || "";
  return { cookie, csrf };
}

async function fetchPage(pageNum, listCount, session) {
  const body = {
    PVSN_INST_GROUP_CD: "",
    SPRT_TRGT_AGE: "",
    EARN_MIN_AMT: "",
    EARN_MAX_AMT: "",
    QLFC_ACBG_NM: "",
    MRG_STTS_CD: "",
    query: "",
    MJR_CND_NM: "",
    EMPM_STTS_NM: "",
    STDG_NM: "",
    SPCL_FLD_NM: "",
    USER_LCLSF_NO: "",
    USER_MCLSF_NO: "",
    STDG_CTPV_NM: "",
    PLCY_KYWD_SN: "",
    pageNum,
    sortFields: "DATE/DESC",
    listCount,
    searchFields: "all",
    APLY_PRD_BGNG_YMD: "",
    APLY_PRD_END_YMD: "",
    APLY_PRD_SE_CD: "",
    ODTM_CD: ""
  };
  const response = await fetch(`${baseUrl}/pubot/search/portalPolicySearch`, {
    method: "POST",
    headers: {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "content-type": "application/json;charset=UTF-8",
      "origin": baseUrl,
      "referer": sourceUrl,
      "user-agent": "Mozilla/5.0",
      "x-requested-with": "XMLHttpRequest",
      "x-xsrf-token": session.csrf,
      "cookie": session.cookie
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`Policy search failed on page ${pageNum}: HTTP ${response.status}`);
  }
  return response.json();
}

function mapPolicy(item) {
  const id = getField(item, ["plcyNo", "PLCY_NO", "DOCID", "id"]);
  const title = stripHtml(getField(item, ["plcyNm", "PLCY_NM", "title"]));
  const support = stripHtml(getField(item, ["sprtCn", "SPRT_CN", "plcySprtCn", "plcyExplnCn", "PLCY_EXPLN_CN"]));
  const summary = stripHtml(getField(item, ["plcyExplnCn", "PLCY_EXPLN_CN", "summary"])) || support;
  const startDate = compactDate(getField(item, ["aplyPrdBgngYmd", "APLY_PRD_BGNG_YMD", "startDate"]));
  const endDate = compactDate(getField(item, ["aplyPrdEndYmd", "APLY_PRD_END_YMD", "endDate"]));
  const regionGroup = detectRegion(item);
  const type = detectType(item);
  const officialUrl = id ? `${sourceUrl}/ythPlcyDetail/${encodeURIComponent(id)}` : sourceUrl;
  return {
    id: id || title.replace(/\s+/g, "-").slice(0, 80),
    title,
    region: regionGroup,
    regionGroup,
    city: getField(item, ["STDG_CTPV_NM", "stdgCtpvNm"]) || regionGroup,
    type,
    status: detectStatus(item),
    support,
    period: stripHtml(getField(item, ["aplyYmd", "APLY_YMD", "aplyPrdCn", "APLY_PRD_CN"])) || [startDate, endDate].filter(Boolean).join(" ~ "),
    startDate,
    endDate,
    age: formatAge(item),
    income: formatIncome(item),
    residence: formatResidence(item, regionGroup),
    summary,
    officialUrl,
    tistoryUrl: ""
  };
}

async function main() {
  const previousPolicies = loadPreviousPolicies();
  const housingPromise = Promise.all([
    collectOptionalSource({
      key: "myhome",
      name: "마이홈·공급기관 공식 공고",
      url: "https://www.myhome.go.kr/hws/portal/sch/selectRsdtRcritNtcView.do",
      collector: fetchMyHomePolicies,
      previousPolicies
    }),
    collectOptionalSource({
      key: "hug",
      name: "HUG 안심전세포털",
      url: "https://www.khug.or.kr/jeonse/web/s07/s070301.jsp",
      collector: fetchHugPolicies,
      previousPolicies
    })
  ]);
  const session = await getSession();
  const firstPayload = await fetchPage(1, 100, session);
  const firstItems = responseItems(firstPayload);
  const total = totalCount(firstPayload, firstItems.length);
  const pages = Math.max(1, Math.ceil(total / 100));
  const rawItems = [...firstItems];
  for (let page = 2; page <= pages; page += 1) {
    const payload = await fetchPage(page, 100, session);
    rawItems.push(...responseItems(payload));
  }
  const seen = new Set();
  const policies = rawItems.map(mapPolicy).filter((item) => {
    if (!item.id || !item.title || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  const [myHomeSource, hugSource] = await housingPromise;
  const manualPolicies = loadManualPolicies()
    .filter((item) => item?.id && item?.title)
    .map((item) => ({ ...item, sourceKey: item.sourceKey || "manual", sourceName: item.sourceName || "직접 확인한 공식 정책" }));
  const mergedPolicies = mergePolicySources([
    manualPolicies,
    myHomeSource.policies,
    hugSource.policies,
    policies.map((item) => ({ ...item, sourceKey: "youthcenter", sourceName: "온통청년 청년정책 통합검색" }))
  ]);
  const sources = [
    {
      key: "youthcenter",
      name: "온통청년 청년정책 통합검색",
      url: sourceUrl,
      count: policies.length,
      status: "ok"
    },
    myHomeSource.metadata,
    hugSource.metadata,
    {
      key: "manual",
      name: "직접 확인한 공식 정책",
      url: "https://youthzip.pages.dev/sources/",
      count: manualPolicies.length,
      status: "ok"
    }
  ];
  const outputPolicies = mergedPolicies.map((item) => {
    if (item.sourceKey !== "youthcenter") return item;
    const { sourceKey, sourceName, ...policy } = item;
    return policy;
  });
  const output = {
    updatedAt: new Date().toISOString().slice(0, 10),
    sourceName: "온통청년·마이홈·HUG 공식 정책 데이터",
    sourceUrl,
    sources,
    policies: outputPolicies
  };
  fs.writeFileSync(outPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(
    `Fetched ${policies.length} youth policies, ${myHomeSource.policies.length} MyHome policies, ` +
    `${hugSource.policies.length} HUG policies, and ${manualPolicies.length} manual policies. ` +
    `Merged total: ${mergedPolicies.length}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
