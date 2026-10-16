# Motion and media: Engineering Instrument

Implemented October 15, 2026. This policy supersedes the animation-library and video restriction in [the September UI audit resolution](ui-ux-audit-resolution.md). Existing project claims, analytics attributes, privacy controls, and the recruiter brief's print rules remain authoritative.

## Visual system

`src/styles/tokens.css` owns the warm paper, graphite, cobalt, and dark-mode palette. Existing `--ink`, `--copy`, `--muted`, `--line`, `--surface`, and `--tint` names remain compatible. Inter Variable, Instrument Serif, and IBM Plex Mono are self-hosted. Shared ruler ticks, figure captions, grid lines, and mono labels identify illustrated systems without suggesting they are live application screens.

## Motion limits

- `motion/mini` provides lightweight native animation controls. One-time reveals use a 700 ms settling ease; headlines stagger words inside clipped masks. The mini build is intentional to leave room within the 25 KB gzip added-JavaScript budget.
- Content is visible before JavaScript, without animation, and during printing. Decorative motion never gates content or data access. Header command navigation adds a bounded delay of at most 450 ms, as documented in [the header navigation guide](terminal-navigation-scope.md).
- Reduced-motion preference changes, printing, and keyboard focus cancel active decorative animations. Counters restore the exact original value. Scrambled labels retain an unchanged accessible copy during the effect and restore original markup afterward.
- The hero's six-second synthetic flow has a visible Pause control. Reduced motion shows the complete static diagram. The terminal cursor blinks only three times, less than five seconds.
- Architecture diagrams use CSS scroll timelines when supported and a one-time native animation fallback otherwise. Every node is a link to the original text and design disclosure.
- Cross-document view transitions preserve ordinary document navigation. They are disabled under reduced motion. Astro ClientRouter is not used, avoiding changes to analytics initialization.
- Single-character keyboard shortcuts can be disabled in the visible shortcuts dialog. They are ignored during typing, composition, modifier-key chords, and other dialogs.
- The optional WebGL background is not included.

## Synthetic product films

`src/data/projectFilms.ts` maps the three public case studies to committed WebM, MP4, and WebP assets in `public/films/`. Every film is explicitly captioned **Recreation · synthetic data**. The film sets use invented records from `projectDemos.ts`; they are editorial explanations, not real product recordings or evidence of measured performance. SeeMyRace contains wireframe placeholders, never photos or biometric data.

`astro.config.mjs` registers the `/dev/films/[slug]` routes only under `astro dev`, so production builds contain neither the pages nor their stylesheet. Each exposes `window.__film.seek(ms)` for deterministic capture. No private application is accessed. The twelve-second storyboards cover ticket review and blocked delivery, source normalization and checkpoint recovery, and athlete-owned candidate verification and GPX course creation.

### Playback policy

Video sources use `data-src` until interaction, alongside `preload="none"` and a fixed-size poster, so no video is requested before interaction. Mouse hover or keyboard focus starts a visible film; touch users have a Play button. Films pause offscreen, when the document is hidden, and for print. Cards also pause when hover/focus leaves. An explicit Pause persists until Play is pressed again.

Reduced motion, Save-Data, and slow/2G connections prevent automatic playback. Explicit Play opts in. Video surfaces use `ph-no-capture`. Fixed width, height, and aspect ratios reserve media space. A native poster remains useful with JavaScript disabled.

### Re-recording

```sh
pnpm dev
pnpm films:record
pnpm test:media
```

The recorder uses installed Google Chrome through `playwright-core` and system `ffmpeg`. Set `FILM_BASE_URL` to override the dev server URL and `FILM_DPR` to choose capture density (default 2). Use `--slug=operational-ticket-intelligence` to record a single film. Output is 1280 × 800 at 30 fps, with deterministic seeking. Encoded files are committed; production CI never records them.

Budgets per film: WebM at most 900,000 bytes; MP4 at most 1,400,000 bytes; poster at most 120,000 bytes. `test:media` verifies actual file presence and size; generated-site contracts verify lazy sources, synthetic captions, unique transitions, and that no dev film route or stylesheet ships.

## Verification

Run `pnpm test`, `pnpm check`, `pnpm build`, `pnpm test:site`, `pnpm test:media`, and `pnpm audit --prod --audit-level=moderate`. Browser review covers light/dark at 1440, 1024, 768, 390, and 320 px; shortcuts; mobile menu; interactive examples; architecture links; reduced motion; and no initial video requests.

| Target (not a measured result) | Threshold |
| --- | --- |
| Lighthouse | Performance ≥95, Accessibility 100 |
| Core Web Vitals | LCP ≤2 s (desktop, throttled), CLS ≤0.05 |

The recruiter brief has no film. Its existing print blocks are unchanged. Final human review should still cover VoiceOver, Safari on a physical phone, and the editorial accuracy of each synthetic film.
