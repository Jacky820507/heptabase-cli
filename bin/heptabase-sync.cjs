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

/** Call heptabase-cli.ts get-journal-range */
function getJournalRange(startDate, endDate) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "get-journal-range", "--start-date", startDate, "--end-date", endDate, "--output", "raw"], {
        encoding: "utf8",
    });
    const parsed = JSON.parse(result);
    return parsed.raw.content.find(c => c.type === 'text')?.text || "";
}

/** Call heptabase-cli.ts search-whiteboards */
function searchWhiteboards(keywords) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "search-whiteboards", "--keywords", keywords.join(","), "--output", "json"], {
        encoding: "utf8",
    });
    return JSON.parse(result);
}

/** Call heptabase-cli.ts get-whiteboard-with-objects */
function getWhiteboardWithObjects(whiteboardId) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "get-whiteboard-with-objects", "--whiteboard-id", whiteboardId, "--output", "raw"], {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large whiteboards
    });
    const parsed = JSON.parse(result);
    return parsed.raw.content.find(c => c.type === 'text')?.text || "";
}

/** Call heptabase-cli.ts get-object */
function getObject(objectId, objectType) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "get-object", "--object-id", objectId, "--object-type", objectType, "--output", "raw"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(result);
    return parsed.raw.content.find(c => c.type === 'text')?.text || "";
}

