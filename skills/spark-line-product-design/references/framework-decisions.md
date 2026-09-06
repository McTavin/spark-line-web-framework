# Framework decisions

These are decision aids for `@spark-line/web-framework`, not a new visual system.
The linked source is a checked baseline at `8e27630`; confirm the recipient's
resolved version before using an API. Installed declarations and actual project
behavior decide compatibility. Newer documentation is not an upgrade request.

## Choose by behavior

The first column describes a possible task, not a universal component mandate.

| Task | Candidate and its actual boundary |
| --- | --- |
| Navigate to a project or document | Astro `Action` with `href` renders an anchor. Without `href` it renders a button; forms must explicitly use `type="submit"`. Preserve URLs, downloads, and browser history. |
| Read optional inline explanation | Astro `Disclosure` uses native `details`/`summary` and a content slot. It needs no React hydration. |
| Compare items together | Compose `Grid`, `Stack`, headings, and actions. `CardShell` supplies a surface, not a whole-card link or a semantic entity. Avoid nested interactive elements when making a card actionable. |
| Switch panels within one view | Reference `Tabs` accepts string content and local selection. It does not implement routes, query parameters, persisted selection, or rich panel slots. Use real navigation for separately addressable pages. |
| Open a brief explanation | Reference `Dialog` accepts trigger, title, description, and close labels. It is not a form or destructive-confirmation API. A richer task needs a suitable project component with verified focus and submission behavior. |
| Show a compact list of destinations | Reference `Menu` items require `href`. It is not an action dispatcher or a settings select. Do not invent command callbacks on its API. |
| Step through a text sequence | Reference `Carousel` accepts labels and descriptions, not image slides or autoplay. Check whether hiding siblings helps the actual task. |

Sources: [Astro APIs][astro], [React APIs][react], [registry status][registry].
The four React islands are experimental reference implementations at this ref.
Reuse does not certify a new application, dataset, or localization.

## Compose without changing the neighbors

For a section change, inspect the section before it and after it as well.
`Section` owns its background and both vertical spacing edges; `Container` owns
width and gutters. `PageFlow` adds no automatic gap. A taller translated heading
may push the following section down; it must not change that section's theme
or spacing. Fix the responsible component rather than reaching into siblings.

Use `SectionGroup` for an intentional overlap or joined composition. A floating
illustration belongs in a `VisualFrame` with reserved dimensions. Missing or
late media must not turn a decorative overlap into an obstruction. Do not remove
an approved visual direction merely because a simpler layout is available.
The wrapper alone reserves nothing: supply `aspectRatio`, `minBlockSize`, or a
project-defined size. Likewise, a `Heading`'s visual `size` does not determine
its semantic `level`; preserve the document outline when changing type scale.

Use project tokens for identity. Check the project's registry for an exact
match, then a compatible typed variant, then composition. Register a new
project component only when reuse is intentional, repeated, or owner-selected;
stability and universal promotion retain the framework's existing review rules.
See the [structural contract][contracts].

## Place state where it belongs

Keep a section's frame and layout in Astro even when a control inside it needs
React. Choose hydration timing from when the control must work; verify the
pre-hydration experience rather than treating `client:visible` as instant.

Sanity should supply typed editorial values and constrained variants, not
interaction handlers or arbitrary layout classes. Keep record identity separate
from component identity and preserve the existing published/draft view-model
path. A design pass must not split it or flatten rich content just to fit a
string-only island. The [stack boundary][stack] owns these contracts; the
publishing skill is only needed when the request includes CMS setup or delivery.

[astro]: https://github.com/McTavin/spark-line-web-framework/tree/8e27630b5cd938c9516de9afdca88c349f5e5227/src/astro
[react]: https://github.com/McTavin/spark-line-web-framework/tree/8e27630b5cd938c9516de9afdca88c349f5e5227/src/react
[registry]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/src/registry/index.ts
[contracts]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/skills/spark-line-web-framework/references/contracts.md
[stack]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/skills/spark-line-web-framework/references/stack-boundaries.md
