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
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  }
  const localChrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  if (!launchOptions.executablePath) {
    try {
      await access(localChrome);
      launchOptions.executablePath = localChrome;
    } catch {
      // CI uses an installed Chrome binary before falling back to Playwright Chromium.
    }
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
      await verifyConsumerIsland(page);
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
      if (await page.locator("astro-island").count()) {
        throw new Error("The static Astro style guide unexpectedly hydrates an island");
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
            interactions: ["consumer-owned counter using React primitives"],
            staticStyleGuideHydrates: false,
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

async function verifyConsumerIsland(page) {
  const button = page.getByRole("button", { name: "Increment count" });
  await button.focus();
  await button.press("Enter");
  await page.locator("[data-fixture-count]").filter({ hasText: "Count: 1" }).waitFor();
  await button.click();
  await page.locator("[data-fixture-count]").filter({ hasText: "Count: 2" }).waitFor();
  if (!(await button.evaluate((element) => element === document.activeElement))) {
    throw new Error("The hydrated Action did not preserve focus");
  }
}

async function verifyReducedMotion(page) {
  const duration = await page.locator("[data-fixture-counter] .slf-action").evaluate(
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
