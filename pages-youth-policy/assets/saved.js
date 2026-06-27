(function () {
  "use strict";

  const FAVORITES_KEY = "youthzip:favorites";

  function readFavorites() {
    try {
      const values = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return new Set(Array.isArray(values) ? values.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function writeFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
  }

  function updateButtons() {
    const favorites = readFavorites();
    document.querySelectorAll("[data-favorite-button]").forEach((button) => {
      const active = favorites.has(String(button.dataset.policyId));
      button.classList.toggle("is-favorite", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "♥ 찜됨" : "♡ 찜";
      button.title = active ? "찜 목록에서 제거" : "찜 목록에 저장";
    });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-favorite-button]");
    if (!button) return;
    const id = String(button.dataset.policyId || "");
    if (!id) return;
    const favorites = readFavorites();
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    writeFavorites(favorites);
    updateButtons();
    window.dispatchEvent(new CustomEvent("youthzip:favorites-changed"));
  });

  window.addEventListener("youthzip:cards-rendered", updateButtons);
  document.addEventListener("DOMContentLoaded", updateButtons);
})();
