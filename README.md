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
`https://us.i.posthog.com`. The production tracker runs only on the canonical
site, respects browser privacy signals, and limits events and properties in
`src/components/Tracker.astro` and `src/lib/posthogPrivacy.ts`.

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
