---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["components/home", "components/effects"]
---

# Homepage

## Current baseline — 2026-11-17

The user accepted the implemented homepage and requested cleanup of design drafts
because they are no longer needed. Current code, DESIGN.md, and the confirmed
requirements below are authoritative. Do not reopen retired pen documents or
require deleted exports for future work. Historical screenshots and review
reports describe earlier implementations, not additional requirements.

- Target: `apps/web/app/page.tsx`; route `/`.
- Mode: Persuade. Developers and UI designers inspect working web interactions.
- Build path: code. Preserve the approved visual identity unless the user requests
  a change; old mockups are not a reproduction target.
- English and desktop only. Minimum document width 1200px; no mobile composition
  or hamburger menu. Narrow windows retain the desktop structure.
- Four real effects: Spatial Tunnel, Metallic Text, Hover Gallery, Image Focus.
  Component links open `/components`; detail pages and documentation are separate
  follow-up work. GitHub remains a noninteractive coming-soon entry.

## Confirmed effects and controls

- **Spatial Tunnel:** oversized beveled cobalt portals with broad silver
  reflections. The homepage has a continuous ten-second anticipation, passage,
  and recovery rhythm with traveling light. Position accumulates across loops.
  The viewpoint is fixed; no pointer-following camera or hover hint.
- **Metallic Text:** readable Tomoyo lettering with silver liquid chrome and cobalt
  environment reflections. Reflections bend across full strokes and flow without
  pointer movement. Pointer and arrow keys tilt the light; Home resets it.
- Hero playback is an icon-only Lucide control with a transparent 44px target and
  no hover surface. Metallic has icon-only playback and reset controls. Names,
  pressed states, and keyboard focus remain accessible.
- GSAP drives animation. Home shader renderers target 60 paints per second and
  catalogue variants target 30; submitted draws are not GPU presentation FPS.
  Pause, hidden pages, reduced motion, and zero visible area stop animation.
  Positive-area re-entry resumes it; unavailable rendering has a readable fallback.
- Metallic resources initialize when visible; curve preprocessing yields between
  batches and is cached. Gallery and Focus animate only after image readiness.
- Preserve local preview Suspense boundaries, one-active-card behavior, retained
  canvases, and uniform initialization for each new WebGL program.

## Direction contract

THESIS: Let developers preview a small collection of real text, image, and background effects, then understand how those components fit into a web page.

OWN-WORLD: Monumental Archivo Black title and footer, Inter interface text, white display surfaces, cobalt portal geometry, silver liquid lettering, and a cool gray furniture example panel. DESIGN.md records the shared design system.

STORY: Full-bleed Spatial Tunnel → Metallic Text specimen → wide Hover Gallery → Image Focus inside FORM Objects → three practical use steps → blue collection invitation → large black wordmark.

FIRST VIEWPORT: An 88px transparent header overlays the scene. The opening height is `clamp(680px, 100svh, 918px)`; title size and inset adapt to desktop height. A 1328px maximum content frame with 56px minimum gutters aligns the title, English description, and browse action. The light left area protects the copy; the tunnel and pause control remain visible.

FORM: seed: none (pinned). The user approved the current homepage, selected the accelerating blue tunnel and flowing liquid chrome directions, then retired the old design references. The implemented structure and these confirmed choices are the baseline.

FINISH: Review rendered changes, record the verdict, maintain DESIGN.md, and preserve provenance on shipping raster assets.

## Acceptance and evidence

- Check 1200×720, 1440×900, and 1920×1080, plus the current user viewport.
- No horizontal overflow at supported desktop widths; preserve intentional desktop
  overflow in narrower windows. Do not introduce phone or tablet reflows.
- Keep Gallery's 1120px rail and 430px region, and the furniture example's 370px
  copy column, 420px photo, and 36px outer inset.
- Verify pause/resume, keyboard light input, visibility suspension, and catalogue
  first activation after shared renderer changes. Refresh renderer covers when
  their visible material changes.
- Current independent review: `ship`, no material fixes. Full captures and checks:
  project-root `.impeccable/review/overdrive-2026-11-17/`. Earlier performance and
  first-hover checks remain historical evidence in sibling review folders.
