---
name: TomoyoDesign
description: Monumental typography and dimensional shader effects in a clear desktop showcase.
colors:
  blue: "#254bff"
  blue-deep: "#183bdf"
  example-ink: "#243b34"
  example-muted: "#435c53"
  example-action: "#253d34"
  white: "#ffffff"
  paper: "#fbfcff"
  ink: "#11131a"
  ink-muted: "#596576"
  navigation-muted: "#555c68"
  line: "#e0e5ef"
  example-surface: "#f0f3f8"
typography:
  display:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: "clamp(80px, min(7.7778vw, 12.2svh), 112px)"
    fontWeight: 400
    lineHeight: 0.97
    letterSpacing: "-0.04em"
  wordmark:
    fontFamily: "Archivo Black, sans-serif"
    fontSize: "clamp(142px, 12.0833vw, 174px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.034em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "24px"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  action:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "17px"
  example-headline:
    fontFamily: "Geist, sans-serif"
    fontSize: "62px"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.04em"
rounded:
  square: "0px"
  action: "4px"
spacing:
  compact: "8px"
  small: "12px"
  control: "16px"
  regular: "24px"
  group: "28px"
  generous: "32px"
  wide: "40px"
  section: "72px"
components:
  button-primary:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "16px 22px"
  button-primary-hover:
    backgroundColor: "{colors.blue-deep}"
  button-inverse:
    backgroundColor: "{colors.white}"
    textColor: "{colors.blue}"
    typography: "{typography.action}"
    rounded: "{rounded.action}"
    padding: "16px 22px"
  button-header:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.action}"
    padding: "13px 18px"
  navigation:
    textColor: "{colors.navigation-muted}"
    padding: "12px 0"
  button-reset:
    backgroundColor: "transparent"
    textColor: "#263246"
    rounded: "50%"
    padding: "0"
    width: "44px"
    height: "44px"
  playback:
    backgroundColor: "transparent"
    textColor: "#1d2d61"
    padding: "0"
    rounded: "50%"
    width: "44px"
    height: "44px"
  example-category:
    backgroundColor: "transparent"
    textColor: "{colors.example-muted}"
    rounded: "{rounded.square}"
    padding: "0"
  example-action:
    backgroundColor: "{colors.example-action}"
    textColor: "{colors.white}"
    rounded: "{rounded.action}"
    padding: "13px 18px"
  text-link:
    textColor: "{colors.blue}"
---

# Design System: TomoyoDesign

## Overview

**Creative North Star: "The interaction edition"**

TomoyoDesign combines monumental Archivo Black typography with reflective cobalt geometry and flowing silver chrome. Inter provides a clear practical interface, while small IBM Plex Mono labels give the work a precise editorial signature. White display surfaces and generous horizontal compositions let each demonstration occupy the foreground.

The interface remains flat around dimensional shader materials and object photography. The embedded FORM Objects example introduces its own quiet green palette and Geist typography within a cool gray section. This document records the current pen-derived implementation; the homepage's exact composition and acceptance measurements live in its surface brief.

**Key Characteristics:**

- Monumental Archivo Black display type and a uniformly black footer wordmark.
- Inter interface typography with restrained IBM Plex Mono labels.
- Cobalt architectural geometry and silver liquid chrome on white and cold paper surfaces.
- Wide desktop compositions, fine borders, and compact rectangular actions.
- A distinct furniture example with green type and Geist typography.
- GSAP-driven effects with accessible controls, reduced motion, and rendering fallbacks.

## Colors

Cobalt identifies actions and reflected material, while near-black type and cool whites keep the surrounding interface clear.

### Primary

- **Electric cobalt** (`blue`) carries primary actions, links, focus outlines, and the effects' dominant material color.
- **Deep cobalt** (`blue-deep`) darkens primary actions and the Image Focus text control on hover.

### Secondary

- **Object ink** (`example-ink`) is the furniture example's main green text.
- **Muted object green** (`example-muted`) supports its category and collection controls.
- **Object action green** (`example-action`) fills its collection button. Preserve this distinct implemented value rather than replacing it with the text green.

### Neutral

- **White** (`white`) is the main display surface and reversed action text.
- **Cold paper** (`paper`) supports the opening scene.
- **Near-black ink** (`ink`) carries primary type; **muted ink** (`ink-muted`) carries descriptions and effect instructions.
- **Navigation gray** (`navigation-muted`) supports header links and the reserved GitHub status.
- **Fine line** (`line`) separates workflow items and the footer baseline.
- **Example gray** (`example-surface`) frames the white furniture example.

**The Accent Has a Job Rule.** Use cobalt for an action, focus, or the demonstrated material. Keep supporting structure neutral.

