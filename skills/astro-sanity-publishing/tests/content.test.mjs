import assert from "node:assert/strict";
import {readFile, readdir, realpath, stat} from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const skillRoot = path.resolve(import.meta.dirname, "..");
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
  "assets/workflows/deploy-editor-preview.yml",
  "tests/content.test.mjs",
  "tests/maintenance.test.mjs",
  "tests/deployment.test.mjs"
];

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async entry => {
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) return listFiles(path.join(directory, entry.name), relative);
    assert.ok(entry.isFile(), `Skill must be portable; unexpected link or special file: ${relative}`);
    return [relative];
  }));
  return files.flat().sort();
}

// Validate the skill's simple string mappings, not arbitrary YAML. New metadata
// structures need explicit support here rather than being silently ignored.
function stringMapping(source, indentation = "") {
  const fields = {};
  for (const line of source.split(/\r?\n/).filter(line => line.trim() && !line.trimStart().startsWith("#"))) {
    assert.ok(line.startsWith(indentation), `Unexpected mapping indentation: ${line}`);
    const entry = line.slice(indentation.length).match(/^([a-z_]+):[ ]+(.+?)\s*$/);
    assert.ok(entry, `Expected a simple string field: ${line}`);
    const [, key, scalar] = entry;
    assert.ok(!Object.hasOwn(fields, key), `Duplicate field: ${key}`);
    let value;
    if (scalar.startsWith('"')) {
      assert.doesNotThrow(() => { value = JSON.parse(scalar); }, `Invalid quoted string: ${key}`);
    } else if (scalar.startsWith("'")) {
      assert.match(scalar, /^'(?:[^']|'')*'$/, `Invalid quoted string: ${key}`);
      value = scalar.slice(1, -1).replaceAll("''", "'");
    } else {
      assert.doesNotMatch(scalar, /^(?:[\[\]{}&*!|>@`%]|[-?:](?:\s|$))|:\s|\s#/, `Unsupported string syntax: ${key}`);
      assert.doesNotMatch(scalar, /^(?:null|true|false|~|[-+]?\d+(?:\.\d+)?)$/i, `Expected a string: ${key}`);
      value = scalar;
    }
    assert.equal(typeof value, "string", `Expected a string: ${key}`);
    assert.ok(value.trim().length > 0, `Empty field: ${key}`);
    fields[key] = value;
  }
  return fields;
}

function validateFrontmatter(source) {
  const frontmatter = source.match(/^---\r?\n([\s\S]+?)\r?\n---(?:\r?\n|$)/)?.[1];
  assert.ok(frontmatter, "SKILL.md needs YAML frontmatter");
  const fields = stringMapping(frontmatter);
  assert.deepEqual(Object.keys(fields).sort(), ["description", "name"]);
  assert.equal(fields.name, "astro-sanity-publishing");
  assert.match(fields.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(fields.name.length < 64);
  assert.ok(fields.description.length <= 1024, "Description must fit discovery metadata");
  assert.doesNotMatch(fields.description, /[<>]/);
  return fields;
}

function validateMetadata(source) {
  assert.match(source, /^interface:\s*\r?\n/, "Discovery metadata needs an interface mapping");
  const fields = stringMapping(source.replace(/^interface:\s*\r?\n/, ""), "  ");
  assert.deepEqual(Object.keys(fields).sort(), ["default_prompt", "display_name", "short_description"]);
  assert.ok(fields.short_description.length >= 25 && fields.short_description.length <= 64, "Short description must contain 25–64 characters");
  assert.ok(fields.default_prompt.includes("$astro-sanity-publishing"), "Default prompt must invoke this skill");
  return fields;
}

test("skill contains its instructions, references, reusable assets and portable tests", async () => {
  const files = await listFiles(skillRoot);
  for (const file of expectedFiles) {
    assert.ok(files.includes(file), `Missing skill file: ${file}`);
    assert.ok((await stat(path.join(skillRoot, file))).size > 0, `Empty skill file: ${file}`);
  }
  assert.ok(!files.some(file => /(?:^|\/)(?:node_modules|\.env|dist)(?:\/|$)/.test(file)));
  validateFrontmatter(await readFile(path.join(skillRoot, "SKILL.md"), "utf8"));
  validateMetadata(await readFile(path.join(skillRoot, "agents/openai.yaml"), "utf8"));
});

test("metadata checks reject missing, duplicate, empty and incorrectly typed fields", () => {
  const frontmatter = "---\nname: astro-sanity-publishing\ndescription: A useful skill description.\n---\n";
  const metadata = 'interface:\n  display_name: "Astro publishing"\n  short_description: "A focused Astro publishing skill"\n  default_prompt: "Use $astro-sanity-publishing here."\n';
  validateFrontmatter(frontmatter);
  validateMetadata(metadata);
  for (const source of [
    frontmatter.replace("name: astro-sanity-publishing\n", ""),
    frontmatter.replace("description:", "name: astro-sanity-publishing\ndescription:"),
    frontmatter.replace("A useful skill description.", "true"),
    frontmatter.replace("A useful skill description.", '""'),
    frontmatter.replace("astro-sanity-publishing", "Different Skill")
  ]) assert.throws(() => validateFrontmatter(source));
  for (const source of [
    metadata.replace('  display_name: "Astro publishing"\n', ""),
    metadata + '  display_name: "Duplicate"\n',
    metadata.replace('"Astro publishing"', "false"),
    metadata.replace('"Astro publishing"', '"unterminated'),
    metadata.replace("A focused Astro publishing skill", "Too short"),
    metadata.replace("$astro-sanity-publishing", "$another-skill"),
    metadata.replace("  default_prompt:", "default_prompt:")
  ]) assert.throws(() => validateMetadata(source));
});

test("skill relative Markdown links resolve inside the shareable folder", async () => {
  const files = await listFiles(skillRoot);
  const canonicalRoot = await realpath(skillRoot);
  const linkedFiles = new Set();
  for (const file of files.filter(entry => entry.endsWith(".md"))) {
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
  for (const file of expectedFiles.filter(entry => entry.startsWith("references/"))) {
    assert.ok(linkedFiles.has(file), `Reference is undiscoverable from skill Markdown: ${file}`);
  }
});
