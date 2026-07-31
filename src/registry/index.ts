export type ComponentKind = "primitive" | "section" | "island" | "pattern" | "composition";
export type ComponentStatus = "stable" | "experimental" | "deprecated";
export const WEB_FRAMEWORK_LAYOUT_PROFILE_ID = "@spark-line/web-framework/layout-v1" as const;
export type CompositionRole = "section" | "container" | "layout" | "surface" | "content" | "control" | "composition";

export interface ComponentComposition {
  profile: typeof WEB_FRAMEWORK_LAYOUT_PROFILE_ID | string;
  role: CompositionRole;
  exceptions: readonly string[];
}

export interface CatalogScenario {
  id: string;
  label: string;
  description?: string;
}

export interface ComponentDefinition<Variant extends string = string> {
  id: string;
  kind: ComponentKind;
  variants: readonly Variant[];
  status: ComponentStatus;
  provenance: string;
  scenarios: readonly CatalogScenario[];
  composition?: ComponentComposition;
}

export interface ComponentRegistry<
  Definition extends ComponentDefinition = ComponentDefinition
> {
  readonly components: readonly Definition[];
  get(id: string): Definition | undefined;
  has(id: string): boolean;
  require(id: string): Definition;
}

export function defineComponentRegistry<
  const Definition extends ComponentDefinition
>(components: readonly Definition[]): ComponentRegistry<Definition> {
  const byId = new Map<string, Definition>();

  for (const component of components) {
    if (byId.has(component.id)) {
      throw new Error(`Duplicate component id: ${component.id}`);
    }
    if (component.scenarios.length === 0) {
      throw new Error(`Component ${component.id} needs at least one catalog scenario`);
    }
    byId.set(component.id, Object.freeze(component));
  }

  const frozenComponents = Object.freeze([...components]);

  return Object.freeze({
    components: frozenComponents,
    get(id: string) {
      return byId.get(id);
    },
    has(id: string) {
      return byId.has(id);
    },
    require(id: string) {
      const component = byId.get(id);
      if (!component) throw new Error(`Unknown component id: ${id}`);
      return component;
    }
  });
}

export const frameworkRegistry = defineComponentRegistry([
  {
    id: "page-flow",
    kind: "primitive",
    variants: ["main", "div"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "default", label: "Page flow" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "composition", exceptions: [] }
  },
  {
    id: "section",
    kind: "primitive",
    variants: ["default", "inverse", "accent", "quiet"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [
      { id: "themes", label: "Themes" },
      { id: "spacing", label: "Spacing edges" }
    ],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "section", exceptions: [] }
  },
  {
    id: "section-group",
    kind: "primitive",
    variants: ["joined", "overlap"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "modes", label: "Grouping modes" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "composition", exceptions: [] }
  },
  {
    id: "container",
    kind: "primitive",
    variants: ["narrow", "content", "wide", "full"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "widths", label: "Container widths" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "container", exceptions: [] }
  },
  {
    id: "stack",
    kind: "primitive",
    variants: ["none", "xs", "sm", "md", "lg", "xl"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "gaps", label: "Vertical gaps" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "layout", exceptions: [] }
  },
  {
    id: "cluster",
    kind: "primitive",
    variants: ["start", "center", "end", "between"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "alignment", label: "Wrapped alignment" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "layout", exceptions: [] }
  },
  {
    id: "grid",
    kind: "primitive",
    variants: ["fixed", "auto-fit", "auto-fill"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "responsive", label: "Responsive columns" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "layout", exceptions: [] }
  },
  {
    id: "visual-frame",
    kind: "primitive",
    variants: ["aspect-ratio", "reserved-block-size"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "reserved-space", label: "Reserved visual space" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "surface", exceptions: [] }
  },
  {
    id: "heading",
    kind: "primitive",
    variants: ["display", "h1", "h2", "h3", "h4", "h5", "h6"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "scale", label: "Project type scale" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "content", exceptions: [] }
  },
  {
    id: "text",
    kind: "primitive",
    variants: ["small", "body", "lead", "muted"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "scale", label: "Text roles" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "content", exceptions: [] }
  },
  {
    id: "action",
    kind: "primitive",
    variants: ["primary", "secondary", "quiet"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "states", label: "Actions and focus states" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  },
  {
    id: "card-shell",
    kind: "primitive",
    variants: ["default", "quiet", "accent"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "surfaces", label: "Project card surfaces" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "surface", exceptions: [] }
  },
  {
    id: "disclosure",
    kind: "primitive",
    variants: ["closed", "open"],
    status: "stable",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "native", label: "Native disclosure" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  },
  {
    id: "tabs",
    kind: "island",
    variants: ["default"],
    status: "experimental",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "keyboard", label: "Keyboard tabs" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  },
  {
    id: "carousel",
    kind: "island",
    variants: ["default"],
    status: "experimental",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "controls", label: "Previous and next controls" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  },
  {
    id: "dialog",
    kind: "island",
    variants: ["modal"],
    status: "experimental",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "native", label: "Native modal dialog" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  },
  {
    id: "menu",
    kind: "island",
    variants: ["links"],
    status: "experimental",
    provenance: "@spark-line/web-framework",
    scenarios: [{ id: "keyboard", label: "Keyboard menu" }],
    composition: { profile: WEB_FRAMEWORK_LAYOUT_PROFILE_ID, role: "control", exceptions: [] }
  }
] as const);
