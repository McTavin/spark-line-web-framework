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

Use the project's required viewport matrix. When none exists, include:

- wide desktop;
- 1024px tablet landscape;
- 834px tablet portrait;
- 390px mobile;
- 320px narrow mobile.

At each width verify:

- no horizontal document overflow;
- correct DOM and visual order;
- readable measures and type;
- minimum 44px interactive targets on touch layouts;
- visual frames reserve their complete space;
- component variants reflow without content loss.

## Interaction and accessibility

- Keyboard-operate every control.
- Keep focus visible.
- Confirm ARIA labels, relationships, expanded state, and live regions.
- Confirm Escape and focus return for overlays.
- Confirm native anchors and history behavior.
- Confirm reduced motion removes nonessential movement.
- Confirm React hydration adds behavior without shifting the Astro layout.

## Completion

- Run build and existing tests.
- Run browser regression tests for unchanged routes.
- Add or update the component-gallery scenario for every changed reusable
  component.
- Report with this fixed schema:

  - `Changed surface`: route, section or component, and project registry ID.
  - `Registry/gallery`: registry path plus scenarios added or reused.
  - `Neighborhood`: predecessor, target, successor, and their seam result.
  - `Viewports`: each audited width and pass/fail result.
  - `Behavior`: anchors, keyboard, focus, hydration, and reduced motion.
  - `Checks`: static audit, build, tests, and unchanged-route regression.
  - `Deviations`: exact component, viewport, evidence, and next action; write
    `none` only when every required check passed.

Preview evidence is optimized for review and may use targeted checks. Complete
browser, accessibility, and responsive assurance belongs to the full Publish
profile for the unchanged candidate unless risk classification requires it
earlier.
