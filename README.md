# TomoyoDesign

A pnpm workspace managed by Turborepo, with a Next.js App Router website.

## Requirements

- Node.js 24 (see `.nvmrc`)
- pnpm 12.18.0 (pinned in the root `package.json`)

## Getting started

Run these commands from the repository root:

```sh
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The website uses the official `create-next-app@16.4.6` App Router template with
TypeScript, ESLint, and Tailwind CSS. The English homepage builds on that template
with four component demos: Spatial Tunnel, Metallic Text, Hover Gallery,
and Image Focus, plus a page-wide Scroll Bloom animation. Current code and [DESIGN.md](DESIGN.md) define the
approved visual baseline; retired mockups have been removed. It is desktop-only, with a 1200px
minimum document width and no phone or tablet reflow. See the
[asset index](design/README.md) for website image sources.

UI icons use Lucide React, with the official GitHub SVG for its brand mark. GSAP and `@gsap/react` drive the demonstrations, with
scoped cleanup and reduced-motion handling. The hero plays automatically from a
fixed viewpoint and has an icon-only pause/play control. Its height adapts to
desktop windows between 680px and 918px.

Scroll Bloom is a cherry blossom background that grows down from the
upper-left of the document. Branches and flower clusters belong to the page,
so developed portions scroll out of view while lower branches appear. Native
scrolling controls growth and reverses it when scrolling back. The original
centered content boundary, `min(100% - 112px, 1328px)`, stays unchanged, as do
the hero and all four demonstrations. There is no flower column, pinned stage,
separate section, or additional scroll distance.

The current revision replaces rectangle-corner routing with a continuous
parent bough and unequal, tapered side branches attached at real nodes. Main
wood and compact clusters stay clear of opaque demo surfaces so white panels
do not cut apparently disconnected pieces out of the plant. Budding and
flowering use each cluster's document position and the viewport height, keeping
the unfolding stage visible during ordinary scrolling. The branches do not
thread through the workflow columns.

The viewport-sized transparent canvas draws on demand. Reduced motion and
rendering failure use one of four mature static backgrounds matching the
desktop composition. Locally served AI-generated petal, leaf, and bark textures
provide surface detail; they are not photographs. The
[sakura background plan](design/plans/homepage-sakura-background.md) records the
current implementation, validation status, and evidence limits separately from
historical review verdicts. The final revision passes 19 tests, lint/type checks,
source formatting, and its focused visual review; all four static fallbacks are
refreshed. Production build verification remains blocked by this environment’s
internal-port permissions and Google Fonts DNS access, so a successful build
is not claimed.

The [component catalogue](http://localhost:3000/components) at `/components`
lists the original four effects with English search, category filtering, and
shareable URL state. Browser navigation restores the query and category. Each card starts
with a real static preview; only the hovered or focused card loads its live
effect, with keyboard focus taking priority. Live previews stop offscreen, in a
hidden tab, or when reduced motion is enabled. Component detail pages are not yet
available, so card titles do not link to unfinished routes.
Scroll Bloom belongs to the homepage composition and is not in the catalogue.

## Workspace layout

```text
apps/
  web/                     Next.js website (@tomoyodesign/web)
    app/                   App Router pages, layout, and styles
    components/home/       Homepage navigation
    components/effects/    Four demos and the page-wide flower animation
    components/catalog/    Catalogue filtering and on-demand previews
    lib/catalog.ts         Shared component metadata and search matching
    public/                Website images and preview fallbacks
      images/showcase/     Chair, vase, and lamp images
      images/components/   Renderer covers, image fallbacks, and flower textures
design/
  plans/                   Approved page plans
  README.md                Website asset index
packages/
  typescript-config/       Shared strict TypeScript configurations
