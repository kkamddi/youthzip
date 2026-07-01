(function () {
  "use strict";

  const DATA_URL = "/data/policies.json";
  const FILTERS_KEY = "youthzip:filters";
  const FAVORITES_KEY = "youthzip:favorites";
  const INITIAL_POLICY_LIMIT = 30;
  const REGIONS = ["전체", "전국", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const TYPES = ["전체", "주거", "취업", "금융", "교육", "교통", "문화", "복지", "창업"];
  const STATUSES = ["전체", "신청중", "마감임박", "예정", "마감"];

  const state = {
    region: "전체",
    type: "전체",
    status: "전체",
    keyword: "",
    sort: "recommended",
    favoritesOnly: false,
    quickMode: "",
    visibleLimit: INITIAL_POLICY_LIMIT
  };

  let policies = [];

  const $ = (selector) => document.querySelector(selector);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function parseDate(value) {
    const date = value ? new Date(`${value}T00:00:00`) : null;
    return date && !Number.isNaN(date.getTime()) ? date : null;
  }

  function today() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  function daysUntil(date) {
    const current = today();
    return date ? Math.ceil((date - current) / 86400000) : null;
  }

  function statusOf(item) {
    const start = parseDate(item.startDate);
    const end = parseDate(item.endDate);
    const current = today();
    if (item.status === "마감") return "마감";
    if (end && end < current) return "마감";
    if (start && start > current) return "예정";
    if (item.status === "마감임박") return "마감임박";
    if (end && Math.ceil((end - current) / 86400000) <= 7) return "마감임박";
    return item.status || "신청중";
  }

  function normalize(item) {
    const effectiveStatus = statusOf(item);
    const searchText = [
      item.title,
      item.region,
      item.regionGroup,
      item.city,
      item.type,
      item.summary,
      item.support,
      item.age,
      item.income,
      item.residence
    ].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
    return { ...item, effectiveStatus, searchText };
  }

  function statusRank(status) {
    return { "마감임박": 0, "신청중": 1, "예정": 2, "마감": 3 }[status] ?? 4;
  }

  function sortDate(item) {
    const date = item.effectiveStatus === "예정"
      ? parseDate(item.startDate)
      : parseDate(item.endDate) || parseDate(item.startDate);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
  }

  function deadlineRank(item) {
    if (item.effectiveStatus === "마감") return 2;
    if (item.effectiveStatus === "예정") return 1;
    return 0;
  }

  function deadlineDate(item) {
    const date = parseDate(item.endDate) || parseDate(item.startDate);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
  }

  function favoriteIds() {
    try {
      const values = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return new Set(Array.isArray(values) ? values.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function loadFilters() {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || "null");
      if (!saved) return false;
      if (REGIONS.includes(saved.region)) state.region = saved.region;
      if (TYPES.includes(saved.type)) state.type = saved.type;
      if (STATUSES.includes(saved.status)) state.status = saved.status;
      if (["recommended", "deadline", "latest"].includes(saved.sort)) state.sort = saved.sort;
      return true;
    } catch {
      return false;
    }
  }

  function saveFilters() {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({
      region: state.region,
      type: state.type,
      status: state.status,
      sort: state.sort
    }));
  }

  function resetVisibleLimit() {
    state.visibleLimit = INITIAL_POLICY_LIMIT;
  }

  function isDefaultListing() {
    return state.region === REGIONS[0] &&
      state.type === TYPES[0] &&
      state.status === STATUSES[0] &&
      !state.keyword &&
      !state.favoritesOnly &&
      !state.quickMode;
  }

  function pill(value, active) {
    return `<button class="pill${active ? " is-active" : ""}" type="button" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  }

  function teaser(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > 95 ? `${text.slice(0, 95)}...` : text;
  }

  function displayPeriod(item) {
    return String(item?.period || "").trim() || "공식 공고 확인";
  }

  function compactCard(item, badge) {
    const detail = `/policy/${encodeURIComponent(item.id)}/`;
    const official = item.officialUrl || "#";
    return `
      <article class="policy-card spotlight-card${item.effectiveStatus === "마감임박" ? " is-closing-soon" : ""}">
        <div class="labels">
          <span>${escapeHtml(item.regionGroup || item.region)}</span>
          <span>${escapeHtml(item.type)}</span>
          <b class="status${item.effectiveStatus === "마감임박" ? " closing-soon" : ""}">${escapeHtml(badge || item.effectiveStatus)}</b>
        </div>
        <h3><a href="${escapeHtml(detail)}">${escapeHtml(item.title)}</a></h3>
        <p class="summary">${escapeHtml(teaser(item.summary || item.support))}</p>
        <div class="card-actions">
          <button class="link-button favorite-button" type="button" data-favorite-button data-policy-id="${escapeHtml(item.id)}" aria-pressed="false">♡ 찜</button>
          <a class="link-button" href="${escapeHtml(detail)}">상세보기</a>
          <a class="link-button primary" href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">공식 링크</a>
        </div>
      </article>
    `;
  }

  function renderPills() {
    $("[data-region-pills]").innerHTML = REGIONS.map((value) => pill(value, value === state.region)).join("");
    $("[data-type-pills]").innerHTML = TYPES.map((value) => pill(value, value === state.type)).join("");
    $("[data-status-pills]").innerHTML = STATUSES.map((value) => pill(value, value === state.status)).join("");
  }

  function renderHomeSections() {
    const weekClosing = policies
      .filter((item) => {
        const remaining = daysUntil(parseDate(item.endDate));
        return item.effectiveStatus !== "마감" && remaining !== null && remaining >= 0 && remaining <= 7;
      })
      .sort((a, b) => sortDate(a) - sortDate(b))
      .slice(0, 3);
    const newest = policies
      .filter((item) => item.effectiveStatus !== "마감")
      .sort((a, b) => (parseDate(b.startDate)?.getTime() || 0) - (parseDate(a.startDate)?.getTime() || 0))
      .slice(0, 3);
    const favorites = favoriteIds();
    const saved = policies
      .filter((item) => favorites.has(String(item.id)))
      .sort((a, b) => statusRank(a.effectiveStatus) - statusRank(b.effectiveStatus) || sortDate(a) - sortDate(b))
      .slice(0, 6);

    const weekTarget = $("[data-week-closing-list]");
    const newTarget = $("[data-new-policy-list]");
    const savedTarget = $("[data-saved-policy-list]");
    const savedCount = $("[data-saved-count]");

    if (weekTarget) {
      weekTarget.innerHTML = weekClosing.length
        ? weekClosing.map((item) => compactCard(item, `${daysUntil(parseDate(item.endDate))}일 남음`)).join("")
        : `<p class="empty">이번 주 마감 정책이 없습니다.</p>`;
    }
    if (newTarget) {
      newTarget.innerHTML = newest.length
        ? newest.map((item) => compactCard(item, "신규")).join("")
        : `<p class="empty">새로 표시할 정책이 없습니다.</p>`;
    }
    if (savedTarget) {
      savedTarget.innerHTML = saved.length
        ? saved.map((item) => compactCard(item, item.effectiveStatus)).join("")
        : `<p class="empty">아직 찜한 정책이 없습니다. 관심 있는 정책의 찜 버튼을 눌러두면 여기에 모입니다.</p>`;
    }
    if (savedCount) savedCount.textContent = favorites.size.toLocaleString("ko-KR");
  }

  function filteredPolicies() {
    const keyword = state.keyword.toLocaleLowerCase("ko-KR");
    const favorites = favoriteIds();
    return policies.filter((item) => {
      const regionMatch = state.region === "전체" ||
        item.regionGroup === state.region ||
        item.city === state.region ||
        String(item.region || "").includes(state.region);
      return regionMatch &&
        (state.type === "전체" || item.type === state.type) &&
        (state.status === "전체" || item.effectiveStatus === state.status) &&
        (state.quickMode !== "new" || item.effectiveStatus !== "마감") &&
        (!state.favoritesOnly || favorites.has(String(item.id))) &&
        (!keyword || item.searchText.includes(keyword));
    }).sort((a, b) => {
      if (state.sort === "deadline") {
        return deadlineRank(a) - deadlineRank(b) || deadlineDate(a) - deadlineDate(b);
      }
      if (state.sort === "latest") {
        return (parseDate(b.startDate)?.getTime() || 0) - (parseDate(a.startDate)?.getTime() || 0);
      }
      return statusRank(a.effectiveStatus) - statusRank(b.effectiveStatus) || sortDate(a) - sortDate(b);
    });
  }

  function card(item) {
    const official = item.officialUrl || "#";
    const detail = `/policy/${encodeURIComponent(item.id)}/`;
    const isClosingSoon = item.effectiveStatus === "마감임박";
    const statusModifier = item.effectiveStatus === "마감"
      ? "closed"
      : item.effectiveStatus === "예정"
        ? "scheduled"
        : isClosingSoon
          ? "closing-soon"
          : "";
    return `
      <article class="policy-card${isClosingSoon ? " is-closing-soon" : ""}">
        <div class="labels">
          <span>${escapeHtml(item.regionGroup || item.region)}</span>
          <span>${escapeHtml(item.type)}</span>
          <b class="status ${statusModifier}">${escapeHtml(item.effectiveStatus)}</b>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="summary">${escapeHtml(teaser(item.summary || item.support))}</p>
        <dl class="meta brief">
          <div><dt>기간</dt><dd>${escapeHtml(displayPeriod(item))}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="link-button favorite-button" type="button" data-favorite-button data-policy-id="${escapeHtml(item.id)}" aria-pressed="false">♡ 찜</button>
          <a class="link-button" href="${escapeHtml(detail)}">상세보기</a>
          <a class="link-button primary" href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">공식 링크</a>
        </div>
      </article>
    `;
  }

  function render() {
    renderPills();
    const items = filteredPolicies();
    const shouldLimit = isDefaultListing();
    const visibleItems = shouldLimit ? items.slice(0, state.visibleLimit) : items;
    $("[data-result-count]").textContent = items.length.toLocaleString("ko-KR");
    $("[data-summary-text]").textContent = `${state.region} · ${state.type} · ${state.status}`;
    $("[data-sort]").value = state.sort;
    const favorites = favoriteIds();
    const favoriteToggle = $("[data-favorites-only]");
    favoriteToggle.textContent = `찜한 정책 ${favorites.size.toLocaleString("ko-KR")}`;
    favoriteToggle.classList.toggle("is-active", state.favoritesOnly);
    favoriteToggle.setAttribute("aria-pressed", String(state.favoritesOnly));
    $("[data-quick-closing]")?.classList.toggle("is-active", state.quickMode === "closing" && !state.favoritesOnly);
    $("[data-quick-new]")?.classList.toggle("is-active", state.quickMode === "new" && !state.favoritesOnly);
    $("[data-policy-list]").innerHTML = visibleItems.map(card).join("");
    $("[data-empty]").hidden = items.length > 0;
    const loadMoreWrap = $("[data-load-more-wrap]");
    const loadMoreSummary = $("[data-load-more-summary]");
    if (loadMoreWrap) {
      const hasMore = shouldLimit && state.visibleLimit < items.length;
      loadMoreWrap.hidden = !hasMore;
      if (loadMoreSummary) {
        loadMoreSummary.textContent = `${visibleItems.length.toLocaleString("ko-KR")}개 표시 중 / 전체 ${items.length.toLocaleString("ko-KR")}개`;
      }
    }
    renderHomeSections();
    window.dispatchEvent(new CustomEvent("youthzip:cards-rendered"));
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".pill");
      if (button) {
        const group = button.closest("[data-filter]")?.dataset.filter;
        if (group && state[group] !== undefined) {
          state[group] = button.dataset.value;
          state.quickMode = "";
          resetVisibleLimit();
          render();
        }
      }
    });

    $("[data-reset]").addEventListener("click", () => {
      state.region = "전체";
      state.type = "전체";
      state.status = "전체";
      state.keyword = "";
      state.sort = "recommended";
      state.favoritesOnly = false;
      state.quickMode = "";
      resetVisibleLimit();
      $("[data-search]").value = "";
      render();
    });

    $("[data-search]").addEventListener("input", (event) => {
      state.keyword = event.target.value.trim();
      state.quickMode = "";
      resetVisibleLimit();
      render();
    });

    $("[data-sort]").addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.quickMode = "";
      resetVisibleLimit();
      render();
    });

    $("[data-save-filters]").addEventListener("click", () => {
      saveFilters();
      const feedback = $("[data-save-feedback]");
      feedback.textContent = "현재 조건을 이 기기에 저장했습니다.";
      window.setTimeout(() => { feedback.textContent = ""; }, 2400);
    });

    $("[data-quick-closing]")?.addEventListener("click", () => {
      state.status = "마감임박";
      state.sort = "deadline";
      state.favoritesOnly = false;
      state.quickMode = "closing";
      state.keyword = "";
      resetVisibleLimit();
      $("[data-search]").value = "";
      render();
    });

    $("[data-quick-new]")?.addEventListener("click", () => {
      state.status = "전체";
      state.sort = "latest";
      state.favoritesOnly = false;
      state.quickMode = "new";
      state.keyword = "";
      resetVisibleLimit();
      $("[data-search]").value = "";
      render();
    });

    $("[data-favorites-only]").addEventListener("click", () => {
      state.favoritesOnly = !state.favoritesOnly;
      state.quickMode = "";
      resetVisibleLimit();
      render();
    });

    $("[data-load-more]")?.addEventListener("click", () => {
      state.visibleLimit += INITIAL_POLICY_LIMIT;
      render();
    });

    window.addEventListener("youthzip:favorites-changed", render);
  }

  async function boot() {
    const restored = loadFilters();
    const queryKeyword = new URLSearchParams(window.location.search).get("q");
    if (queryKeyword) {
      state.keyword = queryKeyword.trim();
      state.quickMode = "";
    }
    bindEvents();
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. HTTP ${response.status}`);
    const payload = await response.json();
    policies = payload.policies.map(normalize);
    $("[data-total-count]").textContent = policies.length.toLocaleString("ko-KR");
    $("[data-updated-at]").textContent = payload.updatedAt ? `업데이트 ${payload.updatedAt}` : "정적 데이터";
    if (state.keyword) $("[data-search]").value = state.keyword;
    if (restored) $("[data-save-feedback]").textContent = "저장된 조건을 불러왔습니다.";
    render();
  }

  boot().catch((error) => {
    $("[data-policy-list]").innerHTML = "";
    $("[data-empty]").hidden = false;
    $("[data-empty]").textContent = error.message;
  });
})();
