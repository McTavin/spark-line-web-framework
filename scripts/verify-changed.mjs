import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import path from "node:path";

import { createVerificationPlan } from "./verification-plan.mjs";

const root = path.resolve(import.meta.dirname, "..");
const base = process.env.VERIFY_BASE_SHA || process.argv[2];
const head = process.env.VERIFY_HEAD_SHA || "HEAD";
const output = base
  ? execFileSync("git", ["diff", "--name-only", `${base}..${head}`], { cwd: root, encoding: "utf8" })
  : execFileSync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: root, encoding: "utf8" })
      .split("\n").filter(Boolean).map((line) => line.slice(3)).join("\n");
const paths = output.split("\n").filter(Boolean);
const plan = createVerificationPlan(paths, {
  forceFull: process.env.VERIFY_FORCE_FULL === "true"
});

if (process.argv.includes("--plan")) {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `profile=${plan.profile}\nneeds_dependencies=${plan.needsDependencies}\nneeds_browser=${plan.needsBrowser}\n`
    );
  }
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

if (base) {
  run("git", ["diff", "--check", `${base}..${head}`]);
} else {
  run("git", ["diff", "--check"]);
  run("git", ["diff", "--cached", "--check"]);
}

for (const step of plan.steps) {
  run(step.command, step.args);
}

console.log(JSON.stringify(plan, null, 2));

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit", env: process.env });
}