**The Example Boundary Rule.** Keep the furniture example's green palette and Geist typography inside its contextual frame.

## Typography

Archivo Black, Inter, IBM Plex Mono, and Geist are loaded through Next.js and exposed as `--font-archivo-black`, `--font-inter`, `--font-plex-mono`, and `--font-geist-sans`. The main interface inherits Inter. Geist belongs to the embedded FORM Objects page; its effect instruction row returns to Inter.

- **Display** establishes the large two-line opening statement. It responds to both desktop width and available viewport height, keeping the letters within the shader's light region and the copy within the first screen. Its lower bound preserves desktop-sized type in narrower preview windows.
- **Wordmark** applies Archivo Black consistently across the complete footer name. At the reference desktop width (1440px), it reaches its maximum size; the entire name remains near-black.
- **Headline** introduces the example and workflow sections. The collection title uses a local larger size (44px), and the gallery title a local smaller size (36px), with the same Inter weight and heading character.
- **Title** identifies the three practical steps.
- **Body** is the inherited reading style. Introductory copy uses 17px; quiet instructions and annotations generally use 13–15px.
- **Action** is the main browse-button text. The compact header action keeps regular-weight Inter with a shorter line box (17px).
- **Label** names the hero effect. Step numbers and the footer signature use IBM Plex Mono at 12px; the footer signature adds letter spacing (0.5px).
- **Example headline** is the lighter green title within the furniture page.

The small header wordmark pairs Archivo Black “Tomoyo” with Inter “Design” at 24px. The large footer uses Archivo Black for the entire name, with no separate accent-colored suffix or dot.

**The Drawn Weight Rule.** Archivo Black supplies its weight through the typeface itself. Use its real regular weight rather than applying synthetic bold.

## Layout

The current homepage is desktop-only. The document has a minimum width (1200px), with no phone or tablet layout breakpoints. A narrower browser retains the desktop structure and may scroll horizontally. Navigation stays visible; the page does not switch to a hamburger menu or stacked mobile composition.

The shared frame uses `min(100% - 112px, 1328px)`: side gutters are 56px through the reference width, and the content width caps at 1328px. Header, section content, closing invitation, and footer share this alignment. Major sections use the recurring section spacing, with local lower spacing appropriate to their content. The workflow remains three equal columns with a wide gap.

The homepage opening is a full-area shader composition with height `clamp(680px, 100svh, 918px)` and a transparent header (88px high). The copy's top inset uses `clamp(32px, 8.5svh, 78px)`, coordinated with the height-aware display size. Copy overlays the scene's light left region. The minimum height remains 680px in shorter windows; this is a desktop canvas rather than a mobile reflow. Demonstration geometry stays intentionally wide: the metallic stage is 430px high with a 42px control row; the gallery occupies a 430px region around a rail up to 1120px wide and 400px high. The furniture frame has a 370px copy column beside a flexible image column, with a 420px photograph. Its 35px padding plus 1px border matches the pen's 36px outer inset.

**The Shared Edge Rule.** Align headings, demonstrations, captions, and dividers to the same content frame; vary the work inside that frame.

## Elevation & Depth

Product chrome has no box shadows. White and cool gray surfaces, fine borders, and whitespace separate content. Perspective, reflection, expansion, and zoom create depth inside the demonstrations. The transparent header belongs directly to the full opening scene.

**The Source Material Rule.** Keep the demonstrated materials dimensional: cobalt portals with broad silver reflections, and liquid silver lettering with cobalt environment reflections. The user-approved overdrive refinement evolves the original pen shaders; it preserves their role as the focal work and the surrounding pen-derived composition.

## Shapes

Photographs and their frames have square corners and fine borders. Main and contextual collection buttons share the action radius. Effect playback and reset controls have no visible container; their circular focus outlines appear only during keyboard use.

The rounded geometric tunnel belongs to the shader. It does not establish a rounded-card language for the surrounding page.

**The Quiet Frame Rule.** Keep imagery rectangular and surrounding controls compact so the demonstrated material remains the focal point.

## Components

### Actions and text links

Primary and inverse browse actions share a minimum height (52px), arrow gap (24px), and arrow size (18px). Primary hover uses deep cobalt. The inverse action sits on cobalt, uses a local pale hover surface (`#e4eaff`), and keeps a white focus outline for contrast.

The header browse action is a smaller filled cobalt button with a minimum height (43px), regular-weight type, and no arrow. Text links use cobalt with an arrow and gain an underline on hover. Header navigation links retain their quieter treatment until hovered.

Global keyboard focus is a cobalt outline (2px) with an offset (5px). Reset and playback controls use a local offset (4px). The automatic tunnel scene itself is not an interactive focus target; its playback button retains visible keyboard focus.

### Icons

