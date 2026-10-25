import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const script = ts.transpileModule(readFileSync(new URL("../src/lib/motion.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;

function harness() {
  class Element {
    contains(other: unknown) { return other === this; }
  }
  const listeners = new Map<string, (event?: { target: Element }) => void>();
  const reducedMotion = {
    matches: false,
    addEventListener: (_: string, listener: () => void) => listeners.set("reduced-motion", listener),
  };
  const animations: { cancelCalls: number; finish: () => void }[] = [];
  const exports = {} as { reveal: (element: Element) => void };
  vm.runInNewContext(script, {
    exports,
    require: (name: string) => {
      assert.equal(name, "motion/mini");
      return {
        animate: () => {
          let finish!: () => void;
          // Motion cancellation does not settle its completion promise.
          const finished = new Promise<void>(resolve => { finish = resolve; });
          const animation = { cancelCalls: 0, finish, finished, cancel() { this.cancelCalls++; } };
          animations.push(animation);
          return animation;
        },
      };
    },
    HTMLElement: Element,
    window: {
      matchMedia: () => reducedMotion,
      addEventListener: (name: string, listener: () => void) => listeners.set(name, listener),
    },
    document: {
      activeElement: null,
      addEventListener: (name: string, listener: (event?: { target: Element }) => void) => listeners.set(name, listener),
    },
  });
  const element = new Element();
  return { ...exports, element, animations, reducedMotion, stop: (event: string) => listeners.get(event)!({ target: element }) };
}

for (const event of ["focusin", "beforeprint", "reduced-motion"]) {
  test(`${event} removes a canceled reveal even while its completion remains pending`, () => {
    const motion = harness();
    motion.reveal(motion.element);
    if (event === "reduced-motion") motion.reducedMotion.matches = true;
    motion.stop(event);
    assert.equal(motion.animations[0].cancelCalls, 1);
    motion.stop(event);
    motion.stop("beforeprint");
    assert.equal(motion.animations[0].cancelCalls, 1, "subsequent stop events must not retain and recancel this reveal");
  });
}

test("normally completed reveals are removed before a later stop event", async () => {
  const motion = harness();
  motion.reveal(motion.element);
  motion.animations[0].finish();
  await Promise.resolve();
  motion.stop("beforeprint");
  assert.equal(motion.animations[0].cancelCalls, 0);
});

test("queued completion of a canceled reveal preserves tracking for its replacement", async () => {
  const motion = harness();
  motion.reveal(motion.element);
  motion.animations[0].finish();
  motion.stop("beforeprint");
  motion.reveal(motion.element);
  await Promise.resolve();
  motion.stop("beforeprint");
  motion.stop("beforeprint");
  assert.equal(motion.animations[0].cancelCalls, 1);
  assert.equal(motion.animations[1].cancelCalls, 1, "queued cleanup must not remove the replacement reveal");
});

test("reduced-motion preference prevents starting reveals", () => {
  const motion = harness();
  motion.reducedMotion.matches = true;
  motion.reveal(motion.element);
  assert.equal(motion.animations.length, 0);
});
