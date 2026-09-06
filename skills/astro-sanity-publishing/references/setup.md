# Content, images and first-time setup

## Inventory before creating anything

Identify the real app and Studio package roots, locked package manager, Astro
adapter/version, public URL, production branch and Cloudflare Pages/Workers
project. Read the existing schema registry and GROQ loaders before deciding
which documents need to exist. Follow repository context instructions when
present; do not install a governance system to use this skill.

For a new integration, reuse the owner's Sanity organization/project/dataset
when available. If those choices are unknown, resolve them before provisioning.
Keep setup commands bounded to the named project; do not accept a CLI's default
organization, dataset, billing option or hostname without checking it.

Separate these identities and capabilities:

| Setting | Use |
| --- | --- |
| Project ID, dataset, API version, Studio URL | Public identifiers, not credentials |
| Sanity read token | Server-side draft reads; private published datasets may also need server/build access |
| Studio deployment token | Project-scoped deploy capability, not content editing |
| Cloudflare deployment token/account | Existing project's deploy path and version verification |
| Preview session secret | Server-only session verification, where the preview implementation uses one |
| Production build-hook URL | Secret endpoint; never commit or log its full value |

Store tokens in the existing secret mechanism. Never put tokens in `PUBLIC_*`
or `SANITY_STUDIO_*` variables, browser bundles, copy exports or skill files.
Keep lifetime/rotation policy project-owned; do not create permanent credentials
or disable expiry as a convenience default.

## Model what editors should change

Keep the existing schema when it serves the request. For new fields, choose
documents and references from the site's actual content: collections for
repeatable records and singletons for one-off pages/settings. Do not impose a
universal page builder, donor document names, or a DOM-wide text replacement
system. Existing text-slot integrations retain their stable keys.

Use typed queries/view models as the boundary between documents and components.
Preserve `_id`, `_type`, array `_key`, references and field-path provenance when
normalizing data. Use the site's existing localization scheme; adding a CMS
does not require adding languages. Keep language-specific metadata and alt text
with their language rather than copying one fallback into every field.

Render strings through normal escaped Astro bindings. Render Portable Text
through a reviewed renderer with controlled components, not arbitrary CMS HTML.
Do not store CSS classes, scripts, SVG markup, geographic behavior or routing
logic in generic editable text fields. Editable slugs/links need the recipient's
validation and route handling, not a blanket ban on editorial URLs.

## Editorial images

Reuse existing image fields/components; otherwise add a Sanity image field with
hotspot enabled and the required alt/caption fields. Query the asset reference,
dimensions, crop and hotspot. Use a compatible `@sanity/image-url` builder and
the site's image renderer to retain crop/hotspot, intrinsic dimensions, sizes
and responsive sources. Preserve meaningful alt text; decorative images use the
site's established empty-alt convention.

Keep brand, developer, video, sequence and other R2-owned assets in their current
storage. Inventory local editorial photos separately; upload only the approved
set. A CMS integration is not permission to copy all media or delete originals.

## Initialize without migrating

Missing-record creation may use create-if-not-exists semantics. Preserve existing
published documents and drafts. A legacy ID or unexpected document shape calls
for a reconciliation decision, not delete-and-reseed. Do not create a general
draft publisher. If an existing initialization script needs repair, read
[maintenance](maintenance.md).

For a schema change, ship a compatible published renderer before exposing the
new field in hosted Studio or widening the content trigger. See
[delivery](delivery.md). Do not turn initialization consent into permission to
publish later editorial drafts.

Official starting points: [Astro integration](https://www.sanity.io/docs/astro),
[image URLs](https://www.sanity.io/docs/apis-and-sdks/image-urls),
[Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).
