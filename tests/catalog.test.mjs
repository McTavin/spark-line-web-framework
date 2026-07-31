import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_SCHEMA_VERSION,
  WEB_FRAMEWORK_LAYOUT_PROFILE,
  WEB_FRAMEWORK_LAYOUT_PROFILE_ID,
  createFrameworkCatalogManifest,
  defineCatalogManifest,
  serializeCatalogManifest,
  validateCatalogManifest
} from "../dist/catalog/index.js";

const commit = "0123456789abcdef0123456789abcdef01234567";

function component(id, framework = "astro") {
  return {
    id,
    name: id,
    framework,
    kind: "primitive",
    scope: "system",
    variants: ["default"],
    scenarios: [{ id: "default", label: "Default" }],
    status: "stable",
    source: { repository: "https://example.test/framework.git", path: `src/${id}.astro`, commit },
    package: { name: "@spark-line/web-framework", version: "0.2.0", export: "./astro" },
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "layout", exceptions: [] }
  };
}

test("catalog manifests validate exact Git provenance", () => {
  const manifest = defineCatalogManifest({
    schema_version: CATALOG_SCHEMA_VERSION,
    generated_from: { repository: "https://example.test/framework.git", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    components: [component("stack")]
  });

  assert.equal(manifest.components[0].source.commit, commit);
  assert.deepEqual(validateCatalogManifest(manifest), { valid: true, errors: [] });
});

test("catalog validation rejects inferred frameworks and floating refs", () => {
  const invalid = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit: "main" },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    components: [component("card", "vue")]
  };
  const result = validateCatalogManifest(invalid);

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("full lowercase Git SHA")));
  assert.ok(result.errors.some((error) => error.includes("astro or react")));
});

test("serialization is deterministic across component order", () => {
  const base = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE]
  };
  const left = serializeCatalogManifest({ ...base, components: [component("text"), component("action")] });
  const right = serializeCatalogManifest({ ...base, components: [component("action"), component("text")] });

  assert.equal(left, right);
});

test("framework catalog declares Astro and React parity for stable presentational primitives", () => {
  const manifest = createFrameworkCatalogManifest({ commit });
  const pairs = new Map();
  for (const component of manifest.components) {
    if (!pairs.has(component.id)) pairs.set(component.id, new Set());
    pairs.get(component.id).add(component.framework);
  }
  assert.equal(manifest.components.length, 16);
  for (const frameworks of pairs.values()) assert.deepEqual([...frameworks].sort(), ["astro", "react"]);
  assert.ok(manifest.components.every((component) => component.scope === "system"));
  assert.deepEqual(manifest.composition_profiles, [WEB_FRAMEWORK_LAYOUT_PROFILE]);
  assert.ok(manifest.components.every((component) => component.composition.profile === WEB_FRAMEWORK_LAYOUT_PROFILE_ID));
});

test("catalog validation requires declared composition profiles and roles", () => {
  const missingProfile = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [],
    components: [component("stack")]
  };
  const undeclaredRole = {
    ...missingProfile,
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    components: [{ ...component("stack"), composition: {
      profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "webflow", exceptions: []
    } }]
  };

  assert.ok(validateCatalogManifest(missingProfile).errors.some((error) => error.includes("composition_profiles")));
  assert.ok(validateCatalogManifest(undeclaredRole).errors.some((error) => error.includes("composition.role")));
});
