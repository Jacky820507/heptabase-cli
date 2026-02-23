#!/usr/bin/env node
const { execFileSync } = require("child_process");
const path = require("path");

const script = path.join(__dirname, "..", "heptabase-cli.ts");
const args = process.argv.slice(2);

try {
  // Try bun first (fastest, works on Mac/Linux/Windows if installed)
  execFileSync("bun", [script, ...args], { stdio: "inherit" });
} catch (bunErr) {
  // Fall back to local tsx (Node.js-based, works everywhere if tsx is installed)
  try {
    const tsx = path.join(__dirname, "..", "node_modules", "tsx", "dist", "cli.mjs");
    execFileSync("node", [tsx, script, ...args], {
      stdio: "inherit",
    });
  } catch (npxErr) {
    console.error("bunErr:", bunErr.message);
    console.error("tsxErr:", npxErr.message);
    console.error(
      "Error: Could not run heptabase-cli.\n" +
      "Please install either Bun (https://bun.sh/) or Node.js (https://nodejs.org/).\n"
    );
    process.exit(1);
  }
}
