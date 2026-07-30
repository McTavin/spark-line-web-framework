export type SectionTheme = "default" | "inverse" | "accent" | "quiet";
export type SectionSpace = "none" | "xs" | "sm" | "md" | "lg" | "xl";

export interface SanitySectionRecord {
  _type: string;
  _key?: string;
  theme?: SectionTheme;
  spaceTop?: SectionSpace;
  spaceBottom?: SectionSpace;
  layout?: string;
  [field: string]: unknown;
}

export interface SectionRegistration {
  type: string;
  componentId: string;
  layouts?: readonly string[];
  themes?: readonly SectionTheme[];
  spaces?: readonly SectionSpace[];
  defaults?: {
    layout?: string;
    theme?: SectionTheme;
    spaceTop?: SectionSpace;
    spaceBottom?: SectionSpace;
  };
}

export interface SectionRegistry {
  readonly sections: readonly SectionRegistration[];
  get(type: string): SectionRegistration | undefined;
  require(type: string): SectionRegistration;
}

export interface NormalizedSection {
  key: string;
  type: string;
  componentId: string | null;
  props: SanitySectionRecord;
  source: SanitySectionRecord;
  known: boolean;
}

export type UnknownSectionPolicy = "omit" | "preserve" | "throw";

export function defineSectionRegistry(
  sections: readonly SectionRegistration[]
): SectionRegistry {
  const byType = new Map<string, SectionRegistration>();

  for (const section of sections) {
    if (byType.has(section.type)) {
      throw new Error(`Duplicate Sanity section type: ${section.type}`);
    }
    byType.set(section.type, Object.freeze({ ...section }));
  }

  const frozenSections = Object.freeze([...byType.values()]);
  return Object.freeze({
    sections: frozenSections,
    get(type: string) {
      return byType.get(type);
    },
    require(type: string) {
      const section = byType.get(type);
      if (!section) throw new Error(`Unknown Sanity section type: ${type}`);
      return section;
    }
  });
}

function assertAllowed(
  section: SectionRegistration,
  field: "layout" | "theme" | "spaceTop" | "spaceBottom",
  value: string | undefined
): void {
  if (value === undefined) return;
  const allowed =
    field === "layout"
      ? section.layouts
      : field === "theme"
        ? section.themes
        : section.spaces;

  if (allowed && !allowed.includes(value as never)) {
    throw new Error(
      `Invalid ${field} "${value}" for ${section.type}; expected ${allowed.join(", ")}`
    );
  }
}

export function normalizePageSections(
  records: readonly SanitySectionRecord[],
  registry: SectionRegistry,
  options: { onUnknown?: UnknownSectionPolicy } = {}
): NormalizedSection[] {
  const policy = options.onUnknown ?? "omit";
  const normalized: NormalizedSection[] = [];

  records.forEach((record, index) => {
    const registration = registry.get(record._type);
    if (!registration) {
      if (policy === "throw") {
        throw new Error(`Unknown Sanity section type: ${record._type}`);
      }
      if (policy === "preserve") {
        normalized.push({
          key: record._key ?? `${record._type}-${index}`,
          type: record._type,
          componentId: null,
          props: { ...record },
          source: record,
          known: false
        });
      }
      return;
    }

    const props: SanitySectionRecord = {
      ...registration.defaults,
      ...record
    };

    assertAllowed(registration, "layout", props.layout as string | undefined);
    assertAllowed(registration, "theme", props.theme as string | undefined);
    assertAllowed(registration, "spaceTop", props.spaceTop as string | undefined);
    assertAllowed(registration, "spaceBottom", props.spaceBottom as string | undefined);

    normalized.push({
      key: record._key ?? `${record._type}-${index}`,
      type: record._type,
      componentId: registration.componentId,
      props,
      source: record,
      known: true
    });
  });

  return normalized;
}

export interface SectionSchemaOptions {
  name: string;
  title: string;
  sectionTypes: readonly string[];
  themes?: readonly SectionTheme[];
  spaces?: readonly SectionSpace[];
  layouts?: readonly string[];
}

export function defineSectionSchema(options: SectionSchemaOptions) {
  const fields: Array<Record<string, unknown>> = [
    {
      name: "sections",
      title: "Sections",
      type: "array",
      of: options.sectionTypes.map((type) => ({ type }))
    }
  ];

  if (options.themes?.length) {
    fields.push({
      name: "theme",
      title: "Theme",
      type: "string",
      options: { list: options.themes }
    });
  }
  if (options.spaces?.length) {
    for (const edge of ["spaceTop", "spaceBottom"]) {
      fields.push({
        name: edge,
        title: edge === "spaceTop" ? "Space above" : "Space below",
        type: "string",
        options: { list: options.spaces }
      });
    }
  }
  if (options.layouts?.length) {
    fields.push({
      name: "layout",
      title: "Layout",
      type: "string",
      options: { list: options.layouts }
    });
  }

  return {
    name: options.name,
    title: options.title,
    type: "object",
    fields
  } as const;
}
