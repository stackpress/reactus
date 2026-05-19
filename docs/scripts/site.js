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

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches("[data-theme-toggle]")) {
    cycleTheme();
    return;
  }

  if (target.matches("[data-copy-code]")) {
    copyCode(target);
  }
});

applyTheme(detectTheme());
