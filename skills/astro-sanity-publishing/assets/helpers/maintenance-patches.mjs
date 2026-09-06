// Adapted from the committed paired-revision reconciliation helper; see references/maintenance.md.
import {isDeepStrictEqual} from 'node:util';

const conflict = (message) => new Error(`Maintenance conflict: ${message}`);
const same = (left, right) => left.exists === right.exists &&
  isDeepStrictEqual(left.value, right.value);
const fieldName = /^[A-Za-z_]\w*$/;

// Indices may select a source value, but every resulting mutation uses stable keys.
export function resolveMaintenancePath(document, path) {
  if (typeof path !== 'string' || !/^[A-Za-z_]\w*(?:\[\d+\])?(?:\.[A-Za-z_]\w*(?:\[\d+\])?)*$/.test(path)) {
    throw conflict(`unsupported path ${path}`);
  }
  const segments = [];
  let node = document;
  for (const token of path.match(/[^.[\]]+/g)) {
    if (/^\d+$/.test(token)) {
      const item = Array.isArray(node) ? node[Number(token)] : undefined;
      if (typeof item?._key !== 'string' || !item._key || node.filter((entry) => entry?._key === item._key).length !== 1) {
        throw conflict(`missing or ambiguous array key at ${document._id}.${path}`);
      }
      segments.push({_key: item._key});
      node = item;
    } else {
      segments.push(token);
      node = node?.[token];
    }
  }
  return segments;
}

function validatePath(path) {
  if (!Array.isArray(path) || !path.length || typeof path[0] !== 'string') {
    throw conflict('a targeted field path is required');
  }
  for (const segment of path) {
    if (typeof segment === 'string') {
      if (!fieldName.test(segment)) throw conflict('unsupported field path');
    } else {
      const entries = segment && typeof segment === 'object' && !Array.isArray(segment)
        ? Object.entries(segment) : [];
      // A semantic selector such as {language: "en"} is resolved to that document's _key.
      if (entries.length !== 1 || !fieldName.test(entries[0][0]) ||
          typeof entries[0][1] !== 'string' || !entries[0][1]) {
        throw conflict('use one stable string identity per array selector');
      }
    }
  }
  if (['_id', '_rev', '_type', '_createdAt', '_updatedAt', '_revision_lock_pseudo_field_'].includes(path[0])) {
    throw conflict('system and revision-lock fields are not maintenance targets');
  }
}

function readTarget(document, segments) {
  let node = document;
  let path = '';
  for (const [index, segment] of segments.entries()) {
    const last = index === segments.length - 1;
    if (typeof segment === 'string') {
      if (!node || typeof node !== 'object' || Array.isArray(node)) {
        throw conflict(`missing parent at ${document._id}.${path}`);
      }
      path += `${path ? '.' : ''}${segment}`;
      if (!Object.hasOwn(node, segment)) {
        if (last) return {path, exists: false, value: undefined};
        throw conflict(`missing target ${document._id}.${path}`);
      }
      node = node[segment];
    } else {
      if (!Array.isArray(node)) throw conflict(`missing array ${document._id}.${path}`);
      const [field, value] = Object.entries(segment)[0];
      const matches = node.filter((item) => item?.[field] === value);
      if (matches.length === 0 && last && field === '_key') {
        return {path: `${path}[_key==${JSON.stringify(value)}]`, exists: false, value: undefined};
      }
      const item = matches[0];
      if (matches.length !== 1 || typeof item?._key !== 'string' || !item._key ||
          node.filter((entry) => entry?._key === item._key).length !== 1) {
        throw conflict(`missing or ambiguous target ${document._id}.${path}`);
      }
      path += `[_key==${JSON.stringify(item._key)}]`;
      node = item;
    }
  }
  return {path, exists: true, value: node};
}

export async function readDocumentPair(client, id) {
  if (typeof id !== 'string' || !id || id.startsWith('drafts.') || id.startsWith('versions.')) {
    throw conflict(`expected a published document ID, got ${id}`);
  }
  const [published, draft] = await client.withConfig({useCdn: false, perspective: 'raw'})
    .getDocuments([id, `drafts.${id}`]);
  return {published, draft};
}

// changes: [{path: ['title', {language: 'en'}, 'value'], value: 'New title'}]
// An explicit {unset: true} removes only the selected field. No document replacement.
export function planPairedPatch({published, draft}, changes) {
  if (typeof published?._id !== 'string' || !published._rev ||
      published._id.startsWith('drafts.') || published._id.startsWith('versions.')) {
    throw conflict('published document and revision are required');
  }
  if (draft && (draft._id !== `drafts.${published._id}` || !draft._rev)) {
    throw conflict(`invalid draft or revision for ${published._id}`);
  }
  const documents = [published, ...(draft ? [draft] : [])];
  if (documents.some(doc => Object.hasOwn(doc, '_revision_lock_pseudo_field_'))) {
    throw conflict('reserved revision-lock field is present; preserve document');
  }
  const patches = documents.map((doc) => ({id: doc._id, ifRevisionID: doc._rev, set: {}, unset: []}));
  const targets = [];
  for (const change of changes) {
    validatePath(change.path);
    if (!change.unset && change.value === undefined) {
      throw conflict('an explicit value or unset is required');
    }
    const before = readTarget(published, change.path);
    const desired = {exists: !change.unset, value: change.unset ? undefined : change.value};
    targets.push({path: change.path, desired});
    for (const [index, doc] of documents.entries()) {
      const current = index === 0 ? before : readTarget(doc, change.path);
      if (same(current, desired)) continue;
      if (index !== 0 && !same(current, before)) {
        throw conflict(`${doc._id}.${current.path} differs from published and intended values; nothing written`);
      }
      if (change.unset) patches[index].unset.push(current.path);
      else patches[index].set[current.path] = change.value;
    }
  }
  const changed = patches.some((patch) => Object.keys(patch.set).length || patch.unset.length);
  return {
    publishedId: published._id,
    hadDraft: Boolean(draft),
    targets,
    mutations: changed ? patches.map(({set, unset, ...patch}) => ({patch: {
      ...patch,
      ...(Object.keys(set).length ? {set} : {}),
      ...(unset.length ? {unset} : {}),
      // Sanity's native revision-lock patch also guards an unchanged counterpart.
      ...(!Object.keys(set).length && !unset.length ? {unset: ['_revision_lock_pseudo_field_']} : {}),
    }})) : [],
  };
}

export async function applyPairedPatch(client, plan) {
  if (!plan.mutations.length) return false;
  await client.withConfig({maxRetries: 0}).transaction(plan.mutations).commit({visibility: 'sync'});
  // There is no absence revision to lock. This detects a newly visible stale
  // draft after a published write, but cannot close every draft-creation race.
  if (!plan.hadDraft) {
    try {
      const draft = await client.withConfig({useCdn: false, perspective: 'raw'})
        .getDocument(`drafts.${plan.publishedId}`);
      if (draft) {
        for (const target of plan.targets) {
          if (!same(readTarget(draft, target.path), target.desired)) {
            throw conflict(`${draft._id} appeared with a different targeted value`);
          }
        }
      }
    } catch (cause) {
      throw Object.assign(conflict(`published mutation for ${plan.publishedId} already succeeded; post-write draft check failed: ${cause.message}. Draft left untouched; no retry.`), {
        cause,
        publishedMutationApplied: true,
      });
    }
  }
  return true;
}
