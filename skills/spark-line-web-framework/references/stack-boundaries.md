# Astro, Sanity, and React boundaries

## Astro

Default to Astro for:

- page and section composition;
- semantic content markup;
- surfaces, containers, and spacing;
- static cards, headings, actions, and disclosures;
- server or build-time data mapping.

Use slots for open components whose child structure is intentionally flexible.
Use typed props for closed components with a fixed content contract.

## React islands

Use React only when persistent client state or interaction justifies hydration.

- Keep the Astro-owned section and visual frame outside the island.
- Accept serializable props.
- Keep state, effects, and event handling local.
- Default to `client:visible` or `client:idle`.
- Use `client:load` only when interaction must work immediately.
- Support semantic roles, ARIA relationships, keyboard operation, focus return,
  and reduced motion.

Do not let an island set page-level theme, section padding, container width, or
adjacent-section layout.

## Sanity

Map Sanity `_type` values to registered Astro section IDs.

Keep page composition in code and normalize Sanity documents through one typed
view-model layer shared by published and authenticated draft rendering. CMS
records such as products and services keep their document identity and revision
outside the component catalog.

Preserve:

- `_key`;
- record order;
- Portable Text;
- references and asset provenance;
- preview and Stega metadata;
- the original source record for visual editing.

Keep Stega metadata in editable text nodes. Clean encoded values before using
them in attributes, URLs, identifiers, comparisons, or application logic. Give
composed fields stable edit targets, and suppress text splitting or
layout-altering motion only in authenticated draft preview.

Localized array values use stable `_key` values plus an explicit language field.
Treat CMS publishing and repository publishing as separate release boundaries.

Expose constrained enums for theme, spacing, and layout. Do not expose arbitrary
CSS classes or freeform page markup.

Choose unknown-section behavior explicitly:

- `omit` for resilient production rendering;
- `preserve` for preview tooling and diagnostics;
- `throw` for strict tests and migrations.

Do not install Sanity into a project that does not use the Sanity export.
