import assert from "node:assert/strict";
import test from "node:test";

import { createVerificationPlan } from "../scripts/verification-plan.mjs";

const stepIds = (plan) => plan.steps.map((step) => step.id);

test("documentation changes do not install dependencies or run suites", () => {
  const plan = createVerificationPlan([
    "README.md",
    "skills/spark-line-web-framework/SKILL.md",
    "skills/astro-sanity-publishing/SKILL.md",
    "skills/astro-sanity-publishing/references/delivery.md",
    "skills/astro-sanity-publishing/agents/openai.yaml"
  ]);

  assert.equal(plan.profile, "documentation");
  assert.equal(plan.needsDependencies, false);
  assert.equal(plan.needsBrowser, false);
  assert.deepEqual(stepIds(plan), []);
});

test("skill executable assets cannot be mistaken for documentation by extension", () => {
  for (const file of [
    "skills/astro-sanity-publishing/assets/workflows/deploy-sanity-studio.yml",
    "skills/astro-sanity-publishing/assets/workflows/deploy-editor-preview.yaml",
    "skills/astro-sanity-publishing/assets/helpers/maintenance-patches.mjs",
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


test("manual verification can force the complete profile even without a diff", () => {
  const plan = createVerificationPlan([], { forceFull: true });

  assert.equal(plan.profile, "full");
  assert.equal(plan.needsDependencies, true);
  assert.equal(plan.needsBrowser, true);
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
    const plan = createVerificationPlan([file]);
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
