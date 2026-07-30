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
- Report remaining deviations with exact affected viewports and components.
