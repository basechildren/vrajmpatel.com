# vrajmpatel-portfolio

Personal portfolio site for Vraj Patel — Backend and ML Systems Engineer, built with Astro 7, Tailwind CSS 4, and deployed at [vrajmpatel.com](https://www.vrajmpatel.com).

## Tech Stack

- **Framework:** [Astro](https://astro.build/) v7
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 (via Vite plugin)
- **Fonts:** Inter & IBM Plex Mono (self-hosted with Fontsource)
- **SEO:** `@astrojs/sitemap`, JSON-LD structured data, Open Graph meta

## Project Structure

```text
src/
├── components/         # Reusable Astro components (ProjectCard, ExperienceItem)
├── content/
│   ├── experience/     # Markdown entries for work experience
│   └── projects/       # Markdown entries for projects
├── layouts/            # BaseLayout with head, nav, footer
├── pages/              # index, /projects, /experience
└── styles/             # Global CSS (Tailwind imports, theme)
public/                 # Static assets (resume, research papers, images)
```

## Getting Started

```bash
pnpm install --frozen-lockfile
pnpm dev        # Start dev server at localhost:4321
pnpm check      # Type-check Astro templates and content
pnpm build      # Build for production to ./dist/
pnpm test       # Exercise the outbound analytics privacy boundary
pnpm privacy:check # Reject public email addresses and mailto links after a build
pnpm preview    # Preview the production build locally
```

Use pnpm 11.24.0 with Node.js 24 LTS for production and CI. Node.js 26 Current is also supported; odd-numbered releases are intentionally excluded. This project has no Python runtime or dependencies, so uv is intentionally not part of the toolchain.

## Analytics

PostHog is optional during local development. Copy `.env.example` to `.env` and set `PUBLIC_POSTHOG_KEY` to the public `phc_...` project token. The token is embedded in the generated site by design; never use a PostHog personal API key here. Values without the public `phc_` token shape are rejected before they can be rendered, and production CI fails closed on the same contract.

`PUBLIC_POSTHOG_HOST` is optional and defaults to `https://us.i.posthog.com`. Set it only when the project uses a different PostHog region or an HTTPS first-party proxy. The production build must receive these variables through its build environment; the current GitHub Pages workflow already maps `PUBLIC_POSTHOG_KEY`.

The tracker sends data only from the canonical production hostnames. It records one query-free manual pageview after each Astro navigation, respects Do Not Track and Global Privacy Control, keeps visitors anonymous unless they are explicitly identified in future code, and disables automatic interaction capture, session replay, surveys, feature flags, and remote dependency loading. A final outbound hook removes campaign, referrer, search, initial-attribution, and session-entry properties before transport.

Custom click events are explicit. Add `data-ph-event` to the clickable element and use only the supported low-cardinality properties: `data-ph-kind`, `data-ph-network`, `data-ph-placement`, `data-ph-project`, and `data-ph-resource`.

```html
<a
  href="/resume.pdf"
  data-ph-event="resume_clicked"
  data-ph-kind="resume"
  data-ph-placement="hero"
>
  Download resume
</a>
```

The tracker accepts only the event names already used by the site: `resume_clicked`, `project_opened`, `outbound_link_clicked`, and `social_profile_clicked`. Property values must be short lowercase slugs; do not include names, email addresses, full URLs, search terms, free text, user IDs, or other personal/high-cardinality values.

## Dependency Maintenance

Dependabot checks Node packages and GitHub Actions every week. Compatible minor and patch releases are grouped into one pull request; major releases stay separate so breaking changes can be reviewed on their own. Security updates remain ungrouped and urgent.

pnpm enforces a 24-hour minimum release age for new dependency resolutions. Every pull request runs a frozen pnpm install, the focused analytics privacy regression test, a high-severity production dependency audit, Astro template/content checks, and a full static build on Node.js 24 LTS and Node.js 26 Current. Node.js 24 also runs the public-asset privacy scan. A successful push to \`main\` deploys the exact verified Node.js 24 artifact; every third-party Action is pinned to an immutable commit.
