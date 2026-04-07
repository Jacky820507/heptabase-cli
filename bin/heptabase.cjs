#!/usr/bin/env node
const { execFileSync } = require("child_process");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "config", ".env") });

const script = path.join(__dirname, "..", "heptabase-cli.ts");
const args = process.argv.slice(2);


// Handle 'organize', 'export', 'hub', 'import', and 'gmail-sync' subcommands by redirecting to heptabase-sync.cjs
if (args[0] === "organize" || args[0] === "export" || args[0] === "hub" || args[0] === "import" || args[0] === "gmail-sync") {
  const syncScript = path.join(__dirname, "heptabase-sync.cjs");
  try {
    execFileSync("node", [syncScript, ...args], { stdio: "inherit" });
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

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
