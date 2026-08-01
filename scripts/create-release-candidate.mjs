import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
await mkdir(artifacts, { recursive: true });
const files = (await readdir(artifacts, { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort();
const digests = {};
for (const file of files) {
  const bytes = await readFile(path.join(artifacts, file));
  digests[file] = `sha256-${createHash("sha256").update(bytes).digest("hex")}`;
}
const packageLock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
const manifest = {
  schema_version: 1,
  package: "@spark-line/web-framework",
  version: JSON.parse(await readFile(path.join(root, "package.json"), "utf8")).version,
  commit_sha: process.env.V1423_RELEASE_SHA || process.env.GITHUB_SHA || null,
  node: process.version,
  resolved_dependencies: Object.fromEntries(Object.entries(packageLock.packages || {})
    .filter(([key, value]) => key.startsWith("node_modules/") && value.version)
    .map(([key, value]) => [key.slice("node_modules/".length), value.version])),
  artifacts: digests
};
await writeFile(path.join(artifacts, "release-candidate.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote release candidate for ${manifest.package}@${manifest.version}`);
