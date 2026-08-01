import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const base = process.env.VERIFY_BASE_SHA || process.argv[2];
const head = process.env.VERIFY_HEAD_SHA || "HEAD";
const output = base
  ? execFileSync("git", ["diff", "--name-only", `${base}..${head}`], { cwd: root, encoding: "utf8" })
  : execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" })
      .split("\n").filter(Boolean).map((line) => line.slice(3)).join("\n");
const paths = output.split("\n").filter(Boolean);
const packageBoundary = paths.some((file) => /^(package(?:-lock)?\.json|src\/sanity\/|tests\/fixtures\/sanity\/|scripts\/test-packed-fixtures\.mjs)/.test(file));
const browserBoundary = paths.some((file) => /^(src\/(astro|react)\/|styles\/|tests\/fixtures\/react-island\/|scripts\/test-browser\.mjs)/.test(file));
const catalogBoundary = paths.some((file) => /^(src\/(catalog|registry)\/|scripts\/export-framework-catalog\.mjs)/.test(file));

run("npm", ["run", "build"]);
run("npm", ["run", "check"]);
run("npm", ["run", "test:unit"]);
run("npm", ["run", "pack:artifact"]);
const fixtures = ["astro-only", "react-island", ...(packageBoundary ? ["sanity"] : [])];
run("npm", ["run", "test:fixtures", "--", ...fixtures]);
if (browserBoundary) run("npm", ["run", "test:browser"]);
if (catalogBoundary) run("npm", ["run", "catalog:export"]);
run("npm", ["run", "pack:inspect"]);

console.log(JSON.stringify({ paths, fixtures, browser: browserBoundary, catalog: catalogBoundary }, null, 2));

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
}
