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

export function reveal(element: HTMLElement, distance = 14, delay = 0) {
  if (!eligible(element)) return;
  const animation = animate(element, { opacity: [0.35, 1], transform: [`translateY(${distance}px)`, "translateY(0)"] }, { duration: .7, delay, ease: [.22, 1, .36, 1] });
  const done = track(element, () => {
    // Motion's completion promise stays pending when an animation is canceled.
    try { animation.cancel(); } finally { done(); }
  });
  animation.finished.then(done, done);
}

export function splitLines(element: HTMLElement) {
  if (!eligible(element) || element.dataset.splitReady) return;
  element.dataset.splitReady = "true";
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  texts.forEach(text => {
    const fragment = document.createDocumentFragment();
    text.textContent?.split(/(\s+)/).forEach(word => {
      if (!word.trim()) { fragment.append(word); return; }
      const mask = document.createElement("span");
      mask.className = "split-mask";
      const span = document.createElement("span");
      span.className = "split-word";
      span.textContent = word;
      mask.append(span); fragment.append(mask);
    });
    text.replaceWith(fragment);
  });
  element.querySelectorAll<HTMLElement>(".split-word").forEach((word, index) => reveal(word, 24, index * .018));
}

// Keep an untouched copy in the accessibility tree; animate a visual duplicate only.
function visualCopy(element: HTMLElement) {
  const original = document.createElement("span");
  original.className = "sr-only";
  while (element.firstChild) original.append(element.firstChild);
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  visual.textContent = original.textContent;
  element.append(original, visual);
  return visual;
}
function frames(element: HTMLElement, duration: number, update: (progress: number) => void, restore: () => void) {
  const start = performance.now();
  let id = 0;
  const cancel = () => { cancelAnimationFrame(id); restore(); done(); };
  const done = track(element, cancel);
  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    update(progress);
    if (progress < 1) id = requestAnimationFrame(tick);
    else { restore(); done(); }
  };
  id = requestAnimationFrame(tick);
}
export function scramble(element: HTMLElement) {
  if (!eligible(element)) return;
  const visual = visualCopy(element);
  const text = visual.textContent ?? "";
  const glyphs = "01/._-";
  frames(element, 380, progress => {
    visual.textContent = [...text].map((char, index) => index < progress * text.length || /\s/.test(char) ? char : glyphs[(index + Math.floor(progress * 15)) % glyphs.length]).join("");
  }, () => { visual.remove(); const original = element.querySelector(".sr-only"); if (original) { while (original.firstChild) element.insertBefore(original.firstChild, original); original.remove(); } });
}
export function countUp(element: HTMLElement) {
  if (!eligible(element)) return;
  const text = element.textContent ?? "";
  const match = text.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  if (!match) return;
  const final = Number(match[1].replaceAll(",", ""));
  const decimals = match[1].split(".")[1]?.length ?? 0;
  const visual = visualCopy(element);
  frames(element, 700, progress => {
    const value = final * (1 - (1 - progress) ** 3);
    visual.textContent = value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + match[2];
  }, () => { element.textContent = text; });
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
