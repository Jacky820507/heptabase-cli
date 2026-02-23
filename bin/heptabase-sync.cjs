#!/usr/bin/env node
// heptabase-sync.cjs — Sync local domain SOPs & lessons to Heptabase note cards
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ── helpers ──────────────────────────────────────────────────────────────────

/** Resolve the tsx CLI path for running heptabase-cli.ts */
function getTsxPath() {
    return path.join(__dirname, "..", "node_modules", "tsx", "dist", "cli.mjs");
}

/** Call heptabase-cli.ts save-to-note-card with the given content */
function saveToNoteCard(content) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "save-to-note-card", "--content", content], {
        encoding: "utf8",
    });
    return result.trim();
}

/** Parse YAML frontmatter from a markdown file (simple key: value parser) */
function parseFrontmatter(raw) {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: raw };

    const meta = {};
    for (const line of match[1].split(/\r?\n/)) {
        const m = line.match(/^(\w[\w_-]*)\s*:\s*(.+)$/);
        if (m) {
            let val = m[2].trim();
            // parse simple arrays: [a, b, c]
            if (val.startsWith("[") && val.endsWith("]")) {
                val = val.slice(1, -1).split(",").map((s) => s.trim());
            }
            meta[m[1]] = val;
        }
    }
    return { meta, body: match[2] };
}

/** Extract the "## 🔬 智慧提煉 (Lessons Learned)" section from GEMINI.md */
function extractLessons(raw) {
    const marker = "## 🔬 智慧提煉";
    const idx = raw.indexOf(marker);
    if (idx === -1) return null;
    // Take everything from the marker to the end (or next ## heading)
    const rest = raw.slice(idx);
    // Find the next ## heading (if any)
    const nextH2 = rest.indexOf("\n## ", marker.length);
    return nextH2 === -1 ? rest : rest.slice(0, nextH2);
}

/** Derive a project name from a GEMINI.md path */
function deriveProjectName(filePath) {
    const dir = path.dirname(path.resolve(filePath));
    return path.basename(dir);
}

// ── subcommands ──────────────────────────────────────────────────────────────

function cmdDomain(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: file not found: ${filePath}`);
        process.exit(1);
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const desc = meta.description || path.basename(filePath, ".md");
    const version = meta.version ? ` (v${meta.version})` : "";
    const keywords = Array.isArray(meta.trigger_keywords)
        ? `\n\n**Keywords**: ${meta.trigger_keywords.join(", ")}`
        : "";
    const tools = Array.isArray(meta.tools)
        ? `\n**Tools**: ${meta.tools.join(", ")}`
        : "";

    const content = `# [Domain] ${desc}${version}\n${keywords}${tools}\n\n${body}`;

    console.log(`Syncing domain SOP: ${desc}...`);
    const result = saveToNoteCard(content);
    console.log(result || "Done.");
}

function cmdDomainAll(dirPath) {
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        console.error(`Error: directory not found: ${dirPath}`);
        process.exit(1);
    }
    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    console.log(`Found ${files.length} domain files in ${dirPath}`);

    let success = 0;
    let failed = 0;
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
            cmdDomain(filePath);
            success++;
        } catch (err) {
            console.error(`  ✗ Failed: ${file} — ${err.message}`);
            failed++;
        }
    }
    console.log(`\nSummary: ${success} synced, ${failed} failed, ${files.length} total`);
}

function cmdLessons(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: file not found: ${filePath}`);
        process.exit(1);
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const lessons = extractLessons(raw);
    if (!lessons) {
        console.error("Error: could not find '## 🔬 智慧提煉' section in the file.");
        process.exit(1);
    }

    const project = deriveProjectName(filePath);
    const content = `# [Lessons] ${project} — 智慧提煉 (Lessons Learned)\n\n${lessons}`;

    console.log(`Syncing lessons from ${project}...`);
    const result = saveToNoteCard(content);
    console.log(result || "Done.");
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
    console.log(`
heptabase-sync — Sync local domain SOPs & lessons to Heptabase

Usage:
  node bin/heptabase-sync.cjs domain <file.md>       Sync one domain SOP
  node bin/heptabase-sync.cjs domain-all <dir>       Sync all domain SOPs in a directory
  node bin/heptabase-sync.cjs lessons <GEMINI.md>    Sync lessons learned section

Examples:
  node bin/heptabase-sync.cjs domain e:\\RevitMCP\\domain\\detail-component-sync.md
  node bin/heptabase-sync.cjs domain-all e:\\RevitMCP\\domain
  node bin/heptabase-sync.cjs lessons e:\\RevitMCP\\GEMINI.md
`);
}

const args = process.argv.slice(2);
const subcommand = args[0];
const target = args[1];

if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printHelp();
    process.exit(0);
}

if (!target) {
    console.error(`Error: missing path argument for '${subcommand}'.`);
    printHelp();
    process.exit(1);
}

switch (subcommand) {
    case "domain":
        cmdDomain(path.resolve(target));
        break;
    case "domain-all":
        cmdDomainAll(path.resolve(target));
        break;
    case "lessons":
        cmdLessons(path.resolve(target));
        break;
    default:
        console.error(`Unknown subcommand: '${subcommand}'`);
        printHelp();
        process.exit(1);
}
