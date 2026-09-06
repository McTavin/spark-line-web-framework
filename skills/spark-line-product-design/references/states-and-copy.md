# States and interface copy

Follow the changed data and event paths. Cover states those paths can enter;
do not add network-error screens to a static section or invent permissions the
product does not have.

## Content-driven surfaces

- Distinguish an empty collection from a filter with no matches. A reset action
  helps the latter; it does not repair a genuinely empty dataset. Reference
  `Tabs` and `Carousel` return nothing for empty input, so the parent must decide
  whether an omission or an explanation serves the page.
- Check a sparse result and long real content when changing grid behavior.
  Do not create equal-height cards by truncating the only information needed to
  distinguish entries. Preserve the reading order across the affected widths.
- For missing editorial media, use the project's approved fallback and retain
  geometry where needed. Distinguish an informative image from decoration before
  writing alt text; a caption does not automatically serve both roles.
- In a CMS-backed project, preserve document IDs, array keys, language identities,
  asset provenance, and edit bindings. Keep text editing metadata in its intended
  text path, not inside routing comparisons or DOM identifiers.

## Actions and forms

Read the handler before promising an outcome. An interface may acknowledge a
request, save locally, or confirm a server write; those are different outcomes.
Name the affected item and scope when the surrounding context leaves room for
mistakes. Do not promise undo, delivery, or immediate publication unless the
system supports it.

For changed asynchronous actions, inspect pending, success, and recoverable
failure behavior. Preserve entered values on validation failure. A disabled
button needs an understandable reason, not only a changed color. Prevent repeat
submission through the existing operation contract; a cosmetic spinner is not
an idempotency guarantee. Do not test destructive behavior on production data.

Use labels from the project's vocabulary. A compact action can stay compact when
its surrounding context is clear; an icon-only control still needs an accessible
name. Place validation next to the field it concerns and preserve its programmatic
association. Suggest a structural change separately when copy cannot resolve a
confusing scope or a missing recovery action.

## Locale and motion checks

Inspect rendered labels, accessible names, and text hidden visually in the
target language. At the linked framework baseline, `Dialog.closeLabel` and
`Carousel.previousLabel`/`nextLabel` have English defaults. Pass project-owned
translations. The carousel's hidden position announcement is hardcoded in
English; translated button labels alone do not localize it. Report the API gap
or use an appropriate project implementation within the requested scope.

Do not strip accents, rich text, or CMS edit metadata to make a label fit.
Inspect affected narrow layouts with actual localized content. Keep decorative
motion from changing reading order or hiding controls, and exercise reduced
motion when changing animation. Authenticated editor-preview motion adjustments
belong to the existing preview path; do not disable production motion as a side
effect of an editorial fix.

Component behavior and props: [versioned React source](https://github.com/McTavin/spark-line-web-framework/tree/8e27630b5cd938c9516de9afdca88c349f5e5227/src/react).
Verify against the recipient version. For scoped viewport, keyboard, focus,
and neighborhood checks, follow the framework's [QA checklist](https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/skills/spark-line-web-framework/references/qa-checklist.md).
