# Motion and media: Engineering Instrument

Implemented October 15, 2026. This policy supersedes the animation-library and video restriction in [the September UI audit resolution](ui-ux-audit-resolution.md). Existing project claims, analytics attributes, privacy controls, and the recruiter brief's print rules remain authoritative.

## Visual system

`src/styles/tokens.css` owns the warm paper, graphite, cobalt, and dark-mode palette. Existing `--ink`, `--copy`, `--muted`, `--line`, `--surface`, and `--tint` names remain compatible. Inter Variable, Instrument Serif, and IBM Plex Mono are self-hosted. Shared ruler ticks, figure captions, grid lines, and mono labels identify illustrated systems without suggesting they are live application screens.

## Motion limits

- `motion/mini` provides lightweight native animation controls. One-time reveals use a 320 ms settling ease with at most 100 ms of stagger. Headlines, role labels, and evidence figures remain stable. The mini build is intentional to leave room within the 25 KB gzip added-JavaScript budget.
- Content is visible before JavaScript, without animation, and during printing. Decorative motion never gates content or data access. Header commands appear on hover or focus without intercepting clicks or delaying navigation; see [the header navigation guide](terminal-navigation-scope.md).
- Reduced-motion preference changes, printing, and keyboard focus cancel active decorative animations. Evidence values and labels do not count up or scramble. Project cards use a simple hover/focus treatment without tracking the pointer.
- The homepage introduces the work without a looping diagram. The terminal cursor blinks only three times, less than five seconds.
- Architecture diagrams use CSS scroll timelines when supported and a one-time native animation fallback otherwise. Every node is a link to the original text and design disclosure.
- Cross-document view transitions preserve ordinary document navigation. They are disabled under reduced motion. Astro ClientRouter is not used, avoiding changes to analytics initialization.
- Single-character keyboard shortcuts can be disabled in the visible shortcuts dialog. They are ignored during typing, composition, modifier-key chords, and other dialogs.
- The optional WebGL background is not included.

## Synthetic product films

`src/data/projectFilms.ts` maps the ticket and dataset case studies to committed WebM, MP4, and WebP assets in `public/films/`. Both films are explicitly captioned **Recreation · synthetic data**. SeeMyRace uses the linked production still described below. The film sets use invented records from `projectDemos.ts`; they are editorial explanations, not real product recordings or evidence of measured performance. The retained SeeMyRace synthetic set contains wireframe placeholders. Its interactive example remains available alongside the production preview.

`astro.config.mjs` registers the `/dev/films/[slug]` routes only under `astro dev`, so production builds contain neither the pages nor their stylesheet. Each exposes `window.__film.seek(ms)` for deterministic capture. No private application is accessed. The twelve-second storyboards cover ticket review and blocked delivery, source normalization and checkpoint recovery, and athlete-owned candidate verification and GPX course creation.

### Playback policy

Video sources use `data-src` until Play is pressed, alongside `preload="none"` and a fixed-size poster, so no video is requested on page load, hover, or keyboard focus. Every visitor starts playback with the same Play button. Films pause offscreen, when the document is hidden, and for print. An explicit Pause persists until Play is pressed again.

Reduced motion, Save-Data, and slow/2G connections prevent automatic playback. Explicit Play opts in. Video surfaces use `ph-no-capture`. Fixed width, height, and aspect ratios reserve media space. A native poster remains useful with JavaScript disabled.

### Re-recording

```sh
pnpm dev
pnpm films:record
pnpm test:media
```

The recorder uses installed Google Chrome through `playwright-core` and system `ffmpeg`. Set `FILM_BASE_URL` to override the dev server URL and `FILM_DPR` to choose capture density (default 2). Use `--slug=operational-ticket-intelligence` to record a single film. Output is 1280 × 800 at 30 fps, with deterministic seeking. Encoded files are committed; production CI never records them.

Budgets per film: WebM at most 900,000 bytes; MP4 at most 1,400,000 bytes; poster at most 120,000 bytes. `test:media` verifies actual file presence and size; generated-site contracts verify lazy sources, synthetic captions, unique transitions, and that no dev film route or stylesheet ships.

## SeeMyRace production preview

The homepage and case study use a still of the public production homepage, captured November 4, 2026. The image links to the live site and is labelled **Production site**. It stays under the 120 KB poster budget. The initial slide-based teaser is preserved with the local review artifacts and is not shipped.

Portraits and the production still live in `src/assets/` and use Astro’s Image component. The build generates WebP sizes for their display widths. Organization marks remain vector images. Social icons use two bundled brand glyphs rendered as static SVG, with visible labels to distinguish the personal and academic GitHub accounts. Navigation and project links opt into Astro’s hover/focus prefetching.

The replacement should record one continuous task: open Races, choose Rattlesnake Ramble, narrow the photo time range, and show the filtered result. Public race galleries and filters are available without sign-in; face search, personal photo review, and confirmation require a separate approved account. Keep the recording within the selected public-site scope.

Plan the actions and reading pauses before recording. Capture a clean browser window at its native resolution; keep an original recording and the editable project. Edit cursor motion, selective zooms, and cuts after capture. Preserve the visible relationship between each action and its result. Export at 60 fps and verify actual source and output frame pacing; increasing the output frame rate does not repair missing source frames. A high-quality 1080p or 1440p delivery is preferable to an upscaled 4K file.

Use the existing deferred playback controls when a real recording is ready. Measure its delivery size and device playback before setting a separate media budget.

Production references: [Screen Studio product demos](https://screen.studio/create/product-demo-videos), [cursor controls](https://screen.studio/guide/cursor), [export settings](https://screen.studio/guide/explanation-of-export-settings), and [Wistia software product videos](https://wistia.com/blog/software-product-video-tips).

## Verification

Run `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:site`, `pnpm test:media`, and `pnpm audit --prod --audit-level=moderate`. Browser review covers light/dark at 1440, 1024, 768, 390, and 320 px; shortcuts; mobile menu; interactive examples; architecture links; reduced motion; and no initial video requests.

| Target (not a measured result) | Threshold |
| --- | --- |
| Lighthouse | Performance ≥95, Accessibility 100 |
| Core Web Vitals | LCP ≤2 s (desktop, throttled), CLS ≤0.05 |

The recruiter brief has no film. Its existing print blocks are unchanged. Final human review should still cover VoiceOver, Safari on a physical phone, and the editorial accuracy of each synthetic film.
