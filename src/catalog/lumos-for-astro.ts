import type { CatalogAssetRequirement, CatalogComponent } from "./index.js";
import type { CatalogScenario, ComponentKind, CompositionRole } from "../registry/index.js";

export const LUMOS_FOR_ASTRO_REPOSITORY = "https://github.com/lumosframework/lumos-for-astro.git" as const;
export const LUMOS_FOR_ASTRO_COMMIT = "455bac567bb5757f3953779a113b1c7cfc6da8a4" as const;
export const LUMOS_FOR_ASTRO_GENERATED_FROM_PATH = "README.md" as const;

const LAYOUT_PROFILE_ID = "@spark-line/web-framework/layout-v1" as const;

const MIT_LICENSE: CatalogAssetRequirement = {
  id: "lumos-mit-license",
  kind: "license",
  status: "available",
  note: "MIT license in LICENSE at the exact source commit."
};

const GLOBAL_STYLES: CatalogAssetRequirement = {
  id: "lumos-global-styles",
  kind: "asset",
  status: "available",
  note: "src/styles/global.css declares the cascade and imports base.css, patterns.css, and utilities.css; component styles rely on those layers and tokens."
};

const SITE_CONFIGURATION: CatalogAssetRequirement = {
  id: "lumos-site-configuration",
  kind: "asset",
  status: "available",
  note: "Site-specific values and shared types are defined by src/consts.ts, src/types.ts, and src/utils/seo.ts."
};

const SITE_LOGO: CatalogAssetRequirement = {
  id: "lumos-site-logo",
  kind: "asset",
  status: "available",
  note: "The upstream Nav and Footer import src/assets/logo.svg directly."
};

const SHARED_STYLE_ASSETS = [MIT_LICENSE, GLOBAL_STYLES] as const;
const SITE_CHROME_ASSETS = [MIT_LICENSE, GLOBAL_STYLES, SITE_CONFIGURATION, SITE_LOGO] as const;

interface LumosComponentInput {
  id: string;
  source_name: string;
  name: string;
  description: string;
  kind: ComponentKind;
  variants: readonly string[];
  scenarios: readonly CatalogScenario[];
  role: CompositionRole;
  exceptions?: readonly string[];
  assets?: readonly CatalogAssetRequirement[];
  tags: readonly string[];
}

function lumosComponent({
  id,
  source_name,
  name,
  description,
  kind,
  variants,
  scenarios,
  role,
  exceptions = [],
  assets = SHARED_STYLE_ASSETS,
  tags
}: LumosComponentInput): CatalogComponent {
  return {
    id,
    name,
    description,
    framework: "astro",
    kind,
    scope: "system",
    variants,
    scenarios,
    status: "experimental",
    source: {
      repository: LUMOS_FOR_ASTRO_REPOSITORY,
      path: `src/components/${source_name}.astro`,
      commit: LUMOS_FOR_ASTRO_COMMIT
    },
    assets,
    tags: ["lumos", "astro", "external-source", ...tags],
    composition: {
      profile: LAYOUT_PROFILE_ID,
      role,
      exceptions
    }
  };
}

