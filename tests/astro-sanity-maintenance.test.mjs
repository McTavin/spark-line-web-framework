import assert from 'node:assert/strict';
import test from 'node:test';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {applyPairedPatch, planPairedPatch, readDocumentPair, resolveMaintenancePath} from '../skills/astro-sanity-publishing/assets/helpers/maintenance-patches.mjs';
import {studioVersionPlugin, verifyStudioVersion} from '../skills/astro-sanity-publishing/assets/helpers/studio-version.mjs';

const published = (extra = {}) => ({_id: 'page-home', _type: 'page', _rev: 'p1', headings: [{_key: 'title', es: 'Antes', en: 'Before'}, {_key: 'other', es: 'Otro'}], ...extra});
const draft = (extra = {}) => ({...published(), _id: 'drafts.page-home', _rev: 'd1', ...extra});
const changes = [{path: ['headings', {_key: 'title'}, 'en'], value: 'After'}];
const pairPlan = (d = draft()) => planPairedPatch({published: published(), draft: d}, changes);

test('maintenance reads exact published/draft IDs without CDN or perspective overlays', async () => {
  const client = {withConfig(options) {
    assert.deepEqual(options, {useCdn: false, perspective: 'raw'});
    return {getDocuments: async ids => {assert.deepEqual(ids, ['page-home', 'drafts.page-home']); return [published(), draft()];}};
  }};
  assert.deepEqual(await readDocumentPair(client, 'page-home'), {published: published(), draft: draft()});
  for (const id of ['', null, 'drafts.page-home', 'versions.release.page-home']) await assert.rejects(readDocumentPair(client, id));
});

test('stable keys survive reordering and preserve unrelated translations and images', async () => {
  const d = draft({headings: [{_key: 'other', es: 'Unrelated edit'}, {_key: 'title', es: 'Cambio español', en: 'Before'}], coverImage: {asset: {_ref: 'image-keep'}}});
  const before = structuredClone(d);
  const plan = pairPlan(d);
  assert.deepEqual(plan.mutations.map(m => m.patch.set), [{'headings[_key=="title"].en': 'After'}, {'headings[_key=="title"].en': 'After'}]);
  assert.deepEqual(d, before);
  assert.deepEqual(resolveMaintenancePath(published(), 'headings[0].en'), changes[0].path);
  const client = clientDouble({'page-home': published(), 'drafts.page-home': d});
  await applyPairedPatch(client, plan);
  const expectedDraft = structuredClone(before);
  expectedDraft.headings[1].en = 'After';
  assert.deepEqual(client.docs['drafts.page-home'], expectedDraft);
});

test('semantic language identities resolve independently to stable keys in each counterpart', () => {
  const p = published({title: [{_key: 'pub-en', language: 'en', value: 'Before'}, {_key: 'pub-es', language: 'es', value: 'Antes'}]});
  const d = draft({title: [{_key: 'draft-es', language: 'es', value: 'Editor español'}, {_key: 'draft-en', language: 'en', value: 'Before'}]});
  const change = [{path: ['title', {language: 'en'}, 'value'], value: 'After'}];
  const plan = planPairedPatch({published: p, draft: d}, change);
  assert.deepEqual(plan.mutations.map(m => m.patch.set), [{'title[_key=="pub-en"].value': 'After'}, {'title[_key=="draft-en"].value': 'After'}]);
  const duplicate = {...d, title: [...d.title, {_key: 'another-en', language: 'en', value: 'Before'}]};
  assert.throws(() => planPairedPatch({published: p, draft: duplicate}, change), /ambiguous/);
});

test('matching drafts update; already-intended draft targets remain revision guarded; conflicts stop', async () => {
  const correct = draft({headings: [{_key: 'title', en: 'After'}]});
  assert.deepEqual(pairPlan(correct).mutations[1].patch, {id: correct._id, ifRevisionID: 'd1', unset: ['_revision_lock_pseudo_field_']});
  for (const en of ['Editor edit', undefined]) assert.throws(() => pairPlan(draft({headings: [{_key: 'title', en}]})), /conflict/);
  const plan = planPairedPatch({published: published({headings: correct.headings}), draft: correct}, changes);
  assert.deepEqual(plan.mutations, []);
  assert.equal(await applyPairedPatch({}, plan), false);
});

