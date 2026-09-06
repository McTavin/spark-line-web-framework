import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const skillRelative = "skills/spark-line-product-design";
const skillRoot = path.join(root, skillRelative);
const references = ["framework-decisions.md", "states-and-copy.md", "evidence.md"];
const requiredFiles = ["SKILL.md", "agents/openai.yaml", ...references.map((file) => `references/${file}`)];

async function listFiles(directory, prefix = "") {
  const files = await Promise.all((await readdir(directory, { withFileTypes: true })).map(async (entry) => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relative);
    assert.ok(entry.isFile(), `Unexpected link or special file: ${relative}`);
    return [relative];
  }));
  return files.flat().sort();
}

// This skill uses simple string mappings, not arbitrary YAML structures.
function fields(source, indentation = "", quoted = false) {
  const values = {};
  for (const line of source.split(/\r?\n/).filter((line) => line.trim() && !line.trimStart().startsWith("#"))) {
    assert.ok(line.startsWith(indentation), `Unexpected indentation: ${line}`);
    const match = line.slice(indentation.length).match(/^([a-z_]+): +(.+?)\s*$/);
    assert.ok(match, `Expected a string field: ${line}`);
    const [, key, scalar] = match;
    assert.ok(!Object.hasOwn(values, key), `Duplicate field: ${key}`);
    if (quoted) assert.ok(scalar.startsWith('"'), `Metadata must use quoted strings: ${key}`);
    if (scalar.startsWith('"')) {
      values[key] = JSON.parse(scalar);
    } else {
      assert.doesNotMatch(scalar, /^(?:[\[\]{}&*!|>@`%'"#]|[-?:](?:\s|$))|:\s|\s#/);
      assert.doesNotMatch(scalar, /^(?:null|true|false|~|[-+]?\d+(?:\.\d+)?)$/i);
      values[key] = scalar;
    }
    assert.equal(typeof values[key], "string");
    assert.ok(values[key].trim(), `Empty field: ${key}`);
  }
  return values;
}

test("product design skill has valid instructions, discovery metadata and required references", async () => {
  const files = await listFiles(skillRoot);
  for (const file of requiredFiles) {
    assert.ok(files.includes(file), `Missing required file: ${file}`);
    assert.ok((await stat(path.join(skillRoot, file))).size > 0, `Empty required file: ${file}`);
  }
  const skill = await readFile(path.join(skillRoot, "SKILL.md"), "utf8");
  const frontmatter = skill.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/)?.[1];
  assert.ok(frontmatter, "SKILL.md needs frontmatter");
  const header = fields(frontmatter);
  assert.deepEqual(Object.keys(header).sort(), ["description", "name"]);
  assert.equal(header.name, "spark-line-product-design");
  assert.ok(header.description.length <= 1024);
  assert.doesNotMatch(header.description, /[<>]/);

  const metadata = await readFile(path.join(skillRoot, "agents/openai.yaml"), "utf8");
  assert.match(metadata, /^interface:\s*\r?\n/);
  const discovery = fields(metadata.replace(/^interface:\s*\r?\n/, ""), "  ", true);
  assert.deepEqual(Object.keys(discovery).sort(), ["default_prompt", "display_name", "short_description"]);
  assert.ok(discovery.short_description.length >= 25 && discovery.short_description.length <= 64);
  assert.ok(discovery.default_prompt.includes("$spark-line-product-design"));
});

test("product design skill links resolve and its references are reachable from the entrypoint", async () => {
  const repositoryRoot = await realpath(root);
  const pending = [path.join(skillRoot, "SKILL.md")];
  const visited = new Set();
  while (pending.length) {
    const file = await realpath(pending.pop());
    if (visited.has(file)) continue;
    visited.add(file);
    const source = await readFile(file, "utf8");
    const links = [
      ...source.matchAll(/\]\(<?([^\s)>]+)>?(?:\s+["'][^\n]*?["'])?\)/g),
      ...source.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)
    ];
    for (const [, href] of links) {
      if (/^(?:https?:|mailto:|#)/i.test(href)) continue;
      assert.doesNotMatch(href, /^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i, `Nonportable link: ${href}`);
      const target = await realpath(path.resolve(path.dirname(file), decodeURIComponent(href.split(/[?#]/, 1)[0])));
      const relative = path.relative(repositoryRoot, target);
      assert.ok(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `Link escapes repository: ${href}`);
      // Validate existing framework links, but traverse only this skill's prose.
      if (target.startsWith(`${skillRoot}${path.sep}`) && target.endsWith(".md")) pending.push(target);
    }
  }
  for (const reference of references) {
    assert.ok(visited.has(await realpath(path.join(skillRoot, "references", reference))), `Unreachable reference: ${reference}`);
  }
});

test("npm package selection includes the complete product design skill", async () => {
  const [report] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--ignore-scripts", "--json"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: path.join(root, ".cache", "npm") },
    stdio: ["ignore", "pipe", "pipe"]
  }));
  const packaged = new Set(report.files.map((file) => file.path));
  for (const file of await listFiles(skillRoot)) {
    assert.ok(packaged.has(`${skillRelative}/${file}`), `Excluded from package: ${file}`);
  }
});
