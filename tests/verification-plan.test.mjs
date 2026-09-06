import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createVerificationPlan } from "../scripts/verification-plan.mjs";

const stepIds = (plan) => plan.steps.map((step) => step.id);

test("documentation changes do not install dependencies or run suites", () => {
  const plan = createVerificationPlan([
    "README.md",
    "skills/spark-line-web-framework/SKILL.md"
  ]);

  assert.equal(plan.profile, "documentation");
  assert.equal(plan.needsDependencies, false);
  assert.equal(plan.needsBrowser, false);
  assert.deepEqual(stepIds(plan), []);
});

test("publishing skill instructions and metadata run only portable content validation", () => {
  for (const file of [
    "SKILL.md",
    "references/delivery.md",
    "agents/openai.yaml",
    "tests/content.test.mjs"
  ]) {
    const plan = createVerificationPlan(["README.md", `skills/astro-sanity-publishing/${file}`]);
    assert.equal(plan.profile, "skill");
    assert.equal(plan.needsDependencies, false);
    assert.equal(plan.needsBrowser, false);
    assert.deepEqual(stepIds(plan), ["skill-content"]);
    assert.deepEqual(plan.steps[0].args, ["--test", "skills/astro-sanity-publishing/tests/content.test.mjs"]);
  }
});

test("product design instructions, metadata and test select only their content and package check", () => {
  for (const file of [
    "skills/spark-line-product-design/SKILL.md",
    "skills/spark-line-product-design/references/framework-decisions.md",
    "skills/spark-line-product-design/agents/openai.yaml",
    "tests/spark-line-product-design.test.mjs"
  ]) {
    const plan = createVerificationPlan(["README.md", file]);
    assert.equal(plan.profile, "skill");
    assert.equal(plan.needsDependencies, false);
    assert.equal(plan.needsBrowser, false);
    assert.deepEqual(plan.steps, [{
      id: "design-skill", command: "node", args: ["--test", "tests/spark-line-product-design.test.mjs"]
    }]);
  }
});

test("product design and publishing skill checks combine without dropping or repeating suites", () => {
  const plan = createVerificationPlan([
    "skills/spark-line-product-design/SKILL.md",
    "tests/spark-line-product-design.test.mjs",
    "skills/astro-sanity-publishing/assets/helpers/maintenance-patches.mjs",
    "skills/astro-sanity-publishing/assets/workflows/deploy-editor-preview.yml"
  ]);
  assert.equal(plan.profile, "skill");
  assert.equal(plan.needsDependencies, false);
  assert.equal(plan.needsBrowser, false);
  assert.deepEqual(stepIds(plan), ["skill-content", "skill-maintenance", "skill-deployment", "skill-package", "design-skill"]);
});

test("mixed product design and runtime changes keep runtime boundaries and use the existing unit runner once", () => {
  for (const [file, profile, fixture, browser] of [
    ["src/sanity/index.ts", "sanity+skill", "sanity", false],
    ["src/react/Tabs.tsx", "browser+skill", "react-island", true]
  ]) {
    const plan = createVerificationPlan(["skills/spark-line-product-design/SKILL.md", file]);
    assert.equal(plan.profile, profile);
    assert.equal(plan.needsDependencies, true);
    assert.equal(plan.needsBrowser, browser);
    assert.equal(stepIds(plan).filter((id) => id === "unit").length, 1);
    assert.ok(!stepIds(plan).includes("design-skill"));
    assert.deepEqual(plan.steps.find((step) => step.id === "fixtures").args.slice(-1), [fixture]);
  }
});

test("product design changes never downgrade full-risk inputs or unknown executable paths", () => {
  for (const file of [
    "package-lock.json",
    "scripts/verification-plan.mjs",
    "skills/spark-line-product-design/assets/workflows/future.yml",
    "skills/spark-line-product-design/scripts/future.mjs",
    "skills/spark-line-product-design/agents/execute.yaml",
    "skills/spark-line-product-design/tests/future.test.mjs"
  ]) {
    const plan = createVerificationPlan(["skills/spark-line-product-design/SKILL.md", file]);
    assert.equal(plan.profile, "full", file);
    assert.equal(plan.needsDependencies, true, file);
    assert.equal(plan.needsBrowser, true, file);
    assert.ok(stepIds(plan).includes("unit"), file);
    assert.ok(stepIds(plan).includes("inspect-pack"), file);
  }
  assert.equal(createVerificationPlan(["skills/spark-line-product-design/SKILL.md"], { forceFull: true }).profile, "full");
});

