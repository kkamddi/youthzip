import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  WifiOff,
  X,
  createIcons
} from "lucide";
import "./styles.css";

const API_BASE = "https://youthzip.pages.dev/data/app";
const WEBSITE = "https://youthzip.pages.dev";
const PAGE_SIZE = 30;
const iconSet = {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  ExternalLink,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  WifiOff,
  X
};

const state = {
  policies: [],
  policyMap: new Map(),
  favorites: new Set(),
  filters: { region: "", type: "", status: "" },
  quick: "all",
  query: "",
  sort: "recommend",
  visible: PAGE_SIZE,
  activeTab: "search",
  currentPolicy: null,
  updatedAt: "",
  isOffline: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const views = {
  search: $("#searchView"),
  calendar: $("#calendarView"),
  favorites: $("#favoritesView"),
  settings: $("#settingsView")
};

function refreshIcons(root = document) {
  createIcons({ icons: iconSet, attrs: { "aria-hidden": "true", "stroke-width": 2 } });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysUntil(value) {
  const date = parseDate(value);
  return date ? Math.round((date - startOfToday()) / 86400000) : null;
}

function formatDate(value, includeYear = true) {
  const date = parseDate(value);
  if (!date) return "상시·별도 공고";
  return new Intl.DateTimeFormat("ko-KR", {
    ...(includeYear ? { year: "numeric" } : {}),
    month: "short",
    day: "numeric",
    weekday: includeYear ? undefined : "short"
  }).format(date);
}

function deadlineLabel(policy) {
  const days = daysUntil(policy.endDate);
  if (days === null) return "기간 확인";
  if (days < 0) return "마감";
  if (days === 0) return "오늘 마감";
  if (days <= 7) return `D-${days}`;
  return `${formatDate(policy.endDate, false)} 마감`;
}

function normalized(value) {
  return String(value || "").toLocaleLowerCase("ko-KR").replace(/\s+/g, "");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function policySearchText(policy) {
  return normalized([policy.title, policy.summary, policy.region, policy.city, policy.type].join(" "));
}

function filteredPolicies() {
  const query = normalized(state.query);
  const list = state.policies.filter((policy) => {
    if (query && !policySearchText(policy).includes(query)) return false;
    if (state.filters.region && policy.region !== state.filters.region) return false;
    if (state.filters.type && policy.type !== state.filters.type) return false;
    if (state.filters.status && policy.status !== state.filters.status) return false;
    if (state.quick === "deadline") {
      const days = daysUntil(policy.endDate);
      if (days === null || days < 0 || days > 7) return false;
    }
    if (state.quick === "housing" && policy.type !== "주거") return false;
    if (state.quick === "job" && policy.type !== "취업") return false;
    return true;
  });

  return list.sort((a, b) => {
    if (state.sort === "deadline") {
      const aTime = parseDate(a.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = parseDate(b.endDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime || a.title.localeCompare(b.title, "ko");
    }
    if (state.sort === "newest") {
      return (b.startDate || "").localeCompare(a.startDate || "") || a.title.localeCompare(b.title, "ko");
    }
    const aDays = daysUntil(a.endDate);
    const bDays = daysUntil(b.endDate);
    const aScore = aDays !== null && aDays >= 0 && aDays <= 30 ? aDays : 9999;
    const bScore = bDays !== null && bDays >= 0 && bDays <= 30 ? bDays : 9999;
    return aScore - bScore || a.title.localeCompare(b.title, "ko");
  });
}

function renderPolicyCard(policy) {
  const favorite = state.favorites.has(policy.id);
  const days = daysUntil(policy.endDate);
  const urgent = days !== null && days >= 0 && days <= 7;
  return `
    <article class="policy-card${urgent ? " is-urgent" : ""}" data-policy-card="${escapeHtml(policy.id)}">
      <div class="policy-tags">
        <span>${escapeHtml(policy.region)}</span>
        <span>${escapeHtml(policy.type)}</span>
        <span class="status-tag">${escapeHtml(policy.status)}</span>
        <b class="deadline-tag${urgent ? " is-urgent" : ""}">${escapeHtml(deadlineLabel(policy))}</b>
      </div>
      <button class="card-body" type="button" data-policy="${escapeHtml(policy.id)}" aria-label="${escapeHtml(policy.title)} 상세보기">
        <h3>${escapeHtml(policy.title)}</h3>
        <p>${escapeHtml(policy.summary || policy.support || "공식 공고에서 지원 내용을 확인하세요.")}</p>
        <small><i data-lucide="clock-3"></i>${escapeHtml(policy.period || "신청 기간 별도 확인")}</small>
      </button>
      <div class="card-actions">
        <button class="favorite-button${favorite ? " is-active" : ""}" type="button" data-favorite="${escapeHtml(policy.id)}" aria-label="${favorite ? "찜 해제" : "찜하기"}">
          <i data-lucide="heart"></i><span>${favorite ? "찜함" : "찜"}</span>
        </button>
        <button class="detail-button" type="button" data-policy="${escapeHtml(policy.id)}">상세보기<i data-lucide="chevron-right"></i></button>
      </div>
    </article>`;
}

function renderSearch() {
  const policies = filteredPolicies();
  $("#resultCount").textContent = `${policies.length.toLocaleString("ko-KR")}개 정책`;
  $("#policyList").innerHTML = policies.length
    ? policies.slice(0, state.visible).map(renderPolicyCard).join("")
    : emptyState("조건에 맞는 정책이 없습니다", "검색어 또는 조건을 바꿔보세요.");
  $("#loadMoreButton").hidden = policies.length <= state.visible;
  const activeFilters = Object.values(state.filters).filter(Boolean).length;
  $("#filterCount").hidden = activeFilters === 0;
  $("#filterCount").textContent = activeFilters;
  refreshIcons();
}

function emptyState(title, description) {
  return `<div class="empty-state"><i data-lucide="search"></i><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div>`;
}

function renderFavorites() {
  const policies = state.policies.filter((policy) => state.favorites.has(policy.id));
  $("#favoriteList").innerHTML = policies.length
    ? policies.map(renderPolicyCard).join("")
    : emptyState("아직 찜한 정책이 없습니다", "관심 정책을 찜하면 여기에서 다시 볼 수 있습니다.");
  $("#favoriteBadge").hidden = !state.favorites.size;
  $("#favoriteBadge").textContent = state.favorites.size > 99 ? "99+" : state.favorites.size;
  refreshIcons();
}

function renderCalendar() {
  const upcoming = state.policies
    .map((policy) => ({ policy, days: daysUntil(policy.endDate) }))
    .filter(({ days }) => days !== null && days >= 0 && days <= 90)
    .sort((a, b) => a.days - b.days || a.policy.title.localeCompare(b.policy.title, "ko"));
  const withinWeek = upcoming.filter(({ days }) => days <= 7).length;
  const withinMonth = upcoming.filter(({ days }) => days <= 30).length;
  $("#deadlineSummary").innerHTML = `
    <div><strong>${withinWeek}</strong><span>7일 안에 마감</span></div>
    <div><strong>${withinMonth}</strong><span>30일 안에 마감</span></div>`;

  const groups = new Map();
  upcoming.forEach(({ policy }) => {
    if (!groups.has(policy.endDate)) groups.set(policy.endDate, []);
    groups.get(policy.endDate).push(policy);
  });
  $("#deadlineList").innerHTML = groups.size
    ? [...groups.entries()].map(([date, policies]) => `
        <section class="deadline-group">
          <h3><time datetime="${date}">${escapeHtml(formatDate(date, false))}</time><span>${policies.length}개</span></h3>
          ${policies.map((policy) => `
            <button type="button" data-policy="${escapeHtml(policy.id)}">
              <span><b>${escapeHtml(policy.title)}</b><small>${escapeHtml(policy.region)} · ${escapeHtml(policy.type)}</small></span>
              <i data-lucide="chevron-right"></i>
            </button>`).join("")}
        </section>`).join("")
    : emptyState("예정된 마감 정책이 없습니다", "새 정책을 불러오면 자동으로 반영됩니다.");
  refreshIcons();
}

function renderAll() {
  renderSearch();
  renderFavorites();
  renderCalendar();
  const updated = state.updatedAt ? formatDate(state.updatedAt) : "업데이트 확인 중";
  $("#updatedLabel").textContent = state.isOffline ? `${updated} 저장 데이터 · 오프라인` : `${updated} 기준 · 공식 공고 연결`;
}

function fillSelect(id, values) {
  const select = $(id);
  const first = select.options[0].outerHTML;
  select.innerHTML = first + values
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"))
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");
}

function prepareFilters() {
  fillSelect("#regionSelect", [...new Set(state.policies.map((item) => item.region))]);
  fillSelect("#typeSelect", [...new Set(state.policies.map((item) => item.type))]);
  fillSelect("#statusSelect", [...new Set(state.policies.map((item) => item.status))]);
}

async function preferenceGet(key, fallback) {
  try {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

async function preferenceSet(key, value) {
  await Preferences.set({ key, value: JSON.stringify(value) }).catch(() => {});
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("youthzip-app", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("cache");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cacheGet(key) {
  try {
    const db = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = db.transaction("cache").objectStore("cache").get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function cacheSet(key, value) {
  try {
    const db = await openDatabase();
    await new Promise((resolve, reject) => {
      const request = db.transaction("cache", "readwrite").objectStore("cache").put(value, key);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } catch {
    // The bundled fallback remains available when browser storage is unavailable.
  }
}

function applyIndex(data, offline = false) {
  if (!data?.policies?.length) return false;
  state.policies = data.policies;
  state.policyMap = new Map(data.policies.map((policy) => [policy.id, policy]));
  state.updatedAt = data.updatedAt || "";
  state.isOffline = offline;
  prepareFilters();
  renderAll();
  return true;
}

async function loadPolicies(force = false) {
  $("#refreshButton").classList.add("is-loading");
  let rendered = false;
  if (!force) {
    const cached = await cacheGet("policy-index");
    rendered = applyIndex(cached, !navigator.onLine);
  }
  if (!rendered) {
    const fallback = await fetch("./data/fallback.json").then((response) => response.json()).catch(() => null);
    rendered = applyIndex(fallback, true);
  }
  try {
    const response = await fetch(`${API_BASE}/index.json?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const remote = await response.json();
    await cacheSet("policy-index", remote);
    applyIndex(remote, false);
    if (force) showToast("최신 정책으로 업데이트했습니다.");
  } catch {
    state.isOffline = true;
    if (!rendered) {
      $("#policyList").innerHTML = emptyState("정책을 불러오지 못했습니다", "인터넷 연결을 확인한 뒤 다시 시도하세요.");
      refreshIcons();
    } else if (force) {
      showToast("저장된 정책을 표시하고 있습니다.");
    }
  } finally {
    $("#refreshButton").classList.remove("is-loading");
  }
}

async function toggleFavorite(id) {
  if (state.favorites.has(id)) {
    state.favorites.delete(id);
    showToast("찜한 정책에서 삭제했습니다.");
  } else {
    state.favorites.add(id);
    showToast("찜한 정책에 저장했습니다.");
  }
  await preferenceSet("favorites", [...state.favorites]);
  renderSearch();
  renderFavorites();
  if (state.currentPolicy?.id === id) renderDetail(state.currentPolicy);
}

async function getPolicyDetail(id) {
  const cached = await cacheGet(`policy:${id}`);
  try {
    const response = await fetch(`${API_BASE}/policy/${encodeURIComponent(id)}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const detail = await response.json();
    await cacheSet(`policy:${id}`, detail);
    return detail;
  } catch {
    if (cached) return cached;
    const compact = state.policyMap.get(id);
    return compact ? { ...compact, webUrl: `${WEBSITE}/policy/${encodeURIComponent(id)}/` } : null;
  }
}

function detailSection(title, value) {
  if (!value || value === "해당없음") return "";
  return `<section class="detail-section"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(value)}</p></section>`;
}

function renderDetail(policy) {
  const favorite = state.favorites.has(policy.id);
  const canNotify = Boolean(parseDate(policy.endDate));
  $("#detailContent").innerHTML = `
    <div class="detail-hero">
      <div class="policy-tags">
        <span>${escapeHtml(policy.region)}</span>
        <span>${escapeHtml(policy.type)}</span>
        <span class="status-tag">${escapeHtml(policy.status)}</span>
        <b class="deadline-tag">${escapeHtml(deadlineLabel(policy))}</b>
      </div>
      <h2 id="detailTitle">${escapeHtml(policy.title)}</h2>
      <p>${escapeHtml(policy.summary || "공식 공고에서 세부 내용을 확인하세요.")}</p>
      <dl>
        <div><dt>신청 기간</dt><dd>${escapeHtml(policy.period || "별도 확인")}</dd></div>
        <div><dt>지역</dt><dd>${escapeHtml([policy.region, policy.city].filter(Boolean).join(" · "))}</dd></div>
      </dl>
    </div>
    <div class="detail-quick-actions">
      <button type="button" data-detail-favorite="${escapeHtml(policy.id)}"><i data-lucide="heart"></i><span>${favorite ? "찜 해제" : "찜하기"}</span></button>
      <button type="button" data-notify="${escapeHtml(policy.id)}" ${canNotify ? "" : "disabled"}><i data-lucide="bell"></i><span>마감 알림</span></button>
      <button type="button" data-detail-share><i data-lucide="share-2"></i><span>공유</span></button>
    </div>
    ${detailSection("지원 내용", policy.support)}
    ${detailSection("연령 조건", policy.age)}
    ${detailSection("소득 조건", policy.income)}
    ${detailSection("거주 조건", policy.residence)}
    <aside class="source-note"><strong>신청 전 확인</strong><p>정책 정보는 변경될 수 있습니다. 자격, 일정, 제출 서류는 반드시 공식 공고에서 최종 확인하세요.</p></aside>
    <div class="detail-primary-actions">
      <button class="secondary-button" type="button" data-open-url="${escapeHtml(policy.webUrl || `${WEBSITE}/policy/${encodeURIComponent(policy.id)}/`)}">웹 상세 보기</button>
      <button class="primary-button" type="button" data-official="${escapeHtml(policy.officialUrl || policy.webUrl || WEBSITE)}">공식 신청처<i data-lucide="external-link"></i></button>
    </div>`;
  refreshIcons();
}

async function showDetail(id) {
  const detailView = $("#detailView");
  detailView.hidden = false;
  document.body.classList.add("has-overlay");
  $("#detailContent").innerHTML = '<div class="detail-loading">정책 정보를 불러오는 중입니다</div>';
  const policy = await getPolicyDetail(id);
  if (!policy) {
    $("#detailContent").innerHTML = emptyState("상세 정보를 불러오지 못했습니다", "잠시 후 다시 시도하세요.");
    refreshIcons();
    return;
  }
  state.currentPolicy = policy;
  renderDetail(policy);
  detailView.scrollTop = 0;
}

function closeDetail() {
  $("#detailView").hidden = true;
  document.body.classList.remove("has-overlay");
  state.currentPolicy = null;
}

async function openExternal(url) {
  if (!/^https:\/\//i.test(url || "")) return;
  if (Capacitor.isNativePlatform()) await Browser.open({ url });
  else window.open(url, "_blank", "noopener,noreferrer");
}

async function sharePolicy(policy) {
  if (!policy) return;
  const url = policy.webUrl || `${WEBSITE}/policy/${encodeURIComponent(policy.id)}/`;
  try {
    await Share.share({ title: policy.title, text: `${policy.title} | 청년혜택.zip`, url, dialogTitle: "정책 공유" });
  } catch {
    await navigator.clipboard?.writeText(url);
    showToast("정책 링크를 복사했습니다.");
  }
}

function notificationId(policyId, daysBefore) {
  let hash = 0;
  for (const char of `${policyId}:${daysBefore}`) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash % 2000000000) + 1;
}

async function scheduleDeadlineNotifications(policy) {
  if (!Capacitor.isNativePlatform()) {
    showToast("마감 알림은 Android 앱에서 사용할 수 있습니다.");
    return;
  }
  const end = parseDate(policy.endDate);
  if (!end) {
    showToast("마감일이 정해진 정책만 알림을 설정할 수 있습니다.");
    return;
  }
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted") {
    showToast("알림 권한을 허용해야 마감 알림을 받을 수 있습니다.");
    return;
  }
  const ids = [7, 3, 1, 0].map((days) => ({ id: notificationId(policy.id, days) }));
  await LocalNotifications.cancel({ notifications: ids }).catch(() => {});
  const now = new Date();
  const notifications = [7, 3, 1, 0].map((days) => {
    const at = new Date(end);
    at.setDate(at.getDate() - days);
    at.setHours(9, 0, 0, 0);
    if (days === 0 && at <= now) at.setHours(18, 0, 0, 0);
    return {
      id: notificationId(policy.id, days),
      title: days === 0 ? "오늘 신청이 마감됩니다" : `${days}일 뒤 신청 마감`,
      body: policy.title,
      schedule: { at },
      extra: { policyId: policy.id }
    };
  }).filter((item) => item.schedule.at > now);
  if (!notifications.length) {
    showToast("이미 마감된 정책입니다.");
    return;
  }
  await LocalNotifications.schedule({ notifications });
  showToast("마감 알림을 설정했습니다.");
}

function switchTab(tab) {
  state.activeTab = tab;
  Object.entries(views).forEach(([key, view]) => { view.hidden = key !== tab; });
  $$(".bottom-nav [data-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.tab === tab));
  if (tab === "calendar") renderCalendar();
  if (tab === "favorites") renderFavorites();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function applyFilters() {
  state.filters = {
    region: $("#regionSelect").value,
    type: $("#typeSelect").value,
    status: $("#statusSelect").value
  };
  state.visible = PAGE_SIZE;
  renderSearch();
}

document.addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-tab]")?.dataset.tab;
  if (tab) return switchTab(tab);
  const policyId = event.target.closest("[data-policy]")?.dataset.policy;
  if (policyId) return showDetail(policyId);
  const favoriteId = event.target.closest("[data-favorite]")?.dataset.favorite;
  if (favoriteId) return toggleFavorite(favoriteId);
  const detailFavoriteId = event.target.closest("[data-detail-favorite]")?.dataset.detailFavorite;
  if (detailFavoriteId) return toggleFavorite(detailFavoriteId);
  const notifyId = event.target.closest("[data-notify]")?.dataset.notify;
  if (notifyId && state.currentPolicy) return scheduleDeadlineNotifications(state.currentPolicy);
  const url = event.target.closest("[data-open-url]")?.dataset.openUrl;
  if (url) return openExternal(url);
  const officialUrl = event.target.closest("[data-official]")?.dataset.official;
  if (officialUrl) return openExternal(officialUrl);
  if (event.target.closest("[data-detail-share]")) return sharePolicy(state.currentPolicy);
  const quick = event.target.closest("[data-quick]")?.dataset.quick;
  if (quick) {
    state.quick = quick;
    state.visible = PAGE_SIZE;
    $$("[data-quick]").forEach((button) => button.classList.toggle("is-active", button.dataset.quick === quick));
    renderSearch();
  }
});

$("#searchInput").addEventListener("input", (event) => {
  state.query = event.target.value;
  state.visible = PAGE_SIZE;
  clearTimeout(state.searchTimer);
  state.searchTimer = setTimeout(renderSearch, 120);
});
$("#sortSelect").addEventListener("change", (event) => {
  state.sort = event.target.value;
  state.visible = PAGE_SIZE;
  renderSearch();
});
$("#loadMoreButton").addEventListener("click", () => {
  state.visible += PAGE_SIZE;
  renderSearch();
});
$("#refreshButton").addEventListener("click", () => loadPolicies(true));
$("#openFilterButton").addEventListener("click", () => $("#filterDialog").showModal());
$("#applyFilterButton").addEventListener("click", applyFilters);
$("#resetFilterButton").addEventListener("click", () => {
  ["#regionSelect", "#typeSelect", "#statusSelect"].forEach((id) => { $(id).value = ""; });
  state.filters = { region: "", type: "", status: "" };
  state.visible = PAGE_SIZE;
  renderSearch();
});
$("#closeDetailButton").addEventListener("click", closeDetail);
$("#detailShareButton").addEventListener("click", () => sharePolicy(state.currentPolicy));

async function initialize() {
  refreshIcons();
  state.favorites = new Set(await preferenceGet("favorites", []));
  renderFavorites();
  await loadPolicies();
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.addListener("localNotificationActionPerformed", ({ notification }) => {
      const policyId = notification.extra?.policyId;
      if (policyId) showDetail(policyId);
    });
    App.addListener("backButton", () => {
      if (!$("#detailView").hidden) closeDetail();
      else if ($("#filterDialog").open) $("#filterDialog").close();
      else if (state.activeTab !== "search") switchTab("search");
      else App.exitApp();
    });
  }
}

initialize();
