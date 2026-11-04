import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { animatedNavigation, getNavigationCommand } from "../src/lib/siteNavigation.ts";

const script = ts.transpileModule(readFileSync(new URL("../src/lib/terminalNavigation.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function setup() {
  class Element {
    dataset: Record<string, string> = {};
    hidden = true;
    textContent = "";
    href = "https://portfolio.test/resume/";
    nodes = new Map<string, Element>();
    handlers = new Map<string, Function>();
    contains(node: unknown) { return [...this.nodes.values()].includes(node as Element); }
    closest() { return this; }
    querySelector(selector: string) { return this.nodes.get(selector); }
    addEventListener(name: string, handler: Function) { this.handlers.set(name, handler); }
    removeAttribute(name: string) { delete this.dataset[name.replace(/^data-/, "").replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())]; }
  }
  const header = new Element();
  const prompt = new Element();
  const preview = new Element();
  const text = new Element();
  const link = new Element();
  header.nodes = new Map([["[data-header-prompt]", prompt], ["[data-command-preview]", preview], ["[data-command-text]", text], ["link", link]]);
  const windowEvents = new Map<string, Function>();
  let preferenceChanged = () => {};
  const preference = { matches: false, addEventListener: (_: string, handler: () => void) => { preferenceChanged = handler; } };
  const exports = {} as { setupTerminalNavigation: () => void };
  vm.runInNewContext(script, {
    exports, Element, URL,
    require: () => ({ animatedNavigation, getNavigationCommand }),
    location: { origin: "https://portfolio.test" },
    window: { location: { href: "https://portfolio.test/", pathname: "/" }, matchMedia: () => preference, addEventListener: (name: string, handler: Function) => windowEvents.set(name, handler) },
    document: { activeElement: null, querySelector: () => header, addEventListener() {} },
  });
  exports.setupTerminalNavigation();
  return { header, preview, text, link, preference, changePreference: () => preferenceChanged(), windowEvents };
}

test("focus previews the destination while activation remains a native link", () => {
  const app = setup();
  app.header.handlers.get("focusin")!({ target: app.link });
  assert.equal(app.preview.hidden, false);
  assert.equal(app.text.textContent, "cd resume");
  app.header.handlers.get("click")!({ preventDefault() { assert.fail("navigation must never be intercepted"); } });
  assert.equal(app.preview.hidden, true);
  assert.equal(app.link.dataset.commandActive, undefined);
});

test("reduced motion and cached-page restoration keep the actual breadcrumb", () => {
  const app = setup();
  app.header.handlers.get("focusin")!({ target: app.link });
  app.windowEvents.get("pageshow")!();
  assert.equal(app.preview.hidden, true);
  app.header.handlers.get("focusin")!({ target: app.link });
  app.preference.matches = true;
  app.changePreference();
  assert.equal(app.preview.hidden, true);
  app.header.handlers.get("focusin")!({ target: app.link });
  assert.equal(app.preview.hidden, true);
});
