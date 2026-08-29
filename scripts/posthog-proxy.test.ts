import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("PostHog proxy worker targets US Cloud and is not a fake local stub", async () => {
  const root = path.resolve("cloudflare/posthog-proxy");
  const [worker, wrangler] = await Promise.all([
    readFile(path.join(root, "worker.js"), "utf8"),
    readFile(path.join(root, "wrangler.toml"), "utf8"),
  ]);

  assert.match(worker, /us\.i\.posthog\.com/);
  assert.match(worker, /us-assets\.i\.posthog\.com/);
  assert.match(worker, /X-Forwarded-For/);
  assert.match(worker, /CF-Connecting-IP/);
  assert.doesNotMatch(worker, /localhost/);
  assert.match(wrangler, /vrajmpatel-ingest/);
  assert.match(wrangler, /workers_dev = false/);
});
