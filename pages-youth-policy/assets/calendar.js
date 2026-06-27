(() => {
  const tablist = document.querySelector(".month-nav");
  const panels = [...document.querySelectorAll(".calendar-month")];
  if (!tablist || panels.length === 0) return;

  const tabs = [...tablist.querySelectorAll("[data-month-target]")];
  const dialog = document.querySelector("[data-calendar-dialog]");
  const dialogTitle = dialog?.querySelector("[data-calendar-dialog-title]");
  const dialogList = dialog?.querySelector("[data-calendar-dialog-list]");
  const dialogClose = dialog?.querySelector("[data-calendar-dialog-close]");

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

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-agenda-target]");
    if (!trigger || !dialog || !dialogTitle || !dialogList) return;

    const source = document.getElementById(trigger.dataset.agendaTarget);
    if (!source) return;

    dialogTitle.textContent = source.querySelector("h3")?.textContent || "마감 정책";
    const groupedLinks = [...source.querySelectorAll("a")].reduce((groups, link) => {
      const type = link.dataset.type || "기타";
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type).push(link);
      return groups;
    }, new Map());

    dialogList.replaceChildren(
      ...[...groupedLinks.entries()].map(([type, links]) => {
        const section = document.createElement("section");
        section.className = "calendar-dialog-group";

        const heading = document.createElement("h3");
        heading.textContent = `${type} ${links.length}개`;
        section.append(heading, ...links.map((link) => link.cloneNode(true)));
        return section;
      })
    );

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  });

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  dialogClose?.addEventListener("click", closeDialog);
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
})();
