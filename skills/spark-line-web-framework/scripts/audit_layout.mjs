#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error("Usage: audit_layout.mjs <file-or-directory> [...]");
  process.exit(2);
}

const rules = [
  {
    label: "section selector reaches a sibling",
    expression: /(?:\[data-slf-section\]|\.slf-section|section\.[\w-]+)\s*[+~]/g
  },
  {
    label: "ordinary negative margin",
    expression: /margin(?:-(?:block|top|bottom))?(?:-start|-end)?:\s*-\d/gi
  },
  {
    label: "raw layout class stored in a Sanity field",
    expression: /name\s*:\s*["'](?:class|className|cssClass)["']/g
  }
];

const files = [];
for (const target of targets) await collect(path.resolve(target), files);

let findings = 0;
for (const file of files) {
  if (!/\.(?:astro|css|js|jsx|mjs|ts|tsx)$/.test(file)) continue;
  const source = await readFile(file, "utf8");
  const lines = source.split(/\r?\n/);
  for (const rule of rules) {
    rule.expression.lastIndex = 0;
    for (const match of source.matchAll(rule.expression)) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      console.log(`${file}:${line}: ${rule.label}`);
      console.log(`  ${lines[line - 1]?.trim() ?? ""}`);
      findings += 1;
    }
  }
}

if (findings) {
  console.log(`Advisory: ${findings} potential framework deviation(s).`);
  process.exitCode = 1;
} else {
  console.log(`No static layout deviations found in ${files.length} file(s).`);
}

async function collect(target, output) {
  const details = await stat(target);
  if (details.isFile()) {
    output.push(target);
    return;
  }
  for (const entry of await readdir(target, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const next = path.join(target, entry.name);
    if (entry.isDirectory()) await collect(next, output);
    else output.push(next);
  }
}
