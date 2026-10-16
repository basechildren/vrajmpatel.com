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
  assert.match(homepage, /10\.8K tickets/);
  assert.match(homepage, /40\+ GB of audio/);
  assert.match(homepage, /15 minutes to under 1/);
  assert.match(homepage, /August 27, 2026/);
  assert.ok(homepage.indexOf('id="selected-work"') < homepage.indexOf('id="proof-heading"'));
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
    3,
    "the homepage should expose all three flagship case studies",
  );
  assert.match(brief, /Selected contributions/);
  assert.match(brief, /data-print-brief/);
  assert.match(brief, /Resume \(PDF\)/);
});

test("about leads with public GitHub activity before the profile narrative", async () => {
  const about = await readPage("about");
  const main = about.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
  assert.ok(main, "About page content was not generated");
  const headingIndex = main.indexOf("GitHub activity across personal and academic work");
  const backgroundIndex = main.indexOf("Background");

  assert.ok(headingIndex > -1, "GitHub activity heading was not generated");
  assert.ok(backgroundIndex > -1, "Background heading was not generated");
  assert.ok(headingIndex < backgroundIndex, "GitHub activity should precede Background");
  assert.match(about, /contributions across two accounts/);
  const activity = JSON.parse(await readFile("src/data/githubActivitySnapshot.json", "utf8"));
  assert.match(about, activity.source === "checked-in-baseline" ? /Snapshot verified/ : /Last refreshed/);
  assert.match(about, /<time[^>]+datetime="[^"]+Z"[^>]+data-activity-refresh-time/);
  assert.doesNotMatch(about, /data-activity-sync-time/);
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

  assert.match(page, /82\.63% accuracy/);
  assert.match(page, /macro-F1 0\.7563/);
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

  assert.match(brief, /athlete verification, GPX race creation/);
  assert.match(brief, /upload\/search workflows/);
  assert.match(page, /Software Engineering/);
  assert.match(page, /I contributed the authenticated confirm\/deny workflow, GPX-backed race creation/);
  assert.match(page, /requested a distinct Jira implementation ticket/);
  assert.match(page, /restricted to non-commercial research/);
  assert.match(page, /work added by other team members/);
  assert.match(page, /proof-grid--three/);
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
  assert.doesNotMatch(privacy, /data-consent-confirm/);
  assert.match(privacy, /data-consent-status-analytics/);
  assert.match(privacy, /data-consent-status-replay/);
  assert.match(privacy, /data-consent-saved/);
  assert.match(privacy, /Save preferences/);
  assert.match(privacy, /Other browsers and devices keep their own preferences/i);
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

test("engineering instrument includes accessible synthetic films and shortcuts", async () => {
  const homepage = await readPage();
  assert.equal((homepage.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((homepage.match(/\bdata-film(?:\s|>)/g) ?? []).length, 3);
  assert.match(homepage, /<dialog[^>]+id="keyboard-shortcuts"/);
  assert.doesNotMatch(homepage, /data-build-time|status-branch|status-sha|Source revision/, "the status bar must not publish build metadata");
  const videos = [...homepage.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/g)].map(match => match[0]);
  assert.equal(videos.length, 3);
  for (const video of videos) {
    assert.match(video, /\bmuted\b/);
    assert.match(video, /\bplaysinline\b/);
    assert.match(video, /preload="none"/);
    assert.match(video, /poster="\/films\/[^" ]+-poster\.webp"/);
    assert.match(video, /<source data-src="[^" ]+\.webm" type="video\/webm"/);
    assert.match(video, /<source data-src="[^" ]+\.mp4" type="video\/mp4"/);
    assert.doesNotMatch(video, /<source src=/, "videos must not request bytes before interaction");
  }
  for (const caption of homepage.matchAll(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/g)) {
    if (caption[1].includes("Recreation")) assert.match(caption[1], /synthetic data/);
  }
  assert.equal((homepage.match(/Recreation · synthetic data/g) ?? []).length, 3);
  await assert.rejects(access(path.join(dist, "dev", "films")));
  for (const slug of ["operational-ticket-intelligence", "building-indian-parliamentary-datasets", "full-stack-biometric-marathon"]) {
    const page = await readPage("projects", slug);
    assert.match(page, /data-film-context="case"/);
    assert.match(page, /Recreation · synthetic data/);
    const names = [...page.matchAll(/view-transition-name:\s*([\w-]+)/g)].map(match => match[1]);
    assert.equal(new Set(names).size, names.length, "view transition names must be unique per page");
  }
});
