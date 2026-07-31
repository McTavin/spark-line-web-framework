import { createElement } from "react";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode
} from "react";

type ElementName = "article" | "aside" | "div" | "main" | "nav" | "section";
type Gap = "none" | "xs" | "sm" | "md" | "lg" | "xl";

function classes(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

export type ActionProps =
  | ({
      href: string;
      children: ReactNode;
      variant?: "primary" | "secondary" | "quiet";
      size?: "sm" | "md" | "lg";
    } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">)
  | ({
      href?: never;
      children: ReactNode;
      variant?: "primary" | "secondary" | "quiet";
      size?: "sm" | "md" | "lg";
    } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">);

export function Action(props: ActionProps): ReactElement {
  const { children, className, size = "md", variant = "primary", ...rest } = props;
  const shared = {
    className: classes("slf-action", className),
    "data-size": size,
    "data-variant": variant
  };

  if ("href" in rest && typeof rest.href === "string") {
    return <a {...rest} {...shared}>{children}</a>;
  }

  return <button type="button" {...rest} {...shared}>{children}</button>;
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "display" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading({ as = "h2", className, size = as, ...props }: HeadingProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-heading", className),
    "data-size": size
  });
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "p" | "span";
  size?: "small" | "body" | "lead";
  tone?: "default" | "muted";
}

export function Text({ as = "p", className, size = "body", tone = "default", ...props }: TextProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-text", className),
    "data-size": size,
    "data-tone": tone
  });
}

export interface CardShellProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "div" | "section";
  surface?: "default" | "quiet" | "accent";
}

export function CardShell({ as = "article", className, surface = "default", ...props }: CardShellProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-card-shell", className),
    "data-surface": surface
  });
}

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementName;
  gap?: Gap;
}

export function Stack({ as = "div", className, gap = "md", ...props }: StackProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-stack", className),
    "data-gap": gap
  });
}

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  as?: ElementName;
  align?: "start" | "center" | "end" | "stretch";
  gap?: Gap;
  justify?: "start" | "center" | "end" | "between";
}

export function Cluster({
  as = "div",
  align = "center",
  className,
  gap = "sm",
  justify = "start",
  ...props
}: ClusterProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-cluster", className),
    "data-align": align,
    "data-gap": gap,
    "data-justify": justify
  });
}

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementName;
  columns?: 1 | 2 | 3 | 4 | "auto-fit" | "auto-fill";
  gap?: Gap;
  min?: string;
}

export function Grid({ as = "div", className, columns = "auto-fit", gap = "md", min = "16rem", style, ...props }: GridProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-grid", className),
    "data-columns": columns,
    "data-gap": gap,
    style: {
      ...style,
      "--slf-grid-columns": typeof columns === "number" ? columns : undefined,
      "--slf-grid-min": min
    }
  });
}

export interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ElementName;
  width?: "narrow" | "content" | "wide" | "full";
}

export function Container({ as = "div", className, width = "wide", ...props }: ContainerProps): ReactElement {
  return createElement(as, {
    ...props,
    className: classes("slf-container", className),
    "data-container": width
  });
}
