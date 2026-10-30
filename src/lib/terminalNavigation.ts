import { animatedNavigation, getNavigationCommand } from "./siteNavigation";

/** Enhance ordinary links with a short command in the existing breadcrumb. */
export function setupTerminalNavigation() {
  const header = document.querySelector<HTMLElement>(".site-header");
  const prompt = header?.querySelector<HTMLElement>("[data-header-prompt]");
  const preview = header?.querySelector<HTMLElement>("[data-command-preview]");
  const text = header?.querySelector<HTMLElement>("[data-command-text]");
  const live = header?.querySelector<HTMLElement>("[data-navigation-live]");
  if (!header || !prompt || !preview || !text || !live || header.dataset.navigationReady) return;
  header.dataset.navigationReady = "true";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const currentPath = window.location.pathname.replace(/\/?$/, "/");
  let frame = 0;
  let timer = 0;
  let generation = 0;
  let pending: { path: string; label: string; link: HTMLAnchorElement } | null = null;

  const reset = () => {
    generation++;
    cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    pending?.link.removeAttribute("data-command-active");
    pending = null;
    preview.hidden = true;
    text.textContent = "";
    prompt.removeAttribute("data-command-running");
  };
  const navigate = () => {
    if (!pending) return;
    if (document.querySelector("dialog[open]")) { reset(); return; }
    if (pending.path === currentPath) {
      const label = pending.label;
      reset();
      live.textContent = `You are already on ${label}.`;
      return;
    }
    window.location.assign(pending.path);
  };
  const animate = (path: string, label: string, link: HTMLAnchorElement) => {
    reset();
    pending = { path, label, link };
    link.dataset.commandActive = "true";
    prompt.dataset.commandRunning = "true";
    preview.hidden = false;
    live.textContent = `Opening ${label}.`;
    const command = getNavigationCommand(currentPath, path);
    const token = generation;
    const start = performance.now();
    const duration = Math.min(360, 160 + command.length * 12);
    const tick = (now: number) => {
      if (generation !== token) return;
      const progress = Math.min(1, (now - start) / duration);
      text.textContent = command.slice(0, Math.max(1, Math.ceil(progress * command.length)));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else timer = window.setTimeout(() => { if (generation === token) navigate(); }, 90);
    };
    frame = requestAnimationFrame(tick);
  };

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    if (!header.contains(link) || !link.hasAttribute("data-command-link")) { reset(); return; }
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || link.hasAttribute("download") || (link.target && link.target !== "_self")) { reset(); return; }
    const url = new URL(link.href, window.location.href);
    const route = animatedNavigation.find(route => route.path === url.pathname.replace(/\/?$/, "/"));
    if (!route || url.origin !== location.origin || url.search || url.hash || reducedMotion.matches) { reset(); return; }
    event.preventDefault();
    animate(route.path, route.label, link);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && pending) { reset(); live.textContent = "Navigation cancelled."; }
  });
  // A cached page must return to its actual breadcrumb rather than a stale command.
  window.addEventListener("pagehide", reset);
  window.addEventListener("pageshow", reset);
  document.addEventListener("visibilitychange", () => { if (document.hidden && pending) navigate(); });
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches || !pending) return;
    const path = pending.path;
    reset();
    if (path !== currentPath && !document.querySelector("dialog[open]")) window.location.assign(path);
  });
}
