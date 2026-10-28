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
`CardShell`, `Stack`, `Cluster`, `Grid`, and `Container` equivalents. Presentational
primitives emit the same semantic classes and data slots as Astro; project CSS
still owns palette and visual identity. Interactive components belong to the
consuming project and its selected upstream library. Wrap a chosen React
component locally, pass serializable props, and hydrate it inside an Astro-owned
frame:

```astro
---
import ProjectIsland from "../components/ProjectIsland";
---

<ProjectIsland client:visible />
```

Use `client:visible` or `client:idle` by default. Use `client:load` only when the
interaction must be available immediately.

### Experimental island removal (unreleased)

The experimental `Carousel`, `Dialog`, `Menu`, and `Tabs` exports and their
associated prop/item types have been removed, along with the `carousel`,
`dialog`, `menu`, and `tabs` framework registry entries. Stable Astro primitives
and the eight React presentational primitives above remain available. The test
suite uses a fixture-only counter to verify React hydration; it is not a public
component or replacement API.

Before upgrading a consumer, audit its imports from
`@spark-line/web-framework/react` and references to the removed registry IDs.
Choose replacements for the actual interaction and migrate props, composition,
keyboard behavior, focus, and styling explicitly. No drop-in replacement is
shipped. Keep existing React consumers as React components and hydrate them as
islands in Astro; do not mechanically port them to Astro or plain JavaScript.
React Bits components always remain React islands, including `-TS-CSS` variants.

[Nimbus](https://nimbus-docs.com/registry/) and
[Lumos for Astro](https://lumosframework.com/docs/) provide Astro-native options
for Astro consumers; [Kumo](https://kumo-ui.com/) provides React controls. Select
and validate an upstream component before adopting it. This package does not
install those libraries or add a second CSS foundation.

This is a breaking API change for consumers of the removed experimental
exports. Existing published versions are unchanged. Publish only as part of a
new breaking release (at least `0.3.0`), not as a `0.2.x` patch.

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

## Nimbus and Lumos foundation (0.3.0 candidate)

New static sites can use the nine source-pinned Astro components from `@spark-line/web-framework/lumos` with `styles/lumos.css`. Nimbus keeps publishing/content/metadata ownership; Spark keeps contracts and provenance. See [the Lumos integration and source notices](src/lumos/README.md). Legacy entry points remain available; choose one CSS foundation per site. No package publication is performed by this change.
