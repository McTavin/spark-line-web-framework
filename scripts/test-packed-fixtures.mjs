import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const root = path.resolve(import.meta.dirname, "..");
const work = path.join(root, "tests", ".fixture-work");
const fixtureSource = path.join(root, "tests", "fixtures");
const artifacts = path.join(root, "artifacts");
const npmCache = path.join(root, ".cache", "npm");

await rm(work, { force: true, recursive: true });
await mkdir(work, { recursive: true });

const tarballs = (await readdir(artifacts))
  .filter((file) => file.endsWith(".tgz"))
  .sort();
if (tarballs.length !== 1) {
  throw new Error(
    `Expected exactly one verified tarball in artifacts; found ${tarballs.length}. Run npm run pack:artifact first.`
  );
}
const [tarballName] = tarballs;
const tarball = path.join(artifacts, tarballName);

const supportedFixtures = ["astro-only", "react-island", "sanity"];
const requestedFixtures = process.argv.slice(2);
const fixtures = requestedFixtures.length ? requestedFixtures : supportedFixtures;

await Promise.all(fixtures.map(async (fixture) => {
  if (!supportedFixtures.includes(fixture)) {
    throw new Error(
      `Unknown fixture ${fixture}. Choose one of: ${supportedFixtures.join(", ")}`
    );
  }
  const target = path.join(work, fixture);
  await cp(path.join(fixtureSource, fixture), target, { recursive: true });

  const packagePath = path.join(target, "package.json");
  const manifest = await readFile(packagePath, "utf8");
  await writeFile(packagePath, manifest.replace("__TARBALL__", tarball), "utf8");
  const lockPath = path.join(target, "package-lock.json");
  let hasLock = true;
  try {
    const lock = await readFile(lockPath, "utf8");
    await writeFile(lockPath, lock.replaceAll("__TARBALL__", tarball), "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    hasLock = false;
  }

  await execFileAsync(
    "npm",
    [hasLock ? "ci" : "install", "--ignore-scripts", "--no-audit", "--no-fund"],
    {
      cwd: target,
      env: { ...process.env, npm_config_cache: npmCache },
      maxBuffer: 10 * 1024 * 1024
    }
  );

  await execFileAsync("npm", ["run", fixture === "sanity" ? "test" : "build"], {
    cwd: target,
    env: { ...process.env, npm_config_cache: npmCache },
    maxBuffer: 10 * 1024 * 1024
  });

  if (fixture === "astro-only") {
    for (const absent of ["react", "react-dom", "sanity"]) {
      await assertMissing(path.join(target, "node_modules", absent), absent);
    }
  }
  if (fixture === "react-island") {
    await assertMissing(path.join(target, "node_modules", "sanity"), "sanity");
  }
}));

console.log(
  `Verified one packed tarball in ${fixtures.length} clean fixture${fixtures.length === 1 ? "" : "s"}: ${tarballName}`
);

async function assertMissing(target, label) {
  try {
    await stat(target);
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Unexpected optional runtime in fixture: ${label}`);
}
