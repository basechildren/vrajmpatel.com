# vrajmpatel.com

Source for [vrajmpatel.com](https://www.vrajmpatel.com), Vraj Patel's personal
portfolio. It is a static Astro site deployed with GitHub Pages.

## Local development

Use Node.js 26 and the pnpm version declared in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server starts at `http://localhost:4321`. `.nvmrc` selects
Node.js 26 for local development and both GitHub Actions workflows.

## Updating the site

- Shared profile details and affiliations live in `src/data/profile.ts`.
- Projects and experience entries are Markdown files under `src/content/`.
- Page layouts and copy live under `src/pages/` and `src/components/`.
- Public PDFs and images live under `public/`.
- Vendored organization marks and their provenance are documented in
  `public/logos/SOURCES.md`.

## GitHub activity snapshot

The About page has a checked-in, reviewed baseline in
`src/data/githubActivitySnapshot.json`. Scheduled and `main` CI builds refresh
activity only in their deployment workspace; they deliberately do not commit
activity updates back to Git. If GitHub returns zero for exactly one account,
the build preserves that account's last verified calendar and the page shows
its account-specific verification time rather than presenting it as fresh. A
`BASECHILDREN_GITHUB_ACTIVITY_TOKEN` Actions secret must authenticate as `basechildren` to
provide the owner-visible personal calendar; credentials must never be
committed. Without it, GitHub legitimately returns zero personal contributions
to the academic/GitHub Actions identity and the build retains the last verified
personal snapshot. A refresh fails if both accounts return zero or if the strict
snapshot contract does not reconcile dates and totals.

## PostHog

Analytics is optional in local development. Copy `.env.example` to `.env`
and set `PUBLIC_POSTHOG_KEY` to the public `phc_...` project token. Never put
a PostHog personal API key in this repository.

Production PostHog ingest is proxied through `https://e.vrajmpatel.com` by
the Worker in `cloudflare/posthog-proxy`, and CI reads that host from the
`PUBLIC_POSTHOG_HOST` Actions variable. Apex and `www` remain DNS-only in
front of GitHub Pages. Always keep `ui_host` at `https://us.posthog.com`.

The production tracker runs only on the canonical site and loads `posthog-js`
with analytics and masked session replay on by default. Visitors can opt out
of either independently on `/privacy`; choices persist in this browser's local
storage. Browser Do Not Track and Global Privacy Control signals do not change
this default. See `src/components/Tracker.astro` and
`src/lib/posthogPrivacy.ts`.

The slim `posthog-js` bundle cannot load session recording, so the tracker
uses the full module.

To keep owner QA out of production analytics, open the canonical site once with
`?analytics_mode=testing`. The mode is saved only in that browser, removed from
the visible URL immediately, and disables browser capture. It also attaches a
request header to PostHog requests so `e.vrajmpatel.com` can discard any queued
capture, batch, or recording payload locally rather than forward it. Return
that browser to normal collection with `?analytics_mode=live`.

## Checks

```bash
pnpm test
pnpm check
pnpm build
pnpm audit --prod --audit-level=moderate
pnpm privacy:check
```

`privacy:check` runs against the built site, so run `pnpm build` first.

To verify the privacy controls and footer in Chrome, start a production preview:

```bash
pnpm build
pnpm preview --host 127.0.0.1 --port 4323
```

Then, with Chrome installed, run in another terminal:

```bash
node scripts/privacy-browser-smoke.mjs
```

The check blocks local storage, so it needs a production preview rather than
`pnpm dev` (Astro's development toolbar would throw an unrelated error); it
defaults to `http://127.0.0.1:4323`, and `SITE_URL` and `QA_OUTPUT` override
the target and the report directory.

## Dependencies and deployment

Dependabot checks npm packages and GitHub Actions every day. pnpm holds newly
published releases for 24 hours before they can enter the lockfile. Compatible
PostHog minor and patch updates merge only after the full CI workflow passes;
major updates remain manual.

Pull requests build the site on Node.js 26. A successful push to `main`
deploys the exact artifact produced by the quality job. Third-party
GitHub Actions are pinned to immutable commit SHAs.
