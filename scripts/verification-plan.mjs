const documentationPatterns = [
  /^README\.md$/,
  /^LICENSE$/,
  /^\.gitignore$/,
  /^\.github\//,
  /^skills\/.*\.(?:md|ya?ml)$/
];

const fullRiskPatterns = [
  /^package(?:-lock)?\.json$/,
  /^tsconfig\.build\.json$/,
  /^\.npmrc$/,
  /^\.nvmrc$/,
  /^starter\//,
  /^skills\/.*\/scripts\//,
  /^scripts\/(?:build|clean|create-pack|create-release-candidate|inspect-pack|test-packed-fixtures|validate-package|verify-changed|verification-plan)\.mjs$/
];

const astroPattern = /^(?:src\/astro\/|tests\/fixtures\/astro-only\/)/;
const reactPattern = /^(?:src\/react\/|tests\/fixtures\/react-island\/)/;
const sanityPattern = /^(?:src\/sanity\/|tests\/fixtures\/sanity\/)/;
const stylesPattern = /^styles\//;
const catalogPattern = /^(?:src\/(?:catalog|registry)\/|scripts\/export-framework-catalog\.mjs$)/;
const browserToolPattern = /^scripts\/test-browser\.mjs$/;
const unitTestPattern = /^tests\/[^/]+\.test\.mjs$/;

export function createVerificationPlan(inputPaths, { forceFull = false } = {}) {
  const paths = [...new Set(inputPaths.filter(Boolean))].sort();

  if (forceFull) {
    return plan("full", paths, fullSteps(), []);
  }

  if (paths.length === 0) {
    return plan("none", paths, [], []);
  }

  if (paths.every(isDocumentationPath)) {
    return plan("documentation", paths, [], []);
  }

  const unknownPaths = paths.filter((file) => !isKnownPath(file));
  if (unknownPaths.length > 0 || paths.some(isFullRiskPath)) {
    return plan("full", paths, fullSteps(), unknownPaths);
  }

  const astro = paths.some((file) => astroPattern.test(file));
  const react = paths.some((file) => reactPattern.test(file));
  const sanity = paths.some((file) => sanityPattern.test(file));
  const styles = paths.some((file) => stylesPattern.test(file));
  const catalog = paths.some((file) => catalogPattern.test(file));
  const browserTool = paths.some((file) => browserToolPattern.test(file));
  const unitTests = paths.some((file) => unitTestPattern.test(file));
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

  const boundaries = [
    ...(catalog ? ["catalog"] : []),
    ...(sanity ? ["sanity"] : []),
    ...(browser ? ["browser"] : []),
    ...(!catalog && !sanity && !browser && unitTests ? ["unit"] : [])
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
    needsDependencies: steps.length > 0,
    needsBrowser: steps.some((entry) => entry.id === "browser"),
    steps
  };
}

function npmStep(id, args) {
  return { id, command: "npm", args };
}

function isDocumentationPath(file) {
  return documentationPatterns.some((pattern) => pattern.test(file));
}

function isFullRiskPath(file) {
  return fullRiskPatterns.some((pattern) => pattern.test(file));
}

function isKnownPath(file) {
  return isDocumentationPath(file)
    || isFullRiskPath(file)
    || astroPattern.test(file)
    || reactPattern.test(file)
    || sanityPattern.test(file)
    || stylesPattern.test(file)
    || catalogPattern.test(file)
    || browserToolPattern.test(file)
    || unitTestPattern.test(file);
}
