import assert from "node:assert/strict";
import {
  defineSectionRegistry,
  normalizePageSections
} from "@spark-line/web-framework/sanity";

const registry = defineSectionRegistry([
  {
    type: "heroSection",
    componentId: "hero",
    layouts: ["centered"]
  }
]);

const source = {
  _type: "heroSection",
  _key: "hero",
  layout: "centered",
  body: [{ _type: "block", children: [] }]
};
const [section] = normalizePageSections([source], registry);

assert.equal(section.componentId, "hero");
assert.equal(section.source, source);
assert.equal(section.props.body, source.body);