Use Lucide for interface icons. ArrowUpRight accompanies forward actions, ArrowUp marks the return-to-top link, Pause and Play identify playback, and RotateCcw resets the metallic light. Main action icons are 18px with a stroke width (1.6); metallic controls and furniture action arrows are 16px with a stroke width (1.5). Tunnel playback uses filled 18px Lucide shapes without a stroke. GitHub is a deliberate brand exception using its official Invertocat SVG. Decorative icons stay hidden from assistive technology; icon-only controls carry an accessible action label.

### Navigation and wordmarks

The transparent header uses a three-column layout: left wordmark, centered links, right actions. Main links remain visible at every supported desktop width. The first navigation link is near-black, while the others use navigation gray. The footer repeats the navigation beside its introductory line and places the uniformly heavy Archivo Black name below.

GitHub is currently a noninteractive status with a small “soon” label and the official GitHub Invertocat mark, in both header and footer. It reserves the confirmed future entry without presenting an invented destination.

### Effect controls

**Metallic controls** pair Pause/Play with Reset light as dark neutral icons in transparent 44px hit areas. Reset is disabled while paused; both are disabled when rendering is unavailable or reduced motion is active. Accessible labels and native titles describe each action. Keyboard focus remains visible.

**Playback** shows only a filled 18px Pause or Play icon over the tunnel, without a background or border. Its transparent 44px hit area aligns to the shared content inset and sits 28px from the opening's bottom. The accessible label names the current action and `aria-pressed` exposes the paused state. Reduced motion disables playback with an explanatory accessible label and reduced opacity. Mouse hover does not add a surface; keyboard focus shows a circular cobalt outline.

**Example categories** are unboxed Geist text buttons. The selected category uses darker green and an underline, expressed through `aria-pressed`. A green collection action cycles the supplied objects; its hover and active states darken the green. The Image Focus text control uses cobalt and exposes its zoom state.

### Demonstration stages

- **Spatial Tunnel:** beveled cobalt portals and broad silver reflections frame a continuous forward journey. The homepage uses a ten-second acceleration and recovery rhythm with traveling light; the compact catalogue preview keeps a centered composition and steady movement. The viewpoint does not follow input. Pause/Play is the only interactive control. Reduced motion fixes the scene, and a vector fallback covers unavailable rendering.
- **Metallic Text:** silver chrome flows across the full volume of a readable “Tomoyo” specimen, with cobalt appearing in the reflected environment. Pointer movement and arrow keys gently tilt the light; Home and Reset light restore its position. An icon-only control pauses the flow. Reduced motion keeps a fixed reflection. Text remains available to assistive technology and a visible fallback covers rendering failure.
- **Hover Gallery:** three bordered object photographs share the wide rail. The selected image expands to a flex-grow factor (3.44) and height (390px), while the others remain 300px high. Pointer position, click, focus, arrow keys, Home, and End select the object.
- **Image Focus:** the furniture example pairs a stable copy column with an image that enlarges on hover or keyboard focus. The zoom factor is 1.32, with pointer position and arrow keys moving the viewing area. Escape closes the zoom, and the visible text control toggles it.

GSAP drives all four demonstrations. Gallery expansion uses reusable `quickTo` tweens (650ms, `expo.out`); Image Focus uses the same easing for zoom (500ms) and image-origin panning (180ms). Its viewing origin stays within 37.5–62.5% on each axis. GSAP tickers advance the tunnel and the liquid reflection independently of pointer movement. Homepage renderers target 60 paints per second; catalogue previews target 30. Action, navigation, and furniture-control color states change immediately without CSS transitions. Reduced-motion preferences settle effect states immediately and stop continuous movement. Renderers suspend work when paused, inactive, hidden, or fully offscreen. Metallic resources initialize near their visible stage rather than blocking the first screen.

**The Operable Demonstration Rule.** Keep effect content readable and keyboard-operable, including static states when motion or rendering is unavailable.

## Do's and Don'ts

### Do:

- **Do** preserve the approved dimensional materials and the distinct roles of all four font families.
- **Do** keep the footer name uniformly near-black and uniformly Archivo Black.
- **Do** use shared content edges and generous horizontal room for the demonstrations.
- **Do** preserve visible focus, selected states, and readable rendering fallbacks.
- **Do** keep the current homepage's desktop structure in narrow preview windows.

### Don't:

- **Don't** replace Archivo Black display type or main Inter text with Geist.
- **Don't** introduce phone or tablet reflows into this desktop-only implementation.
- **Don't** add rounded, shadowed card containers around every demonstration.
- **Don't** replace the dimensional tunnel or liquid metal with flat decorative gradients.
- **Don't** let the furniture example's colors or typography redefine surrounding product chrome.
