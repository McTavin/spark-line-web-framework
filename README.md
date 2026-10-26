# `@spark-line/web-framework`

Structural UI contracts for Astro pages, optional React islands, and optional
Sanity section data.

This package adapts the durable parts of the Lumos method—tokens before
components, explicit containment, fluid layout, registered variants, and
reserved visual space—to the Spark Line web stack. It does not include a
universal visual identity, generated site CSS, or a Webflow/global browser
runtime. React JavaScript ships only when a consumer imports and hydrates an
island.

## Install

Pin an exact version while the API is young:

```sh
npm install @spark-line/web-framework@0.2.1
```

Astro is required. React, React DOM, and Sanity are optional peer dependencies
and are only needed when their respective exports are used.

```astro
---
import "@spark-line/web-framework/styles/foundation.css";
import {
  Action,
  Heading,
  PageFlow,
  Section,
  Stack,
  Text,
  VisualFrame
} from "@spark-line/web-framework/astro";
---

<PageFlow>
  <Section theme="default" spaceTop="lg" spaceBottom="lg">
    <Stack gap="md">
      <Heading level={1} size="display">Project-owned design</Heading>
      <Text size="lead">Framework-owned structure.</Text>
      <Action href="/projects">View projects</Action>
      <VisualFrame aspectRatio="16 / 9">
        <slot name="visual" />
      </VisualFrame>
    </Stack>
  </Section>
</PageFlow>
```

Define project tokens after the foundation stylesheet. The package deliberately
uses semantic slots rather than a palette:

```css
:root {
  --project-surface-default: Canvas;
  --project-text-default: CanvasText;
  --project-action-background: CanvasText;
  --project-action-foreground: Canvas;
  --project-type-display: clamp(3rem, 8vw, 7rem);
}
```

## Section contract

- `PageFlow` introduces no implicit gap.
- Every `Section` owns its background, theme, and both internal vertical edges.
- `Container` owns maximum width and inline gutters.
- Child layouts own only their internal grid or flex behavior.
- Section roots do not use external margins or selectors that style siblings.
- A changed section may move the following section in normal flow, but may not
  change that section's spacing, theme, width, or layout.
- Joined seams and deliberate overlaps use `SectionGroup`.
- Floating or absolutely positioned artwork uses `VisualFrame` with a reserved
  aspect ratio or block size.

## Component sourcing order

1. Inspect the real implementation and the component registry.
2. Reuse an exact registered component.
3. Add a typed variant when semantics and behavior are unchanged.
4. Compose existing primitives.
5. Create a project-owned component only for new structure or behavior.
6. Register it when reuse is intentional, repeated, or explicitly requested;
   new reusable entries begin experimental.

The registry is available from `@spark-line/web-framework/registry`.

## React primitives and islands

The React export contains presentational `Action`, `Heading`, `Text`,
`CardShell`, `Stack`, `Cluster`, `Grid`, and `Container` equivalents plus the
reference `Tabs`, `Carousel`, `Dialog`, and `Menu` islands. Presentational
primitives emit the same semantic classes and data slots as Astro; project CSS
still owns palette and visual identity. Props for hydrated islands are
serializable data.

```astro
---
import { Tabs } from "@spark-line/web-framework/react";
---

<Tabs
  client:visible
  label="Project sections"
  items={[
    { id: "context", label: "Context", content: "Approved source material." },
    { id: "proof", label: "Proof", content: "Verified outcomes." }
  ]}
/>
```

Use `client:visible` or `client:idle` by default. Use `client:load` only when the
interaction must be available immediately.

## Exact-ref catalog manifests

`@spark-line/web-framework/catalog` provides the framework-neutral catalog
schema, validation, deterministic serialization, and the seeded Astro/React
system manifest builder. A catalog entry records framework, kind, variants,
scenarios, status, assets, optional package export and lineage, plus an exact
Git repository, repository-relative path, and 40-character commit SHA.

Catalog manifests also declare `@spark-line/web-framework/layout-v1` once.
Each component references that profile with a small composition contract:
`role` states what the component owns and `exceptions` records deliberate,
reviewable departures. The profile keeps section, container, child-layout,
surface, content, and control responsibilities consistent without supplying a
palette or turning component composition into a layout DSL.

CMS-capable projects may also declare the optional
`@spark-line/web-framework/sanity-v1` content profile. A component binding names
project-defined typed view models, not individual CMS documents:

```ts
{
  content_profiles: [WEB_FRAMEWORK_SANITY_PROFILE],
  components: [{
    // component metadata...
    content: {
      profile: WEB_FRAMEWORK_SANITY_PROFILE_ID,
      models: ["product", "service"]
    }
  }]
}
```

