(() => {
  const tablist = document.querySelector(".month-nav");
  const panels = [...document.querySelectorAll(".calendar-month")];
  if (!tablist || panels.length === 0) return;

  const tabs = [...tablist.querySelectorAll("[data-month-target]")];

  function selectMonth(tab, focus = false) {
    const targetId = tab.dataset.monthTarget;

    tabs.forEach((item) => {
      const selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });

    if (focus) tab.focus();
  }

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-month-target]");
    if (tab) selectMonth(tab);
  });

  tablist.addEventListener("keydown", (event) => {
    const currentIndex = tabs.indexOf(event.target);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    selectMonth(tabs[nextIndex], true);
  });
})();