test("known maintenance helpers and tests select only their portable suite and package checks", () => {
  for (const file of [
    "assets/helpers/maintenance-patches.mjs",
    "assets/helpers/studio-version.mjs",
    "assets/helpers/verify-deployment.mjs",
    "tests/maintenance.test.mjs"
  ]) {
    const plan = createVerificationPlan([`skills/astro-sanity-publishing/${file}`]);
    assert.equal(plan.profile, "skill");
    assert.equal(plan.needsDependencies, false);
    assert.equal(plan.needsBrowser, false);
    assert.deepEqual(stepIds(plan), ["skill-content", "skill-maintenance", "skill-package"]);
    assert.ok(plan.steps.every((step) => step.command === "node"));
  }
});

test("known executable workflows and Worker verification select deployment coverage, not documentation", () => {
  for (const file of [
    "assets/workflows/deploy-sanity-studio.yml",
    "assets/workflows/deploy-editor-preview.yml",
    "assets/helpers/verify-worker-deployment.mjs",
    "tests/deployment.test.mjs"
  ]) {
    const plan = createVerificationPlan([`skills/astro-sanity-publishing/${file}`]);
    assert.equal(plan.profile, "skill");
    assert.equal(plan.needsDependencies, false);
    assert.equal(plan.needsBrowser, false);
    assert.deepEqual(stepIds(plan), ["skill-content", "skill-deployment", "skill-package"]);
  }
});

test("portable suites and repository package assertions are unioned without duplicate steps", () => {
  const plan = createVerificationPlan([
    "skills/astro-sanity-publishing/SKILL.md",
    "skills/astro-sanity-publishing/assets/helpers/maintenance-patches.mjs",
    "skills/astro-sanity-publishing/tests/maintenance.test.mjs",
    "skills/astro-sanity-publishing/assets/workflows/deploy-editor-preview.yml",
    "tests/astro-sanity-skill-package.test.mjs",
    "tests/astro-sanity-skill-package.test.mjs"
  ]);
  assert.deepEqual(stepIds(plan), ["skill-content", "skill-maintenance", "skill-deployment", "skill-package"]);
  assert.equal(plan.needsDependencies, false);
  assert.deepEqual(plan.steps.at(-1).args, ["--test", "tests/astro-sanity-skill-package.test.mjs"]);

  const packageOnly = createVerificationPlan(["tests/astro-sanity-skill-package.test.mjs"]);
  assert.deepEqual(stepIds(packageOnly), ["skill-content", "skill-package"]);
});

test("unknown skill executable assets cannot be mistaken for documentation by extension", () => {
  for (const file of [
    "skills/astro-sanity-publishing/assets/workflows/deploy-editor-preview.yaml",
    "skills/astro-sanity-publishing/assets/helpers/future-helper.mjs",
    "skills/astro-sanity-publishing/assets/README.md",
    "skills/spark-line-web-framework/scripts/settings.yaml",
    "skills/spark-line-web-framework/resources/scripts/settings.yaml"
  ]) {
    const plan = createVerificationPlan(["README.md", file]);
    assert.equal(plan.profile, "full", file);
    assert.equal(plan.needsDependencies, true, file);
    assert.ok(stepIds(plan).includes("unit"), file);
    assert.ok(stepIds(plan).includes("pack"), file);
    assert.ok(stepIds(plan).includes("inspect-pack"), file);
    assert.deepEqual(plan.unknownPaths, [], file);
  }
});

test("unknown portable tests and configuration fail closed", () => {
  for (const file of [
    "skills/astro-sanity-publishing/tests/future.test.mjs",
    "skills/astro-sanity-publishing/agents/execute.yaml"
  ]) {
    const plan = createVerificationPlan(["skills/astro-sanity-publishing/SKILL.md", file]);
    assert.equal(plan.profile, "full");
    assert.deepEqual(plan.unknownPaths, [file]);
  }
});

test("catalog changes run build, package validation, units, and catalog export only", () => {
  const plan = createVerificationPlan(["src/catalog/index.ts"]);

  assert.equal(plan.profile, "catalog");
  assert.equal(plan.needsBrowser, false);
  assert.deepEqual(stepIds(plan), ["build", "validate-package", "unit", "catalog"]);
});

