import { animate } from "motion/mini";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const running = new Map<HTMLElement, Set<() => void>>();
const eligible = (element: HTMLElement) => !reducedMotion.matches && !element.contains(document.activeElement);
function track(element: HTMLElement, cancel: () => void) {
  const set = running.get(element) ?? new Set();
  set.add(cancel);
  running.set(element, set);
  return () => { if (set.delete(cancel) && !set.size) running.delete(element); };
}

export function reveal(element: HTMLElement, distance = 8, delay = 0) {
  if (!eligible(element)) return;
  const animation = animate(element, { opacity: [0.65, 1], transform: [`translateY(${distance}px)`, "translateY(0)"] }, { duration: .32, delay, ease: [.22, 1, .36, 1] });
  const done = track(element, () => {
    // Motion's completion promise stays pending when an animation is canceled.
    try { animation.cancel(); } finally { done(); }
  });
  animation.finished.then(done, done);
}

export function onEnter(selector: string, fn: (element: HTMLElement) => void) {
  if (!("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { observer.unobserve(entry.target); fn(entry.target as HTMLElement); } });
  }, { threshold: .15 });
  document.querySelectorAll<HTMLElement>(selector).forEach(element => observer.observe(element));
}
const stop = (target?: HTMLElement) => {
  [...running.entries()].forEach(([element, callbacks]) => {
    if (!target || element.contains(target) || target.contains(element)) [...callbacks].forEach(cancel => cancel());
  });
};
reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) stop(); });
window.addEventListener("beforeprint", () => stop());
document.addEventListener("focusin", event => { if (event.target instanceof HTMLElement) stop(event.target); });
