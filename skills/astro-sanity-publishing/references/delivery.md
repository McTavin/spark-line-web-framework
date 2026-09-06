# Automatic delivery on Cloudflare

## Keep three responsibilities separate

1. Native Sanity Publish changes Content Lake documents.
2. The existing production content trigger rebuilds the static site (or refreshes
   the existing SSR delivery/cache path). Do not add another trigger if one works.
3. Repository changes deploy hosted Studio and the editor runtime. Studio
   auto-updates update the hosted runtime, not repository-owned schema/config code.

Inspect the actual hosted Studio identity and its deployment owner before adding
a workflow. Preserve `deployment.autoUpdates: true` and the recipient's app ID.
Do not mistake the editor-preview Worker workflow for a Studio deployment.

For a static Pages site, keep the existing production build hook and expand its
document-type filter only when the published renderer supports the new types.
Cover create/update/delete for the actual rendered editorial types, with both
`drafts.**` and `versions.**` excluded. Check provider draft/version flags too.
Use uncached published reads at build time. Keep the hook enabled during normal
maintenance; do not turn Publish into a manual release operation.

A Workers SSR site may already read published content on request without a
rebuild hook. Preserve that model and its cache invalidation instead of imposing
a static-site trigger. Confirm Publish becomes visible on the live route.

## Adapt the workflow assets

Start with [Studio](../assets/workflows/deploy-sanity-studio.yml) and
[editor preview](../assets/workflows/deploy-editor-preview.yml) only when an
equivalent pipeline does not exist. Otherwise merge the missing behavior into
its single deployment path. These templates are examples to adapt, not files to
activate unchanged. They assume GitHub Actions and npm package scripts.

Resolve every `__UPPER_CASE__` token from recipient evidence:

| Token | Required value |
| --- | --- |
| `__PRODUCTION_BRANCH__` | Actual production branch, also used by checkout, fetch and recovery dispatch |
| `__APP_DIR__`, `__STUDIO_DIR__` | Repository-relative package roots, `.` when appropriate |
| `__APP_LOCKFILE__`, `__STUDIO_LOCKFILE__` | Their tracked lockfiles |
| `__SHARED_STUDIO_INPUTS__` | Relevant shared imports outside Studio; remove line if none |
| `__NODE_VERSION__` | Supported pinned Node version from the recipient |
| `__WORKER_CONFIG__` | Built Worker config path relative to the app package root |
| `__STUDIO_DIST__` | Built Studio output path relative to its package root |

For a root package, remove its directory prefix from path filters: use `**`
and `package.json`, not `./**` or `./package.json`. Keep `working-directory: .`.
Adjust package-manager commands, cache inputs, build scripts and
filters together; deduplicate installs when app and Studio share one package.
Review transitive imports and build configuration, not only schema directories.
Keep the target filenames or change the recovery dispatch filename with them.

The templates use these repository variables: `SANITY_PROJECT_ID`,
`SANITY_DATASET`, `SANITY_STUDIO_URL`, `SANITY_PREVIEW_URL`, `EDITOR_WORKER_NAME`.
Map names to existing conventions instead of creating duplicate configuration.
Secrets are `SANITY_AUTH_TOKEN` (Studio deploy only),
`CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_API_TOKEN`. Preview read/session secrets
belong to the Worker runtime and are not supplied to its frontend build. A
private published dataset may need a server/build read token for public builds;
add only that specific capability and never serialize it into output.

Copy [studio-version.mjs](../assets/helpers/studio-version.mjs) and
[verify-deployment.mjs](../assets/helpers/verify-deployment.mjs) into the Studio's
`scripts/` directory. Add `studioVersionPlugin({repoRoot})` to the existing
`sanity.cli` Vite plugin list without replacing other plugins. `repoRoot` must be
the Git root, especially in a monorepo; the default is the command's current
directory. Continue using the recipient's deployment app configuration.

Copy [verify-worker-deployment.mjs](../assets/helpers/verify-worker-deployment.mjs)
to the app's `scripts/` directory. Ensure the locked Wrangler supports the
commands in the template. Preserve runtime secrets/bindings. `--keep-vars`
retains dashboard variables; it is not proof that every required binding exists.

## Stale-run recovery and provenance

Each deployment uses one stable workflow-wide concurrency group with
`cancel-in-progress: false`. PRs build their exact head without deploying.
Deployments, reruns and recovery runs check out current production branch.
Before upload they fetch that branch again. Any SHA advance skips the artifact
and queues the same workflow against the branch via `workflow_dispatch`.
This works even when push path filters would ignore the intervening commit.

Only the checkout-free recovery job has `actions: write`; build jobs stay
read-only. Do not grant PR code the token used to dispatch. A rejected dispatch
fails CI and never permits stale upload. Repeated advances can queue further
recovery; once changes settle, the next current build uploads. Manual cancellation,
disabled Actions or provider outages are not guarantees the workflow can override.

Inspect how the recipient's release process advances its production branch.
If an existing token-driven release suppresses push events, add that real
workflow's completion event to the same deploy workflows. Do not invent a release
workflow or copy another client's workflow name. Keep its nonproduction events
from being confused with a successful production release.

Fail before upload when builds create unexpected tracked or untracked files.
Resolve them in source, not by deleting changes from CI. Upload the already
built Studio with `--no-build`; do not rebuild after its marker was verified.
The marker format is `{gitSha, dirty, builtAt}`: exact checkout SHA, `false`,
valid UTC ISO timestamp. Check the actual hosted marker after deployment.

For the Worker, annotate the deployment with the checkout SHA and inspect the
active provider deployment: expected SHA, known version ID and 100% traffic.
The included verifier rejects a stale or partial rollout. Then smoke the real
preview URL's auth boundary and a Studio-opened authenticated route. Provider
metadata verifies version delivery, not that every route or binding works.

## Test without damaging editorial work

Use local histories and mocked uploads/dispatch for advances during build,
old-event reruns and dispatch failure. Verify actual workflow shell, not a
parallel toy algorithm. Check live delivery after normal authorized rollout,
but do not force a production race or publish test content. Report separately
if a real native Publish → live content update remains unobserved.

Sources: [Studio deployment](https://www.sanity.io/docs/studio/deployment),
[Sanity webhooks](https://www.sanity.io/docs/content-lake/webhooks),
[GitHub workflow dispatch](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/).