test('ambiguous keys, missing parents, invalid revisions and unsafe path shapes stop', () => {
  for (const headings of [[], [{_key: 'title', en: 'Before'}, {_key: 'title', en: 'Before'}]]) assert.throws(() => pairPlan(draft({headings})), /missing or ambiguous/);
  for (const d of [draft({_rev: undefined}), draft({_id: 'drafts.other'})]) assert.throws(() => pairPlan(d), /revision/);
  assert.throws(() => pairPlan(draft({_revision_lock_pseudo_field_: 'keep'})), /preserve/);
  assert.throws(() => planPairedPatch({published: published()}, [{path: ['missing', 'parent'], value: 'After'}]), /missing/);
  for (const path of [[], [0], ['headings', 0, 'en'], ['headings', {_key: 'title', language: 'en'}, 'en'], ['_rev'], ['bad.field']]) {
    assert.throws(() => planPairedPatch({published: published()}, [{path, value: 'After'}]), /conflict/);
  }
  assert.throws(() => resolveMaintenancePath(published(), 'headings[99].en'), /ambiguous array key/);
  assert.throws(() => resolveMaintenancePath(published(), 'headings[*].en'), /unsupported path/);
  assert.throws(() => planPairedPatch({published: published()}, [{path: ['title']}]), /explicit value/);
});

test('already-correct published targets do not justify overwriting missing draft work', () => {
  assert.throws(() => planPairedPatch({published: published({summary: 'Correct'}), draft: draft()}, [{path: ['summary'], value: 'Correct'}]), /conflict/);
});

test('targeted unsets preserve an already-removed draft field and fence its revision', () => {
  const plan = planPairedPatch({published: published({summary: 'Before'}), draft: draft()}, [{path: ['summary'], unset: true}]);
  assert.deepEqual(plan.mutations.map(m => m.patch.unset), [['summary'], ['_revision_lock_pseudo_field_']]);
  assert.throws(() => planPairedPatch({published: published({summary: 'Before'}), draft: draft({summary: 'Editor edit'})}, [{path: ['summary'], unset: true}]), /conflict/);
});

// Small transaction double: validate every revision before applying any field.
function clientDouble(documents, newDraft) {
  return {
    docs: structuredClone(documents), commits: 0, reads: 0, configs: [],
    withConfig(config) {this.configs.push(config); return this;},
    transaction(mutations) {return {commit: async options => {
      assert.deepEqual(options, {visibility: 'sync'});
      this.commits++;
      for (const {patch} of mutations) if (this.docs[patch.id]?._rev !== patch.ifRevisionID) throw Object.assign(new Error('Revision conflict'), {statusCode: 409});
      for (const {patch} of mutations) {
        for (const [path, value] of Object.entries(patch.set || {})) {
          const slot = path.match(/^headings\[_key=="(.*?)"\]\.en$/);
          if (slot) this.docs[patch.id].headings.find(item => item._key === slot[1]).en = value;
          else this.docs[patch.id][path] = value;
        }
        for (const path of patch.unset || []) delete this.docs[patch.id][path];
      }
    }};},
    async getDocument(id) {this.reads++; assert.equal(id, 'drafts.page-home'); if (newDraft instanceof Error) throw newDraft; return newDraft;},
  };
}

test('atomic revision rejection guards changed and unchanged counterparts with no retries or rereads', async () => {
  const correct = draft({headings: [{_key: 'title', en: 'After'}]});
  for (const d of [draft(), correct]) for (const changedId of ['page-home', 'drafts.page-home']) {
    const client = clientDouble({'page-home': published(), 'drafts.page-home': d});
    client.docs[changedId]._rev = 'concurrent-change';
    const before = structuredClone(client.docs);
    await assert.rejects(applyPairedPatch(client, pairPlan(d)), {statusCode: 409});
    assert.deepEqual(client.docs, before);
    assert.equal(client.commits, 1); assert.equal(client.reads, 0);
    assert.deepEqual(client.configs, [{maxRetries: 0}]);
  }
});

test('without a draft, a stale published revision rejects before any write or post-read', async () => {
  const client = clientDouble({'page-home': published({_rev: 'newer'})});
  await assert.rejects(applyPairedPatch(client, pairPlan(null)), {statusCode: 409});
  assert.equal(client.docs['page-home'].headings[0].en, 'Before');
  assert.equal(client.commits, 1); assert.equal(client.reads, 0);
});

