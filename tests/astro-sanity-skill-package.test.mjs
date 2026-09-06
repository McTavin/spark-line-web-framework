import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const skillRelative = "skills/astro-sanity-publishing";
const skillRoot = path.join(root, skillRelative);

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relative);
    assert.ok(entry.isFile(), `Skill must be portable; unexpected link or special file: ${relative}`);
    return [relative];
  }));
  return files.flat().sort();
}

test("repository runner discovers the portable tests directly without legacy duplicate suites", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
  assert.equal(manifest.scripts["test:unit"], "node --test tests/*.test.mjs skills/astro-sanity-publishing/tests/*.test.mjs");
  const rootTests = await readdir(path.join(root, "tests"));
  assert.ok(!rootTests.includes("astro-sanity-maintenance.test.mjs"));
  assert.ok(!rootTests.includes("astro-sanity-deployment.test.mjs"));
});

test("npm package file selection includes every skill helper and workflow template", async () => {
  const files = await listFiles(skillRoot);
  const [report] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: path.join(root, ".cache", "npm") },
    stdio: ["ignore", "pipe", "pipe"]
  }));
  const packedPaths = new Set(report.files.map((file) => file.path));
  for (const file of files) {
    assert.ok(packedPaths.has(`${skillRelative}/${file}`), `Skill file excluded from package: ${file}`);
  }
});

test("executable skill assets contain no donor deployment or content configuration", async () => {
  const files = (await listFiles(skillRoot)).filter((file) => file.startsWith("assets/"));
  const donorConfiguration = [
    /\by8z6ootm\b/i,
    /\bp0um9gjxn7oid779n5fggm6g\b/i,
    /\bohHfFZQVP\b/i,
    /(?:cyel|opalo)[\w.-]*\.(?:sanity\.studio|pages\.dev|workers\.dev)/i,
    /\b(?:siteCopy|projectEditorial|homePage|PillarPage)\b/,
    /\b(?:client_id|Exact Candidate|release-exact-candidate)\b/i,
    /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/
  ];
  for (const file of files) {
    const source = await readFile(path.join(skillRoot, file), "utf8");
    for (const pattern of donorConfiguration) {
      assert.doesNotMatch(source, pattern, `Nonportable donor configuration or credential in ${file}`);
    }
    assert.doesNotMatch(source, /(?:sanityProjectId|projectId|appId|account_id|accountId)\s*[:=]\s*["'][a-z0-9]{8,}["']/i,
      `A concrete project/account identity is embedded in ${file}`);
  }
});
