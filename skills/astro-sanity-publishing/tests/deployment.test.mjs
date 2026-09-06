import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {appendFileSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {verifyWorkerDeployment} from '../assets/helpers/verify-worker-deployment.mjs';

// Exercise the actual workflow shell against local Git history. Only provider
// uploads and dispatch are doubles; no remote credentials or live content.
const targets = [
  {file: 'deploy-sanity-studio.yml', job: 'studio', step: 'Deploy current Studio', relevant: 'studio/config.ts'},
  {file: 'deploy-editor-preview.yml', job: 'deploy', step: 'Deploy current preview', relevant: 'src/page.astro'},
];
const workflow = target => readFileSync(new URL(`../assets/workflows/${target.file}`, import.meta.url), 'utf8');
function shell(source, step) {
  const section = source.split(`      - name: ${step}\n`)[1];
  assert.ok(section, `Missing step ${step}`);
  const block = section.match(/        run: \|\n((?:          .*\n|\n)+)/)?.[1];
  assert.ok(block, `Missing shell for ${step}`);
  return block.replace(/^          /gm, '');
}

test('Worker evidence selects newest deployment and requires the exact full-traffic SHA', () => {
  const sha = 'a'.repeat(40);
  const current = {id: 'deployment-2', created_on: '2026-09-06T06:00:00.000Z',
    annotations: {'workers/message': `editor-preview@${sha}`},
    versions: [{version_id: 'version-2', percentage: 100}]};
  const previous = {...current, id: 'deployment-1', created_on: '2026-09-06T05:00:00.000Z', annotations: {'workers/message': `editor-preview@${'b'.repeat(40)}`}};
  for (const list of [[current, previous], [previous, current]]) {
    assert.deepEqual(verifyWorkerDeployment(list, sha), {deploymentId: 'deployment-2', versionId: 'version-2', gitSha: sha, percentage: 100});
  }
  for (const bad of [[], [previous], [{...current, versions: [{version_id: 'v', percentage: 50}]}],
    [{...current, versions: [{version_id: 'v', percentage: 50}, {version_id: 'w', percentage: 50}]}],
    [{...current, created_on: 'bad'}], [current, {...current, id: 'ambiguous'}]]) {
    assert.throws(() => verifyWorkerDeployment(bad, sha));
  }
});

function fixture(t, target) {
  const root = mkdtempSync(join(tmpdir(), 'astro-sanity-deploy-test-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const origin = join(root, 'origin'), checkout = join(root, 'checkout'), bin = join(root, 'bin');
  mkdirSync(origin); mkdirSync(bin);
  const git = (cwd, ...args) => execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
  git(origin, 'init', '-b', 'release');
  function advance(path, text) {
    mkdirSync(join(origin, path, '..'), {recursive: true});
    writeFileSync(join(origin, path), text);
    git(origin, 'add', path);
    git(origin, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', text);
    return git(origin, 'rev-parse', 'HEAD');
  }
  const first = advance(target.relevant, 'relevant A');
  git(root, 'clone', origin, checkout);
  mkdirSync(join(checkout, 'dist/server'), {recursive: true});
  writeFileSync(join(checkout, 'dist/server/wrangler.json'), '{}');
  // Simulated build outputs must not trip the Studio's clean-checkout fence.
  writeFileSync(join(checkout, '.git/info/exclude'), 'dist/\n');
  for (const command of ['npm', 'npx', 'gh']) writeFileSync(join(bin, command), `#!/bin/bash
if [ "$(basename "$0")" = gh ]; then
  test "\${FAIL_DISPATCH:-0}" != 1 || exit 1
  echo "$*" >> "$DISPATCH_LOG"
else
  git rev-parse HEAD >> "$UPLOAD_LOG"
fi
`, {mode: 0o755});
  const output = join(root, 'output'), uploads = join(root, 'uploads'), dispatches = join(root, 'dispatches');
  for (const path of [output, uploads, dispatches]) writeFileSync(path, '');
  const env = {PATH: `${bin}:${process.env.PATH}`, SANITY_AUTH_TOKEN: 'offline-fixture', CLOUDFLARE_ACCOUNT_ID: 'fixture', CLOUDFLARE_API_TOKEN: 'fixture', WORKER_NAME: 'fixture-preview', WORKER_CONFIG: 'dist/server/wrangler.json', WRANGLER_ENV: '',
    GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: join(root, 'summary'), UPLOAD_LOG: uploads, DISPATCH_LOG: dispatches};
  return {root, checkout, bin, first, advance, read: path => readFileSync(path, 'utf8'), output, uploads, dispatches,
    run: (script, extra = {}) => spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script], {cwd: checkout, env: {...env, ...extra}, encoding: 'utf8'}),
    checkoutBranch() {git(checkout, 'fetch', 'origin', 'release'); git(checkout, 'checkout', '--detach', 'origin/release'); writeFileSync(output, '');},
  };
}

const previewSource = workflow(targets[1]).replaceAll('__PRODUCTION_BRANCH__', 'release');
const previewDeploy = shell(previewSource, 'Deploy current preview');
const previewInspect = shell(previewSource, 'Verify active Worker version');

test('Worker target inputs are shared and credentials are confined to deployment and inspection', () => {
  const jobEnv = previewSource.match(/^    env:\n((?:      .+\n)+)/m)?.[1];
  assert.equal(jobEnv, "      WORKER_CONFIG: '__WORKER_CONFIG__'\n" +
    '      WORKER_NAME: ${{ vars.EDITOR_WORKER_NAME }}\n' +
    '      WRANGLER_ENV: ${{ vars.EDITOR_WORKER_ENV }}\n');
  const stepEnv = name => previewSource.split(`      - name: ${name}\n`)[1]
    .match(/        env:\n((?:          .+\n)+)/)?.[1];
  const credentials = '          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}\n' +
    '          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n';
  assert.equal(stepEnv('Deploy current preview'), credentials);
  assert.equal(stepEnv('Verify active Worker version'), credentials);
  assert.equal([...previewSource.matchAll(/secrets\.CLOUDFLARE_API_TOKEN/g)].length, 2);
  assert.equal([...previewSource.matchAll(/secrets\.CLOUDFLARE_ACCOUNT_ID/g)].length, 2);
  assert.match(previewSource, /if: steps.deploy.outputs.stale != 'true'/);
});

function workerFixture(t) {
  const f = fixture(t, targets[1]);
  const config = 'dist/editor runtime/wrangler.json';
  mkdirSync(join(f.checkout, 'dist/editor runtime'), {recursive: true});
  writeFileSync(join(f.checkout, config), '{}');
  mkdirSync(join(f.checkout, 'scripts'));
  writeFileSync(join(f.checkout, 'scripts/verify-worker-deployment.mjs'),
    readFileSync(new URL('../assets/helpers/verify-worker-deployment.mjs', import.meta.url)));
  appendFileSync(join(f.checkout, '.git/info/exclude'), 'scripts/\n');
  writeFileSync(join(f.bin, 'sleep'), '#!/bin/bash\nexit 0\n', {mode: 0o755});
  // Record argv boundaries and effective account, then emulate provider evidence
  // scoped to the exact deployed target. No Wrangler installation or API calls.
  writeFileSync(join(f.bin, 'npx'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
const config = value('--config');
const selected = config ? JSON.parse(fs.readFileSync(config, 'utf8')) : {};
const environment = value('--env');
const effective = environment ? {...selected, ...selected.env?.[environment]} : selected;
const target = {config, name: value('--name'), environment,
  account: effective.account_id || process.env.CLOUDFLARE_ACCOUNT_ID};
fs.appendFileSync(process.env.CALL_LOG, JSON.stringify({args, target}) + '\\n');
if (args[2] === 'deploy') {
  fs.writeFileSync(process.env.DEPLOY_RECORD, JSON.stringify({target, message: value('--message')}));
} else if (args[2] === 'deployments' && args[3] === 'list') {
  const deployed = JSON.parse(fs.readFileSync(process.env.DEPLOY_RECORD, 'utf8'));
  const matches = JSON.stringify(target) === JSON.stringify(deployed.target);
  process.stdout.write(JSON.stringify([{id:'deployment',created_on:'2026-09-06T06:00:00.000Z',
    annotations:{'workers/message': matches ? deployed.message : 'editor-preview@' + '0'.repeat(40)},
    versions:[{version_id:'version',percentage:100}]}]));
} else process.exit(1);
`, {mode: 0o755});
  const callLog = join(f.root, 'calls');
  const env = {WORKER_CONFIG: config, RUNNER_TEMP: f.root,
    CALL_LOG: callLog, DEPLOY_RECORD: join(f.root, 'deployed')};
  return {...f, env, calls: () => f.read(callLog).trim().split('\n').map(JSON.parse)};
}

for (const environment of ['', 'editor']) {
  test(`Worker deployment and inspection share config, name, account and ${environment || 'default'} environment`, t => {
    const f = workerFixture(t);
    const env = {...f.env, WRANGLER_ENV: environment};
    assert.equal(f.run(previewDeploy, env).status, 0);
    const result = f.run(previewInspect, env);
    assert.equal(result.status, 0, result.stderr);
    const [deploy, inspect] = f.calls();
    assert.deepEqual(inspect.target, deploy.target);
    assert.deepEqual(deploy.target, {config: env.WORKER_CONFIG, name: 'fixture-preview', environment, account: 'fixture'});
    assert.ok(inspect.args.includes('--json'));
    assert.match(f.read(join(f.root, 'summary')), new RegExp(f.first));
  });
}

for (const [field, value] of Object.entries({WORKER_CONFIG: 'dist/server/wrangler.json',
  WORKER_NAME: 'another-worker', CLOUDFLARE_ACCOUNT_ID: 'another-account', WRANGLER_ENV: 'another-env'})) {
  test(`Worker inspection fails visibly when ${field} differs from the deployed target`, t => {
    const f = workerFixture(t);
    assert.equal(f.run(previewDeploy, f.env).status, 0);
    const result = f.run(previewInspect, {...f.env, [field]: value});
    assert.equal(result.status, 1);
    assert.match(result.stdout, /::error::Active Worker deployment does not match checkout/);
    assert.notDeepEqual(f.calls()[1].target, f.calls()[0].target);
    assert.doesNotMatch(result.stdout, /Verified active/);
  });
}

for (const target of targets) {
  const source = workflow(target).replaceAll('__PRODUCTION_BRANCH__', 'release').replaceAll('__WORKER_CONFIG__', 'dist/server/wrangler.json');
  const deploy = shell(source, target.step);
  const reconcile = shell(source, 'Queue current production branch');

  test(`${target.file}: serialized recovery is automatic and build jobs stay read-only`, () => {
    assert.match(source, /cancel-in-progress: false/);
    assert.match(source, /workflow_dispatch:/);
    assert.match(source, /stale: \$\{\{ steps\.deploy\.outputs\.stale \}\}/);
    const recovery = source.split('\n  reconcile:\n')[1];
    assert.ok(recovery.includes(`needs: ${target.job}`));
    assert.ok(recovery.includes(`needs.${target.job}.outputs.stale == 'true'`));
    assert.match(recovery, /permissions:\n      actions: write/);
    assert.match(recovery, /GH_TOKEN: \$\{\{ github.token \}\}/);
    assert.match(recovery, /GH_REPO: \$\{\{ github.repository \}\}/);
    assert.doesNotMatch(recovery, /uses: actions\/checkout|contents: write/);
    assert.doesNotMatch(source.split('\n  reconcile:\n')[0], /actions: write/);
    if (target.job === 'studio') {
      assert.match(source, /github\.event\.pull_request\.head\.sha \|\| 'release'/);
      assert.match(source, /if: github.event_name != 'pull_request' && steps.deploy.outputs.stale != 'true'/);
    } else assert.match(source, /ref: 'release'/);
  });

  for (const relevant of [false, true]) test(`${target.file}: A → ${relevant ? 'relevant B' : 'ignored docs B'} → automatic current-main upload`, t => {
    const f = fixture(t, target);
    const next = f.advance(relevant ? target.relevant : 'docs/note.md', 'commit B');
    assert.equal(f.run(deploy).status, 0);
    assert.equal(f.read(f.output), 'stale=true\n');
    assert.equal(f.read(f.uploads), '', 'A cannot upload');
    assert.equal(f.run(reconcile).status, 0);
    assert.equal(f.read(f.dispatches), `workflow run ${target.file} --ref release\n`);
    f.checkoutBranch(); // The dispatched run uses the workflow's current-main checkout.
    assert.equal(f.run(deploy).status, 0);
    assert.equal(f.read(f.output), '');
    assert.equal(f.read(f.uploads), `${next}\n`, 'only current production branch uploads');
  });

  test(`${target.file}: rerun of old event checks out current production branch`, t => {
    const f = fixture(t, target);
    const next = f.advance(target.relevant, 'new main before rerun');
    f.checkoutBranch();
    assert.equal(f.run(deploy, {GITHUB_SHA: f.first}).status, 0);
    assert.equal(f.read(f.uploads), `${next}\n`);
    assert.equal(f.read(f.output), '');
    assert.equal(f.read(f.dispatches), '');
  });

  test(`${target.file}: rejected dispatch fails visibly without uploading stale artifact`, t => {
    const f = fixture(t, target);
    f.advance('docs/note.md', 'main advanced');
    assert.equal(f.run(deploy).status, 0);
    assert.equal(f.run(reconcile, {FAIL_DISPATCH: '1'}).status, 1);
    assert.equal(f.read(f.dispatches), '');
    assert.equal(f.read(f.uploads), '');
  });
}
