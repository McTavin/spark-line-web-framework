const documentationPatterns = [
  /^README\.md$/,
  /^LICENSE$/,
  /^\.gitignore$/,
  /^skills\/.*\.(?:md|ya?ml)$/
];

const fullRiskPatterns = [
  /^\.github\//,
  /^package(?:-lock)?\.json$/,
  /^tsconfig\.build\.json$/,
  /^\.npmrc$/,
  /^\.nvmrc$/,
  /^starter\//,
  /^skills\/.*\/(?:assets|scripts)\//,
  /^scripts\/(?:build|clean|create-pack|create-release-candidate|inspect-pack|test-packed-fixtures|validate-package|verify-changed|verification-plan)\.mjs$/
];

const astroPattern = /^(?:src\/astro\/|tests\/fixtures\/astro-only\/)/;
const reactPattern = /^(?:src\/react\/|tests\/fixtures\/react-island\/)/;
const sanityPattern = /^(?:src\/sanity\/|tests\/fixtures\/sanity\/)/;
const stylesPattern = /^styles\//;
const catalogPattern = /^(?:src\/(?:catalog|registry)\/|scripts\/export-framework-catalog\.mjs$)/;
const browserToolPattern = /^scripts\/test-browser\.mjs$/;
const unitTestPattern = /^tests\/[^/]+\.test\.mjs$/;
const skillRoot = "skills/astro-sanity-publishing/";
const skillContentPatterns = [
  /^SKILL\.md$/,
  /^references\/[^/]+\.md$/,
  /^agents\/openai\.yaml$/,
  /^tests\/content\.test\.mjs$/
];
const skillSuites = new Map([
  ["assets/helpers/maintenance-patches.mjs", "maintenance"],
  ["assets/helpers/studio-version.mjs", "maintenance"],
  ["assets/helpers/verify-deployment.mjs", "maintenance"],
  ["tests/maintenance.test.mjs", "maintenance"],
  ["assets/helpers/verify-worker-deployment.mjs", "deployment"],
  ["assets/workflows/deploy-sanity-studio.yml", "deployment"],
  ["assets/workflows/deploy-editor-preview.yml", "deployment"],
  ["tests/deployment.test.mjs", "deployment"]
]);
const skillPackageTest = "tests/astro-sanity-skill-package.test.mjs";
const designSkillRoot = "skills/spark-line-product-design/";
const designSkillTest = "tests/spark-line-product-design.test.mjs";

function isDesignSkillPath(file) {
  return file === designSkillTest || (file.startsWith(designSkillRoot)
    && /^(?:SKILL\.md|references\/[^/]+\.md|agents\/openai\.yaml)$/.test(file.slice(designSkillRoot.length)));
}

