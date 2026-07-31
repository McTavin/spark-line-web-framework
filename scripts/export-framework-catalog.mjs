import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createFrameworkCatalogManifest, serializeCatalogManifest } from "../dist/catalog/index.js";

const outputIndex = process.argv.indexOf("--output");
const output = resolve(outputIndex >= 0 ? process.argv[outputIndex + 1] : "dist/component-catalog.json");
const commitIndex = process.argv.indexOf("--commit");
const commit = commitIndex >= 0
  ? process.argv[commitIndex + 1]
  : execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const manifest = createFrameworkCatalogManifest({ commit });
for (const path of new Set([manifest.generated_from.path, ...manifest.components.map((item) => item.source.path)])) {
  execFileSync("git", ["cat-file", "-e", `${commit}:${path}`], { stdio: "ignore" });
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, serializeCatalogManifest(manifest));
console.log(`Wrote ${manifest.components.length} catalog entries to ${output}`);
