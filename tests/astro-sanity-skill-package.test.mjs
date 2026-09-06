import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const skillRelative = "skills/astro-sanity-publishing";
const skillRoot = path.join(root, skillRelative);
const expectedFiles = [
  "SKILL.md",
  "agents/openai.yaml",
  "references/setup.md",
  "references/presentation.md",
  "references/delivery.md",
  "references/maintenance.md",
  "assets/helpers/studio-version.mjs",
  "assets/helpers/verify-deployment.mjs",
  "assets/helpers/maintenance-patches.mjs",
  "assets/helpers/verify-worker-deployment.mjs",
  "assets/workflows/deploy-sanity-studio.yml",
  "assets/workflows/deploy-editor-preview.yml"
];

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

test("Astro Sanity skill ships complete portable content and discovery metadata", async () => {
  const files = await listFiles(skillRoot);
  for (const file of expectedFiles) {
    assert.ok(files.includes(file), `Missing skill file: ${file}`);
    assert.ok((await stat(path.join(skillRoot, file))).size > 0, `Empty skill file: ${file}`);
  }
  assert.ok(!files.some((file) => /(?:^|\/)(?:node_modules|\.env|dist)(?:\/|$)/.test(file)));
  const skill = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const frontmatter = skill.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/)?.[1];
  assert.ok(frontmatter, "SKILL.md needs YAML frontmatter");
  assert.match(frontmatter, /^name:\s*astro-sanity-publishing\s*$/m);
  assert.match(frontmatter, /^description:\s*\S.+/m);
  const metadata = await readFile(path.join(skillRoot, "agents/openai.yaml"), "utf8");
  assert.match(metadata, /^interface:\s*$/m);
  assert.match(metadata, /^\s+display_name:\s*\S.+/m);
  assert.match(metadata, /^\s+short_description:\s*\S.+/m);
  assert.match(metadata, /^\s+default_prompt:.*\$astro-sanity-publishing/m);
});

test("skill relative Markdown links resolve inside the shareable folder", async () => {
  const files = await listFiles(skillRoot);
  const canonicalRoot = await realpath(skillRoot);
  const linkedFiles = new Set();
  for (const file of files.filter((entry) => entry.endsWith(".md"))) {
    const source = await readFile(path.join(skillRoot, file), "utf8");
    const links = [
      ...source.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+["'][^\n]*?["'])?\)/g),
      ...source.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)
    ];
    for (const [, href] of links) {
      if (/^(?:https?:|mailto:|#)/i.test(href)) continue;
      assert.ok(!/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(href), `Nonportable link in ${file}: ${href}`);
      const target = path.resolve(path.dirname(path.join(skillRoot, file)), decodeURIComponent(href.split(/[?#]/, 1)[0]));
      const canonicalTarget = await realpath(target);
      const relative = path.relative(canonicalRoot, canonicalTarget);
      assert.ok(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Link escapes skill in ${file}: ${href}`);
      linkedFiles.add(relative.split(path.sep).join("/"));
    }
  }
  for (const file of expectedFiles.filter((entry) => entry.startsWith("references/"))) {
    assert.ok(linkedFiles.has(file), `Reference is undiscoverable from skill Markdown: ${file}`);
  }
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
