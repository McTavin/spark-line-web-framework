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
npm install @spark-line/web-framework@0.2.0
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
5. Create and register a component only for new structure or behavior.
6. Add every meaningful state to the component gallery.

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
unlinked and includes `noindex, nofollow`. Register every new component and
show every meaningful state before considering it reusable.

## v14.23 guidance

Executable code comes from npm. Reviewed workflow and project canon come from
the existing v14.23 MCP endpoint through the `web_framework` module. UI work
requests both `design_authoring` and `web_framework`; structural-only work may
request `web_framework`. Version drift is advisory and must never edit
dependencies automatically.

## Development and release

```sh
npm ci
npm run check
npm test
npm run pack:artifact
npm run test:fixtures
npm run test:browser
npm run pack:inspect
```

`pack:artifact` creates the single release tarball. Fixture tests, inspection,
and publication all use that same file rather than silently repacking it.
Releases are immutable. Tag the exact verified commit as `v0.2.0`; the included
workflow publishes the verified tarball with npm provenance.
