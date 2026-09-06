import {execFileSync} from 'node:child_process';

// Set repoRoot explicitly when the Studio's build working directory is not in its repository.
export function studioVersionPlugin({repoRoot = process.cwd()} = {}) {
  return {
    name: 'astro-sanity-studio-version',
    generateBundle() {
      const git = (...args) => execFileSync('git', args, {cwd: repoRoot, encoding: 'utf8'}).trim();
      this.emitFile({type: 'asset', fileName: 'studio-version.json', source: JSON.stringify({
        gitSha: git('rev-parse', 'HEAD'),
        dirty: Boolean(git('status', '--porcelain', '--untracked-files=all')),
        builtAt: new Date().toISOString(),
      }, null, 2)});
    },
  };
}

export function verifyStudioVersion(version, expectedSha) {
  const timestamp = new Date(version?.builtAt);
  if (!/^[a-f0-9]{40}$/.test(expectedSha || '') || version?.gitSha !== expectedSha ||
      version.dirty !== false || !Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== version.builtAt) {
    throw new Error('Studio SHA, cleanliness, or build timestamp is invalid');
  }
  return version;
}
