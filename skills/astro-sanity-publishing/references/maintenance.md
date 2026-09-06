# Existing maintenance writers

Read every real seed, backfill, initialization and publishing script involved in
the request. Fix unsafe behavior without inventing migrations or maintenance
jobs. Ordinary edits remain Studio edits followed by native Publish.

The optional [paired-patch helper](../assets/helpers/maintenance-patches.mjs)
is schema-independent. Copy it only when a writer must update existing published
fields. The recipient owns selection, intended values and reviewed input; the
helper does not decide which content should change.

## Target narrow fields

Read the published ID and exact `drafts.<id>` counterpart through uncached raw
document reads. Do not compare a perspective-overlaid query result with itself.
Use stable `_key` selectors and the recipient's language identities, never array
indexes or a whole-array replacement. Missing or ambiguous targets stop the plan.
Also guard identity fields used to choose a default, such as a catalog reference.

For each target, compare the draft with the published baseline and intended value:

- Matching baseline: update both targets.
- Already at intended value: preserve that draft target.
- Any other value: stop and preserve the draft.

Do not compare unrelated content as a reason to overwrite it. Preflight the
selected plans before mutations where practical, but report that a multi-document
run is atomic per pair, not across every document it selected.

## Commit one pair atomically

The helper submits both existing documents in one transaction, checking both
read revisions even when one target needs no change. The unchanged counterpart
uses a revision-fenced no-op patch; a document containing the helper's reserved
guard field is rejected rather than altered. Do not remove that fence to make a
script pass. Disable client mutation retries and never retry a revision conflict
after rereading fresh state.

Example using a keyed language item (adapt the path to the real schema):

```js
import {readDocumentPair, planPairedPatch, applyPairedPatch} from './maintenance-patches.mjs';

const pair = await readDocumentPair(client, publishedId);
const plan = planPairedPatch(pair, [
  {path: ['translations', {language: 'en'}, 'summary'], value: reviewedSummary},
]);
// Inspect the plan first; execute only within the authorized maintenance scope.
await applyPairedPatch(client, plan);
```

Consult the helper exports when adapting an existing writer. It does not create,
publish or delete drafts. Preserve its tests alongside recipient-specific tests.

## When no draft exists

There is no atomic absence guarantee. The helper revision-checks the published
write, then performs an uncached, read-only draft check. A newly observed draft
must match the intended target values, not the old published values. Otherwise
stop, leave it untouched, and report that the published write already succeeded.
A failed post-write read must report that same uncertainty; it is not a rollback.

Callers must retain the `publishedMutationApplied` signal in errors and stop
their batch, not hide it in a generic retry. A draft appearing after the check
is outside the guarantee. Do not promise that every concurrent race is closed.

## Creation and one-time initialization

Retain safe create-if-missing behavior and revision-fenced append of missing
stable slots. Preserve existing published documents, canonical drafts and
unrelated fields. Unexpected legacy IDs stop for explicit reconciliation.

A one-time seed publisher, if the recipient already needs one, must match the
reviewed seed against all non-system draft content, use create-only publication
and an atomic draft revision fence, and never replace existing published content.
Do not copy donor seed publishers or turn this exception into a generic draft
overwrite/delete/publish utility.

Tests should cover matching/conflicting/already-correct drafts, reordered keys
and languages, unrelated data preservation, either revision changing, no retry,
new drafts after an applied write and failed post-write reads. Keep them offline.
