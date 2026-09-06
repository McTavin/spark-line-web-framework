import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export function verifyWorkerDeployment(deployments, expectedSha) {
  if (!/^[a-f0-9]{40}$/.test(expectedSha || '') || !Array.isArray(deployments) || !deployments.length) {
    throw new Error('Expected a checkout SHA and nonempty Wrangler deployment list');
  }
  const ordered = deployments.map(deployment => {
    const created = Date.parse(deployment.created_on);
    if (!Number.isFinite(created)) throw new Error('Invalid deployment timestamp');
    return {deployment, created};
  }).sort((a, b) => b.created - a.created);
  if (ordered.length > 1 && ordered[0].created === ordered[1].created) {
    throw new Error('Ambiguous active deployment timestamp');
  }
  const current = ordered[0].deployment;
  if (current.annotations?.['workers/message'] !== `editor-preview@${expectedSha}`
    || !current.id || current.versions?.length !== 1
    || current.versions[0].percentage !== 100 || !current.versions[0].version_id) {
    throw new Error('Active Worker does not match the expected full-traffic checkout');
  }
  return {deploymentId: current.id, versionId: current.versions[0].version_id, gitSha: expectedSha, percentage: 100};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file, sha] = process.argv.slice(2);
  console.log(JSON.stringify(verifyWorkerDeployment(JSON.parse(readFileSync(file, 'utf8')), sha)));
}
