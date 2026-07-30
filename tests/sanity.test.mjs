import assert from "node:assert/strict";
import test from "node:test";

import {
  defineSectionRegistry,
  defineSectionSchema,
  normalizePageSections
} from "../dist/sanity/index.js";

const registry = defineSectionRegistry([
  {
    type: "heroSection",
    componentId: "hero",
    layouts: ["centered", "split"],
    themes: ["default", "inverse"],
    spaces: ["none", "sm", "md", "lg"],
    defaults: {
      layout: "centered",
      theme: "default",
      spaceTop: "lg",
      spaceBottom: "lg"
    }
  }
]);

test("normalization preserves order, keys, nested content, and source identity", () => {
  const portableText = [{ _type: "block", _key: "copy", children: [] }];
  const source = {
    _type: "heroSection",
    _key: "hero-key",
    heading: "Hello",
    body: portableText,
    image: { _type: "image", asset: { _ref: "image-reference" } },
    _stega: { path: "document.sections[0]" }
  };
  const next = {
    _type: "heroSection",
    _key: "second-key",
    heading: "Next",
    layout: "split"
  };

  const result = normalizePageSections([source, next], registry);

  assert.deepEqual(
    result.map((section) => section.key),
    ["hero-key", "second-key"]
  );
  assert.equal(result[0].componentId, "hero");
  assert.equal(result[0].props.layout, "centered");
  assert.equal(result[0].props.body, portableText);
  assert.equal(result[0].source, source);
  assert.deepEqual(result[0].props._stega, source._stega);
});

test("unknown sections support omit, preserve, and throw policies", () => {
  const unknown = { _type: "futureSection", _key: "future", payload: 23 };

  assert.deepEqual(normalizePageSections([unknown], registry), []);
  assert.deepEqual(
    normalizePageSections([unknown], registry, { onUnknown: "preserve" })[0],
    {
      key: "future",
      type: "futureSection",
      componentId: null,
      props: unknown,
      source: unknown,
      known: false
    }
  );
  assert.throws(
    () => normalizePageSections([unknown], registry, { onUnknown: "throw" }),
    /Unknown Sanity section type/
  );
});

test("normalization rejects unapproved layout decisions", () => {
  assert.throws(
    () =>
      normalizePageSections(
        [{ _type: "heroSection", layout: "freeform" }],
        registry
      ),
    /Invalid layout/
  );
});

test("schema helper offers controlled lists rather than raw class fields", () => {
  const schema = defineSectionSchema({
    name: "pageBuilder",
    title: "Page builder",
    sectionTypes: ["heroSection"],
    themes: ["default", "inverse"],
    spaces: ["none", "md", "lg"],
    layouts: ["centered", "split"]
  });

  assert.equal(schema.type, "object");
  assert.equal(schema.fields.some((field) => field.name === "className"), false);
  assert.equal(schema.fields.some((field) => field.name === "theme"), true);
  assert.equal(schema.fields.some((field) => field.name === "layout"), true);
});
