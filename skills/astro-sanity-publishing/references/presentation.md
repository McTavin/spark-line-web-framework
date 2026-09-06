# Authenticated Presentation editing

Use the [official Astro visual-editing guide](https://www.sanity.io/docs/astro/astro-visual-editing)
for the installed version. Its adapter examples are not a reason to replace
Cloudflare with Node hosting. For a working integration, repair the missing
connection instead of replacing the entire preview runtime.

## Connect both sides

Studio's `presentationTool` needs a preview origin, actual enable/disable routes,
and document-location resolvers for the recipient's routes and locales. Configure
exact Studio/frontend origins in the appropriate Sanity CORS and Presentation
settings. Do not assume that configuring a Studio iframe authenticates requests
to the frontend.

The Astro side needs per-request draft context, a server-side content loader and
visual-editing UI. `@sanity/astro` supplies an integration/client when compatible;
an existing `@sanity/client` loader can remain. Enable source maps/stega or explicit
`data-sanity` targets only in verified preview context. Preserve document IDs,
stable array selectors and field paths through view-model transforms. Include
editable image targets, not only text overlays.

Wire the visual-editing refresh callback and navigation/history behavior. In
Astro, a refresh may reload the server-rendered page to read current drafts;
visible overlays alone do not prove realtime synchronization. Keep URL, metadata,
numeric values and CSS free of invisible stega characters. Cleaning every text
value also removes implicit edit targets, so retain explicit targets where needed.

## Draft access is a server decision

Validate the Sanity preview URL secret before granting a draft session. A query
parameter, client-writable perspective cookie or iframe `Origin` is a preference,
not authorization. Require a verified server-side session (or existing equivalent
access control) before using a privileged draft-read token. Restrict supported
perspectives; reject malformed input instead of forwarding it to GROQ/client APIs.

Use recipient-compatible secure cookie/session handling. Validate redirects as
same-origin paths. Set `private, no-store` and `noindex` on draft responses, and
keep authorized drafts out of shared caches and static build output. Do not open
all JSON, image-looking or asset-extension URLs as an auth bypass: distinguish
actual public build assets from routes that could return draft data.

Verify the real cross-site iframe: Secure/SameSite settings, browser third-party
cookie restrictions, frame-ancestor policy and the disable/logout path. Preserve
session expiry and renewal policy; do not fix login failures by exposing preview
or issuing unlimited sessions. Draft API tokens stay server-side, never in
`SANITY_STUDIO_*`, `PUBLIC_*`, HTML, serialized props or browser requests.

## Cloudflare rendering boundary

For an existing server-rendered Cloudflare app, reuse its request/runtime secret
access and preview routes. For a static public site, build a separate authenticated
SSR preview Worker from the same production branch, enabling the Cloudflare
adapter only for that build. Production stays static and published-only. Read
runtime bindings using the installed adapter's supported Cloudflare API, not a
build-time secret substituted into client code. There is no universal requirement
for a Workers KV session binding; follow the chosen adapter/session implementation.

Use the current production-branch workflow in [delivery](delivery.md). Disable
only animations that demonstrably obstruct editing, under verified preview mode;
do not create a permanent preview source branch or change production visuals.

## Acceptance

- A known text field and image open the exact intended Studio field, including a
  reordered array item and another locale when the site has them.
- An authorized draft change refreshes preview without publishing; disable mode
  restores published content. Test locally or in a nonproduction fixture.
- An unauthenticated request, forged perspective cookie and invalid preview URL
  cannot read drafts. Cache headers and framing match the actual preview origins.
- Public output contains neither drafts, privileged tokens nor editing metadata.

Further references: [draft mode](https://www.sanity.io/docs/visual-editing/implementing-draft-mode),
[Presentation configuration](https://www.sanity.io/docs/visual-editing/configuring-the-presentation-tool).