/** Sanitize a string for use as a filename */
function sanitizeFilename(name) {
    return name
        .replace(/[<>:"\/\\|?*]/g, '_')  // replace illegal chars
        .replace(/\s+/g, '_')             // replace whitespace
        .replace(/_+/g, '_')              // collapse multiple underscores
        .replace(/^_|_$/g, '')            // trim leading/trailing underscores
        .slice(0, 100);                   // limit length
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

async function cmdOrganize(days = 7) {
    console.log(`Analyzing journals for the last ${days} days...`);

    // 1. Calculate dates
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const formatDate = (d) => d.toISOString().split("T")[0];
    const startDateStr = formatDate(start);
    const endDateStr = formatDate(end);

    try {
        // 2. Fetch journal entries
        const journalsText = getJournalRange(startDateStr, endDateStr);
        if (!journalsText || journalsText.length === 0) {
            console.log("No journal entries found in this period.");
            return;
        }

        // 3. Consolidate content for "AI analysis"
        console.log(`Retrieved journal data.`);

        console.log("\n[AUTO-ORG-DATA-START]");
        console.log(JSON.stringify({
            startDate: startDateStr,
            endDate: endDateStr,
            content: journalsText
        }, null, 2));
        console.log("[AUTO-ORG-DATA-END]");

        console.log("\nData collected. Please provide this to your AI assistant for organization suggestions.");
    } catch (err) {
        console.error(`Error during organization analysis: ${err.message}`);
    }
}

async function cmdExport(whiteboardId, keyword, outputDir) {
    // Step 0: If keyword is provided, search for the whiteboard first
    if (!whiteboardId && keyword) {
        console.log(`Searching for whiteboard: "${keyword}"...`);
        const tsx = getTsxPath();
        const script = path.join(__dirname, "..", "heptabase-cli.ts");
        const result = execFileSync("node", [tsx, script, "search-whiteboards", "--keywords", keyword, "--output", "raw"], {
            encoding: "utf8",
        });
        const parsed = JSON.parse(result);
        const rawText = parsed.raw.content.find(c => c.type === 'text')?.text || "";
        const wbMatch = rawText.match(/<whiteboard\s+id="([^"]+)"\s+name="([^"]+)"/);
        if (!wbMatch) {
            console.error('Error: No whiteboard found matching the keyword.');
            process.exit(1);
        }
        whiteboardId = wbMatch[1];
        console.log(`Found whiteboard: "${wbMatch[2]}" (${whiteboardId})`);
    }

    if (!whiteboardId) {
        console.error('Error: Please provide --whiteboard-id or --keyword.');
        process.exit(1);
    }

    console.log(`\nFetching whiteboard structure...`);
    const wbText = getWhiteboardWithObjects(whiteboardId);

    // Parse whiteboard name
    const nameMatch = wbText.match(/<whiteboard[^>]+name="([^"]+)"/);
    const wbName = nameMatch ? nameMatch[1] : 'unnamed-whiteboard';

    // Parse all cards from the XML
    const cardRegex = /<card\s+id="([^"]+)"\s+title="([^"]*)"/g;
    const cards = [];
    let match;
    while ((match = cardRegex.exec(wbText)) !== null) {
        cards.push({ id: match[1], title: match[2] });
    }

    if (cards.length === 0) {
        console.log('No cards found on this whiteboard.');
        return;
    }

    console.log(`Found ${cards.length} cards on whiteboard "${wbName}".`);

    // Determine output directory
    const targetDir = outputDir
        ? path.resolve(outputDir)
        : path.resolve('export', sanitizeFilename(wbName));

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Fetch and write each card
    const exportedCards = [];
    let success = 0;
    let failed = 0;

    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const progress = `[${i + 1}/${cards.length}]`;
        const displayTitle = card.title || `untitled-${card.id.slice(0, 8)}`;

        try {
            process.stdout.write(`${progress} Exporting: ${displayTitle}...`);
            const content = getObject(card.id, 'card');

            // Extract only the card content (strip XML wrapper and metadata)
            let mdContent = content;

            // Method 1: extract from <chunk> tags if present
            const chunkMatch = content.match(/<chunk[^>]*>([\s\S]*?)<\/chunk>/g);
            if (chunkMatch) {
                mdContent = chunkMatch
                    .map(c => c.replace(/<\/?chunk[^>]*>/g, '').trim())
                    .join('\n\n');
            }

            // Strip remaining XML tags and API metadata
            mdContent = mdContent
                .replace(/<card[^>]*>/g, '')        // remove <card> open tags
                .replace(/<\/card>/g, '')            // remove </card> close tags
                .replace(/<mention[^>]*\/>/g, '')    // remove <mention /> tags
                .replace(/^.*METADATA MARKERS.*$/gm, '')  // remove metadata lines
                .replace(/^.*NEVER expose XML.*$/gm, '')
                .replace(/^.*Present information naturally.*$/gm, '')
                .replace(/^.*Content may be split.*$/gm, '')
                .replace(/^.*XML tags and attributes.*$/gm, '')
                .replace(/^.*\(id, index, type.*$/gm, '')
                .replace(/^,\s*<title>.*$/gm, '')    // remove ", <title>, <content>)" lines
                .replace(/^\s*\n{3,}/gm, '\n\n')     // collapse excessive blank lines
                .trim();

            const filename = sanitizeFilename(displayTitle) + '.md';
            const filePath = path.join(targetDir, filename);
            fs.writeFileSync(filePath, mdContent, 'utf8');

            exportedCards.push({ title: displayTitle, filename });
            success++;
            console.log(' OK');
        } catch (err) {
            failed++;
            console.log(` FAILED (${err.message})`);
        }
    }

    // Generate _index.md
    const now = new Date().toISOString().split('T')[0];
    let indexContent = `# ${wbName}\n\n`;
    indexContent += `> Exported on ${now} from Heptabase whiteboard\n`;
    indexContent += `> Total cards: ${exportedCards.length}\n\n`;
    indexContent += `## Cards\n\n`;
    exportedCards.forEach((card, i) => {
        indexContent += `${i + 1}. [${card.title}](./${card.filename})\n`;
    });
    fs.writeFileSync(path.join(targetDir, '_index.md'), indexContent, 'utf8');

    console.log(`\n\u2705 Export complete!`);
    console.log(`   Location: ${targetDir}`);
    console.log(`   Success: ${success}, Failed: ${failed}, Total: ${cards.length}`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
    console.log(`
heptabase-sync — Sync local domain SOPs & lessons to Heptabase

Usage:
  heptabase domain <file.md>       Sync one domain SOP
  heptabase domain-all <dir>       Sync all domain SOPs in a directory
  heptabase lessons <GEMINI.md>    Sync lessons learned section
  heptabase organize [--days N]    Analyze recent journals for organization
  heptabase export [options]       Export whiteboard cards as local Markdown files

Export options:
  --whiteboard-id <id>    Whiteboard ID to export
  --keyword <text>        Search whiteboard by keyword
  --output-dir <path>     Output directory (default: ./export/<whiteboard-name>/)

Examples:
  heptabase domain e:\\RevitMCP\\domain\\detail-component-sync.md
  heptabase organize 7
  heptabase export --keyword "Dynamo" --output-dir E:\\Backup\\Dynamo
`);
}

const args = process.argv.slice(2);
const subcommand = args[0];

if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    printHelp();
    process.exit(0);
}

// Simple flag parser
function getFlagValue(flagName) {
    const idx = args.indexOf(flagName);
    if (idx !== -1 && args[idx + 1]) {
        return args[idx + 1];
    }
    return null;
}

switch (subcommand) {
    case "domain":
        if (!args[1]) { console.error("Error: missing file path"); process.exit(1); }
        cmdDomain(path.resolve(args[1]));
        break;
    case "domain-all":
        if (!args[1]) { console.error("Error: missing directory path"); process.exit(1); }
        cmdDomainAll(path.resolve(args[1]));
        break;
    case "lessons":
        if (!args[1]) { console.error("Error: missing file path"); process.exit(1); }
        cmdLessons(path.resolve(args[1]));
        break;
    case "organize":
        let days = 7;
        const daysFlag = getFlagValue("--days");
        if (daysFlag) {
            days = parseInt(daysFlag);
        } else if (args[1] && !args[1].startsWith("-")) {
            days = parseInt(args[1]);
        }
        cmdOrganize(isNaN(days) ? 7 : days);
        break;
    case "export":
        const exportWbId = getFlagValue("--whiteboard-id");
        const exportKeyword = getFlagValue("--keyword");
        const exportOutputDir = getFlagValue("--output-dir");
        if (!exportWbId && !exportKeyword) {
            console.error("Error: please provide --whiteboard-id or --keyword");
            process.exit(1);
        }
        cmdExport(exportWbId, exportKeyword, exportOutputDir);
        break;
    default:
        console.error(`Unknown subcommand: '${subcommand}'`);
        printHelp();
        process.exit(1);
}
