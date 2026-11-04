import { animatedNavigation, getNavigationCommand } from "./siteNavigation";

export function setupTerminalNavigation() {
  const header = document.querySelector<HTMLElement>(".site-header");
  const prompt = header?.querySelector<HTMLElement>("[data-header-prompt]");
  const preview = header?.querySelector<HTMLElement>("[data-command-preview]");
  const text = header?.querySelector<HTMLElement>("[data-command-text]");
  if (!header || !prompt || !preview || !text || header.dataset.navigationReady) return;
  header.dataset.navigationReady = "true";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const currentPath = window.location.pathname.replace(/\/?$/, "/");
  let active: HTMLAnchorElement | null = null;

  const reset = () => {
    active?.removeAttribute("data-command-active");
    active = null;
    preview.hidden = true;
    text.textContent = "";
    prompt.removeAttribute("data-command-running");
  };
  const show = (target: EventTarget | null) => {
    reset();
    if (reducedMotion.matches || !(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[data-command-link]");
    if (!link || !header.contains(link) || prompt.contains(link)) return;
    const url = new URL(link.href, window.location.href);
    const route = animatedNavigation.find(route => route.path === url.pathname.replace(/\/?$/, "/"));
    if (!route || url.origin !== location.origin || url.search || url.hash) return;
    active = link;
    active.dataset.commandActive = "true";
    text.textContent = getNavigationCommand(currentPath, route.path);
    prompt.dataset.commandRunning = "true";
    preview.hidden = false;
  };

  header.addEventListener("pointerover", event => { if (event.pointerType === "mouse") show(event.target); });
  header.addEventListener("pointerleave", () => show(document.activeElement));
  header.addEventListener("focusin", event => show(event.target));
  header.addEventListener("focusout", event => show(event.relatedTarget));
  header.addEventListener("click", reset);
  document.addEventListener("keydown", event => { if (event.key === "Escape") reset(); });
  window.addEventListener("pagehide", reset);
  window.addEventListener("pageshow", reset);
  reducedMotion.addEventListener("change", reset);
}
