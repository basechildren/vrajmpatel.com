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

test("tracker and CI stay proxy-ready without hardcoding the ingest host", async () => {
  const [tracker, layout, ci, readme] = await Promise.all([
    readFile(path.resolve("src/components/Tracker.astro"), "utf8"),
    readFile(path.resolve("src/layouts/BaseLayout.astro"), "utf8"),
    readFile(path.resolve(".github/workflows/ci.yml"), "utf8"),
    readFile(path.resolve("README.md"), "utf8"),
  ]);

  assert.match(tracker, /import\.meta\.env\.PUBLIC_POSTHOG_KEY/);
  assert.match(tracker, /import\.meta\.env\.PUBLIC_POSTHOG_HOST/);
  assert.match(layout, /import\.meta\.env\.PUBLIC_POSTHOG_KEY/);
  assert.match(layout, /import\.meta\.env\.PUBLIC_POSTHOG_HOST/);
  assert.match(tracker, /const UI_HOST = "https:\/\/us\.posthog\.com"/);
  assert.match(tracker, /const DEFAULT_API_HOST = "https:\/\/us\.i\.posthog\.com"/);
  assert.match(tracker, /capture_dead_clicks: (?:consent|initialConsent)\.analytics/);
  assert.doesNotMatch(tracker, /opt_out_capturing_by_default/);
  assert.doesNotMatch(tracker, /e\.vrajmpatel\.com/);
  assert.doesNotMatch(layout, /e\.vrajmpatel\.com/);

  assert.match(
    ci,
    /PUBLIC_POSTHOG_HOST: \$\{\{ vars\.PUBLIC_POSTHOG_HOST \|\| 'https:\/\/us\.i\.posthog\.com' \}\}/,
  );
  const buildCount = (ci.match(/run: pnpm build/g) ?? []).length;
  const postHogHostBindingCount = (
    ci.match(/vars\.PUBLIC_POSTHOG_HOST \|\| 'https:\/\/us\.i\.posthog\.com'/g) ?? []
  ).length;
  assert.equal(postHogHostBindingCount, buildCount);

  assert.match(readme, /Production PostHog ingest is proxied through/);
  assert.match(readme, /Apex and `www` remain DNS-only/);
  assert.match(readme, /`PUBLIC_POSTHOG_HOST` Actions variable/);
  assert.doesNotMatch(readme, /Remaining Cloudflare steps/);
});
