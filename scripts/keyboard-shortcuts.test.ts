import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const component = readFileSync(new URL("../src/components/ShortcutsDialog.astro", import.meta.url), "utf8");
// Plain string search: no regular expression matches HTML tags (CodeQL js/bad-tag-filter).
const openTag = "<script>";
const scriptStart = component.indexOf(openTag);
const scriptEnd = component.indexOf("</script>", scriptStart);
if (scriptStart === -1 || scriptEnd === -1) throw new Error("ShortcutsDialog.astro has no <script> block");
const source = ts.transpileModule(component.slice(scriptStart + openTag.length, scriptEnd), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText;

function setup(stored = "enabled", hasHomeLink = true) {
  const handlers = new Map<string, Function>();
  const preferenceHandlers = new Map<string, Function>();
  const clickHandlers = new Map<string, Function>();
  const actions: string[] = [];
  class Element {
    editable = false;
    closest() { return this.editable ? this : null; }
  }
  class HTMLElement extends Element { focus() {} }
  const preference = {
    checked: true,
    addEventListener: (name: string, fn: Function) => preferenceHandlers.set(name, fn),
  };
  const dialog = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    querySelector: () => ({ addEventListener() {} }),
    addEventListener() {},
  };
  const openButton = { hidden: true, addEventListener: (name: string, fn: Function) => clickHandlers.set(name, fn) };
  const state = vm.createContext({
    Element, HTMLElement,
    performance: { now: () => 100 },
    localStorage: { getItem: () => stored, setItem() {} },
    document: {
      activeElement: new HTMLElement(),
      querySelector(selector: string) {
        if (selector === "[data-shortcuts-dialog]") return dialog;
        if (selector === "[data-shortcuts-enabled]") return preference;
        if (selector.startsWith("dialog[open]")) return dialog.open ? dialog : null;
        if (selector === '.terminal-breadcrumb a[href="/"]' && !hasHomeLink) return null;
        return { click: () => actions.push(selector) };
      },
      querySelectorAll: () => [openButton],
      addEventListener: (name: string, fn: Function) => handlers.set(name, fn),
    },
    window: { addEventListener() {}, location: { assign: (path: string) => actions.push(path) } },
  });
  vm.runInContext(source, state);
  const key = (value: string, options: Record<string, unknown> = {}) => {
    let prevented = false;
    handlers.get("keydown")!({ key: value, target: new Element(), preventDefault() { prevented = true; }, ...options });
    return prevented;
  };
  return { key, actions, dialog, preference, preferenceHandlers, clickHandlers, Element, openButton };
}

test("shortcuts open the reference, navigate, toggle theme, and use the home chord", () => {
  const app = setup();
  assert.equal(app.openButton.hidden, false);
  assert.equal(app.key("1"), true);
  assert.equal(app.key("t"), true);
  app.key("g"); app.key("h");
  assert.deepEqual(app.actions, ['[data-shortcut-route="1"]', "[data-theme-toggle]", '.terminal-breadcrumb a[href="/"]']);
  assert.equal(app.key("?", { shiftKey: true }), true);
  assert.equal(app.dialog.open, true);
});

test("home chord falls back to ordinary navigation when the breadcrumb is absent", () => {
  const app = setup("enabled", false);
  app.key("g");
  assert.equal(app.key("h"), true);
  assert.deepEqual(app.actions, ["/"]);
});

test("shortcuts preserve typing, modifier combinations, composition, repeat, and modal interaction", () => {
  const app = setup();
  const editable = new app.Element();
  editable.editable = true;
  for (const options of [{ target: editable }, { ctrlKey: true }, { metaKey: true }, { altKey: true }, { shiftKey: true }, { isComposing: true }, { repeat: true }, { defaultPrevented: true }]) {
    app.key("g");
    assert.equal(app.key("t", options), false);
    assert.equal(app.key("h"), false);
  }
  app.dialog.open = true;
  assert.equal(app.key("t"), false);
  assert.deepEqual(app.actions, []);
});

test("single-key shortcuts can be disabled while the visible reference button remains usable", () => {
  const app = setup("disabled");
  assert.equal(app.preference.checked, false);
  assert.equal(app.key("1"), false);
  assert.equal(app.key("?"), false);
  app.clickHandlers.get("click")!();
  assert.equal(app.dialog.open, true);
  app.dialog.close();
  app.preference.checked = true;
  app.preferenceHandlers.get("change")!();
  assert.equal(app.key("1"), true);
});
