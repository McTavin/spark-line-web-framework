import { execFileSync } from "node:child_process";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const npmCache = path.join(root, ".cache", "npm");

await mkdir(artifacts, { recursive: true });
for (const file of await readdir(artifacts)) {
  if (file.endsWith(".tgz")) {
    await rm(path.join(artifacts, file), { force: true });
  }
}

const output = execFileSync(
  "npm",
  ["pack", "--ignore-scripts", "--json", "--pack-destination", artifacts],
  {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: npmCache },
    stdio: ["ignore", "pipe", "inherit"]
  }
);
const [report] = JSON.parse(output);

console.log(path.join(artifacts, report.filename));
