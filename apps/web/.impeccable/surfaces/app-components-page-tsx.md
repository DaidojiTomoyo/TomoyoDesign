---
version: 1
slug: "app-components-page-tsx"
primary_target: "app/components/page.tsx"
related_targets: ["components/catalog","lib/catalog.ts"]
---

# Components catalogue

The user retired the design drafts on 2026-11-17. Current code, DESIGN.md, and the approved catalogue plan are the baseline; deleted pen exports are not required for future implementation or review. Historical reports remain implementation evidence.

## Shared effect refinement — 2026-11-17

The user selected the homepage overdrive directions: flowing liquid chrome and a blue accelerating tunnel. The catalogue uses the same silver/cobalt text material and beveled portal surfaces, with its own centered framing and steady tunnel motion. Both active shader previews target 30 paints per second and stop when inactive, paused, hidden, or fully outside the viewport. Boundary contact with zero visible area does not count as visibility.

The new `liquid-chrome-preview.jpg` and `beveled-tunnel-preview.jpg` are 854×534 captures of the actual compact renderers at time zero. Updated filenames prevent old optimized covers from surviving a material change. Only the Gallery and Image Focus PNGs remain as runtime failure fallbacks; obsolete shader PNGs and duplicate design exports were removed. The local Suspense boundaries and new-program resolution initialization remain required.

## Preview and search refinement — 2026-11-17

Follow-up first-hover correction: each live preview has a local Suspense boundary. Loading Metallic Text or Spatial Tunnel must preserve the catalogue, its focus, and neighboring renderers. The poster and local loading feedback remain outside the renderer boundary. Metallic renderer reinitialization always sets the new program's resolution, including reuse of a same-size canvas. Controlled slow-loading and route-return evidence lives in project-root `.impeccable/review/first-hover-2026-11-17/`.

The user reported broken previews, requested search in the Header, and rejected the blue outer input ring. This supersedes the earlier body-search and reset-to-poster behavior.

- The shared 88px Header contains the catalogue search. Its focus treatment is an inset neutral line; the rest of the global focus system stays unchanged.
- Only keyboard focus takes precedence over hover. Pointer-focused buttons remain usable when the visitor switches to Space or Enter.
- Image previews use the same DOM and photos for their still and active states. Effects start after assets are ready; leaving freezes the initialized view and re-entry resumes it. An explicit Pause or Escape stays paused until Preview is activated, including after focus returns.
- Shader posters come from the actual catalogue renderer. The compact tunnel is centered without the homepage copy veil. Instances initialize on demand and stop rendering while inactive, hidden, offscreen, or reduced motion is enabled.
- Search drafts follow same-route Link navigation as well as history traversal. Fresh independent review on 2026-11-17: `ship`, no material fixes. The 2026-11-16 verdict does not cover these changes; current evidence is in `.impeccable/review/refinement-2026-11-17/` at the project root.

- Mode: Operate. Developers and UI designers search four real effects, preview one, and retain their place while exploring.
- Target: `/components`, `app/components/page.tsx`; English and desktop only, minimum document width 1200px.
- Confirmed brief: `design/plans/components-catalog.md`; the user approved implementation on 2026-11-16. The approved implemented catalogue is the composition baseline. Build path: code.
- Four real items: Metallic Text, Hover Gallery, Spatial Tunnel, Image Focus. No fabricated framework support, counts or detail links. Detail routes are not part of this build.
- Search by name and purpose, single category selection, URL persistence, accessible empty/error states. Hover or focus activates one preview; motion preferences, page visibility and intersection stop it. Until details ship, a compact Preview control supplies keyboard access while the name remains plain text.

## Direction contract

THESIS: Make choosing an interaction immediate through real previews and a compact searchable catalogue, with no promotional hero between visitors and the work.

OWN-WORLD: Inherit the implemented homepage's white surface, cool pale preview fields, near-black Inter interface, fine borders and cobalt actions. Shared wordmark and navigation remain continuous with the finished homepage.

STORY: Find Components, narrow by name or purpose, scan the three-column grid, then focus or hover one of the four actual effects. The selected material moves while neighboring previews stay still.

FIRST VIEWPORT: Shared 88px desktop header with compact search, 1328px maximum content with 56px gutters, a compact Components heading, category controls and result count, then three equal preview columns. The fourth item begins the next row; it never stretches to fill the grid. No repeated browse CTA in the current section.

FORM: seed: none (pinned). The user confirmed the four-item, hover/focus-only catalogue plan, accepted its implementation, and later retired the source drafts: “OK，就按这个规划开始做组件列表页吧”.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Acceptance

- Desktop 1200, 1440 and 1920 widths: no horizontal overflow; narrower user viewport retains intentional desktop canvas.
- Real four-item count, combined search and category, independent clear controls and back navigation restoration.
- At most one playing preview; zero playing previews on initial render, while hidden, offscreen or reduced motion is active. Initialized canvases may stay mounted without rendering.
- Static first frames remain while dynamic previews load or fail; retry is local to the affected card.
- Home visual identity and four existing demos remain intact; component navigation now reaches the catalogue.
- This is an extension of the existing design system: compare against DESIGN.md without rewriting it.

## Completed verification

- Implemented and verified on 2026-11-16. Four desktop captures (1200, 1280, 1440, 1920) retain the approved composition without horizontal overflow.
- Search, combined filters, independent clear controls, URL/history restoration, keyboard activation and single-preview playback were exercised in the browser.
- Five search tests, lint, TypeScript, formatting and production build passed. Original shader materials and the existing homepage defaults are retained.
- Independent finish review: `ship`, no material fixes. Existing DESIGN.md and sidecar were compared and preserved; local directory control sizes live in this surface.
- Evidence: project-root `.impeccable/review/catalog-verification.md` and `catalog-finish-review.md`. Retained runtime previews have embedded source provenance, documented in `design/README.md`. The original design exports are retired.
