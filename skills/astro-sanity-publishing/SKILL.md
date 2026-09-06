---
name: astro-sanity-publishing
description: Set up or repair Sanity content, editorial images, Presentation editing, and automatic publishing for Astro sites on Cloudflare. Use for new integrations or unreliable existing CMS delivery; not for redesigns, routine copywriting, or other hosting providers.
---

# Astro + Sanity publishing

Keep the editor's workflow **Edit → native Publish → automatic production delivery**.
Work with the recipient's content model and hosting. This skill does not require
Spark Line components, v14.23, a particular schema, or a staging branch.

## Start with the recipient

Read its instructions, package/lockfiles, Astro and Studio configuration,
content loaders, image components, preview routes, deployment workflows and
maintenance scripts. Inspect existing Sanity/Cloudflare resources read-only
when access is available. Distinguish an absent resource from one you cannot see.

Establish the production branch, app/Studio package roots, static or server
rendering, Cloudflare product, existing production content trigger, schema
types, languages, asset ownership and secret locations. Ask only for unresolved
choices that affect implementation. A project ID or filename in an example is
not authority to create or replace resources.

Use only the part of the skill needed for the request:

- New integration, additional editable fields or images: read
  [setup](references/setup.md).
- Draft access, overlays, document routing or live refresh: read
  [Presentation](references/presentation.md).
- Studio, preview or production delivery: read
  [delivery](references/delivery.md), then inspect the workflow assets it names.
- A script writes existing published content: read
  [maintenance](references/maintenance.md) before changing or running it.

## Preserve the boundaries

- Keep native Publish, validation and realtime synchronization. Do not add a
  content approval, mandatory preview, PR, or manual release to hide a CMS fault.
- Sanity owns approved editorial fields and images; Astro owns markup, styles,
  behavior and composition. Preserve existing IDs, localization and R2 assets.
  Do not migrate content or redesign as an incidental setup step.
- Reuse existing deployments and triggers. Static public output may have an
  authenticated server-rendered preview built from the same production branch.
  Do not maintain a second live source branch for editors.
- Preserve repository release rules and the user's execution scope. Instructions
  and templates do not authorize project creation, credential changes, content
  publication, merges or deployments beyond that scope.
- Read current official documentation for the installed versions before adopting
  framework or SDK APIs. Do not upgrade a recipient merely to match an example.

## Use the assets selectively

Assets are recipient-owned code to copy and adapt, not a remote installer or a
new framework runtime. Keep only what the requested change needs. Resolve every
workflow substitution listed in the delivery reference before enabling it.
Merge into an existing equivalent workflow instead of adding a competing path.

The marker and paired-patch assets derive from committed reliability work in
`McTavin/opalo` (`b502ef9`, `937e9fe`) and `McTavin/cyel`
(`6e6b9e4f10b0fb436cf53b7c5782b7117308e5fa`). They contain no donor accounts,
schemas, content or release architecture. Consumer code does not fetch those
repositories at runtime.

## Verify and report

Use the repository's selected checks and focused tests for changed behavior.
Test concurrency and content races offline; do not manufacture a production
failure, stale browser state or test publication. Reuse passing evidence when
its inputs have not changed.

Keep the bundled `tests/` directory with the skill. From the copied skill root,
run `node --test tests/*.test.mjs` using Node 24, Git and Bash on a POSIX system;
no npm install or provider credentials are needed. See the
[delivery reference](references/delivery.md) for test limits and the distinction
between repository-build identity, running Sanity core, editor state and public
content freshness.

Report separately: implemented code, saved/merged SHA, deployed Studio marker,
active preview Worker version, and verified published-content delivery. A build
or dispatch alone is not deployment proof. If credentials or configuration are
missing, name the missing capability without exposing values. Do not claim an
end-to-end Publish test unless an authorized edit was actually observed through
the existing trigger and live output.
