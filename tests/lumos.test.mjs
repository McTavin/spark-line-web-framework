import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createLumosCatalogManifest, validateCatalogManifest } from "../dist/catalog/index.js";
import { lumosRegistry } from "../dist/registry/index.js";

test("Lumos catalog records actual vendored source and upstream lineage without React parity", () => {
  const manifest = createLumosCatalogManifest({ commit: "a".repeat(40) });
  assert.equal(validateCatalogManifest(manifest).valid, true);
  assert.equal(manifest.components.length, 9);
  for (const item of manifest.components) {
    assert.equal(item.framework, "astro");
    assert.equal(item.package.export, "./lumos");
    assert.match(item.source.path, /^src\/lumos\/components\/.+\.astro$/);
    assert.equal(item.lineage.source.commit, "e9c07d2e59bc5fe6275b7b795f482661af0acff0");
    assert.ok(lumosRegistry.has(item.id));
  }
});

test("vendored Lumos source matches the reviewed hashes and carries the upstream license", async () => {
  const root = new URL("../", import.meta.url);
  const provenance = JSON.parse(await readFile(new URL("src/lumos/PROVENANCE.json", root), "utf8"));
  assert.equal(provenance.license, "MIT");
  for (const file of provenance.files) {
    const bytes = await readFile(new URL(file.path, root));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256, file.path);
    assert.match(file.upstreamBlob, /^[0-9a-f]{40}$/);
    if (file.path.endsWith(".astro")) assert.doesNotMatch(bytes.toString(), /["']@\//);
  }
  const license = await readFile(new URL("src/lumos/LICENSE", root), "utf8");
  assert.match(license, /Timothy Ricks/);
  assert.match(license, /Permission is hereby granted/);
});
