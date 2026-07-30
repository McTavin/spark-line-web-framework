# Structural contracts

## Component lookup

Use this decision sequence:

1. Exact registry match.
2. Typed variant of the same semantics and behavior.
3. Composition from primitives.
4. New registered component.

A visual resemblance alone does not justify a new component. A new semantic
role, DOM structure, interaction model, or content contract does.

## Section boundary

`PageFlow` introduces no implicit section gap.

Each `Section` owns:

- its background and semantic theme;
- its top and bottom internal spacing;
- its optional contained or full-width presentation;
- its anchor identifier.

`Container` owns maximum width, centering, and inline gutters. Child layout
components own internal grid or flex behavior only.

Do not put external block margins on a section root. Do not use sibling
selectors to reach from one section into another. Do not use ordinary negative
margins to repair page flow.

Changing a section may change its height and move subsequent content naturally.
It must not change the next section's theme, spacing, width, grid, or stacking
order.

## Joined compositions

Use `SectionGroup` when two or more sections deliberately:

- share a background;
- overlap;
- visually join without an independent seam;
- participate in one sticky or pinned composition.

Review every grouped member together. Do not simulate a group by reaching into
siblings from page-level CSS.

## Floating visuals

Use `VisualFrame` around absolutely positioned, floating, animated, or
late-loading artwork.

Provide one of:

- an aspect ratio;
- a minimum reserved block size;
- a project component that establishes both dimensions.

The frame owns clipping and container-query context. The visual cannot create
unreserved document height or cover the following section by accident.

## Registry record

Register:

- stable component ID;
- `primitive`, `section`, `island`, or `pattern` kind;
- approved variants;
- `stable`, `experimental`, or `deprecated` status;
- provenance;
- at least one component-gallery scenario.

Do not call a component reusable until its relevant responsive, focus, empty,
loading, error, and reduced-motion states are represented where applicable.
