---
name: spark-line-web-framework
description: Inspect, reuse, create, refactor, and verify Spark Line interfaces built with Astro, optional Sanity content, and React islands using the @spark-line/web-framework contracts. Use for page or section design changes, component creation, screenshot or source-faithful implementation, responsive layout corrections, component-gallery work, section adjacency bugs, or frontend architecture decisions in this stack.
---

# Spark Line Web Framework

Use `@spark-line/web-framework` for structural contracts. Keep project identity,
content, and approved visual decisions in the project's v14.23 context.

## Start with governed context

1. Read the repository instructions and `v1423.project.json` when present.
2. Follow the repository's required v14.23 handshake exactly.
3. Request `context_modules: ["design_authoring", "web_framework"]` for visual
   or copy work. Request `["web_framework"]` for purely structural frontend work.
4. Treat framework-version drift as advisory. Never edit dependencies
   automatically.
5. If governed context is unavailable, record the repo-visible fallback required
   by the repository instructions and continue from local evidence.

Do not create a competing design-canon file.

## Inspect before designing

Before editing:

1. Inspect the actual rendered interface, repository implementation, supplied
   export, and component registry.
2. Open the component gallery when it exists.
3. Identify the target section plus its immediate predecessor and successor.
4. Record the target contract:
   - theme;
   - container width;
   - top and bottom spacing;
   - layout variant;
   - reserved visual dimensions;
   - Astro, Sanity, and React ownership boundaries.

When a reference points to an existing site component, use its real structure
and approved tokens. Do not approximate it from memory.

## Source components in this order

1. Reuse an exact registered component.
2. Add a typed variant when structure, semantics, and behavior are unchanged.
3. Compose registered primitives.
4. Create a component only for genuinely new structure or behavior.
5. Register every new component with ID, kind, approved variants, status,
   provenance, and at least one catalog scenario.
6. Add every meaningful state to the component gallery.

Read [contracts.md](references/contracts.md) before changing section composition.
Read [stack-boundaries.md](references/stack-boundaries.md) when Sanity or React
is involved.

## Implement within ownership boundaries

- Let Astro own page composition, sections, surfaces, containers, spacing, and
  presentational markup.
- Let React own interactive state only. Pass serializable data and keep the
  island inside an Astro-owned frame.
- Let Sanity store content and controlled variant values. Do not store arbitrary
  CSS classes or page markup.
- Use project-supplied semantic tokens. Do not introduce a package palette.
- Use `VisualFrame` for floating or absolutely positioned visuals and reserve
  their dimensions before they load.
- Use `SectionGroup` for intentional joined seams or overlaps.
- Preserve native semantics, keyboard behavior, visible focus, and reduced
  motion.

## Verify the changed neighborhood

Run the checklist in [qa-checklist.md](references/qa-checklist.md). At minimum:

1. Inspect the changed section and both adjacent sections at desktop, tablet,
   and narrow mobile widths.
2. Check seam, gap, overlap, overflow, theme inheritance, DOM order, anchor
   behavior, and hydration boundaries.
3. Confirm the changed section may move its successor in normal flow but does
   not style or reposition it.
4. Run existing builds and tests plus the repository's browser checks.
5. Run `scripts/audit_layout.mjs <paths...>` as an advisory static scan.
6. Report any deviation; do not silently reinterpret it as an exception.