export const lumosForAstroComponents = Object.freeze<CatalogComponent[]>([
  lumosComponent({
    id: "lumos.base-head",
    source_name: "BaseHead",
    name: "Lumos BaseHead",
    description: "Astro document metadata pattern for canonical, Open Graph, Twitter, robots, favicon, and generator tags.",
    kind: "pattern",
    variants: ["website", "article"],
    scenarios: [
      { id: "default-metadata", label: "Default website metadata" },
      { id: "article-metadata", label: "Article metadata" },
      { id: "noindex", label: "Noindex route" }
    ],
    role: "content",
    exceptions: [
      "Requires Astro.site and the upstream site constants, SEO utility, shared types, and public head assets; adapt those project-owned values before reuse."
    ],
    assets: [
      MIT_LICENSE,
      SITE_CONFIGURATION,
      {
        id: "lumos-favicons",
        kind: "asset",
        status: "available",
        note: "public/favicon.svg and public/favicon.ico exist at the exact source commit."
      },
      {
        id: "lumos-default-social-image",
        kind: "asset",
        status: "unavailable",
        note: "BaseHead defaults to /og-image.jpg, but that file is absent at the exact source commit; consumers must supply one or override image."
      }
    ],
    tags: ["metadata", "seo", "head"]
  }),
  lumosComponent({
    id: "lumos.button",
    source_name: "Button",
    name: "Lumos Button",
    description: "Button or anchor control with primary, secondary, and link treatments plus empty-content suppression.",
    kind: "primitive",
    variants: ["primary", "secondary", "link"],
    scenarios: [
      { id: "button-and-link", label: "Button and link elements" },
      { id: "disabled", label: "Disabled button" },
      { id: "focus-and-hover", label: "Focus and hover states" }
    ],
    role: "control",
    tags: ["action", "button", "link"]
  }),
  lumosComponent({
    id: "lumos.button-wrapper",
    source_name: "ButtonWrapper",
    name: "Lumos Button Wrapper",
    description: "Action-group layout wrapper with controlled top-margin utilities and empty-content suppression.",
    kind: "primitive",
    variants: ["default", "0", "1", "2", "3", "4", "5", "6", "7", "8", "auto"],
    scenarios: [
      { id: "action-group", label: "Wrapped action group" },
      { id: "margin-top", label: "Controlled top margins" }
    ],
    role: "layout",
    tags: ["actions", "layout", "spacing"]
  }),
  lumosComponent({
    id: "lumos.card",
    source_name: "Card",
    name: "Lumos Card",
    description: "Composed card pattern supporting text-only, image-cover, and stacked-image presentations.",
    kind: "pattern",
    variants: ["default", "cover", "stacked"],
    scenarios: [
      { id: "text-only", label: "Text-only card" },
      { id: "cover-image", label: "Cover image card" },
      { id: "stacked-image", label: "Stacked image card" },
      { id: "missing-image", label: "Missing optional image fallback" }
    ],
    role: "surface",
    exceptions: [
      "Composes the upstream Eyebrow, Heading, Paragraph, Button, ButtonWrapper, Img, and Overlay components through the upstream @ path alias."
    ],
    tags: ["card", "surface", "media"]
  }),
  lumosComponent({
    id: "lumos.content-wrapper",
    source_name: "ContentWrapper",
    name: "Lumos Content Wrapper",
    description: "Two-slot responsive layout family for stacked, column, breakout, contained, sticky, and media-card compositions.",
    kind: "pattern",
    variants: ["stack", "auto-width", "columns", "breakout", "contain", "sticky-content", "sticky-visual", "card"],
    scenarios: [
      { id: "stack-centered", label: "Centered stack" },
      { id: "columns-reversed", label: "Reversed columns" },
      { id: "sticky-layouts", label: "Sticky content and visual" },
      { id: "media-card", label: "Media card with opacity" }
    ],
    role: "layout",
    exceptions: [
      "The breakout variant intentionally reaches viewport width inside its own boundary.",
      "Sticky variants depend on the upstream --nav-height and --site-margin tokens; the card variant applies theme-dark and owns media layering."
    ],
    tags: ["layout", "columns", "sticky", "breakout"]
  }),
  lumosComponent({
    id: "lumos.eyebrow",
    source_name: "Eyebrow",
    name: "Lumos Eyebrow",
    description: "Short supporting label rendered with either a marker or filled tag treatment.",
    kind: "primitive",
    variants: ["default", "tag"],
    scenarios: [
      { id: "marker", label: "Marker label" },
      { id: "tag", label: "Filled tag" }
    ],
    role: "content",
    tags: ["label", "eyebrow", "tag"]
  }),
  lumosComponent({
    id: "lumos.footer",
    source_name: "Footer",
    name: "Lumos Footer",
    description: "Site footer composition with logo, fixed example routes, and browser-refreshed copyright year.",
    kind: "composition",
    variants: ["default"],
    scenarios: [{ id: "site-footer", label: "Default site footer" }],
    role: "section",
    exceptions: [
      "Hard-codes the upstream logo, SITE_NAME, Home and Example Components routes, and a browser script for the current year; adapt these before reuse."
    ],
    assets: SITE_CHROME_ASSETS,
    tags: ["footer", "navigation", "site-chrome"]
  }),
  lumosComponent({
    id: "lumos.formatted-date",
    source_name: "FormattedDate",
    name: "Lumos Formatted Date",
    description: "Locale- and time-zone-aware time element with invalid-date suppression.",
    kind: "primitive",
    variants: ["long", "custom-format"],
    scenarios: [
      { id: "default-date", label: "Default long date" },
      { id: "locale-time-zone", label: "Custom locale and time zone" },
      { id: "invalid-date", label: "Invalid date suppression" }
    ],
    role: "content",
    exceptions: ["Defaults locale through the upstream SITE_LOCALE constant."],
    assets: [MIT_LICENSE, SITE_CONFIGURATION],
    tags: ["date", "locale", "time"]
  }),
  lumosComponent({
    id: "lumos.grid",
    source_name: "Grid",
    name: "Lumos Grid",
    description: "Responsive grid with explicit breakpoint columns or auto-fit and auto-fill track sizing.",
    kind: "primitive",
    variants: ["columns", "autofit", "autofill"],
    scenarios: [
      { id: "breakpoint-columns", label: "Breakpoint column counts" },
      { id: "automatic-columns", label: "Auto-fit and auto-fill" },
      { id: "invalid-width", label: "Invalid minimum-width fallback" }
    ],
    role: "layout",
    tags: ["grid", "responsive", "layout"]
  }),
  lumosComponent({
    id: "lumos.heading",
    source_name: "Heading",
    name: "Lumos Heading",
    description: "Semantic h1-h6 heading with an independently controlled visual text style and optional line-length cap.",
    kind: "primitive",
    variants: ["inherit", "display", "h1", "h2", "h3", "h4", "h5", "h6", "large", "main", "small"],
    scenarios: [
      { id: "semantic-and-visual", label: "Semantic and visual levels" },
      { id: "max-width", label: "Character-width cap" },
      { id: "empty", label: "Empty-content suppression" }
    ],
    role: "content",
    tags: ["heading", "typography", "content"]
  }),
  lumosComponent({
    id: "lumos.icon",
    source_name: "Icon",
    name: "Lumos Icon",
    description: "Inline imported SVG renderer with semantic labelling detection and four size modes.",
    kind: "primitive",
    variants: ["small", "medium", "large", "full-width"],
    scenarios: [
      { id: "decorative", label: "Decorative icon" },
      { id: "labelled", label: "Accessible labelled icon" },
      { id: "missing-source", label: "Missing-source suppression" }
    ],
    role: "content",
    assets: [
      ...SHARED_STYLE_ASSETS,
      {
        id: "lumos-svg-source",
        kind: "asset",
        status: "available",
        note: "Requires an SVG imported as an Astro SvgComponent; upstream examples are available under src/assets/icons."
      }
    ],
    tags: ["icon", "svg", "media"]
  }),
  lumosComponent({
    id: "lumos.img",
    source_name: "Img",
    name: "Lumos Img",
    description: "Astro image wrapper for imported, public-path, and remote sources with controlled srcset and quality modes.",
    kind: "primitive",
    variants: ["full-width", "constrained", "densities"],
    scenarios: [
      { id: "imported-image", label: "Optimized imported image" },
      { id: "public-path", label: "Unoptimized public path" },
      { id: "remote-image", label: "Remote image" },
      { id: "transparent", label: "Transparent cutout" }
    ],
    role: "surface",
    exceptions: [
      "Remote srcsets require matching Astro image.remotePatterns or image.domains; public files and SVGs intentionally bypass optimization."
    ],
    tags: ["image", "astro-assets", "responsive-media"]
  }),
  lumosComponent({
    id: "lumos.nav",
    source_name: "Nav",
    name: "Lumos Nav",
    description: "Responsive site navigation with sticky or overlapping placement and an inline mobile-menu controller.",
    kind: "island",
    variants: ["sticky", "overlap"],
    scenarios: [
      { id: "desktop", label: "Desktop navigation" },
      { id: "mobile-closed", label: "Closed mobile menu" },
      { id: "mobile-open", label: "Open mobile menu" },
      { id: "overlap", label: "Overlapping navigation" }
    ],
    role: "control",
    exceptions: [
      "Hard-codes the upstream logo, SITE_NAME, and Home and Example Components routes; adapt these before reuse.",
      "Ships an inline browser controller for toggle, Escape, outside-click, link-click, and breakpoint state."
    ],
    assets: SITE_CHROME_ASSETS,
    tags: ["navigation", "menu", "site-chrome", "interactive"]
  }),
  lumosComponent({
    id: "lumos.overlay",
    source_name: "Overlay",
    name: "Lumos Overlay",
    description: "Absolute media tint with solid or bottom-weighted gradient distribution and controlled strength.",
    kind: "primitive",
    variants: ["solid", "gradient"],
    scenarios: [
      { id: "solid", label: "Solid tint" },
      { id: "gradient", label: "Gradient tint" },
      { id: "strength", label: "Tint strengths" }
    ],
    role: "surface",
    tags: ["overlay", "media", "surface"]
  }),
  lumosComponent({
    id: "lumos.paragraph",
    source_name: "Paragraph",
    name: "Lumos Paragraph",
    description: "Paragraph, span, or div text primitive with controlled visual type roles and optional line-length cap.",
    kind: "primitive",
    variants: ["inherit", "display", "h1", "h2", "h3", "h4", "h5", "h6", "large", "main", "small"],
    scenarios: [
      { id: "text-scale", label: "Visual text roles" },
      { id: "semantic-tags", label: "Paragraph, span, and div tags" },
      { id: "max-width", label: "Character-width cap" },
      { id: "empty", label: "Empty-content suppression" }
    ],
    role: "content",
    tags: ["paragraph", "typography", "content"]
  }),
  lumosComponent({
    id: "lumos.rich-text",
    source_name: "RichText",
    name: "Lumos Rich Text",
    description: "Rich prose wrapper providing rhythm, list, nested-list, marker, and blockquote treatments.",
    kind: "pattern",
    variants: ["inherit", "display", "h1", "h2", "h3", "h4", "h5", "h6", "large", "main", "small"],
    scenarios: [
      { id: "prose", label: "Mixed prose elements" },
      { id: "nested-lists", label: "Nested ordered and unordered lists" },
      { id: "blockquote", label: "Blockquote treatment" },
      { id: "empty", label: "Empty-content suppression" }
    ],
    role: "content",
    tags: ["rich-text", "prose", "content"]
  }),
  lumosComponent({
    id: "lumos.section",
    source_name: "Section",
    name: "Lumos Section",
    description: "Page-flow section with theme, independent edge spacing, inner container gap, alignment, full-height, and background-slot controls.",
    kind: "section",
    variants: ["inherit", "light", "dark", "brand"],
    scenarios: [
      { id: "themes", label: "Section themes" },
      { id: "spacing", label: "Independent section edges" },
      { id: "full-height", label: "Full-height section" },
      { id: "background-only", label: "Background-only section" }
    ],
    role: "section",
    exceptions: [
      "Also renders and configures its inner .container, combining section and container responsibilities in one source component.",
      "The navoverlap spacing and full-height modes depend on upstream navigation and viewport tokens."
    ],
    tags: ["section", "theme", "spacing", "container"]
  }),
  lumosComponent({
    id: "lumos.skip-link",
    source_name: "SkipLink",
    name: "Lumos Skip Link",
    description: "Keyboard-first skip navigation link composed from the upstream Button component.",
    kind: "primitive",
    variants: ["default"],
    scenarios: [
      { id: "keyboard-focus", label: "Visible keyboard focus" },
      { id: "custom-target", label: "Custom target and label" }
    ],
    role: "control",
    exceptions: ["Composes lumos.button through the upstream @ path alias."],
    tags: ["accessibility", "skip-link", "keyboard"]
  }),
  lumosComponent({
    id: "lumos.video",
    source_name: "Video",
    name: "Lumos Video",
    description: "Native video wrapper with preset, custom, or intrinsic aspect ratios and guarded autoplay behavior.",
    kind: "primitive",
    variants: ["2-1", "16-9", "3-2", "5-4", "1-1", "4-5", "2-3", "custom", "auto"],
    scenarios: [
      { id: "autoplay-muted", label: "Muted autoplay loop" },
      { id: "manual-playback", label: "Manual playback controls" },
      { id: "custom-ratio", label: "Custom aspect ratio" },
      { id: "transparent", label: "Transparent cutout" },
      { id: "missing-source", label: "Missing-source suppression" }
    ],
    role: "surface",
    exceptions: [
      "The auto ratio intentionally reserves no height before metadata loads; custom requires the consumer to supply a valid CSS aspect ratio."
    ],
    tags: ["video", "media", "aspect-ratio"]
  })
]);
