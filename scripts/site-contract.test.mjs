import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = path.resolve("dist");
const readPage = (...segments) =>
  readFile(path.join(dist, ...segments, "index.html"), "utf8");

async function builtHtmlFiles(directory = dist) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? builtHtmlFiles(filename) : entry.name.endsWith(".html") ? [filename] : [];
  }))).flat();
}

test("Astro preview accepts public page URLs with and without trailing slashes", async () => {
  const config = (await import("../astro.config.mjs")).default;
  const astro = path.dirname(fileURLToPath(import.meta.resolve("astro/package.json")));
  const { vitePluginAstroPreview } = await import(pathToFileURL(path.join(astro, "dist/core/preview/vite-plugin-astro-preview.js")).href);
  const middleware = [];
  const server = { middlewares: { stack: middleware, use: handle => middleware.push({ handle }) } };
  const plugin = vitePluginAstroPreview({ config: { ...config, base: "/", outDir: pathToFileURL(`${dist}/`) } });
  plugin.configurePreviewServer(server)();
  for (const filename of await builtHtmlFiles()) {
    if (!filename.endsWith(`${path.sep}index.html`)) continue;
    const route = "/" + path.relative(dist, path.dirname(filename)).split(path.sep).filter(Boolean).join("/");
    for (const requestPath of new Set([route, route.replace(/\/?$/, "/")])) {
      const req = { url: requestPath };
      let continued = false;
      const res = { statusCode: 200, setHeader() {}, end() {} };
      middleware[0].handle(req, res, () => middleware[1].handle(req, res, () => { continued = true; }));
      assert.equal(res.statusCode, 200, `${requestPath} was rejected by Astro preview`);
      assert.ok(continued, `${requestPath} must reach static file serving`);
      await access(path.join(dist, req.url.endsWith("/") ? `${req.url}index.html` : req.url));
    }
  }
});