test('no-draft race reports applied publication, preserves new draft, and stops the writer', async () => {
  const newDraft = draft({notes: 'keep'}), before = structuredClone(newDraft);
  const client = clientDouble({'page-home': published()}, newDraft);
  let operations = 0;
  await assert.rejects((async () => {for (let i = 0; i < 2; i++) {operations++; await applyPairedPatch(client, pairPlan(null));}})(), error => error.publishedMutationApplied === true && /already succeeded.*no retry/.test(error.message));
  assert.equal(client.docs['page-home'].headings[0].en, 'After');
  assert.deepEqual(newDraft, before); assert.equal(operations, 1); assert.equal(client.commits, 1);
  assert.deepEqual(client.configs, [{maxRetries: 0}, {useCdn: false, perspective: 'raw'}]);
});

test('post-write read accepts intended draft targets, rejects unavailable checks and never mutates drafts', async () => {
  for (const newDraft of [null, draft({headings: [{_key: 'title', en: 'After', es: 'keep'}]})]) {
    const before = structuredClone(newDraft);
    const client = clientDouble({'page-home': published()}, newDraft);
    assert.equal(await applyPairedPatch(client, pairPlan(null)), true);
    assert.deepEqual(newDraft, before);
    assert.equal(client.commits, 1); assert.equal(client.reads, 1);
  }
  const client = clientDouble({'page-home': published()}, new Error('offline'));
  await assert.rejects(applyPairedPatch(client, pairPlan(null)), {publishedMutationApplied: true});
  assert.equal(client.docs['page-home'].headings[0].en, 'After');
  assert.equal(client.commits, 1); assert.equal(client.reads, 1);
});

test('Studio marker rejects stale, dirty, missing and malformed build identities', () => {
  const sha = 'a'.repeat(40), marker = {gitSha: sha, dirty: false, builtAt: '2026-09-06T04:00:00.000Z'};
  assert.deepEqual(verifyStudioVersion(marker, sha), marker);
  for (const bad of [{dirty: true}, {gitSha: 'b'.repeat(40)}, {builtAt: null}, {builtAt: 'yesterday'}, {builtAt: '2026-09-06'}]) assert.throws(() => verifyStudioVersion({...marker, ...bad}, sha), /invalid/);
  for (const bad of [null, undefined, {}]) assert.throws(() => verifyStudioVersion(bad, sha), /invalid/);
  assert.throws(() => verifyStudioVersion(marker, 'main'), /invalid/);
});

test('marker plugin reads configured repository independently of its asset location and reports dirt', () => {
  const root = mkdtempSync(join(tmpdir(), 'astro-sanity-marker-'));
  const git = (...args) => execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  try {
    git('init');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-m', 'Fixture');
    const sha = git('rev-parse', 'HEAD');
    const nested = join(root, 'apps', 'editor');
    mkdirSync(nested, {recursive: true});
    const emit = plugin => {
      let asset;
      plugin.generateBundle.call({emitFile(value) {asset = value;}});
      assert.equal(asset.fileName, 'studio-version.json');
      assert.equal(asset.type, 'asset');
      return JSON.parse(asset.source);
    };
    const marker = emit(studioVersionPlugin({repoRoot: nested}));
    assert.equal(verifyStudioVersion(marker, sha).dirty, false);
    writeFileSync(join(root, 'untracked.txt'), 'new input');
    const dirty = emit(studioVersionPlugin({repoRoot: root}));
    assert.equal(dirty.dirty, true);
    assert.throws(() => verifyStudioVersion(dirty, sha), /invalid/);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('deployment verification CLI exits nonzero for wrong SHA or missing arguments', () => {
  const root = mkdtempSync(join(tmpdir(), 'astro-sanity-verify-'));
  const cli = fileURLToPath(new URL('../skills/astro-sanity-publishing/assets/helpers/verify-deployment.mjs', import.meta.url));
  try {
    const sha = 'a'.repeat(40), markerFile = join(root, 'studio-version.json');
    writeFileSync(markerFile, JSON.stringify({gitSha: sha, dirty: false, builtAt: '2026-09-06T04:00:00.000Z'}));
    const run = (...args) => execFileSync(process.execPath, [cli, ...args], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
    assert.match(run(markerFile, sha), new RegExp(`Studio ${sha}, clean build`));
    assert.throws(() => run(markerFile, 'b'.repeat(40)), {status: 1});
    assert.throws(() => run(), {status: 1});
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
