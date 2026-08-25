import assert from "node:assert/strict";
import test from "node:test";

import {
  CATALOG_SCHEMA_VERSION,
  LUMOS_FOR_ASTRO_CATALOG_MANIFEST,
  LUMOS_FOR_ASTRO_COMMIT,
  LUMOS_FOR_ASTRO_REPOSITORY,
  WEB_FRAMEWORK_LAYOUT_PROFILE,
  WEB_FRAMEWORK_LAYOUT_PROFILE_ID,
  WEB_FRAMEWORK_SANITY_PROFILE,
  WEB_FRAMEWORK_SANITY_PROFILE_ID,
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
    content_profiles: [],
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
    content_profiles: [],
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
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: []
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
  assert.deepEqual(manifest.content_profiles, [WEB_FRAMEWORK_SANITY_PROFILE]);
  assert.ok(manifest.components.every((component) => component.content === undefined));
  assert.ok(manifest.components.every((component) => component.composition.profile === WEB_FRAMEWORK_LAYOUT_PROFILE_ID));
});

test("Lumos for Astro is a separate exact-ref experimental system manifest", () => {
  const manifest = LUMOS_FOR_ASTRO_CATALOG_MANIFEST;
  const frameworkManifest = createFrameworkCatalogManifest({ commit });
  const expectedPaths = [
    "BaseHead",
    "Button",
    "ButtonWrapper",
    "Card",
    "ContentWrapper",
    "Eyebrow",
    "Footer",
    "FormattedDate",
    "Grid",
    "Heading",
    "Icon",
    "Img",
    "Nav",
    "Overlay",
    "Paragraph",
    "RichText",
    "Section",
    "SkipLink",
    "Video"
  ].map((name) => `src/components/${name}.astro`).sort();

  assert.equal(manifest.components.length, 19);
  assert.equal(manifest.generated_from.repository, LUMOS_FOR_ASTRO_REPOSITORY);
  assert.equal(manifest.generated_from.commit, LUMOS_FOR_ASTRO_COMMIT);
  assert.notEqual(manifest.generated_from.repository, frameworkManifest.generated_from.repository);
  assert.deepEqual(manifest.content_profiles, []);
  assert.deepEqual(manifest.components.map((component) => component.source.path).sort(), expectedPaths);
  assert.ok(manifest.components.every((component) => component.id.startsWith("lumos.")));
  assert.ok(manifest.components.every((component) => component.scope === "system"));
  assert.ok(manifest.components.every((component) => component.framework === "astro"));
  assert.ok(manifest.components.every((component) => component.status === "experimental"));
  assert.ok(manifest.components.every((component) => component.package === undefined));
  assert.ok(manifest.components.every((component) => component.source.repository === LUMOS_FOR_ASTRO_REPOSITORY));
  assert.ok(manifest.components.every((component) => component.source.commit === LUMOS_FOR_ASTRO_COMMIT));
  assert.ok(manifest.components.every((component) => component.assets.some((asset) =>
    asset.id === "lumos-mit-license" && asset.kind === "license" && asset.status === "available")));
  assert.ok(manifest.components.every((component) => component.composition.profile === WEB_FRAMEWORK_LAYOUT_PROFILE_ID));

  const byId = new Map(manifest.components.map((component) => [component.id, component]));
  assert.deepEqual(byId.get("lumos.button").variants, ["primary", "secondary", "link"]);
  assert.deepEqual(byId.get("lumos.content-wrapper").variants, [
    "stack", "auto-width", "columns", "breakout", "contain", "sticky-content", "sticky-visual", "card"
  ]);
  assert.deepEqual(byId.get("lumos.grid").variants, ["columns", "autofit", "autofill"]);
  assert.ok(byId.get("lumos.base-head").assets.some((asset) =>
    asset.id === "lumos-default-social-image" && asset.status === "unavailable"));
  assert.deepEqual(validateCatalogManifest(manifest), { valid: true, errors: [] });
});

