---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/home", "components/effects"]
---

# Homepage

## Current baseline — 2026-11-17

The homepage keeps its established visual system, centered desktop composition,
and document-bound sakura background. After the latest independent critique,
the user approved keeping downward branch growth while revising the complete
branch silhouette, occlusion relationships, and bloom timing together. That
revision is implemented, its recorded visual fixes passed focused review, and
the final four static fallbacks and browser checks are complete. Nineteen tests,
lint/type checks, and source formatting pass. Production build verification is
blocked by environment port/network restrictions; no successful build is claimed.
Previous reviews remain historical evidence. Current code, DESIGN.md, and the
confirmed requirements below remain the baseline. Retired mockups are not required.

- Target: `apps/web/app/page.tsx`; route `/`.
- Mode: Persuade. Developers and UI designers inspect working web interactions.
- Build path: code. Preserve the approved visual identity unless the user requests
  a change; old mockups are not a reproduction target.
- English and desktop only. Minimum document width 1200px; no mobile composition
  or hamburger menu. Narrow windows retain the desktop structure.
- Five real homepage effects: Spatial Tunnel, Metallic Text, Hover Gallery,
  Image Focus, and Scroll Bloom. The catalogue retains the original four effects.
  Component links open `/components`; detail pages and documentation are separate
  follow-up work. The shared header and homepage footer link to the GitHub repository.

## Confirmed effects and controls

- **Spatial Tunnel:** oversized beveled cobalt portals with broad silver
  reflections. The homepage has a continuous ten-second anticipation, passage,
  and recovery rhythm with traveling light. Position accumulates across loops.
  The viewpoint is fixed; no pointer-following camera or hover hint.
- **Metallic Text:** readable Tomoyo lettering with silver liquid chrome and cobalt
  environment reflections. Reflections bend across full strokes and flow without
  pointer movement. Pointer and arrow keys tilt the light; Home resets it.
- **Scroll Bloom / Sakura:** a natural cherry blossom background throughout the
  homepage, growing down from the document's upper-left. Native document scroll
  drives branch growth, buds, and clusters of pale-pink to milky-white five-petal
  flowers. The scene is anchored to page coordinates; developed portions scroll
  out of view. A fixed viewport canvas draws only the visible page slice. There
  is no standalone section, pinned stage, or extra scroll distance.
- Hero playback is an icon-only Lucide control with a transparent 44px target and
  no hover surface. Metallic has icon-only playback and reset controls. Names,
  pressed states, and keyboard focus remain accessible.
- GSAP drives animation. Tunnel and Metallic homepage renderers target 60 paints
  per second and catalogue variants target 30; submitted draws are not GPU presentation FPS.
  Pause, hidden pages, reduced motion, and zero visible area stop animation.
  Positive-area re-entry resumes it; unavailable rendering has a readable fallback.
- Metallic resources initialize when visible; curve preprocessing yields between
  batches and is cached. Gallery and Focus animate only after image readiness.
- The flower renderer draws only when progress, visible page slice, size, or
  resource state changes; it stays idle when scrolling settles or the document
  is hidden. Reduced motion and rendering failure use a transparent static image
  of the mature page background. The decorative scene cannot intercept clicks,
  keyboard focus, or accessibility navigation.
- Preserve local preview Suspense boundaries, one-active-card behavior, retained
  canvases, and uniform initialization for each new WebGL program.

## Direction contract

THESIS: Let developers preview a small collection of real text, image, and background effects, then understand how those components fit into a web page.

OWN-WORLD: Monumental Archivo Black title and footer, Inter interface text, white display surfaces, cobalt portal geometry, silver liquid lettering, and a cool gray furniture example panel. DESIGN.md records the shared design system.

STORY: Spatial Tunnel → Metallic Text → Hover Gallery → Image Focus → How to use → collection invitation → wordmark. A document-bound cherry blossom background grows downward through this journey. Earlier branches leave the viewport as lower clusters appear; reverse scrolling retracts growth and closes flowers into buds.

FIRST VIEWPORT: Preserve the existing title, 88px transparent header, browse action, and blue tunnel at their original centered width. The opening height remains `clamp(680px, 100svh, 918px)` and the pause control stays visible. A woody branch enters from beyond the upper-left page edge. Its continuous parent and unequal node-attached lateral branches develop downward with tapered hierarchy and compact flower groups. The transparent background sits between the page color and foreground content; live demos retain their surfaces. Preserve the shared `min(100% - 112px, 1328px)` boundary, horizontal CTA, and footer arrangement. Do not push content aside, reserve a flower rail, or disguise geometry with uniform transparency.