test("sanity changes run only the sanity packed fixture", () => {
  const plan = createVerificationPlan(["src/sanity/index.ts"]);

  assert.equal(plan.profile, "sanity");
  assert.equal(plan.needsBrowser, false);
  assert.deepEqual(stepIds(plan), [
    "build",
    "validate-package",
    "unit",
    "pack",
    "fixtures",
    "inspect-pack"
  ]);
  assert.deepEqual(plan.steps.find((step) => step.id === "fixtures").args.slice(-1), ["sanity"]);
});

test("react changes run the react fixture and browser checks without unrelated fixtures", () => {
  const plan = createVerificationPlan(["src/react/Tabs.tsx"]);

  assert.equal(plan.profile, "browser");
  assert.equal(plan.needsBrowser, true);
  assert.deepEqual(stepIds(plan), [
    "build",
    "validate-package",
    "unit",
    "pack",
    "fixtures",
    "browser",
    "inspect-pack"
  ]);
  assert.deepEqual(plan.steps.find((step) => step.id === "fixtures").args.slice(-1), ["react-island"]);
});

test("mixed skill and runtime changes retain boundary verification without repeating portable tests", () => {
  for (const [runtimePath, profile, fixture, needsBrowser] of [
    ["src/sanity/index.ts", "sanity+skill", "sanity", false],
    ["src/react/Tabs.tsx", "browser+skill", "react-island", true]
  ]) {
    const plan = createVerificationPlan([
      runtimePath,
      "skills/astro-sanity-publishing/assets/helpers/maintenance-patches.mjs",
      "skills/astro-sanity-publishing/assets/workflows/deploy-editor-preview.yml"
    ]);
    assert.equal(plan.profile, profile);
    assert.equal(plan.needsDependencies, true);
    assert.equal(plan.needsBrowser, needsBrowser);
    assert.equal(stepIds(plan).filter((id) => id === "unit").length, 1);
    assert.ok(!stepIds(plan).some((id) => id.startsWith("skill-")));
    assert.deepEqual(plan.steps.find((step) => step.id === "fixtures").args.slice(-1), [fixture]);
  }
});


test("manual verification can force the complete profile even without a diff", () => {
  const plan = createVerificationPlan([], { forceFull: true });

  assert.equal(plan.profile, "full");
  assert.equal(plan.needsDependencies, true);
  assert.equal(plan.needsBrowser, true);
  assert.equal(createVerificationPlan(["skills/astro-sanity-publishing/SKILL.md"], { forceFull: true }).profile, "full");
});

test("toolchain and unknown changes fail closed to one full changed-surface suite", () => {
  for (const file of [
    ".github/workflows/verify.yml",
    ".github/dependabot.yml",
    "package.json",
    "package-lock.json",
    "scripts/verify-changed.mjs",
    "skills/spark-line-web-framework/scripts/audit_layout.mjs",
    "src/future/new-boundary.ts"
  ]) {
    const plan = createVerificationPlan([file, "skills/astro-sanity-publishing/SKILL.md"]);
    assert.equal(plan.profile, "full");
    assert.equal(plan.needsBrowser, true);
    assert.deepEqual(stepIds(plan), [
      "build",
      "validate-package",
      "unit",
      "catalog",
      "pack",
      "fixtures",
      "browser",
      "inspect-pack"
    ]);
  }
});

test("CI pins Node before planning while dependencies and browser setup remain conditional", () => {
  const workflow = readFileSync(new URL("../.github/workflows/verify.yml", import.meta.url), "utf8");
  const setup = workflow.indexOf("- uses: actions/setup-node@v4");
  const plan = workflow.indexOf("- name: Plan verification");
  assert.ok(setup >= 0 && setup < plan);
  assert.match(workflow.slice(setup, plan), /node-version: 24/);
  assert.doesNotMatch(workflow.slice(setup, plan), /if:/);
  assert.match(workflow, /- run: npm ci\n\s+if: steps\.plan\.outputs\.needs_dependencies == 'true'/);
  assert.match(workflow, /- name: Prefer installed Chrome\n\s+if: steps\.plan\.outputs\.needs_browser == 'true'/);
});
