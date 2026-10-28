import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as reactExports from "../dist/react/index.js";

import {
  Action,
  CardShell,
  Cluster,
  Container,
  Grid,
  Heading,
  Stack,
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

test("React public exports retain presentational primitives without retired islands", () => {
  assert.deepEqual(Object.keys(reactExports).sort(), [
    "Action", "CardShell", "Cluster", "Container", "Grid", "Heading", "Stack", "Text"
  ]);
});