FORM: seed: none (pinned). The latest confirmed choice is “保留枝条向下生长，把枝形、遮挡和开花时序一起调整，让整体更自然一些”. Author a coherent plant silhouette before fitting it to the page. Remove rectangle-corner shortest-path routing, long bare arcs, parallel hanging stems, and deliberate workflow-gap threading. Keep main branch connections legible outside opaque demo surfaces, especially the boundaryless white Metallic stage. Use measured text and surface bounds for clearance, not as a recipe for the tree's shape. Time parent growth, shoots, stalks, buds, and opening by their actual document position and viewport height so the focal transition stays visible. Mature wood remains stable and reverse scrolling deterministic. Retain thin cupped petals, shallow notches, red-brown sepals, enclosed buds, and the three local AI-generated material textures. Balance wood and flower weight on white, image, and blue backgrounds. See `design/plans/homepage-sakura-background.md` for the active local refinement.

FINISH: Review rendered changes, record the verdict, and preserve provenance on shipping raster assets. Update DESIGN.md only when shared system rules change; Scroll Bloom is a local extension within the existing system.

## Acceptance and evidence

- Check 1200×720, 1280px desktop width, 1440×900, and 1920×1080, plus the current user viewport.
- No horizontal overflow at supported desktop widths; preserve intentional desktop
  overflow in narrower windows. Do not introduce phone or tablet reflows.
- Preserve operable previews and the original centered content width. Restore
  the furniture example's original columns, horizontal CTA, and footer
  arrangement. Branches must blend into the background without competing with
  copy, previews, or controls.
- Verify pause/resume, keyboard light input, visibility suspension, and catalogue
  first activation after shared renderer changes. Refresh renderer covers when
  their visible material changes.
- Verify global forward/reverse growth, restored scroll position, anchors,
  reduced motion, context loss/restoration, idle suspension, and no new document
  height. Verify that earlier branches scroll out of view and reduced-motion
  and failure fallbacks use the same document-bound composition. Validate
  branch/copy separation and all controls at each desktop size.
- Main wood must remain visually connected while passing the demo regions. No
  unexplained flat cuts, floating restarts, corner-following loops, or thin stems
  threaded through workflow column gaps. Check actual slow-scroll intermediate
  states in addition to mature screenshots.
- Branches grow before their child shoots; buds and opening should be visible
  around the middle/lower portion of the viewport. Fast forward, reverse, and
  restored positions must produce the same deterministic state without a
  separate trailing scrub motion.
- Retain Uint16-compatible geometry, finite positions/normals, stable mature wood,
  cached layout, and the 1,250,000-pixel visible-canvas budget. Record current
  geometry/test results only after validation; CPU timings are not GPU FPS.
- Refresh all four mature transparent fallbacks from the final renderer, preserving
  native alpha and embedded provenance. Keep the existing `picture` viewport
  selection unless a verified requirement changes it. Never use erasure masks to
  hide disconnected branches.
- Current evidence is in `.impeccable/review/sakura-composition-2026-11-17/`.
  Final geometry has 65,239 vertices and 91,200 triangles within Uint16 indexing.
  Nineteen tests pass (14 geometry and five catalogue), `pnpm check` passes,
  and source formatting passes. Detailed scope is in
  `design/plans/homepage-sakura-background.md` and `final-code-checks.md`.
- Final native-alpha fallbacks match the last renderer at 1200×3975, 1280×3975,
  1440×4155 and 1920×4173; `exports.json` records metadata-inclusive file sizes.
  All fourteen runtime rasters retain provenance. Final reduced-motion media
  simulation and real context loss/restoration pass. The temporary verification
  route was removed, the owned browser was closed, and its viewport restored.
- `finish-verdict-3.md` resolves the first-branch junction eyelet and preserves
  the preceding resolved rounded-parent and unequal-lateral fixes. Its `ship`
  scores only these recorded visual fixes; it is not a whole-site endorsement.
  The final PNG export and fallback checks were completed afterward.
- Production build remains unverified. Default Turbopack fails on an internal
  port permission in this environment; the official webpack alternative fails
  fetching existing Google Fonts because sandbox DNS is unavailable. The user
  aborted the external webpack retry, and no further retry was attempted. No
  dependency, font, or build configuration was changed to bypass these limits.
- Current logs have no Sakura/runtime errors but retain existing development LCP
  advice for `lounge-chair.jpg` after a midpage reload. No current GPU FPS or
  broad device-compatibility claim is made; earlier CPU samples predate final
  geometry changes.
- The independent critique in `.impeccable/review/sakura-critique-2026-11-17/`
  assessed the preceding animation at 15/24 and motivated this change. It found
  invisible surface cuts, layout-driven branch shape, late blooms, and inconsistent
  material weight. It used 1280×720 live forward/reverse scrolling, not a new FPS
  or compatibility benchmark.
- `.impeccable/review/sakura-natural-2026-11-17/` contains the preceding revision's
  15 passing tests, four-width captures, fallback checks, and a `ship` verdict
  limited to lower branching and documentation fixes. Those results do not
  validate the current structural/timing revision. Earlier versions are indexed
  in `design/plans/homepage-scroll-bloom.md`.
