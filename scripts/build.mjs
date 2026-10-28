import { mkdir, writeFile } from "node:fs/promises";

const output = new URL("../dist/astro/", import.meta.url);
await mkdir(output, { recursive: true });

const components = [
  "PageFlow",
  "Section",
  "SectionGroup",
  "Container",
  "Stack",
  "Cluster",
  "Grid",
  "VisualFrame",
  "Heading",
  "Text",
  "Action",
  "CardShell",
  "Disclosure"
];

const moduleSource = components
  .map((name) => `export { default as ${name} } from "../../src/astro/${name}.astro";`)
  .join("\n");

await writeFile(new URL("index.js", output), `${moduleSource}\n`, "utf8");

const lumosOutput = new URL("../dist/lumos/", import.meta.url);
await mkdir(lumosOutput, { recursive: true });
const lumos = {
  Section: "wrapper/Section", ContentWrapper: "wrapper/ContentWrapper", Grid: "wrapper/Grid",
  Heading: "typography/Heading", Paragraph: "typography/Paragraph", Eyebrow: "typography/Eyebrow",
  RichText: "typography/RichText", Button: "Button", Card: "item/Card"
};
await writeFile(new URL("index.js", lumosOutput), Object.entries(lumos)
  .map(([name, file]) => `export { default as ${name} } from "../../src/lumos/components/${file}.astro";`)
  .join("\n") + "\n", "utf8");
