import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const expectedExports = [
  "./astro",
  "./react",
  "./sanity",
  "./registry",
  "./styles/foundation.css"
];

const failures = [];
for (const key of expectedExports) {
  if (!manifest.exports?.[key]) failures.push(`missing export ${key}`);
}

if (manifest.name !== "@spark-line/web-framework") failures.push("unexpected package name");
if (manifest.version !== "0.1.0") failures.push("unexpected package version");
if (!manifest.peerDependencies?.astro) failures.push("Astro must be a peer dependency");
for (const optionalPeer of ["react", "react-dom", "sanity"]) {
  if (!manifest.peerDependenciesMeta?.[optionalPeer]?.optional) {
    failures.push(`${optionalPeer} must be an optional peer`);
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(entryPath) : [entryPath];
      })
    )
  ).flat();
}

const scanRoots = ["src", "styles", "starter"].map((directory) => path.join(root, directory));
const sourceFiles = (await Promise.all(scanRoots.map(walk))).flat();
const forbidden = [
  { label: "jQuery runtime", expression: /\bjQuery\b|\$\(\s*["'`]/ },
  { label: "Webflow runtime reference", expression: /\bWebflow\.(?:push|require|env)\b/ },
  { label: "Webflow utility class", expression: /class(?:Name)?=["'][^"']*\bw-[a-z0-9_-]+/i }
];

for (const file of sourceFiles) {
  if (!/\.(?:astro|css|html|js|mjs|ts|tsx)$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  for (const rule of forbidden) {
    if (rule.expression.test(source)) {
      failures.push(`${rule.label} found in ${path.relative(root, file)}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validated ${manifest.name}@${manifest.version}`);
  console.log(`Checked ${sourceFiles.length} source and starter files`);
}
