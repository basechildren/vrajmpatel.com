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

## GitHub activity snapshot

The About page reads the versioned two-account snapshot in
`src/data/githubActivitySnapshot.json`. CI refreshes public activity with its
built-in token and preserves an account's last verified calendar if GitHub
returns zero for only that account. A `GITHUB_ACTIVITY_TOKEN` Actions secret
can optionally provide the owner-visible `basechildren` calendar; credentials
must never be committed. A refresh fails if both accounts return zero or if
daily counts do not reconcile with their totals.

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

Production PostHog ingest is proxied through `https://e.vrajmpatel.com` by
the Worker in `cloudflare/posthog-proxy`. Apex and `www` remain DNS-only in
front of GitHub Pages; only the ingest subdomain routes through Cloudflare.
CI reads the deployed host from the `PUBLIC_POSTHOG_HOST` Actions variable.

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