test("catalog validation requires declared composition profiles and roles", () => {
  const missingProfile = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [],
    content_profiles: [],
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

test("catalog content bindings reference declared profiles and project-defined models", () => {
  const serviceCard = {
    ...component("service-card"),
    content: { profile: WEB_FRAMEWORK_SANITY_PROFILE_ID, models: ["service", "product"] }
  };
  const manifest = defineCatalogManifest({
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [WEB_FRAMEWORK_SANITY_PROFILE],
    components: [serviceCard]
  });

  assert.deepEqual(manifest.components[0].content.models, ["service", "product"]);
  assert.deepEqual(validateCatalogManifest(manifest), { valid: true, errors: [] });
});

test("catalog validation rejects undeclared content profiles and invalid model identifiers", () => {
  const invalid = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [],
    components: [{
      ...component("service-card"),
      content: { profile: WEB_FRAMEWORK_SANITY_PROFILE_ID, models: ["Service Card"] }
    }]
  };
  const result = validateCatalogManifest(invalid);

  assert.ok(result.errors.some((error) => error.includes("content.profile")));
  assert.ok(result.errors.some((error) => error.includes("content.models")));
});

test("catalog validation rejects duplicate content capabilities and models", () => {
  const duplicateProfile = {
    ...WEB_FRAMEWORK_SANITY_PROFILE,
    capabilities: ["published", "published"]
  };
  const result = validateCatalogManifest({
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [duplicateProfile],
    components: [{
      ...component("service-card"),
      content: { profile: WEB_FRAMEWORK_SANITY_PROFILE_ID, models: ["service", "service"] }
    }]
  });

  assert.ok(result.errors.some((error) => error.includes("capabilities must not contain duplicates")));
  assert.ok(result.errors.some((error) => error.includes("models must not contain duplicates")));
});

test("catalog validation rejects loose legacy asset metadata", () => {
  const result = validateCatalogManifest({
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [],
    components: [{
      ...component("legacy-assets"),
      assets: [
        { kind: "image", role: "hero", source: "sanity", required: true },
        { id: "duplicate", kind: "asset", status: "available", note: "First" },
        { id: "duplicate", kind: "asset", status: "available", note: " " }
      ]
    }]
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("assets[0].id")));
  assert.ok(result.errors.some((error) => error.includes("assets[0].kind")));
  assert.ok(result.errors.some((error) => error.includes("assets[0].status")));
  assert.ok(result.errors.some((error) => error.includes("id duplicates duplicate")));
  assert.ok(result.errors.some((error) => error.includes("note must be a non-empty string")));
});

test("catalog validation rejects loose legacy lineage metadata", () => {
  const legacy = validateCatalogManifest({
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [],
    components: [{
      ...component("legacy-lineage"),
      lineage: {
        kind: "project-owned-preservation-extraction",
        baseline: { repository: "repo", path: "archive.zip", commit }
      }
    }]
  });
  const malformed = validateCatalogManifest({
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE],
    content_profiles: [],
    components: [{
      ...component("malformed-lineage"),
      lineage: {
        component_id: "Invalid ID",
        source: { repository: "repo", path: "../component.astro", commit: "main" }
      }
    }]
  });

  assert.equal(legacy.valid, false);
  assert.ok(legacy.errors.some((error) => error.includes("lineage.component_id")));
  assert.ok(legacy.errors.some((error) => error.includes("lineage.source must be an exact Git source")));
  assert.equal(malformed.valid, false);
  assert.ok(malformed.errors.some((error) => error.includes("lineage.component_id")));
  assert.ok(malformed.errors.some((error) => error.includes("lineage.source.path")));
  assert.ok(malformed.errors.some((error) => error.includes("lineage.source.commit")));
});

test("serialization normalizes content capability and model order", () => {
  const reverseProfile = {
    ...WEB_FRAMEWORK_SANITY_PROFILE,
    capabilities: [...WEB_FRAMEWORK_SANITY_PROFILE.capabilities].reverse()
  };
  const base = {
    schema_version: 1,
    generated_from: { repository: "repo", path: "catalog.json", commit },
    composition_profiles: [WEB_FRAMEWORK_LAYOUT_PROFILE]
  };
  const left = serializeCatalogManifest({
    ...base,
    content_profiles: [WEB_FRAMEWORK_SANITY_PROFILE],
    components: [{ ...component("service-card"), content: {
      profile: WEB_FRAMEWORK_SANITY_PROFILE_ID, models: ["product", "service"]
    } }]
  });
  const right = serializeCatalogManifest({
    ...base,
    content_profiles: [reverseProfile],
    components: [{ ...component("service-card"), content: {
      profile: WEB_FRAMEWORK_SANITY_PROFILE_ID, models: ["service", "product"]
    } }]
  });

  assert.equal(left, right);
});
