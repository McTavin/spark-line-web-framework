import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createFrameworkCatalogManifest, createLumosCatalogManifest, serializeCatalogManifest } from "../dist/catalog/index.js";

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
const lumos = createLumosCatalogManifest({ commit });
for (const item of lumos.components) {
  execFileSync("git", ["cat-file", "-e", `${commit}:${item.source.path}`], { stdio: "ignore" });
}
writeFileSync(resolve(dirname(output), "lumos-catalog.json"), serializeCatalogManifest(lumos));
console.log(`Wrote ${lumos.components.length} Lumos entries with pinned upstream lineage`);
