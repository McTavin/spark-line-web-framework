import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import {
  access,
  mkdir,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = path.resolve(import.meta.dirname, "..");
const fixture = path.join(root, "tests", ".fixture-work", "react-island");
const screenshotDirectory = path.join(root, "artifacts", "screenshots");
const port = 4178;
const origin = `http://127.0.0.1:${port}`;

await access(path.join(fixture, "dist", "index.html"));
await mkdir(screenshotDirectory, { recursive: true });

const server = spawn(
  process.execPath,
  [
    path.join(fixture, "node_modules", "astro", "bin", "astro.mjs"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port)
  ],
  {
    cwd: fixture,
    env: {
      ...process.env,
      npm_config_cache: path.join(root, ".cache", "npm")
    },
    stdio: ["ignore", "pipe", "pipe"]
  }
);

let serverLog = "";
server.stdout.on("data", (chunk) => {
  serverLog += chunk;
});
server.stderr.on("data", (chunk) => {
  serverLog += chunk;
});

try {
  await waitForServer(`${origin}/`);

  const launchOptions = { headless: true };
  const localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  try {
    await access(localChrome);
    launchOptions.executablePath = localChrome;
  } catch {
    // CI uses the Playwright-managed Chromium installed by the release workflow.
  }

  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce"
    });
    try {
      const page = await context.newPage();
      await page.goto(`${origin}/`, { waitUntil: "networkidle" });

      await assertNoOverflow(page);
      await verifyTabs(page);
      await verifyCarousel(page);
      await verifyDialog(page);
      await verifyMenu(page);
      await verifyReducedMotion(page);
      await assertAccessible(page, "islands");
      await page.screenshot({
        path: path.join(screenshotDirectory, "react-islands-1280x900.png"),
        fullPage: true
      });

      await page.setViewportSize({ width: 390, height: 844 });
      await assertNoOverflow(page);
      await page.screenshot({
        path: path.join(screenshotDirectory, "react-islands-390x844.png"),
        fullPage: true
      });

      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`${origin}/style-guide/`, { waitUntil: "networkidle" });
      await assertNoOverflow(page);
      const robots = await page.locator('meta[name="robots"]').getAttribute("content");
      if (robots !== "noindex, nofollow") {
        throw new Error(`Style guide robots directive is ${robots ?? "missing"}`);
      }
      await assertAccessible(page, "style-guide");
      await page.screenshot({
        path: path.join(screenshotDirectory, "style-guide-1280x900.png"),
        fullPage: true
      });

      await writeFile(
        path.join(screenshotDirectory, "verification.json"),
        `${JSON.stringify(
          {
            origin,
            viewports: ["1280x900", "390x844"],
            interactions: ["tabs", "carousel", "dialog", "menu"],
            accessibility: "axe:0 serious-or-critical violations",
            reducedMotion: true,
            horizontalOverflow: false
          },
          null,
          2
        )}\n`,
        "utf8"
      );
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  await stopServer(server);
}

console.log(`Browser verification passed. Artifacts: ${screenshotDirectory}`);

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Keep polling until the preview server is ready.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Preview server did not start.\n${serverLog}`);
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const exited = once(child, "exit");
  child.kill("SIGTERM");
  const stopped = await Promise.race([
    exited.then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 2_000))
  ]);

  if (!stopped && child.exitCode === null && child.signalCode === null) {
    const forcedExit = once(child, "exit");
    child.kill("SIGKILL");
    await forcedExit;
  }
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth
  );
  if (overflow) throw new Error("Document has horizontal overflow");
}

async function verifyTabs(page) {
  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await tabs.first().press("ArrowRight");
  if ((await tabs.nth(1).getAttribute("aria-selected")) !== "true") {
    throw new Error("ArrowRight did not select the next tab");
  }
  if (!(await tabs.nth(1).evaluate((element) => element === document.activeElement))) {
    throw new Error("Selected tab did not receive focus");
  }
}

async function verifyCarousel(page) {
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByText("Navigation decision").waitFor();
}

async function verifyDialog(page) {
  const trigger = page.getByRole("button", { name: "Read details" });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  if (!(await dialog.evaluate((element) => element.open))) {
    throw new Error("Dialog did not open");
  }
  await page.keyboard.press("Escape");
  if (!(await trigger.evaluate((element) => element === document.activeElement))) {
    throw new Error("Dialog did not return focus to its trigger");
  }
}

async function verifyMenu(page) {
  const trigger = page.getByRole("button", { name: "Open menu" });
  await trigger.click();
  const items = page.getByRole("menuitem");
  if (!(await items.first().evaluate((element) => element === document.activeElement))) {
    throw new Error("Opening the menu did not focus its first item");
  }
  await items.first().press("ArrowDown");
  if (!(await items.nth(1).evaluate((element) => element === document.activeElement))) {
    throw new Error("ArrowDown did not move menu focus");
  }
  await page.keyboard.press("Escape");
  if (!(await trigger.evaluate((element) => element === document.activeElement))) {
    throw new Error("Menu did not return focus to its trigger");
  }
}

async function verifyReducedMotion(page) {
  const duration = await page.locator("[data-slf-island='tabs']").evaluate(
    (element) => getComputedStyle(element).transitionDuration
  );
  const seconds = Number.parseFloat(duration);
  if (!Number.isFinite(seconds) || seconds > 0.000001) {
    throw new Error(`Reduced-motion duration is ${duration}`);
  }
}

async function assertAccessible(page, label) {
  const result = await new AxeBuilder({ page }).analyze();
  const blocking = result.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? "")
  );
  if (blocking.length) {
    throw new Error(
      `${label} accessibility violations:\n${blocking
        .map((violation) => `${violation.id}: ${violation.help}`)
        .join("\n")}`
    );
  }
}
