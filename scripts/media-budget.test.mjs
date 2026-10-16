import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import { test } from "node:test";

const directory = new URL("../public/films/", import.meta.url);
const slugs = ["operational-ticket-intelligence", "building-indian-parliamentary-datasets", "full-stack-biometric-marathon"];
const budgets = { ".webm": 900_000, ".mp4": 1_400_000, "-poster.webp": 120_000 };

test("every flagship film ships both formats and a poster within its budget", async () => {
  const files = await readdir(directory);
  for (const slug of slugs) {
    for (const suffix of Object.keys(budgets)) {
      const name = `${slug}${suffix}`;
      assert.ok(files.includes(name), `Missing ${name}`);
    }
  }
  for (const name of files) {
    const suffix = Object.keys(budgets).find((candidate) => name.endsWith(candidate));
    if (!suffix) continue;
    const limit = budgets[suffix];
    const { size } = await stat(new URL(name, directory));
    assert.ok(size > 0, `${name} must not be empty`);
    assert.ok(size <= limit, `${name}: ${size.toLocaleString()} bytes exceeds ${limit.toLocaleString()} bytes`);
  }
});