```

`apps/web` retains the official template's `tsconfig.json`. Application imports
use the `@/*` alias for the application root (`./*`); there is no `src/` folder.
The shared TypeScript configuration package remains available for future
workspace packages.

The template was generated with `--app --ts --eslint --tailwind --no-src-dir`
using pnpm. Workspace integration preserves the `@tomoyodesign/web` package name
and adds the type-checking script and zero-warning lint command used below.
Package installation and build-script settings are managed at the workspace
root, with one shared lockfile.

## Commands

| Command             | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Start workspace development servers through Turborepo |
| `pnpm dev:web`      | Start only the website                                |
| `pnpm build`        | Build workspace applications and packages             |
| `pnpm start`        | Serve the website's production build                  |
| `pnpm lint`         | Run ESLint                                            |
| `pnpm typecheck`    | Generate Next.js route types and run TypeScript       |
| `pnpm check`        | Run lint and type checking                            |
| `pnpm format`       | Format project files with Prettier                    |
| `pnpm format:check` | Check formatting without writing files                |

Prettier uses its default formatting options. The
[`prettier-plugin-tailwindcss`](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)
plugin sorts Tailwind classes using the website's Tailwind v4 entry stylesheet,
`apps/web/app/globals.css`.

Build before using `pnpm start`. Next.js builds do not run ESLint, so a complete
local verification is:

```sh
pnpm check
pnpm format:check
node --test apps/web/lib/catalog.test.mjs
node --test apps/web/components/effects/shaders/scroll-bloom-geometry.test.mjs
pnpm build
```

For reproducible installs in CI, use `pnpm install --frozen-lockfile` and run the
same checks. Commit `pnpm-lock.yaml` with dependency changes.

Turborepo caches builds and checks locally in `.turbo/`. Development servers are
persistent tasks with caching disabled. No remote cache or hosting provider is
configured.

## Extending the workspace

Homepage component-directory links now navigate to `/components`; Examples and
How to use keep their homepage section destinations. The shared catalogue header
links back to those sections. Component detail pages, installation documentation,
a source registry, authentication, and a backend remain separate follow-up work.
Each effect is isolated in
`apps/web/components/effects/` so it can move into a reusable package once its
public API is defined. The tunnel, metallic text, and Scroll Bloom use GLSL shaders
with small WebGL renderers: accelerating cobalt portals, flowing liquid chrome,
and scroll-driven cherry blossom clusters. They provide static fallbacks and
respect reduced motion. The local demos suspend rendering while offscreen or in
a hidden tab; the flower background draws only when its progress, visible page
slice, size, or resource state changes and stops in a hidden tab. The shared
header and homepage footer link to the [GitHub repository](https://github.com/DaidojiTomoyo/TomoyoDesign).

Tailwind's Turbopack loader is scoped to `globals.css`; CSS Modules use Next.js's
built-in processing. Keep module files out of the plain-CSS loader rule so their
generated class names are preserved.

- Add deployable services under `apps/` and reusable packages under `packages/`.
- Give each package a unique name and declare internal dependencies using
  `workspace:*` so pnpm and Turborepo can resolve the dependency graph.
- A shared UI library can be added when the first reusable components exist.
- Backend services and database packages can be added when their requirements
  are defined.

The website currently needs no environment variables. Keep future local secrets
in ignored `.env.local` files and commit only example files with placeholders.
When introducing environment-dependent build output, declare the relevant
variables in `turbo.json` so task caching stays correct.

## Product and design context

`PRODUCT.md` records the product brief, English-first requirement, and agreed
stack. The [asset index](design/README.md) lists website images, their sources,
and naming conventions. Retired design references are no longer required for
development. Shared Impeccable
configuration is versioned; `.impeccable/config.local.json` stays local.

[DESIGN.md](DESIGN.md) records the implemented palette, typography, layout, and
control patterns. Its machine-readable companion is `.impeccable/design.json`.
Surface briefs are versioned under Impeccable's project folders; verification
captures and local tooling state are ignored.
The [component catalogue plan](design/plans/components-catalog.md) records the
approved four-item scope, preview behavior, and follow-up detail routes.
The [sakura background plan](design/plans/homepage-sakura-background.md) records
the approved upper-left, document-bound composition, reversible growth,
centered layout, rendering limits, and fallback behavior. The earlier
[Scroll Bloom plan](design/plans/homepage-scroll-bloom.md) preserves the
right-side version's implementation and review history.

Local agent installations in `.agents/` and `.codex/` are not committed or required
to build the website. Official GreenSock skills are installed locally in `.agents/skills/gsap-core/`,
`.agents/skills/gsap-react/`, and `.agents/skills/gsap-performance/`, sourced from
[`greensock/gsap-skills`](https://github.com/greensock/gsap-skills) at commit
`aed9cfd3277740755f6bfc1155c7aa645403b760`.

## Tooling references

- [Turborepo task configuration](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks)
- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [Next.js ESLint configuration](https://nextjs.org/docs/app/api-reference/config/eslint)
- [pnpm workspace settings](https://pnpm.io/settings)
