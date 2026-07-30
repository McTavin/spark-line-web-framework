import assert from "node:assert/strict";
import test from "node:test";

import {
  defineComponentRegistry,
  frameworkRegistry
} from "../dist/registry/index.js";

test("framework registry includes every public primitive and reference island", () => {
  for (const id of [
    "page-flow",
    "section",
    "section-group",
    "container",
    "stack",
    "cluster",
    "grid",
    "visual-frame",
    "heading",
    "text",
    "action",
    "card-shell",
    "disclosure",
    "tabs",
    "carousel",
    "dialog",
    "menu"
  ]) {
    assert.equal(frameworkRegistry.has(id), true, `${id} is registered`);
    assert.ok(frameworkRegistry.require(id).scenarios.length > 0);
  }
});

test("registry rejects duplicate component ids", () => {
  const component = {
    id: "duplicate",
    kind: "primitive",
    variants: ["default"],
    status: "stable",
    provenance: "test",
    scenarios: [{ id: "default", label: "Default" }]
  };

  assert.throws(
    () => defineComponentRegistry([component, component]),
    /Duplicate component id/
  );
});

test("registry requires a catalog scenario", () => {
  assert.throws(
    () =>
      defineComponentRegistry([
        {
          id: "uncatalogued",
          kind: "pattern",
          variants: ["default"],
          status: "experimental",
          provenance: "test",
          scenarios: []
        }
      ]),
    /needs at least one catalog scenario/
  );
});
