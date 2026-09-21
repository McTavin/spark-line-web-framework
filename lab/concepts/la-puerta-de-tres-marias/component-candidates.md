# Candidate components and motion patterns

Promotion candidates observed in this concept. Nothing here is registered in the framework catalog, moved into `src/astro/`, or stabilized. Registration (per `skills/spark-line-web-framework/SKILL.md`) requires ID, kind, composition role, variants, experimental-or-stable status, exact provenance and at least one meaningful scenario, plus repeated verified usefulness or an explicit owner choice. That decision is the owner's, not this concept's.

## 1. MemoryRail (from `src/components/CazuelaRow.astro`)

- What it does: ARIA tablist where each tab is an illustrated object plus label, selecting swaps a quote panel with a direction-aware crossfade; horizontal scroll-snap rail on touch, full Arrow/Home/End/Escape keyboard support.
- Evidence it works: scripted probe passes at 1440 px and 390 px (click, ArrowRight, End, focus-after-pointer, panel/aria sync); no sub-16px text; captures in `/tmp/la-puerta-skill/check5/`.
- Generalization cost: moderate. The pot SVG, clay palette and Spanish copy are concept-owned; the tablist state machine, snap rail and panel-swap timing are the reusable shell. Would need a slot-based item model and a neutral default visual.
- Risk: as a pattern it is a themed tablist; the framework already ships tabs-adjacent primitives, so the case for registering rests on the object-as-tab + attribution panel combo, not the a11y plumbing.

## 2. Occluded-name hero (from `src/pages/index.astro` hero block)

- What it does: oversized display name with a row of illustrated objects overlapping its baseline; the occluded text stays live, selectable, and on one semantic line inside the `h1`. Entrance is a staggered CSS keyframe sequence (`hero-warm`, `name-rise`, `pot-rise`), settled state is the static render.
- Evidence it works: verified at 1440/768/390 (mobile drops to three pots, `clamp(72px, 21vw, 118px)`, no overflow, subtitle clear of the pots).
- Generalization cost: high. This is a composition recipe, not a component: stage wrapper, absolute pot row at `inset-block-end` with a translate, per-viewport hide rules. Worth a `references/` note in the framework skill before any component exists.

## 3. Scroll-driven exit handoff (M2)

- What it does: `animation-timeline: view()` maps hero decoration travel + fade to scroll exit, wrapped in `@supports` and `prefers-reduced-motion: no-preference`; unsupported browsers get the settled static state by design (contract reconciled in DESIGN.md).
- Evidence it works: computed transform moves +34.6 px to −5.5 px and opacity 1 → 0.55 between 20 % and 70 % hero scroll; reduced-motion context renders statically.
- Generalization cost: low as a utility (a `data-slf-scroll-exit` style attribute on any decorative element), if the owner wants scroll-driven motion governed at all.

## 4. Missing-asset presentation tile (from `src/pages/presentacion.astro`)

- What it does: a hatched ∅ frame that states, on the asset itself, that no official source existed at a dated investigation timestamp, instead of standing in a fake image.
- Evidence it works: `/tmp/la-puerta-skill/check5-pres/` at 1440/390.
- Generalization cost: small. `VisualFrame` plus a documented "unverified asset" treatment (caption contract + hatch pattern) could serve every concept that lacks licensed imagery.

## 5. Framework fit notes (no new component)

- `Section theme="inverse"` reads `--project-surface-inverse`, not a concept custom property; the concept added that token rather than overriding section internals. Worth recording in the framework docs if not already explicit in `contracts.md`.
- `Action variant="quiet"` renders at inherited button font size; the concept had to set `font-size: 1rem` on its own controls to hold the 16 px floor. A floor guarantee inside `foundation.css` would remove that per-project step.
- Inverse/accent/quiet theme banding, `Container` widths and `Heading` levels carried the whole page without modification; no framework change is requested by this concept.
