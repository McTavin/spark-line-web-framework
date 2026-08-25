# Interface QA checklist

## Evidence

- Capture the current rendered baseline before restructuring.
- Compare against the actual reference at the same viewport.
- Preserve approved copy, URLs, assets, states, and route behavior.

## Target and neighbors

Verify the changed section, previous section, and next section together:

- independent theme and background;
- intended seam or separation;
- no unexplained gap;
- no accidental overlap;
- no clipping of focus or content;
- no cross-section selector effects;
- correct normal-flow movement after height changes.

## Responsive

Use the project's required viewport matrix when it exists. Otherwise choose the
smallest set that crosses the breakpoints affected by the diff:

- start with one wide desktop and one narrow mobile;
- add 1024px or 834px when tablet behavior changed;
- add 320px when minimum-width, wrapping, overflow, or touch-target risk exists;
- use the complete matrix only for breakpoint-system changes, explicit
  acceptance criteria, or the full Publish profile.

At each selected width verify:

- no horizontal document overflow;
- correct DOM and visual order;
- readable measures and type;
- minimum 44px interactive targets on touch layouts;
- visual frames reserve their complete space;
- component variants reflow without content loss.

## Interaction and accessibility

For controls changed by the diff:

- operate them by keyboard;
- keep focus visible;
- confirm relevant ARIA labels, relationships, expanded state, and live regions;
- confirm Escape and focus return for changed overlays;
- confirm native anchors and history behavior when affected;
- confirm reduced motion removes changed nonessential movement;
- confirm React hydration adds behavior without shifting the Astro layout.

Do not retest unrelated controls solely because they share the route.

## Completion

- Run the repository's changed-surface or risk-selected verification plan.
- Do not independently repeat successful build, unit, fixture, browser, or
  unchanged-route checks for the same SHA.
- Run unchanged-route regression only when the selected risk profile requires
  it or the change affects shared layout, navigation, tokens, or browser runtime.
- Add or update a component-gallery scenario only for a reusable component whose
  states or contract changed.
- Report with this fixed schema:

  - `Changed surface`: route, section or component, and project registry ID.
  - `Registry/gallery`: registry path plus scenarios added or reused.
  - `Neighborhood`: predecessor, target, successor, and their seam result.
  - `Viewports`: each selected width, why it was selected, and pass/fail result.
  - `Behavior`: affected anchors, keyboard, focus, hydration, and reduced motion.
  - `Checks`: authoritative profile, exact SHA, and checks actually run.
  - `Reused evidence`: successful unchanged-SHA evidence reused, or `none`.
  - `Deviations`: exact component, viewport, evidence, and next action; write
    `none` only when every selected check passed.

Preview evidence is optimized for review and uses targeted checks. Complete
browser, accessibility, and responsive assurance belongs to one full Publish
profile for the unchanged candidate unless risk classification requires it
earlier.
