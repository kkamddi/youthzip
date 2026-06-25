(function () {
  "use strict";

  const DATA_URL = "/data/policies.json";
  const REGIONS = ["전체", "전국", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
  const TYPES = ["전체", "주거", "취업", "금융", "교육", "교통", "문화", "복지", "창업"];
  const STATUSES = ["전체", "신청중", "마감임박", "예정", "마감"];

  const state = {
    region: "전체",
    type: "전체",
    status: "전체",
    keyword: ""
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

  function pill(value, active) {
    return `<button class="pill${active ? " is-active" : ""}" type="button" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  }

  function teaser(value) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    return text.length > 95 ? `${text.slice(0, 95)}...` : text;
  }

  function renderPills() {
    $("[data-region-pills]").innerHTML = REGIONS.map((value) => pill(value, value === state.region)).join("");
    $("[data-type-pills]").innerHTML = TYPES.map((value) => pill(value, value === state.type)).join("");
    $("[data-status-pills]").innerHTML = STATUSES.map((value) => pill(value, value === state.status)).join("");
  }

  function filteredPolicies() {
    const keyword = state.keyword.toLocaleLowerCase("ko-KR");
    return policies.filter((item) => {
      const regionMatch = state.region === "전체" ||
        item.regionGroup === state.region ||
        item.city === state.region ||
        String(item.region || "").includes(state.region);
      return regionMatch &&
        (state.type === "전체" || item.type === state.type) &&
        (state.status === "전체" || item.effectiveStatus === state.status) &&
        (!keyword || item.searchText.includes(keyword));
    }).sort((a, b) => statusRank(a.effectiveStatus) - statusRank(b.effectiveStatus) || sortDate(a) - sortDate(b));
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
          <div><dt>기간</dt><dd>${escapeHtml(item.period)}</dd></div>
        </dl>
        <div class="card-actions">
          <a class="link-button" href="${escapeHtml(detail)}">상세보기</a>
          <a class="link-button primary" href="${escapeHtml(official)}" target="_blank" rel="noopener noreferrer">공식 링크</a>
        </div>
      </article>
    `;
  }

  function render() {
    renderPills();
    const items = filteredPolicies();
    $("[data-result-count]").textContent = items.length.toLocaleString("ko-KR");
    $("[data-summary-text]").textContent = `${state.region} · ${state.type} · ${state.status}`;
    $("[data-policy-list]").innerHTML = items.map(card).join("");
    $("[data-empty]").hidden = items.length > 0;
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest(".pill");
      if (button) {
        const group = button.closest("[data-filter]")?.dataset.filter;
        if (group && state[group] !== undefined) {
          state[group] = button.dataset.value;
          render();
        }
      }
    });

    $("[data-reset]").addEventListener("click", () => {
      state.region = "전체";
      state.type = "전체";
      state.status = "전체";
      state.keyword = "";
      $("[data-search]").value = "";
      render();
    });

    $("[data-search]").addEventListener("input", (event) => {
      state.keyword = event.target.value.trim();
      render();
    });
  }

  async function boot() {
    bindEvents();
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. HTTP ${response.status}`);
    const payload = await response.json();
    policies = payload.policies.map(normalize);
    $("[data-total-count]").textContent = policies.length.toLocaleString("ko-KR");
    $("[data-updated-at]").textContent = payload.updatedAt ? `업데이트 ${payload.updatedAt}` : "정적 데이터";
    render();
  }

  boot().catch((error) => {
    $("[data-policy-list]").innerHTML = "";
    $("[data-empty]").hidden = false;
    $("[data-empty]").textContent = error.message;
  });
})();
