import {readFileSync} from 'node:fs';
import {verifyStudioVersion} from './studio-version.mjs';

const [file, expectedSha] = process.argv.slice(2);
if (!file || !expectedSha) throw new Error('Usage: node verify-deployment.mjs <studio-version.json> <expected-checkout-sha>');
const version = verifyStudioVersion(JSON.parse(readFileSync(file, 'utf8')), expectedSha);
console.log(`Studio ${version.gitSha}, clean build at ${version.builtAt}`);
