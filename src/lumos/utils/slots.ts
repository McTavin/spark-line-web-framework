type Slots = {
  has(name: string): boolean;
  render(name: string): Promise<string>;
};

/** Ignores empty and comment-only slots. Used by Button, NavLink, and slotted form, interactive, typography, and wrapper components. */
export async function slotContent(
  slots: Slots,
  name = "default",
): Promise<string> {
  if (!slots.has(name)) return "";
  const html = await slots.render(name);
  // Use a stripped copy only to detect empty slots. Preserve React/Astro SSR
  // markers in meaningful content so an island can hydrate without recovery.
  return html.replace(/<!--[\s\S]*?-->/g, "").trim() ? html.trim() : "";
}
