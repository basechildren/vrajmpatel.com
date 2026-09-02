import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const dist = path.resolve("dist");
const readPage = (...segments) =>
  readFile(path.join(dist, ...segments, "index.html"), "utf8");

test("homepage and recruiter brief expose evidence-led navigation", async () => {
  const [homepage, brief] = await Promise.all([
    readPage(),
    readPage("brief"),
  ]);

  assert.match(homepage, /Evidence at a glance/);
  assert.match(homepage, /Recruiter brief/);
  assert.match(homepage, /82\.6% \/ 0\.756/);
  assert.match(homepage, /10\.8K \/ 96\.7%/);
  assert.match(homepage, /61% \/ 66% smaller/);
  assert.match(homepage, /~15 min → &lt;1 min/);
  assert.match(homepage, /Sealed-test accuracy \/ macro-F1/);
  assert.match(homepage, /Human-in-the-loop ML/);
  assert.match(homepage, /Endpoint operations/);
  assert.match(homepage, /Document processing/);
  assert.doesNotMatch(
    homepage,
    /· (?:human-in-the-loop ML|endpoint operations|document processing)/,
  );
  assert.match(
    homepage,
    /Undergraduate Research Assistant, Satellite Telemetry Data Analysis/,
  );
  assert.match(
    homepage,
    /The Data Mine of the Rockies · Purdue University and L3Harris/,
  );
  assert.match(homepage, /August 2024 – May 2025/);
  assert.match(homepage, /github\.com\/basechildren/);
  assert.match(homepage, /github\.com\/PatVraj/);
  assert.doesNotMatch(homepage, /github\.com\/IBS-Vraj/);
  assert.equal(
    (homepage.match(/data-ph-placement="project_list_action"/g) ?? []).length,
    2,
    "the homepage should keep selected work to two compact case-study actions",
  );
  assert.match(brief, /Backend, data, and applied ML systems/);
  assert.match(brief, /~15 min → &lt;1 min/);
});

test("about establishes the current profile before public GitHub activity", async () => {
  const about = await readPage("about");
  const headingIndex = about.indexOf("GitHub activity across personal and academic work");
  const backgroundIndex = about.indexOf("Background");

  assert.ok(headingIndex > -1, "GitHub activity heading was not generated");
  assert.ok(backgroundIndex > -1, "Background heading was not generated");
  assert.ok(backgroundIndex < headingIndex, "Background should precede GitHub activity");
  assert.match(about, /contributions across two accounts/);
  assert.match(about, /<time[^>]+datetime="[^"]+Z"[^>]+data-activity-sync-time/);
  assert.match(about, /github\.com\/basechildren/);
  assert.match(about, /github\.com\/PatVraj/);
  assert.match(about, /data-account-total="personal">[1-9][0-9]*/);
  assert.match(about, /data-account-total="academic">[1-9][0-9]*/);
  assert.match(about, /Latest weeks shown\. Swipe horizontally for earlier activity\./);
  assert.match(about, /role="region"[^>]+aria-label="Scrollable GitHub contribution calendar"/);
  assert.match(about, /aria-describedby="activity-calendar-summary activity-scroll-hint"/);
  assert.match(about, /class="min-w-\[50rem\]" aria-hidden="true"/);
  assert.doesNotMatch(about, /github\.com\/IBS-Vraj/);
});

test("flagship case study includes the complete public-safe system path", async () => {
  const page = await readPage("projects", "operational-ticket-intelligence");

  for (const step of [
    "Source reconciliation",
    "Durable application state",
    "Advisory ML boundary",
    "Bounded delivery",
    "Operator surface",
  ]) {
    assert.match(page, new RegExp(step));
  }

  assert.match(page, /82\.63% \/ 0\.7563/);
  assert.match(page, /10,803 ticket records/);
  assert.match(page, /10,442(?:—|&mdash;)or 96\.7%/);
  assert.match(page, /13 mapped to the current runtime group configuration/);
  assert.match(page, /6,487 records across seven eligible destination classes/);
  assert.match(page, /alongside 86 older tickets/);
  assert.match(page, /24\.2 ms p50 and 45\.8 ms p95/);
  assert.match(page, /unreleased BERT candidate/i);
  assert.match(page, /not analytics recomputation, browser or network latency, concurrent load, or a production service-level objective/i);
});

