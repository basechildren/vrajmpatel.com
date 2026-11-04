# Header command previews

The header previews a contextual command in the existing breadcrumb area when a primary navigation link receives mouse hover or keyboard focus. Clicks, modified clicks, touch activation, and keyboard shortcuts use ordinary links immediately. No timer, typewriter animation, or scripted redirect delays navigation.

## Behavior

Commands describe the relationship between pages: `cd projects` from Home, `cd ../about` from Brief, and `cd ..` from a case study to Work. Resumes opens `/resume/`; the `r` shortcut opens the same collection. The home breadcrumb remains a normal link and is never replaced while focused.

Leaving the header, moving focus, pressing Escape, changing the motion preference, or restoring a cached page clears the preview. Reduced-motion visitors retain the static breadcrumb. The preview is hidden from assistive technology; link names and destinations remain available normally.

## Verification

Run `pnpm test` for command resolution, preview behavior, shortcuts, and cancellation safeguards. `scripts/header-navigation-browser-smoke.mjs` covers native navigation, focus previews, reduced motion, mobile menu dismissal, resume access, and JavaScript-disabled links when run with a local preview.
