# Curated Lumos source

Source: [lumos-for-astro](https://github.com/lumosframework/lumos-for-astro/tree/e9c07d2e59bc5fe6275b7b795f482661af0acff0), template 1.0.1, MIT © 2026 Timothy Ricks. This is a selected source integration, not the upstream scaffold installer. Keep LICENSE and PROVENANCE.json with redistribution. The provenance file records every upstream Git blob, local SHA-256 and adaptation; it includes the import/asset/style closure.

```astro
---
import { Section, Heading, Paragraph } from '@spark-line/web-framework/lumos';
import '@spark-line/web-framework/styles/lumos.css';
---
<Section aria-labelledby="intro">
  <Heading tag="h1" id="intro">Project title</Heading>
  <Paragraph>Project content.</Paragraph>
</Section>
```

Import this stylesheet once. Its cascade is `base, patterns, components, utilities`; project token overrides belong in `base` and component styling in `components`. Do not also import legacy `foundation.css`, the Nimbus full docs theme, Tailwind preflight or Kumo's global stylesheet. An island does not isolate global CSS.

Supply `--sl-surface`, `--sl-surface-raised`, `--sl-surface-muted`, `--sl-ink`, `--sl-ink-subtle`, `--sl-ink-muted`, `--sl-accent` and `--sl-on-accent`. These replace upstream sample swatches; system colors are the neutral fallback. Type, site width, gutters and spacing remain Lumos variables, overridden by each project. Body overflow is intentionally visible so invalid layouts are not concealed.

Exports: Section, ContentWrapper, Grid, Heading, Paragraph, Eyebrow, RichText, Button and Card. `lumosRegistry` and `createLumosCatalogManifest` record the curated variants and their gallery. Broader upstream type options remain source-compatible, but breakout/sticky/card ContentWrapper modes and icon-only Button modes need project-specific accessibility/layout review before adoption. Section includes its own container; do not nest a legacy Spark Container. Background-slot content must be decorative; reserve media dimensions. Card cover/stacked visuals reserve their frame in CSS.

Astro owns sections, typography, surfaces and layout. Nimbus owns content compilation/publishing and NimbusHead in the complete site starter. Spark owns registry, provenance, projections and QA. Existing `./astro` and `./react` consumers retain their previous APIs; their foundation is an alternative per site, not a second reset. Carousel, Dialog, Menu and Tabs are not restored.

React stays optional. Use a real React component with an Astro `client:*` directive inside Section when interaction calls for it; no porting React Bits into Astro or plain JavaScript. Prefer `client:visible` or `client:idle`, using `client:load` only when immediate interaction warrants it. Pass serializable props. The packed React fixture verifies hydration through Lumos's slot helper. Projected MDX in the site starter currently registers only the MDX server renderer, so React in projected MDX requires a separate integration and reading contract.

The upstream template asks for Astro ^7.4.2 and TypeScript ^6.0.3. This selected surface is tested in the package's locked Astro fixtures and in the starter on Astro 7.3.1 / TypeScript 5.9.3; this is not a compatibility claim for the whole template or all Astro versions in the legacy peer range. No template manifest/dependency upgrades are copied.

Card's `heading`, `text` and `eyebrow` strings intentionally accept HTML upstream. Supply trusted authored/sanitized content only. Image URLs and markup need the host's content policy. Button supplies native semantics; it does not implement dialog/menu/tab state. Preserve keyboard focus, 44px targets, reduced motion and no-JavaScript content. Reading mappings are host-specific; do not claim generic Markdown equivalence for every visual component.

Release boundary: 0.3.0 includes the already-approved removal of public experimental APIs. This branch prepares that version but does not publish it. The starter may review an exact packed candidate before a separately approved release; replace that candidate with the published exact version before treating it as a released dependency.
