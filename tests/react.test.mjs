import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Carousel, Dialog, Menu, Tabs } from "../dist/react/index.js";

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