export function createVerificationPlan(inputPaths, { forceFull = false } = {}) {
  const paths = [...new Set(inputPaths.filter(Boolean))].sort();

  if (forceFull) {
    return plan("full", paths, fullSteps(), []);
  }

  if (paths.length === 0) {
    return plan("none", paths, [], []);
  }

  const unknownPaths = paths.filter((file) => !isKnownPath(file));
  if (unknownPaths.length > 0 || paths.some(isFullRiskPath)) {
    return plan("full", paths, fullSteps(), unknownPaths);
  }

  if (paths.every(isDocumentationPath)) {
    return plan("documentation", paths, [], []);
  }

  const astro = paths.some((file) => astroPattern.test(file));
  const react = paths.some((file) => reactPattern.test(file));
  const sanity = paths.some((file) => sanityPattern.test(file));
  const styles = paths.some((file) => stylesPattern.test(file));
  const catalog = paths.some((file) => catalogPattern.test(file));
  const browserTool = paths.some((file) => browserToolPattern.test(file));
  const unitTests = paths.some((file) => unitTestPattern.test(file) && !skillSurface(file) && !isDesignSkillPath(file));
  const skillChanges = new Set(paths.map(skillSurface).filter(Boolean));
  const designSkillChanges = paths.some(isDesignSkillPath);
  const browser = astro || react || styles || browserTool;
  const packageFixture = astro || react || sanity || styles || browserTool;
  const build = packageFixture || catalog || unitTests;
  const steps = [];

  if (build) {
    steps.push(
      npmStep("build", ["run", "build"]),
      npmStep("validate-package", ["run", "check:package"]),
      npmStep("unit", ["run", "test:unit"])
    );
  }

  if (catalog) {
    steps.push(npmStep("catalog", ["run", "catalog:export"]));
  }

  if (packageFixture) {
    steps.push(npmStep("pack", ["run", "pack:artifact"]));
    const fixtures = [];
    if (astro || styles) fixtures.push("astro-only");
    if (react || styles || browser) fixtures.push("react-island");
    if (sanity) fixtures.push("sanity");
    steps.push(npmStep("fixtures", ["run", "test:fixtures", "--", ...fixtures]));
    if (browser) steps.push(npmStep("browser", ["run", "test:browser"]));
    steps.push(npmStep("inspect-pack", ["run", "pack:inspect"]));
  }

  // The repository unit runner already includes all portable suites and package
  // assertions. Do not run the same test files twice for mixed changes.
  if (skillChanges.size > 0 && !build) {
    steps.push(skillTestStep("content"));
    for (const suite of ["maintenance", "deployment"]) {
      if (skillChanges.has(suite)) steps.push(skillTestStep(suite));
    }
    if ([...skillChanges].some((surface) => surface !== "content")) {
      steps.push({ id: "skill-package", command: "node", args: ["--test", skillPackageTest] });
    }
  }
  if (designSkillChanges && !build) {
    steps.push({ id: "design-skill", command: "node", args: ["--test", designSkillTest] });
  }

  const boundaries = [
    ...(catalog ? ["catalog"] : []),
    ...(sanity ? ["sanity"] : []),
    ...(browser ? ["browser"] : []),
    ...(!catalog && !sanity && !browser && unitTests ? ["unit"] : []),
    ...(skillChanges.size > 0 || designSkillChanges ? ["skill"] : [])
  ];

  return plan(boundaries.join("+") || "targeted", paths, steps, []);
}

function fullSteps() {
  return [
    npmStep("build", ["run", "build"]),
    npmStep("validate-package", ["run", "check:package"]),
    npmStep("unit", ["run", "test:unit"]),
    npmStep("catalog", ["run", "catalog:export"]),
    npmStep("pack", ["run", "pack:artifact"]),
    npmStep("fixtures", ["run", "test:fixtures", "--", "astro-only", "react-island", "sanity"]),
    npmStep("browser", ["run", "test:browser"]),
    npmStep("inspect-pack", ["run", "pack:inspect"])
  ];
}

function plan(profile, paths, steps, unknownPaths) {
  return {
    profile,
    paths,
    unknownPaths,
    needsDependencies: steps.some((entry) => entry.command === "npm"),
    needsBrowser: steps.some((entry) => entry.id === "browser"),
    steps
  };
}

function npmStep(id, args) {
  return { id, command: "npm", args };
}

function skillTestStep(suite) {
  return {
    id: `skill-${suite}`,
    command: "node",
    args: ["--test", `${skillRoot}tests/${suite}.test.mjs`]
  };
}

function skillSurface(file) {
  if (file === skillPackageTest) return "package";
  if (!file.startsWith(skillRoot)) return undefined;
  const relative = file.slice(skillRoot.length);
  if (skillContentPatterns.some((pattern) => pattern.test(relative))) return "content";
  return skillSuites.get(relative);
}

function isDocumentationPath(file) {
  return !file.startsWith(skillRoot) && !file.startsWith(designSkillRoot) && !isFullRiskPath(file)
    && documentationPatterns.some((pattern) => pattern.test(file));
}

function isFullRiskPath(file) {
  return !skillSurface(file) && fullRiskPatterns.some((pattern) => pattern.test(file));
}

function isKnownPath(file) {
  return Boolean(skillSurface(file))
    || isDesignSkillPath(file)
    || isDocumentationPath(file)
    || isFullRiskPath(file)
    || astroPattern.test(file)
    || reactPattern.test(file)
    || sanityPattern.test(file)
    || stylesPattern.test(file)
    || catalogPattern.test(file)
    || browserToolPattern.test(file)
    || unitTestPattern.test(file);
}
