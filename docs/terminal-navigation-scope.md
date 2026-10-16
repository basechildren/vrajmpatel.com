# Header command navigation

The header now animates navigation commands in the existing `~/vraj-patel` breadcrumb area. Selecting the home link or a numbered link types its destination command, then loads the page through ordinary document navigation. The separate terminal dialog and manual command input have been removed.

## Behavior

| Link | Command shown |
| --- | --- |
| Home from any page | `cd ~` |
| 1 Work from Home | `cd projects` |
| 2 Experience from Home | `cd experience` |
| 3 About from Brief | `cd ../about` |
| 4 Brief from About | `cd ../brief` |
| 1 Work from a case study | `cd ..` |
| 3 About from a case study | `cd ~/about` |

The same animation runs for numbered keyboard shortcuts, the go-home shortcut, and the mobile menu's matching links. Commands are calculated relative to the current page: entering a child uses its name, moving to a sibling starts with `../`, and returning to a parent uses `..`. A jump requiring two or more parent steps uses `~/` instead, with `~` representing the site's home page. Going home always shows `cd ~`. The new page shows its actual breadcrumb when it loads. Selecting the current page shows `cd .` (or `cd ~` for Home) and restores the breadcrumb without reloading.

Typing takes at most 360 ms, followed by a 90 ms pause before navigation. Reduced-motion visitors navigate immediately. The regular links remain real anchors, including when JavaScript is unavailable; modified clicks, new tabs, downloads, and external destinations retain native browser behavior.

## Reliability and accessibility

The primary navigation and command targets share `src/lib/siteNavigation.ts`. The enhancement only accepts Home and the four fixed primary destinations. It does not execute commands or accept visitor input.

The per-character preview is hidden from assistive technology. A separate status message announces the destination once. The animated layer does not change the header's dimensions or remove the regular navigation.

## Verification

Run the standard project checks and `node scripts/header-navigation-browser-smoke.mjs` with the live preview running. The focused browser checks cover all four commands, navigation timing, keyboard shortcuts, rapid clicks, cancellation, Back, modified clicks, reduced motion, JavaScript-disabled navigation, and mobile and desktop layouts in both themes.
