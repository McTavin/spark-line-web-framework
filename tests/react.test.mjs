import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  Action,
  CardShell,
  Carousel,
  Cluster,
  Container,
  Dialog,
  Grid,
  Heading,
  Menu,
  Stack,
  Tabs,
  Text
} from "../dist/react/index.js";

test("presentational primitives preserve semantic elements and framework slots", () => {
  const markup = renderToStaticMarkup(
    createElement(Container, { as: "main", width: "content" },
      createElement(Stack, { gap: "lg" },
        createElement(Heading, { as: "h1", size: "display" }, "A heading"),
        createElement(Text, { size: "lead", tone: "muted" }, "Supporting copy"),
        createElement(Grid, { columns: 2, min: "12rem" },
          createElement(CardShell, { surface: "quiet" }, "Card"),
          createElement(Cluster, { justify: "between" },
            createElement(Action, { href: "/work", variant: "secondary" }, "Work"),
            createElement(Action, { disabled: true }, "Disabled")
          )
        )
      )
    )
  );

  assert.match(markup, /<main class="slf-container" data-container="content">/);
  assert.match(markup, /<h1 class="slf-heading" data-size="display">/);
  assert.match(markup, /class="slf-grid" data-columns="2" data-gap="md"/);
  assert.match(markup, /<a href="\/work" class="slf-action" data-size="md" data-variant="secondary">/);
  assert.match(markup, /<button type="button" disabled="" class="slf-action"/);
});

test("tabs render the complete ARIA relationship without client state loss", () => {
  const markup = renderToStaticMarkup(
    createElement(Tabs, {
      label: "Project areas",
      items: [
        { id: "context", label: "Context", content: "Sources" },
        { id: "proof", label: "Proof", content: "Outcome" }
      ]
    })
  );

  assert.match(markup, /role="tablist"/);
  assert.match(markup, /aria-selected="true"/);
  assert.match(markup, /role="tabpanel"/);
  assert.match(markup, /aria-controls=/);
});

test("carousel exposes a named region, live status, and explicit controls", () => {
  const markup = renderToStaticMarkup(
    createElement(Carousel, {
      label: "Decisions",
      items: [{ id: "one", label: "Homepage direction" }]
    })
  );

  assert.match(markup, /aria-roledescription="carousel"/);
  assert.match(markup, /aria-live="polite"/);
  assert.match(markup, />Previous</);
  assert.match(markup, />Next</);
});

test("dialog and menu render native or named accessible controls", () => {
  const dialogMarkup = renderToStaticMarkup(
    createElement(Dialog, {
      triggerLabel: "Read details",
      title: "Details",
      description: "More information"
    })
  );
  const menuMarkup = renderToStaticMarkup(
    createElement(Menu, {
      label: "Open menu",
      items: [{ id: "home", label: "Home", href: "/" }]
    })
  );

  assert.match(dialogMarkup, /<dialog/);
  assert.match(dialogMarkup, /aria-labelledby=/);
  assert.match(menuMarkup, /aria-haspopup="menu"/);
  assert.match(menuMarkup, /role="menu"/);
  assert.match(menuMarkup, /role="menuitem"/);
});
