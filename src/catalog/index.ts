import type { CatalogScenario, ComponentKind, ComponentStatus } from "../registry/index.js";
import { frameworkRegistry } from "../registry/index.js";

export const CATALOG_SCHEMA_VERSION = 1 as const;

export type CatalogFramework = "astro" | "react";
export type CatalogScope = "system" | "workspace";
export type CatalogAvailability = ComponentStatus | "unavailable";

export interface GitSourceReference {
  repository: string;
  path: string;
  commit: string;
}

export interface PackageReference {
  name: string;
  version: string;
  export: string;
}

export interface CatalogAssetRequirement {
  id: string;
  kind: "asset" | "font" | "license";
  status: "available" | "unavailable";
  note?: string;
}

export interface CatalogLineage {
  component_id: string;
  source: GitSourceReference;
}

export interface CatalogComponent {
  id: string;
  name: string;
  description?: string;
  framework: CatalogFramework;
  kind: ComponentKind;
  scope: CatalogScope;
  workspace_id?: string;
  variants: readonly string[];
  scenarios: readonly CatalogScenario[];
  status: CatalogAvailability;
  source: GitSourceReference;
  package?: PackageReference;
  assets?: readonly CatalogAssetRequirement[];
  lineage?: CatalogLineage;
  tags?: readonly string[];
}

export interface CatalogManifest {
  schema_version: typeof CATALOG_SCHEMA_VERSION;
  generated_from: GitSourceReference;
  components: readonly CatalogComponent[];
}

export interface CatalogValidationResult {
  valid: boolean;
  errors: readonly string[];
}

const idPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const commitPattern = /^[0-9a-f]{40}$/;
const frameworks = new Set<CatalogFramework>(["astro", "react"]);
const scopes = new Set<CatalogScope>(["system", "workspace"]);
const statuses = new Set<CatalogAvailability>([
  "stable",
  "experimental",
  "deprecated",
  "unavailable"
]);

function validateSource(source: GitSourceReference, label: string, errors: string[]) {
  if (!source.repository.trim()) errors.push(`${label}.repository is required`);
  if (!source.path.trim() || source.path.startsWith("/") || source.path.split("/").includes("..")) {
    errors.push(`${label}.path must be repository-relative`);
  }
  if (!commitPattern.test(source.commit)) errors.push(`${label}.commit must be a full lowercase Git SHA`);
}

export function validateCatalogManifest(input: unknown): CatalogValidationResult {
  const errors: string[] = [];
  const manifest = input as Partial<CatalogManifest> | null;

  if (!manifest || typeof manifest !== "object") return { valid: false, errors: ["manifest must be an object"] };
  if (manifest.schema_version !== CATALOG_SCHEMA_VERSION) errors.push(`schema_version must be ${CATALOG_SCHEMA_VERSION}`);
  if (!manifest.generated_from) errors.push("generated_from is required");
  else validateSource(manifest.generated_from, "generated_from", errors);
  if (!Array.isArray(manifest.components)) errors.push("components must be an array");

  const keys = new Set<string>();
  for (const [index, component] of (manifest.components ?? []).entries()) {
    const label = `components[${index}]`;
    if (!idPattern.test(component.id ?? "")) errors.push(`${label}.id must be a stable lowercase identifier`);
    if (!component.name?.trim()) errors.push(`${label}.name is required`);
    if (!frameworks.has(component.framework)) errors.push(`${label}.framework must be astro or react`);
    if (!scopes.has(component.scope)) errors.push(`${label}.scope must be system or workspace`);
    if (component.scope === "workspace" && !component.workspace_id?.trim()) errors.push(`${label}.workspace_id is required for workspace scope`);
    if (component.scope === "system" && component.workspace_id) errors.push(`${label}.workspace_id is not allowed for system scope`);
    if (!statuses.has(component.status)) errors.push(`${label}.status is invalid`);
    if (!Array.isArray(component.variants) || component.variants.length === 0) errors.push(`${label}.variants must not be empty`);
    if (!Array.isArray(component.scenarios) || component.scenarios.length === 0) errors.push(`${label}.scenarios must not be empty`);
    if (component.source) validateSource(component.source, `${label}.source`, errors);
    else errors.push(`${label}.source is required`);
    if (component.lineage) validateSource(component.lineage.source, `${label}.lineage.source`, errors);
    if (component.package && (!component.package.name || !component.package.version || !component.package.export)) {
      errors.push(`${label}.package requires name, version, and export`);
    }

    const key = `${component.scope}:${component.workspace_id ?? "system"}:${component.framework}:${component.id}`;
    if (keys.has(key)) errors.push(`${label} duplicates ${key}`);
    keys.add(key);
  }

  return { valid: errors.length === 0, errors };
}

export function defineCatalogManifest<const Manifest extends CatalogManifest>(manifest: Manifest): Readonly<Manifest> {
  const result = validateCatalogManifest(manifest);
  if (!result.valid) throw new Error(`Invalid component catalog:\n${result.errors.map((error) => `- ${error}`).join("\n")}`);
  return Object.freeze(manifest);
}

export function serializeCatalogManifest(manifest: CatalogManifest): string {
  const result = validateCatalogManifest(manifest);
  if (!result.valid) throw new Error(`Invalid component catalog:\n${result.errors.map((error) => `- ${error}`).join("\n")}`);
  const deterministic = {
    ...manifest,
    components: [...manifest.components].sort((a, b) => {
      const left = `${a.scope}:${a.workspace_id ?? ""}:${a.framework}:${a.id}`;
      const right = `${b.scope}:${b.workspace_id ?? ""}:${b.framework}:${b.id}`;
      return left.localeCompare(right);
    })
  };
  return `${JSON.stringify(deterministic, null, 2)}\n`;
}

const presentationalSources = {
  action: "Action",
  heading: "Heading",
  text: "Text",
  "card-shell": "CardShell",
  stack: "Stack",
  cluster: "Cluster",
  grid: "Grid",
  container: "Container"
} as const;

export function createFrameworkCatalogManifest({
  commit,
  repository = "https://github.com/McTavin/spark-line-web-framework.git"
}: {
  commit: string;
  repository?: string;
}): Readonly<CatalogManifest> {
  const components: CatalogComponent[] = [];
  for (const [id, sourceName] of Object.entries(presentationalSources)) {
    const definition = frameworkRegistry.require(id);
    for (const framework of ["astro", "react"] as const) {
      components.push({
        id,
        name: sourceName.replace(/([a-z])([A-Z])/g, "$1 $2"),
        description: `Neutral ${id} presentational primitive.`,
        framework,
        kind: definition.kind,
        scope: "system",
        variants: definition.variants,
        scenarios: definition.scenarios,
        status: definition.status,
        source: {
          repository,
          path: framework === "astro" ? `src/astro/${sourceName}.astro` : "src/react/Primitives.tsx",
          commit
        },
        package: {
          name: "@spark-line/web-framework",
          version: "0.2.0",
          export: framework === "astro" ? "./astro" : "./react"
        },
        tags: ["universal", "presentational", id]
      });
    }
  }
  return defineCatalogManifest({
    schema_version: CATALOG_SCHEMA_VERSION,
    generated_from: { repository, path: "src/catalog/index.ts", commit },
    components
  });
}
