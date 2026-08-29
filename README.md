# vrajmpatel.com

Source for [vrajmpatel.com](https://www.vrajmpatel.com), Vraj Patel's personal
portfolio. It is a static Astro site deployed with GitHub Pages.

## Local development

Use Node.js 24 LTS and the pnpm version declared in `package.json`.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The development server starts at `http://localhost:4321`. Node.js 26 is also
tested in CI as a forward-compatibility check.

## Updating the site

- Shared profile details and affiliations live in `src/data/profile.ts`.
- Projects and experience entries are Markdown files under `src/content/`.
- Page layouts and copy live under `src/pages/` and `src/components/`.
- Public PDFs and images live under `public/`.
- Vendored organization marks and their provenance are documented in
  `public/logos/SOURCES.md`.

## PostHog

Analytics is optional in local development. Copy `.env.example` to `.env`
and set `PUBLIC_POSTHOG_KEY` to the public `phc_...` project token. Never put
a PostHog personal API key in this repository.

`PUBLIC_POSTHOG_HOST` is optional and defaults to
`https://us.i.posthog.com`. After a first-party Cloudflare Worker proxy is
attached to `e.vrajmpatel.com`, set `PUBLIC_POSTHOG_HOST` to
`https://e.vrajmpatel.com` so the tracker sends events through the site's
domain. Always keep `ui_host` at `https://us.posthog.com`.

The production tracker runs only on the canonical site and loads `posthog-js`
with analytics and masked session replay on by default. Visitors can opt out
of either independently on `/privacy`; choices persist in this browser's local
storage. Browser Do Not Track and Global Privacy Control signals do not change
this default. See `src/components/Tracker.astro` and
`src/lib/posthogPrivacy.ts`.

The slim `posthog-js` bundle cannot load session recording, so the tracker
uses the full module.

### First-party ingest proxy

`vrajmpatel.com` already uses Cloudflare DNS, but apex and `www` stay
DNS-only in front of GitHub Pages. A Worker proxy cannot be activated from
this repository alone: it needs a Cloudflare login, a Worker deploy, and a
custom domain.

Worker source lives in `cloudflare/posthog-proxy` and matches PostHog's
[Cloudflare reverse proxy](https://posthog.com/docs/advanced/proxy/cloudflare)
guide for US Cloud.

Remaining Cloudflare steps:

1. Keep apex and `www` grey-clouded to GitHub Pages. Do not proxy those
   records through Cloudflare; that can break GitHub Pages TLS.
2. From `cloudflare/posthog-proxy`, run `npx wrangler login` and
   `npx wrangler deploy` against the Cloudflare account that already holds
   the zone.
3. In Workers & Pages, add a custom domain `e.vrajmpatel.com` to
   `vrajmpatel-ingest`. Avoid names such as `analytics`, `posthog`,
   `tracking`, `telemetry`, or `ph`.
4. Set the GitHub Actions variable `PUBLIC_POSTHOG_HOST` to
   `https://e.vrajmpatel.com` and rebuild. Until that variable is set, CI
   keeps the default US Cloud ingest host.

The Cloudflare free Worker plan caps request bodies at 10MB. Large session
recordings can exceed that; a paid Workers plan raises the limit.

## Checks

```bash
pnpm test
pnpm check
pnpm build
pnpm audit --prod --audit-level=moderate
pnpm privacy:check
```

`privacy:check` runs against the built site, so run `pnpm build` first.

## Dependencies and deployment

Dependabot checks npm packages and GitHub Actions every day. pnpm holds newly
published releases for 24 hours before they can enter the lockfile. Compatible
PostHog minor and patch updates merge only after the full CI workflow passes;
major updates remain manual.

Pull requests build the site on Node.js 24 and 26. A successful push to `main`
deploys the exact artifact produced by the Node.js 24 quality job. Third-party
GitHub Actions are pinned to immutable commit SHAs.
