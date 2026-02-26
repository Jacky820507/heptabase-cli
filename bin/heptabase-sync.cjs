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

/** Call heptabase-cli.ts get-pdf-pages to retrieve PDF content */
function getPdfPages(pdfId, startPage, endPage) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const args = [tsx, script, "get-pdf-pages", "--pdf-card-id", pdfId, "--start-page-number", String(startPage), "--end-page-number", String(endPage), "--output", "raw"];
    const result = execFileSync("node", args, {
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
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

/** Search whiteboards and return raw text content (for XML parsing) */
function searchWhiteboardsRaw(keywords) {
    const tsx = getTsxPath();
    const script = path.join(__dirname, "..", "heptabase-cli.ts");
    const result = execFileSync("node", [tsx, script, "search-whiteboards", "--keywords", keywords, "--output", "raw"], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
    });
    const parsed = JSON.parse(result);
    return parsed.raw.content.find(c => c.type === 'text')?.text || "";
}

async function cmdHub(topic) {
    console.log(`\n🗂️  Generating Hub card for topic: "${topic}"...\n`);

    // 1. Search for related whiteboards
    console.log("Searching for related whiteboards...");
    let searchText;
    try {
        searchText = searchWhiteboardsRaw(topic);
    } catch (err) {
        console.error(`Error searching whiteboards: ${err.message}`);
        return;
    }

    // 2. Parse whiteboard IDs and names from XML
    const wbRegex = /<whiteboard\s+id="([^"]+)"\s+name="([^"]*)"/g;
    const whiteboards = [];
    let match;
    while ((match = wbRegex.exec(searchText)) !== null) {
        whiteboards.push({ id: match[1], name: match[2] });
    }

    if (whiteboards.length === 0) {
        console.log(`No whiteboards found for topic "${topic}".`);
        return;
    }

    console.log(`Found ${whiteboards.length} whiteboards. Fetching details...\n`);

    // 3. For each whiteboard, fetch structure info
    const results = [];
    for (let i = 0; i < whiteboards.length; i++) {
        const wb = whiteboards[i];
        const progress = `[${i + 1}/${whiteboards.length}]`;
        process.stdout.write(`${progress} ${wb.name}...`);
        try {
            const wbText = getWhiteboardWithObjects(wb.id);

            // Extract card titles (handle escaped quotes in title attribute)
            const cardRegex = /<card\s+id="([^"]+)"\s+title="((?:[^"\\]|\\.)*)"/g;
            const cards = [];
            let cMatch;
            while ((cMatch = cardRegex.exec(wbText)) !== null) {
                cards.push({ id: cMatch[1], title: cMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'), type: 'card' });
            }

            // Extract PDF card titles (handle escaped quotes in title attribute)
            const pdfRegex = /<pdfCard\s+id="([^"]+)"\s+title="((?:[^"\\]|\\.)*)"/g;
            while ((cMatch = pdfRegex.exec(wbText)) !== null) {
                cards.push({ id: cMatch[1], title: cMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'), type: 'pdfCard' });
            }

            // Extract sections with objectIds
            const sectionRegex = /<section\s+title="([^"]*)"\s+objectIds="([^"]*)"/g;
            const sections = [];
            const objectToSection = {};
            let sMatch;
            while ((sMatch = sectionRegex.exec(wbText)) !== null) {
                const sTitle = sMatch[1];
                const objectIds = sMatch[2].split(',').map(id => id.trim()).filter(Boolean);
                sections.push({ title: sTitle, objectIds });
                objectIds.forEach(id => { objectToSection[id] = sTitle; });
            }

            // Group cards by section
            const sectionCards = {};  // sectionTitle -> [card]
            const unsectioned = [];
            for (const card of cards) {
                const sec = objectToSection[card.id];
                if (sec) {
                    if (!sectionCards[sec]) sectionCards[sec] = [];
                    sectionCards[sec].push(card);
                } else {
                    unsectioned.push(card);
                }
            }

            results.push({
                ...wb,
                cardCount: cards.filter(c => c.type === 'card').length,
                pdfCount: cards.filter(c => c.type === 'pdfCard').length,
                sections: sections.map(s => s.title),
                sectionCards,
                unsectioned
            });
            console.log(` OK (${cards.length} items, ${sections.length} sections)`);
        } catch (err) {
            // Still include the whiteboard but without details
            results.push({ ...wb, cardCount: 0, pdfCount: 0, sections: [], sectionCards: {}, unsectioned: [], error: err.message });
            console.log(` WARN (${err.message})`);
        }
    }

    // 4. Generate Hub card content
    const now = new Date().toISOString().split('T')[0];
    let hubContent = `# 🗂️ ${topic} Hub\n\n`;
    hubContent += `> Auto-generated hub card for topic "${topic}"\n`;
    hubContent += `> Found ${results.length} related whiteboards\n`;
    hubContent += `> Generated on ${now}\n\n`;
    hubContent += `## 📋 Related Whiteboards\n\n`;

    for (const wb of results) {
        hubContent += `### → 白板『${wb.name}』\n`;
        const stats = [];
        if (wb.cardCount > 0) stats.push(`${wb.cardCount} cards`);
        if (wb.pdfCount > 0) stats.push(`${wb.pdfCount} PDFs`);
        if (stats.length > 0) {
            hubContent += `- 📊 ${stats.join(', ')}\n`;
        }

        // Hybrid sort: version-number aware + general natural sort
        // - Titles starting with N.N.N or N.: version sort (1. < 1.1 < 2.)
        // - Other titles: natural sort (Python #1 < #2 < #10, API 1 < API 6)
        function sortCards(arr) {
            return arr.slice().sort((a, b) => {
                const ta = a.title || '';
                const tb = b.title || '';

                // Try version-number comparison for titles starting with N. or N.N.N
                const va = ta.match(/^(\d+(?:\.\d+)*)\.?/);
                const vb = tb.match(/^(\d+(?:\.\d+)*)\.?/);
                if (va && vb) {
                    const numsA = va[1].split('.').map(Number);
                    const numsB = vb[1].split('.').map(Number);
                    const vlen = Math.max(numsA.length, numsB.length);
                    for (let i = 0; i < vlen; i++) {
                        const na = numsA[i] ?? -1;  // missing = parent, sorts first
                        const nb = numsB[i] ?? -1;
                        if (na !== nb) return na - nb;
                    }
                    // Same version, compare remaining text
                    return ta.substring(va[0].length).localeCompare(tb.substring(vb[0].length), 'zh-Hant');
                }

                // Fallback: sort by LAST number in title (handles API 1..6, #1..#10, etc.)
                const lastNumA = (ta.match(/\d+/g) || []).map(Number);
                const lastNumB = (tb.match(/\d+/g) || []).map(Number);
                const lnA = lastNumA.length > 0 ? lastNumA[lastNumA.length - 1] : Infinity;
                const lnB = lastNumB.length > 0 ? lastNumB[lastNumB.length - 1] : Infinity;
                if (lnA !== lnB) return lnA - lnB;
                return ta.localeCompare(tb, 'zh-Hant');
            });
        }

        // Helper to render cards with prefix grouping
        function renderCards(cardsArray, baseIndent = "  ") {
            let out = "";
            const prefixRegex = /^(\[[^\]]+\]|【[^】]+】|[^:：]+[:：])\s*(.*)/;
            const groups = {};
            const others = [];

            cardsArray.forEach(c => {
                const m = (c.title || "").match(prefixRegex);
                if (m) {
                    const prefix = m[1].trim();
                    if (!groups[prefix]) groups[prefix] = [];
                    groups[prefix].push({ ...c, displayTitle: m[2].trim() });
                } else {
                    others.push({ ...c, displayTitle: c.title || "(untitled)" });
                }
            });

            // If a group has > 1 item, render it as a nested list
            for (const [prefix, groupedCards] of Object.entries(groups)) {
                if (groupedCards.length > 1) {
                    out += `${baseIndent}${prefix}\n`;
                    groupedCards.forEach(c => {
                        const icon = c.type === 'pdfCard' ? '📄' : '📝';
                        out += `${baseIndent}  - ${icon} ${c.displayTitle}\n`;
                    });
                } else {
                    // Single item -> just render normally
                    others.push({ ...groupedCards[0], displayTitle: (groupedCards[0].title || "(untitled)") });
                }
            }

            // Render remaining cards
            others.sort((a, b) => sortCards([{ title: a.title }, { title: b.title }])[0].title === a.title ? -1 : 1).forEach(c => {
                const icon = c.type === 'pdfCard' ? '📄' : '📝';
                out += `${baseIndent}- ${icon} ${c.displayTitle}\n`;
            });

            return out;
        }

        // List cards grouped by section (sort section titles too)
        const sortedSections = sortCards(wb.sections.map(s => ({ title: s }))).map(s => s.title);
        if (sortedSections.length > 0) {
            for (const secTitle of sortedSections) {
                const secCards = sortCards(wb.sectionCards[secTitle] || []);
                if (secCards.length > 0) {
                    hubContent += `- 📁 **${secTitle}**\n`;
                    hubContent += renderCards(secCards, "  ");
                } else {
                    hubContent += `- 📁 ${secTitle}\n`;
                }
            }
        }

        // List unsectioned cards
        if (wb.unsectioned.length > 0) {
            const sorted = sortCards(wb.unsectioned);
            if (wb.sections.length > 0) {
                hubContent += `- 📂 **其他卡片**\n`;
            }
            hubContent += renderCards(sorted, "  ");
        }

        if (wb.error) {
            hubContent += `- ⚠️ Could not fetch details: ${wb.error}\n`;
        }
        hubContent += `\n`;
    }

    // 5. Save the Hub card
    console.log(`\nSaving Hub card to Heptabase...`);
    try {
        const saveResult = saveToNoteCard(hubContent);
        console.log(`\n✅ Hub card created successfully!`);
        console.log(`   Topic: ${topic}`);
        console.log(`   Whiteboards: ${results.length}`);
        console.log(`   Total cards: ${results.reduce((sum, wb) => sum + wb.cardCount, 0)}`);
    } catch (err) {
        console.error(`Error saving Hub card: ${err.message}`);
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
        cards.push({ id: match[1], title: match[2], type: 'card' });
    }

    // Parse all pdfCards from the XML
    const pdfRegex = /<pdfCard\s+id="([^"]+)"\s+title="([^"]*)"/g;
    while ((match = pdfRegex.exec(wbText)) !== null) {
        // Check if this pdfCard has totalPages (= already parsed)
        const pdfBlock = wbText.substring(match.index, wbText.indexOf('</pdfCard>', match.index) + 10);
        const pagesMatch = pdfBlock.match(/totalPages=(\d+)/);
        cards.push({
            id: match[1],
            title: match[2],
            type: 'pdfCard',
            totalPages: pagesMatch ? parseInt(pagesMatch[1]) : 0
        });
    }

    // Parse sections from the XML
    const sectionRegex = /<section\s+title="([^"]*)"\s+objectIds="([^"]*)"/g;
    const sections = [];
    const objectToSection = {};  // objectId -> section title
    while ((match = sectionRegex.exec(wbText)) !== null) {
        const sectionTitle = match[1];
        const objectIds = match[2].split(',').map(id => id.trim()).filter(Boolean);
        sections.push({ title: sectionTitle, objectIds });
        objectIds.forEach(id => { objectToSection[id] = sectionTitle; });
    }

    if (cards.length === 0) {
        console.log('No cards found on this whiteboard.');
        return;
    }

    const regularCards = cards.filter(c => c.type === 'card');
    const pdfCards = cards.filter(c => c.type === 'pdfCard');
    console.log(`Found ${regularCards.length} cards and ${pdfCards.length} PDF cards on whiteboard "${wbName}".`);
    if (sections.length > 0) {
        console.log(`Found ${sections.length} sections: ${sections.map(s => '"' + s.title + '"').join(', ')}`);
    }

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
            let mdContent = '';

            if (card.type === 'pdfCard') {
                // Handle PDF card
                if (card.totalPages === 0) {
                    console.log(' SKIPPED (PDF not yet parsed in Heptabase)');
                    failed++;
                    continue;
                }
                // Fetch PDF pages in batches of 10
                const pageBatchSize = 10;
                const allPageContent = [];
                for (let p = 1; p <= card.totalPages; p += pageBatchSize) {
                    const endPage = Math.min(p + pageBatchSize - 1, card.totalPages);
                    const pageContent = getPdfPages(card.id, p, endPage);
                    allPageContent.push(pageContent);
                }
                let rawPdf = allPageContent.join('\n\n');

                // Clean PDF content: extract text from <chunk> tags
                const pdfChunks = rawPdf.match(/<chunk[^>]*>([\s\S]*?)<\/chunk>/g);
                if (pdfChunks) {
                    const cleanedChunks = pdfChunks
                        .filter(c => {
                            // Don't skip chunks that only contain images if we want to show placeholders
                            const inner = c.replace(/<\/?chunk[^>]*>/g, '').trim();
                            return inner.length > 0;
                        })
                        .map(c => {
                            let text = c.replace(/<\/?chunk[^>]*>/g, '').trim();
                            // Convert image tags to placeholders
                            text = text.replace(/<image[^>]+fileId="([^"]+)"[^>]*\/?>/g, '\n\n> 📷 *[Image Placeholder: $1]*\n\n');
                            // Clean up self-closing images without fileId if any
                            text = text.replace(/<image[^>]*\/?>/g, '\n\n> 📷 *[Image Placeholder]*\n\n');
                            // Convert simple HTML tables to text
                            text = text.replace(/<table>[\s\S]*?<\/table>/g, (tbl) => {
                                const rows = tbl.match(/<tr>[\s\S]*?<\/tr>/g) || [];
                                return rows.map(row => {
                                    const cells = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || [];
                                    return cells.map(cell => cell.replace(/<\/?td[^>]*>/g, '').trim()).filter(Boolean).join(' | ');
                                }).filter(Boolean).join('\n');
                            });
                            // Clean remaining HTML entities and tags
                            text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                            text = text.replace(/<[^>]+>/g, '');
                            // Remove "Captions:" and "Footnotes:" labels (usually empty for PDF)
                            text = text.replace(/^Captions:\s*$/gm, '').replace(/^Footnotes:\s*$/gm, '');
                            return text.trim();
                        })
                        .filter(t => t.length > 0);
                    rawPdf = cleanedChunks.join('\n\n');
                }

                // Strip remaining API metadata
                rawPdf = rawPdf
                    .replace(/<pdfCard[^>]*>/g, '')
                    .replace(/<\/pdfCard>/g, '')
                    .replace(/^PDF pages content retrieved successfully\.\s*$/gm, '')
                    .replace(/^IMPORTANT - Understanding the format:\s*$/gm, '')
                    .replace(/^- Content is formatted in XML.*$/gm, '')
                    .replace(/^- XML tags and attributes.*$/gm, '')
                    .replace(/^- Content may be split into chunks.*$/gm, '')
                    .replace(/^- NEVER expose XML formatting.*$/gm, '')
                    .replace(/^- Present information naturally.*$/gm, '')
                    .replace(/^- Results are formatted.*$/gm, '')
                    .replace(/^,\s*,\s*\)\s*$/gm, '')    // residual ", , )" line
                    .replace(/^---\s*$/gm, '')
                    .replace(/^\s*\n{3,}/gm, '\n\n')
                    .trim();

                mdContent = `# ${displayTitle}\n\n> Source: PDF (${card.totalPages} pages)\n\n${rawPdf}`;
            } else {
                // Handle regular card
                const content = getObject(card.id, 'card');

                // Extract only the card content (strip XML wrapper and metadata)
                mdContent = content;

                // Method 1: extract from <chunk> tags if present
                const chunkMatch = content.match(/<chunk[^>]*>([\s\S]*?)<\/chunk>/g);
                if (chunkMatch) {
                    mdContent = chunkMatch
                        .map(c => c.replace(/<\/?chunk[^>]*>/g, '').trim())
                        .join('\n\n');
                }

                // Strip remaining XML tags and API metadata
                mdContent = mdContent
                    .replace(/<image[^>]+fileId="([^"]+)"[^>]*\/?>/g, '\n\n> 📷 *[Image Placeholder: $1]*\n\n')
                    .replace(/<image[^>]*\/?>/g, '\n\n> 📷 *[Image Placeholder]*\n\n')
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
            }

            const filename = sanitizeFilename(displayTitle) + '.md';

            // Determine subdirectory based on section membership
            const sectionTitle = objectToSection[card.id];
            let cardDir = targetDir;
            let relPath = filename;
            if (sectionTitle) {
                const sectionFolder = sanitizeFilename(sectionTitle);
                cardDir = path.join(targetDir, sectionFolder);
                relPath = sectionFolder + '/' + filename;
                if (!fs.existsSync(cardDir)) {
                    fs.mkdirSync(cardDir, { recursive: true });
                }
            }

            const filePath = path.join(cardDir, filename);
            fs.writeFileSync(filePath, mdContent, 'utf8');

            exportedCards.push({ title: displayTitle, filename, relPath, section: sectionTitle || null });
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

    // Group by section
    const unsectioned = exportedCards.filter(c => !c.section);
    const sectionGroups = {};
    exportedCards.forEach(c => {
        if (c.section) {
            if (!sectionGroups[c.section]) sectionGroups[c.section] = [];
            sectionGroups[c.section].push(c);
        }
    });

    // List sections first
    for (const sec of sections) {
        const group = sectionGroups[sec.title];
        if (group && group.length > 0) {
            indexContent += `## 📁 ${sec.title}\n\n`;
            group.forEach((card, i) => {
                indexContent += `${i + 1}. [${card.title}](./${card.relPath})\n`;
            });
            indexContent += `\n`;
        }
    }

    // Then unsectioned cards
    if (unsectioned.length > 0) {
        if (sections.length > 0) {
            indexContent += `## Other Cards\n\n`;
        } else {
            indexContent += `## Cards\n\n`;
        }
        unsectioned.forEach((card, i) => {
            indexContent += `${i + 1}. [${card.title}](./${card.relPath})\n`;
        });
    }

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
  heptabase hub <topic>            Auto-generate a Hub card for a topic

Export options:
  --whiteboard-id <id>    Whiteboard ID to export
  --keyword <text>        Search whiteboard by keyword
  --output-dir <path>     Output directory (default: ./export/<whiteboard-name>/)

Examples:
  heptabase domain e:\\RevitMCP\\domain\\detail-component-sync.md
  heptabase organize 7
  heptabase export --keyword "Dynamo" --output-dir E:\\Backup\\Dynamo
  heptabase hub Dynamo
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
    case "hub":
        if (!args[1]) {
            console.error("Error: please provide a topic keyword, e.g. heptabase hub Dynamo");
            process.exit(1);
        }
        cmdHub(args[1]);
        break;
    default:
        console.error(`Unknown subcommand: '${subcommand}'`);
        printHelp();
        process.exit(1);
}
