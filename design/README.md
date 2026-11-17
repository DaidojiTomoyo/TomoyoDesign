# Website asset index

Retired page mockups, duplicate design exports, and unused shader preview PNGs
were removed at the user's request on 2026-11-17. Current code, `DESIGN.md`, and
the approved page plans are the development baseline. Old design documents are
not required to implement or review future changes.

Implementation screenshots and historical verification reports remain in
`.impeccable/review/`; they document the built website rather than provide new
page specifications. The [catalogue plan](plans/components-catalog.md) retains
confirmed scope and interaction decisions.

## Component preview assets

Website assets live in `apps/web/public/images/components/`, served under
`/images/components/`. Keep the following files: all four are referenced by
`apps/web/lib/catalog.ts` and used by `components/catalog/catalog-preview.tsx`.

| File                                                                                          | Dimensions | Use and source                                                               |
| --------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| [liquid-chrome-preview.jpg](../apps/web/public/images/components/liquid-chrome-preview.jpg)   | 854 × 534  | Actual `MetallicText` catalogue renderer, elapsed time 0, light `(0.5, 0.5)` |
| [beveled-tunnel-preview.jpg](../apps/web/public/images/components/beveled-tunnel-preview.jpg) | 854 × 534  | Actual `SpatialTunnel` catalogue renderer, centered view, elapsed time 0     |
| [hover-gallery.png](../apps/web/public/images/components/hover-gallery.png)                   | 854 × 508  | Gallery failure fallback, originally exported from the supplied design       |
| [image-focus.png](../apps/web/public/images/components/image-focus.png)                       | 854 × 508  | Image Focus failure fallback, originally exported from the supplied design   |

The JPEGs were captured on 2026-11-17 and include embedded renderer provenance.
They remain visible while a shader loads or fails. Their filenames distinguish
the current materials from retired image-optimizer cache entries.

The two retained PNGs carry their original export provenance. They are runtime
fallbacks, not unused mockups. Normal Gallery and Image Focus previews render
the same photo elements for their resting and animated states; these PNGs are
used when a preview fails.

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
Official Next.js starter assets remain in `apps/web/public/`.

## Naming and maintenance

- Use lowercase English filenames with hyphens and the correct image extension.
- Name reusable assets by subject or effect, without generic export counters.
- Preserve embedded source information when updating a shipping asset.
- Update this index and runtime references when adding, replacing, or moving assets.
