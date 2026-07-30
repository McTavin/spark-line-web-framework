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