test("SeeMyRace presents recruiter-ready evidence without overstating ML ownership", async () => {
  const [page, brief, llms] = await Promise.all([
    readPage("projects", "full-stack-biometric-marathon"),
    readPage("brief"),
    readFile(path.join(dist, "llms.txt"), "utf8"),
  ]);

  for (const evidence of [
    /32 commits(?: · | &middot; )7 merged PRs/,
    /MongoDB(?: → | &rarr; )PostgreSQL \+ pgvector/,
    /128(?: → | &rarr; )512 dimensions/,
    /Body-first analysis/,
    /Canny-backed Stroke Width Transform/,
    /not evidence of a fourfold accuracy gain/i,
  ]) {
    assert.match(page, evidence);
  }

  assert.match(brief, /32 mainline commits, with work landing through seven merged PRs/);
  assert.match(brief, /Full-stack race-photo retrieval system built primarily on open-source/);
  assert.match(page, /Software Engineering/);
  assert.match(page, /Match Verification · GPX Race Creation · Upload\/Search UX · OCR\/SWT Evaluation/);
  assert.match(page, /requested a distinct Jira implementation ticket/);
  assert.match(page, /restricted to non-commercial research/);
  assert.match(page, /work added by other team members/);
  assert.match(page, /md:grid-cols-3/);
  assert.match(llms, /user-scoped match verification/);
  assert.match(llms, /Full-Stack Software Engineering and Applied ML/);
  assert.match(llms, /architectural changes, not measured accuracy gains/);
});

test("archived projects and retired research PDFs are not published", async () => {
  const archivedSlugs = [
    "automated-interview-scoring",
    "end-to-end-disease-prediction",
    "generative-ai-mental-health",
    "ralphie-bites-marketplace",
    "real-time-nlp-detection",
    "self-hosted-cloud-infrastructure",
  ];
  const retiredPaths = [
    ...archivedSlugs.flatMap((slug) => [
      path.join(dist, "projects", slug, "index.html"),
      path.join(dist, "og", `${slug}.png`),
    ]),
    path.join(dist, "mental-health-classification-chatbot.pdf"),
    path.join(dist, "indian-parliament-data-grant.pdf"),
  ];

  for (const retiredPath of retiredPaths) {
    await assert.rejects(access(retiredPath));
  }

  const sitemapFile = (await readdir(dist)).find((name) => /^sitemap-\d+\.xml$/.test(name));
  assert.ok(sitemapFile, "generated sitemap was not found");
  const sitemap = await readFile(path.join(dist, sitemapFile), "utf8");
  for (const slug of archivedSlugs) {
    assert.doesNotMatch(sitemap, new RegExp(slug));
  }
});

test("privacy policy is published, linked, and opt-out capable", async () => {
  const [homepage, privacy] = await Promise.all([
    readPage(),
    readPage("privacy"),
  ]);

  assert.match(homepage, /href="\/privacy"/);
  assert.match(homepage, />Privacy</);
  assert.match(homepage, /name="posthog-config"/);
  assert.match(homepage, /data-api-host="https:\/\//);
  assert.match(homepage, /data-ui-host="https:\/\/us\.posthog\.com"/);
  assert.doesNotMatch(homepage, /Privacy choices/);
  assert.doesNotMatch(homepage, /consent-banner/);
  assert.doesNotMatch(homepage, /data-consent-analytics/);
  assert.doesNotMatch(homepage, /data-consent-replay/);
  assert.doesNotMatch(homepage, /data-consent-confirm/);
  assert.doesNotMatch(homepage, /turn either off/i);
  assert.doesNotMatch(homepage, /stay off until you save/i);

  assert.match(privacy, /<h1[^>]*>[\s\S]*Privacy/);
  assert.match(privacy, /dead clicks/);
  assert.match(privacy, /on by default/i);
  assert.match(privacy, /opt out/i);
  assert.match(privacy, /this browser only/i);
  assert.match(privacy, /data-consent-form/);
  assert.match(privacy, /data-consent-analytics[^>]*checked/);
  assert.match(privacy, /data-consent-replay[^>]*checked/);
  assert.match(privacy, /data-consent-confirm/);
  assert.match(privacy, /data-consent-status-analytics/);
  assert.match(privacy, /data-consent-status-replay/);
  assert.match(privacy, /data-consent-saved/);
  assert.match(privacy, /Type[\s\S]*opt out/);
  assert.match(privacy, /not a global suppression/i);
  assert.doesNotMatch(privacy, /both default to off/i);
  assert.doesNotMatch(privacy, /Do Not Track/);
  assert.doesNotMatch(privacy, /Global Privacy Control/);
  assert.doesNotMatch(privacy, /data-consent-privacy-signal/);
  assert.doesNotMatch(privacy, /Privacy choices/);
  assert.doesNotMatch(privacy, /Terms of Service/);
  assert.doesNotMatch(privacy, /mailto:/i);
  assert.doesNotMatch(privacy, /type="email"/i);

  await assert.rejects(access(path.join(dist, "terms", "index.html")));

  const sitemapFile = (await readdir(dist)).find((name) => /^sitemap-\d+\.xml$/.test(name));
  assert.ok(sitemapFile, "generated sitemap was not found");
  const sitemap = await readFile(path.join(dist, sitemapFile), "utf8");
  assert.match(sitemap, /https:\/\/www\.vrajmpatel\.com\/privacy\/?/);
});
