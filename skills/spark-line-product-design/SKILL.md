---
name: spark-line-product-design
description: Make and review product-facing design decisions in projects using @spark-line/web-framework. Use for task flows, page hierarchy, component selection, interface copy, and interaction states in Astro with optional React islands and Sanity. Complements the framework implementation skill; not for backend-only changes or adopting a new design system without a request.
---

# Spark Line Product Design

Decide what the interface needs to do, then use the framework's actual contracts
to build it. This skill owns product reasoning, not the project's visual
identity or the package's component APIs.

## Establish the task

Infer the requested action from the user's words. A critique produces findings;
an implementation request permits scoped edits. A copy pass stays with language
and its necessary bindings. Polishing an accepted design does not reopen it.
A supplied screenshot or URL is evidence, not permission to redesign.

For a changed flow, name the person, the task, and the result they need. Trace
the relevant route, data source, and action handler before choosing controls.
If the task is already precise, implement it without adding a discovery phase.

Read the recipient's repository instructions and configured project context.
Use its approved content, visual direction, and tokens. Follow its v14.23
handshake when configured; do not introduce v14.23 where it is absent or create
a competing design-canon file. Flag missing decisions that would change scope;
keep minor implementation choices local.

## Use the framework that is present

Check the resolved `@spark-line/web-framework` version, exports, project registry,
and existing gallery. For structural implementation, use the available
`spark-line-web-framework` companion skill and its relevant references. If it
is absent, use repository-owned guidance at the project's checked-out ref or
inspect the installed package. Do not require installation or upgrade packages
to satisfy this skill. Report an unavailable contract instead of guessing an API.

The package registry is not the project's complete component inventory. Look
for the documented project registry, commonly `src/framework/registry.ts`, and
the existing `src/pages/style-guide.astro` before proposing a new abstraction.

Read only the reference needed for the changed decision:

- [Framework decisions](references/framework-decisions.md): component selection,
  layout ownership, hydration, or a content-backed surface.
- [States and copy](references/states-and-copy.md): controls, forms, localization,
  empty results, delayed data, or action feedback.
- [Evidence](references/evidence.md): review findings, verification, or a proposed
  addition to reusable guidance.

## Make the change defensible

For a non-obvious choice, explain the user consequence and the contract it uses.
For example, a service comparison that needs all options visible suggests a
`Grid`; a carousel would hide the comparison. That is a task-specific choice,
not a ban on carousels. Prefer the existing component when it meets the task;
do not force a task into an incomplete reference island.

Keep Astro responsible for page structure, React for justified client state,
and Sanity for editorial values through the project's typed content path.
Design decisions do not authorize CMS mutations or alter native Publish,
automatic content delivery, or repository release permissions.

Verify the changed behavior and rendered surface using the recipient's selected
checks, not a second universal test gate. Source-only findings stay labeled
source-only. In the handoff, state the decision, changed surface, evidence, and
remaining uncertainty; use the companion's existing QA report when applicable.

## Basis

Inspired by Vercel's separation of judgment, mechanical checks, and reviewed
evidence in [Teaching agents product design at Vercel](https://vercel.com/blog/teaching-agents-product-design-at-vercel).
The framework decisions here come from Spark Line's contracts. This is not a
copy of Vercel's internal skill, a Geist theme, or an automated rule collector.
