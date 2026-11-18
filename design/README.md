# Website asset index

Retired page mockups, duplicate design exports, and unused shader preview PNGs
were removed at the user's request on 2026-11-17. Current code, `DESIGN.md`, and
the approved page plans are the development baseline. Old design documents are
not required to implement or review future changes.

Implementation screenshots and historical verification reports remain in
`.impeccable/review/`; they document the built website rather than provide new
page specifications. The [catalogue plan](plans/components-catalog.md) retains
confirmed scope and interaction decisions.
The [sakura background plan](plans/homepage-sakura-background.md) records the
current revision: continuous natural branch structure, clear relationships with
opaque demos, and viewport-aware growth and flowering, within the unchanged
centered layout. The latest critique is recorded in
`.impeccable/review/sakura-critique-2026-11-17/`; current implementation and
verification evidence is recorded in
`.impeccable/review/sakura-composition-2026-11-17/`. The earlier
`.impeccable/review/sakura-natural-2026-11-17/finish-verdict-1.md` approved only
that version's lower branching and documentation fixes. It does not approve the
new revision. The [Scroll Bloom archive](plans/homepage-scroll-bloom.md) links
still earlier versions.

## Component preview assets

Website assets live in `apps/web/public/images/components/`, served under
`/images/components/`. The first four files are referenced by
`apps/web/lib/catalog.ts` and used by `components/catalog/catalog-preview.tsx`;
the sakura fallback belongs to `components/effects/scroll-bloom.tsx` on the homepage.
The shader renderer loads the petal, leaf, and bark textures in parallel through
`loadSakuraMaterials` before creating the scene. The background rebuild reuses
these three materials. The four responsive static backgrounds below were refreshed
from the final revised renderer, preserving native alpha and embedded source
information. Final exports and fallback checks are complete.

| File                                                                                          | Dimensions  | Use and source                                                                                      |
| --------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| [liquid-chrome-preview.jpg](../apps/web/public/images/components/liquid-chrome-preview.jpg)   | 854 × 534   | Actual `MetallicText` catalogue renderer, elapsed time 0, light `(0.5, 0.5)`                        |
| [beveled-tunnel-preview.jpg](../apps/web/public/images/components/beveled-tunnel-preview.jpg) | 854 × 534   | Actual `SpatialTunnel` catalogue renderer, centered view, elapsed time 0                            |
| [hover-gallery.png](../apps/web/public/images/components/hover-gallery.png)                   | 854 × 508   | Gallery failure fallback, originally exported from the supplied design                              |
| [image-focus.png](../apps/web/public/images/components/image-focus.png)                       | 854 × 508   | Image Focus failure fallback, originally exported from the supplied design                          |
| [sakura-background.png](../apps/web/public/images/components/sakura-background.png)           | 1440 × 4155 | Mature renderer background, native alpha and embedded provenance; 311,227 bytes including metadata  |
| [sakura-background-1200.png](../apps/web/public/images/components/sakura-background-1200.png) | 1200 × 3975 | Mature renderer background for the 1200px layout; 249,751 bytes including metadata                  |
| [sakura-background-1280.png](../apps/web/public/images/components/sakura-background-1280.png) | 1280 × 3975 | Mature renderer background for the 1280px layout; 268,080 bytes including metadata                  |
| [sakura-background-1920.png](../apps/web/public/images/components/sakura-background-1920.png) | 1920 × 4173 | Mature renderer background for the 1920px layout; 456,800 bytes including metadata                  |
| [sakura-petal.png](../apps/web/public/images/components/sakura-petal.png)                     | 1254 × 1254 | AI-generated single-petal shader texture with native alpha and its exact generation prompt embedded |
| [sakura-leaf.png](../apps/web/public/images/components/sakura-leaf.png)                       | 1254 × 1254 | AI-generated leaf shader texture with native alpha and its exact generation prompt embedded         |
| [sakura-bark.png](../apps/web/public/images/components/sakura-bark.png)                       | 1254 × 1254 | AI-generated opaque bark shader texture with its exact generation prompt embedded                   |

The JPEGs were captured on 2026-11-17 and include embedded renderer provenance.
They remain visible while a shader loads or fails. Their filenames distinguish
the current materials from retired image-optimizer cache entries.

The Gallery and Image Focus PNGs carry their original export provenance. They
are runtime fallbacks, not unused mockups. Normal Gallery and Image Focus previews render
the same photo elements for their resting and animated states; these PNGs are
used when a preview fails.

The final background images were exported from the mature WebGL renderer at
DPR 1 in 600px-high slices, then assembled into transparent page images. Native
alpha and embedded renderer provenance were verified for all four. A `picture` element
selects the 1200, 1280, 1440, or 1920px variant at viewport thresholds of 1240,
1360, and 1680px; only the selected image loads.

The runtime canvas remains viewport-sized and uses a 1,250,000-pixel budget.
The full-page images are static fallbacks. The current rebuild replaces the earlier rectangle-routed composition and
workflow-gap branch with an authored continuous parent and unequal lateral
flowering branches. Mature exports use the final live composition at
each desktop width, including the rounded parent returns and single outward
first-branch junction. Neither the live shader nor the posters use erasure
masks to conceal disconnected wood.
The replaced `sakura-branch-v2.png` is outside `public/`, retained only in
`.impeccable/review/sakura-background-2026-11-17/retired/`.
The earlier `sakura-branch.png` was also moved out of `public/` into ignored
`before-rebuild` review evidence.
The superseded `scroll-bloom-cover.png` was moved out of `public/` into ignored
historical review evidence; no runtime reference remains. The intermediate
`sakura-cover.png` was also removed from runtime assets. The current provenance
scan covers all fourteen shipping raster assets, including all four backgrounds,
with no missing source information. Export measurements are recorded in
`.impeccable/review/sakura-composition-2026-11-17/exports.json`. Final reduced-motion
and context-loss/recovery checks passed after export; the temporary export route
was removed.

The three sakura material PNGs were generated with the built-in image-generation
tool for naturalistic surface detail. They are AI-generated material, not
photographs. Their exact generation prompts are embedded in the PNGs. Petal
and leaf images carry native alpha; the bark image is opaque. The renderer loads
these local images and maps them onto the animated geometry; no external image
service is needed at runtime.

## Showcase images

The homepage and catalogue use these supplied JPEGs from
`apps/web/public/images/showcase/`. The original files had `.png` names despite
containing JPEG data; extensions were corrected without re-encoding. Embedded
origin comments record the supplied filenames. Original generation prompts were
not provided.

| File                                                                    | Dimensions | Content                              | Original filename |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------ | ----------------- |
| [lounge-chair.jpg](../apps/web/public/images/showcase/lounge-chair.jpg) | 1376 × 768 | Metal armchair with green upholstery | `generated.png`   |
| [ceramic-vase.jpg](../apps/web/public/images/showcase/ceramic-vase.jpg) | 1376 × 768 | Light ceramic vase                   | `generated-1.png` |
| [table-lamp.jpg](../apps/web/public/images/showcase/table-lamp.jpg)     | 1376 × 768 | Metal dome table lamp                | `generated-2.png` |

The FORM Objects scene is a furniture website example, not a customer claim.

## Naming and maintenance

- Use lowercase English filenames with hyphens and the correct image extension.
- Name reusable assets by subject or effect, without generic export counters.
- Preserve embedded source information when updating a shipping asset.
- Update this index and runtime references when adding, replacing, or moving assets.
