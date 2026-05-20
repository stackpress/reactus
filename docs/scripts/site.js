const storageKey = "reactus-docs-theme";
const root = document.documentElement;

function applyTheme(theme) {
  root.dataset.theme = theme;
}

function detectTheme() {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function cycleTheme() {
  const current = root.dataset.theme === "dark" ? "dark" : "light";
  const next = current === "dark" ? "light" : "dark";
  window.localStorage.setItem(storageKey, next);
  applyTheme(next);
}

async function copyCode(button) {
  const block = button.closest(".code-block");
  const code = block?.querySelector("code");
  if (!code) {
    return;
  }

  const value = code.dataset.raw || code.textContent || "";

  try {
    await navigator.clipboard.writeText(value);
    button.dataset.copied = "true";
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.dataset.copied = "false";
      button.textContent = "Copy";
    }, 1600);
  } catch (error) {
    button.textContent = "Failed";
  }
}

function selectExampleTab(button) {
  const tabList = button.closest("[role='tablist']");
  if (!tabList) {
    return;
  }

  const tabs = Array.from(tabList.querySelectorAll("[data-example-tab]"));
  const panels = tabs
    .map(tab => document.getElementById(tab.getAttribute("aria-controls") || ""))
    .filter(Boolean);

  tabs.forEach(tab => {
    const active = tab === button;
    tab.setAttribute("aria-selected", active ? "true" : "false");
    tab.tabIndex = active ? 0 : -1;
  });

  panels.forEach(panel => {
    panel.hidden = panel.id !== button.getAttribute("aria-controls");
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const themeToggle = target.closest("[data-theme-toggle]");
  if (themeToggle instanceof HTMLButtonElement) {
    cycleTheme();
    return;
  }

  if (target.matches("[data-copy-code]")) {
    copyCode(target);
    return;
  }

  const tab = target.closest("[data-example-tab]");
  if (tab instanceof HTMLButtonElement) {
    selectExampleTab(tab);
  }
});

applyTheme(detectTheme());
