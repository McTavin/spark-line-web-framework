# Evidence and guidance changes

## Review what can be established

Separate an API or source finding from observed behavior. A screenshot cannot
establish keyboard focus, persistence, or a successful write. A passing package
test does not establish that a recipient page uses the package correctly.

For each material finding, give the location, evidence, user consequence, and
smallest corrective change. Identify a violated contract when one exists; label
a proposed usability improvement as a recommendation rather than manufacturing
a framework rule. Order findings by task failure or harm before visual polish.
If a referenced page cannot be inspected, say which conclusions remain unverified.

## Reuse the checks that own the risk

Use the recipient's selected verification profile. Within this framework repo,
`npm run verify:changed` selects package, unit, fixture, and browser checks by
changed paths. Do not impose that command on a consumer that has another runner.
Use the existing companion QA report instead of adding a parallel release record.

The companion's `scripts/audit_layout.mjs` flags potential sibling selectors,
negative margins, and raw CMS layout-class fields. Resolve it from the available
skill directory. It is advisory source matching: a hit needs inspection and a
clean result does not prove layout correctness. Do not relabel it as a product
design linter. The framework's browser tests cover reference fixtures, including
keyboard and accessibility checks; consumer routes still need relevant rendered
evidence. Reuse successful evidence when its inputs have not changed.

Sources: [verification selector][selector], [layout audit][audit],
[browser checks][browser]. No new linter or browser harness is supplied here.

## Improve the guidance only within scope

When a task reveals a repeatable decision, propose a short amendment with its
reason, exact source or review evidence, applicable surface, and exceptions.
Do not rewrite this skill automatically as a side effect of using it. Project
identity stays with the project's canon; a component API change stays with its
implementation; a reusable judgment can belong in this skill. A shipped example
is supporting evidence, not automatic approval of a universal rule.

If a mechanical check is proposed later, establish what it can reliably detect
and demonstrate false-positive cases before making it blocking. Leave context-
dependent component and language choices as reasoned guidance. No scheduled
collection, new approval layer, or mandatory publication experiment is implied.

[selector]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/scripts/verification-plan.mjs
[audit]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/skills/spark-line-web-framework/scripts/audit_layout.mjs
[browser]: https://github.com/McTavin/spark-line-web-framework/blob/8e27630b5cd938c9516de9afdca88c349f5e5227/scripts/test-browser.mjs
