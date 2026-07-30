import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const foundation = await readFile(
  new URL("../styles/foundation.css", import.meta.url),
  "utf8"
);

test("page flow has no implicit gap and sections own both internal edges", () => {
  assert.match(foundation, /\.slf-page-flow\s*\{[\s\S]*?display:\s*flow-root/);
  assert.match(foundation, /\.slf-section\s*\{[\s\S]*?padding-block-start/);
  assert.match(foundation, /\.slf-section\s*\{[\s\S]*?padding-block-end/);
});

test("containers own width and gutters while grids use minmax zero", () => {
  assert.match(foundation, /\.slf-container\s*\{[\s\S]*?margin-inline:\s*auto/);
  assert.match(foundation, /\.slf-container\s*\{[\s\S]*?container-type:\s*inline-size/);
  assert.match(foundation, /2 \* var\(--slf-gutter\)/);
  assert.match(foundation, /minmax\(0,\s*1fr\)/);
});

test("visual frames reserve space and reduced motion is explicit", () => {
  assert.match(foundation, /\.slf-visual-frame\s*\{[\s\S]*?aspect-ratio:/);
  assert.match(foundation, /prefers-reduced-motion:\s*reduce/);
});

test("foundation has no section-sibling reach or ordinary negative margins", () => {
  assert.doesNotMatch(foundation, /\.slf-section\s*[+~]/);
  assert.doesNotMatch(foundation, /margin(?:-[a-z]+)?:\s*-\d/);
});