test("built internal links use canonical paths and point to published files and sections", async () => {
  for (const filename of await builtHtmlFiles()) {
    const html = await readFile(filename, "utf8");
    for (const match of html.matchAll(/\bhref="(\/[^"\s]*)"/g)) {
      const url = new URL(match[1].replace(/&amp;/g, "&"), "https://www.vrajmpatel.com");
      if (url.origin !== "https://www.vrajmpatel.com") continue;
      const isPage = !path.posix.extname(url.pathname);
      if (isPage) assert.ok(url.pathname.endsWith("/"), `${filename}: noncanonical page link ${match[1]}`);
      const target = path.join(dist, isPage ? `${url.pathname}index.html` : url.pathname);
      await access(target);
      if (isPage && url.hash) {
        const contents = await readFile(target, "utf8");
        assert.ok(contents.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${match[1]} must link to an existing section`);
      }
    }
  }
});

test("discovery documents link to built public resources and preserve evidence scope", async () => {
  const index = await readFile(path.join(dist, "llms.txt"), "utf8");
  const full = await readFile(path.join(dist, "llms-full.txt"), "utf8");
  assert.match(index, /^# Vraj Patel\n\n> Software engineer/);
  assert.ok(Buffer.byteLength(index) < 6000, "the index should remain a concise entry point");
  const localLinks = [...index.matchAll(/https:\/\/www\.vrajmpatel\.com([^\s)]+)/g)].map(match => match[1]);
  for (const href of localLinks) {
    const target = href.endsWith("/") ? `${href}index.html` : href;
    await access(path.join(dist, target));
  }
  assert.match(full, /1951[–-]2024/);
  assert.match(full, /unreleased BERT candidate/i);
  assert.match(full, /not a controlled, labeled study stored in the repository/);
  const projects = await readdir(path.join(dist, "projects"));
  assert.equal(projects.filter(name => name.endsWith(".md")).length, 3);
});

test("all four resume versions publish PDF and text with a stable default", async () => {
  const page = await readPage("resume");
  for (const variant of ["master", "data", "ml", "software"]) {
    assert.match(page, new RegExp(`href="/resumes/${variant}\\.pdf"`));
    assert.match(page, new RegExp(`href="/resumes/${variant}\\.md"`));
    const pdf = await readFile(path.join(dist, "resumes", `${variant}.pdf`));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    const text = await readFile(path.join(dist, "resumes", `${variant}.md`), "utf8");
    assert.match(text, /^# Vraj Patel/);
    assert.match(text, /Expected May 2028/);
  }
  assert.deepEqual(await readFile(path.join(dist, "resume.pdf")), await readFile(path.join(dist, "resumes", "software.pdf")));
  const brief = await readPage("brief");
  assert.match(brief, /href="\/resume\/?"/);
});

test("profile metadata uses stable identities, canonical URLs and public alternatives", async () => {
  const home = await readPage();
  const about = await readPage("about");
  const project = await readPage("projects", "operational-ticket-intelligence");
  for (const html of [home, about, project]) {
    const structured = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    assert.ok(structured, "structured data must be published");
    const graph = JSON.parse(structured[1])["@graph"];
    const person = graph.find(entry => entry["@type"] === "Person");
    const webpage = graph.find(entry => ["WebPage", "ProfilePage"].includes(entry["@type"]));
    assert.equal(person["@id"], "https://www.vrajmpatel.com/#person");
    assert.equal(webpage.author["@id"], person["@id"]);
    assert.ok(webpage.url.endsWith("/"));
    if (html !== project) {
      assert.equal(webpage["@type"], "ProfilePage");
      assert.equal(webpage.mainEntity["@id"], person["@id"]);
    }
    assert.match(html, /rel="describedby" href="\/llms\.txt"/);
  }
  assert.match(home, /rel="alternate" type="text\/markdown" href="\/profile\.md"/);
  assert.match(project, /rel="alternate" type="text\/markdown" href="\/projects\/operational-ticket-intelligence\.md"/);
  const og = await readFile(path.join(dist, "og", "profile.png"));
  assert.equal(og.readUInt32BE(16), 1200);
  assert.equal(og.readUInt32BE(20), 630);
});

test("homepage and recruiter brief expose evidence-led navigation", async () => {
  const [homepage, brief] = await Promise.all([
    readPage(),
    readPage("brief"),
  ]);

  assert.match(homepage, /Evidence at a glance/);
  assert.match(homepage, /Recruiter brief/);
  assert.match(homepage, /10\.8K tickets/);
  assert.match(homepage, /200\+ hours of audio/);
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
  assert.match(homepage, /Aug 2024 – May 2025/);
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
    readFile(path.join(dist, "llms-full.txt"), "utf8"),
  ]);

  for (const evidence of [
    /32 commits(?: · | &middot; )7 merged PRs/,
    /MongoDB(?: → | &rarr; )PostgreSQL \+ pgvector/,
    /128(?: → | &rarr; )512 dimensions/,
    /Body-first analysis/,
    /Canny-backed Stroke Width Transform/,
    /These are architecture changes, not measured accuracy gains/,
    /not a controlled, labeled study stored in the repository/,
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
  assert.match(llms, /user-scoped confirm\/deny workflow/);
  assert.match(llms, /team-built application for finding race photos/);
  assert.match(llms, /architecture changes, not measured accuracy gains/);
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
      path.join(dist, "projects", `${slug}.md`),
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

  assert.match(homepage, /href="\/privacy\/"/);
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
  assert.match(privacy, /Saved for this browser\./);
  assert.match(privacy, /theme and shortcut preferences are saved separately/);
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
  const placements = [...homepage.matchAll(/data-system-flow-placement="([\w-]+)"/g)].map((match) => match[1]);
  assert.deepEqual(placements, ["hero", "after-work"]);
  assert.ok(homepage.indexOf('data-system-flow-placement="hero"') < homepage.indexOf('id="selected-work"'));
  assert.ok(homepage.indexOf('data-system-flow-placement="after-work"') > homepage.indexOf('id="selected-work"'));
  const ids = [...homepage.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "ids must be unique on the homepage");
  for (const card of homepage.split('<article class="project-feature"').slice(1)) {
    const copy = card.indexOf("project-feature-copy");
    assert.ok(copy > -1 && copy < card.indexOf("data-film"), "project card text comes before its film");
  }
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
  assert.doesNotMatch(homepage, /12 sec \/ loop/);
  assert.doesNotMatch(homepage, /fig\. 0\d|System 01/);
  await assert.rejects(access(path.join(dist, "dev", "films")));
  for (const slug of ["operational-ticket-intelligence", "building-indian-parliamentary-datasets", "full-stack-biometric-marathon"]) {
    const page = await readPage("projects", slug);
    assert.match(page, /data-film-context="case"/);
    assert.equal((page.match(/\bdata-film(?:\s|>)/g) ?? []).length, 1, "case studies show one film");
    assert.ok(page.indexOf('id="overview"') < page.indexOf('data-film-context="case"'), "the case film follows the overview");
    assert.doesNotMatch(page, />\s*Contribution\s*</, "the header Contribution cell duplicates My contribution");
    assert.doesNotMatch(page, /fig\. 0\d|~\/work\//);
    assert.match(page, /Recreation · synthetic data/);
    const names = [...page.matchAll(/view-transition-name:\s*([\w-]+)/g)].map(match => match[1]);
    assert.equal(new Set(names).size, names.length, "view transition names must be unique per page");
  }
});

test("dev film recording sets stay out of the production build", async () => {
  await assert.rejects(access(path.join(dist, "dev")));
  const assets = (await readdir(path.join(dist, "_astro"))).filter((name) => /\.(?:css|js)$/.test(name));
  for (const name of assets) {
    const contents = await readFile(path.join(dist, "_astro", name), "utf8");
    assert.doesNotMatch(contents, /\.film-set\b|__film|html,body\{width:1280px/, `${name} contains the dev film recording set`);
  }
});
