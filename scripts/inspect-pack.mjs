import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const tarballs = (await readdir(artifacts))
  .filter((file) => file.endsWith(".tgz"))
  .sort();

if (tarballs.length !== 1) {
  throw new Error(`Expected exactly one tarball in artifacts; found ${tarballs.length}`);
}

const [filename] = tarballs;
const tarball = path.join(artifacts, filename);
const archive = await readFile(tarball);
const details = await stat(tarball);
const entries = execFileSync("tar", ["-tzf", tarball], {
  encoding: "utf8"
})
  .trim()
  .split("\n");
const manifest = JSON.parse(
  execFileSync("tar", ["-xOzf", tarball, "package/package.json"], {
    encoding: "utf8"
  })
);

console.log(`${manifest.name}@${manifest.version}`);
console.log(`filename: ${filename}`);
console.log(`files: ${entries.length}`);
console.log(`packed bytes: ${details.size}`);
console.log(`sha256: ${createHash("sha256").update(archive).digest("hex")}`);
for (const entry of entries) console.log(entry.replace(/^package\//, ""));