Content bindings are compatibility metadata. Component source remains exact-ref
Git authority, while CMS records retain their own document and revision
identity outside the component catalog.

```ts
import {
  createFrameworkCatalogManifest,
  serializeCatalogManifest
} from "@spark-line/web-framework/catalog";

const manifest = createFrameworkCatalogManifest({ commit: process.env.GITHUB_SHA });
const json = serializeCatalogManifest(manifest);
```

Repository CI runs `npm run catalog:export -- --commit "$GITHUB_SHA"`. The
export fails when the commit or any declared source path is unavailable.

## Sanity adapter

The Sanity export has no runtime import from `sanity`. It provides typed
registry, normalization, and schema-shape helpers while keeping the peer
optional.

```ts
import {
  defineSectionRegistry,
  normalizePageSections
} from "@spark-line/web-framework/sanity";

const registry = defineSectionRegistry([
  {
    type: "heroSection",
    componentId: "hero",
    themes: ["default", "inverse"],
    spaces: ["none", "sm", "md", "lg", "xl"],
    layouts: ["split", "centered"]
  }
]);

const sections = normalizePageSections(document.sections, registry);
```

`_type`, `_key`, Portable Text, references, asset data, and preview metadata
remain on `props` and the original record remains available as `source`.
Unknown section policy is explicitly `omit`, `preserve`, or `throw`.

## Component gallery

Copy `starter/astro/src/pages/style-guide.astro` into a project. The route is
unlinked and includes `noindex, nofollow`. Register intentionally reusable
components and show meaningful states before requesting stable status.

## v14.23 guidance

Executable code comes from npm. Reviewed workflow and project canon come from
the existing v14.23 MCP endpoint through the `web_framework` module. UI work
requests both `design_authoring` and `web_framework`; structural-only work may
request `web_framework`. Version drift is advisory and must never edit
dependencies automatically.

## Optional reader (prerelease)

`@spark-line/web-framework/reader` exports `ReaderDialog`. It is an Astro component with a small standalone browser enhancer; it does not require React, Nimbus, a Markdown parser, or the global foundation stylesheet. It is an experimental catalog entry in `0.2.2-reader.0`, not an npm release.

```astro
---
import { ReaderDialog } from '@spark-line/web-framework/reader';
// The host prepares and sanitizes its published article body at build time.
const { title, html, markdownUrl } = preparedArticle;
---
<ReaderDialog id="article-reader" title={title} lang="en" markdownUrl={markdownUrl}>
  <Fragment set:html={html} />
</ReaderDialog>
```

The slot is the prepared body, without a second title. Pass only trusted sanitized HTML, for example from `prepareReaderDocument` in the existing content-projection package. This UI does not sanitize a slot or execute Markdown/MDX. Give the dialog and prepared content distinct page-scoped IDs. The host owns public/draft gating, route opt-in, canonical metadata and the direct Markdown URL.

The trigger stays hidden without JavaScript, with a direct Markdown link as fallback. A rendered component loads its own CSS/module URLs; omit it to omit those resources. Native dialog supplies modality, focus containment and Escape. The enhancer lazily mounts the inert template, restores focus/scroll on close, focuses internal anchors, and cleans up when a client router removes its custom element. Tables and code get labeled keyboard-scrollable regions. Other links retain normal navigation. No history entry, alternate route, stored preference or reader canonical is created.

`labels` overrides `open`, `close`, `markdown`, `mode`, `table` and `code`; `lang` belongs to the article. Optional CSS properties: `--reader-paper`, `--reader-ink`, `--reader-accent`, `--reader-font`, `--reader-size`. Check contrast after customization. Controls wrap; layout accommodates dynamic viewports, safe areas, large text and reduced motion.

Packed Astro-only/React fixtures and Chromium keyboard/axe checks cover this export. The starter adds generated-Markdown parity, hidden-page cleanup, mobile/large-text/spacing and navigation/teardown checks. Manual assistive-technology and Safari/Firefox review remain useful before a client release.

## Development and release

```sh
npm ci
npm run verify:changed
npm run verify:full
```

`verify:changed` selects boundary-relevant fixtures and browser coverage.
`verify:full` builds once and produces one SHA-bound release-candidate bundle
with the tarball, catalog, dependency resolution, digests, browser evidence,
and screenshots. The publish job downloads and verifies that candidate, uses
npm Trusted Publishing, polls registry integrity, and creates `v0.2.1` only
after the registry matches.
