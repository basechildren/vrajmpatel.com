# vrajmpatel-portfolio

Personal portfolio site for Vraj Patel — Systems Integration Engineer & ML Researcher, built with Astro 7, Tailwind CSS 4, and deployed at [vrajmpatel.com](https://www.vrajmpatel.com).

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
pnpm build      # Build for production to ./dist/
pnpm preview    # Preview the production build locally
```

Use pnpm 11.24.0 with Node.js 24 LTS for production and CI. Node.js 26 Current is also supported; odd-numbered releases are intentionally excluded. This project has no Python runtime or dependencies, so uv is intentionally not part of the toolchain.

## Analytics

PostHog is optional during local development. Copy `.env.example` to `.env` and set `PUBLIC_POSTHOG_KEY` to the public `phc_...` project token. The token is embedded in the generated site by design; never use a PostHog personal API key here.

`PUBLIC_POSTHOG_HOST` is optional and defaults to `https://us.i.posthog.com`. Set it only when the project uses a different PostHog region or an HTTPS first-party proxy. The production build must receive these variables through its build environment; the current GitHub Pages workflow already maps `PUBLIC_POSTHOG_KEY`.

The tracker does not send data from localhost or loopback addresses. It records one manual pageview after each Astro navigation, respects Do Not Track, keeps visitors anonymous unless they are explicitly identified in future code, and disables both automatic interaction capture and session replay.

Custom click events are explicit. Add `data-ph-event` to the clickable element and use only the supported low-cardinality properties: `data-ph-kind`, `data-ph-network`, `data-ph-placement`, `data-ph-project`, and `data-ph-resource`.

```html
<a
  href="/resume.pdf"
  data-ph-event="portfolio_cta_clicked"
  data-ph-kind="resume"
  data-ph-placement="hero"
>
  Download resume
</a>
```

Event names must be lowercase snake case and at most 64 characters. Property values must be short lowercase slugs; do not include names, email addresses, full URLs, search terms, free text, user IDs, or other personal/high-cardinality values.

## Dependency Maintenance

Dependabot checks Node packages and GitHub Actions every week. Compatible minor and patch releases are grouped into one pull request; major releases stay separate so breaking changes can be reviewed on their own. Security updates remain ungrouped and urgent.

Every pull request runs a frozen pnpm install, a high-severity production dependency audit, and a full static build on Node.js 24 LTS. PostHog is intentionally separate: it measures site usage and explicit interactions, while GitHub and Dependabot handle dependency alerts and remediation.
