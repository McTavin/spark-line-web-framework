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
2. Look for the project registry at `src/framework/registry.ts`. Honor an
   existing documented project path when one is already established. The
   package's `frameworkRegistry` covers framework primitives; it does not
   replace the project registry.
3. Open `src/pages/style-guide.astro` when it exists.
4. Project components may ship project-owned without catalog ceremony. Register
   one when reuse is intentional, it is encountered again, or the owner selects
   it for future discovery.
5. Identify the target section plus its immediate predecessor and successor.
6. Record the target contract:
   - theme;
   - container width;
   - top and bottom spacing;
   - layout variant;
   - reserved visual dimensions;
   - Astro, Sanity, and React ownership boundaries.
7. When a catalog match declares a content profile, treat its model IDs as
   compatibility metadata. Retrieve actual CMS records through the project's
   authenticated content path, never through the component catalog.

When a reference points to an existing site component, use its real structure
and approved tokens. Do not approximate it from memory.

## Source components in this order

1. Reuse an exact registered component.
2. Add a typed variant when structure, semantics, and behavior are unchanged.
3. Compose registered primitives.
4. Create a component only for genuinely new structure or behavior.
5. When registering, include ID, kind, composition role, variants, experimental
   or stable status, exact provenance, and at least one meaningful scenario.
6. Stability requires relevant verification and owner approval. Universal
   promotion requires repeated verified usefulness or an explicit owner choice;
   it is never automatic.
7. Add meaningful states to the component gallery for registered components.

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
- Keep component code Git-authoritative. A CMS-backed component consumes a
  typed project view model; individual product or service records are not
  components.
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
5. Resolve this installed skill's directory from the loaded `SKILL.md`, then
   run `node "<skill-root>/scripts/audit_layout.mjs" <paths...>` as an
   advisory static scan. Do not resolve the script relative to the consumer
   repository.
6. Report results with the fixed schema in `qa-checklist.md`. Report every
   deviation; do not silently reinterpret one as an exception.

For repository delivery, Save performs Git protection only. Preview should
reach a reviewable immutable deployment quickly with the repository's targeted
checks. Publish runs the complete verification profile against that unchanged
candidate before production moves. Do not describe a Preview as fully verified
unless the repository intentionally used its full fallback profile.
