const { google } = require("googleapis");
const TurndownService = require("turndown");
const fs = require("fs");
const path = require("path");

// Scopes for Gmail API (Read only for messages)
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(__dirname, "..", "config", "token.json");
const CREDENTIALS_PATH = path.join(__dirname, "..", "config", "credentials.json");
const SYNC_STATE_PATH = path.join(__dirname, "..", "config", "gmail-sync-state.json");

/**
 * Initialize OAuth2 client
 */
async function getOAuth2Client() {
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error(`Missing credentials.json in config/ directory. Please get it from Google Cloud Console.`);
    }
    const content = fs.readFileSync(CREDENTIALS_PATH, "utf8");
    let credentials;
    try {
        credentials = JSON.parse(content);
    } catch (e) {
        throw new Error(`Invalid credentials.json format.`);
    }

    const clientConfig = credentials.installed || credentials.web;
    if (!clientConfig) {
        throw new Error(`Invalid credentials.json structure (missing 'installed' or 'web' key).`);
    }

    const { client_secret, client_id, redirect_uris } = clientConfig;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    if (fs.existsSync(TOKEN_PATH)) {
        const token = fs.readFileSync(TOKEN_PATH, "utf8");
        oAuth2Client.setCredentials(JSON.parse(token));
        return oAuth2Client;
    } else {
        // Trigger manual OAuth flow (in console)
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });
        console.log("\n🚀 Gmail API Authorization Required!");
        console.log("1. Open this URL in your browser:\n", authUrl);
        
        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        return new Promise((resolve, reject) => {
            readline.question("\n2. After authorizing, paste the 'code' from the redirect URL here: ", (code) => {
                readline.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return reject(new Error(`Error retrieving access token: ${err.message}`));
                    oAuth2Client.setCredentials(token);
                    // Save the token for future runs
                    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
                    console.log(`✅ Token stored to ${TOKEN_PATH}`);
                    resolve(oAuth2Client);
                });
            });
        });
    }
}

/**
 * Sync Gmail messages based on filters
 */
async function cmdGmailSync(options, saveToNoteCardFunc) {
    const { query, label, sender, days } = options;
    console.log(`📡 Searching for Gmail messages...`);

    let auth;
    try {
        auth = await getOAuth2Client();
    } catch (err) {
        console.error(`❌ Authentication error: ${err.message}`);
        return;
    }

    const gmail = google.gmail({ version: "v1", auth });
    const turndown = new TurndownService();

    // 1. Build Query
    let q = query || "";
    if (sender) q += ` from:${sender}`;
    if (label) q += ` label:${label}`;
    if (days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        q += ` after:${yyyy}/${mm}/${dd}`;
    }
    q = q.trim();
    console.log(`🔍 Gmail Filter: "${q || "ALL (limited to 50)"}"`);

    // 2. Load Sync State
    let syncState = [];
    if (fs.existsSync(SYNC_STATE_PATH)) {
        try {
            syncState = JSON.parse(fs.readFileSync(SYNC_STATE_PATH, "utf8"));
        } catch (e) {
            syncState = [];
        }
    }

    // 3. List Messages
    const res = await gmail.users.messages.list({ userId: "me", q, maxResults: 50 });
    const messages = res.data.messages || [];

    if (messages.length === 0) {
        console.log("✨ No new messages found matching the criteria.");
        return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (const msg of messages) {
        if (syncState.includes(msg.id)) {
            skipCount++;
            continue;
        }

        // 4. Get Message Details
        const message = await gmail.users.messages.get({ userId: "me", id: msg.id });
        const headers = message.data.payload.headers;
        const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
        const from = headers.find(h => h.name === "From")?.value || "Unknown";
        const dateStr = headers.find(h => h.name === "Date")?.value || "";

        // 5. Extract Content
        let rawHtml = "";
        let rawText = "";

        // Simplified content extraction
        function findBody(payload) {
            if (payload.body.data) {
                const data = Buffer.from(payload.body.data, "base64url").toString();
                if (payload.mimeType === "text/html") rawHtml = data;
                if (payload.mimeType === "text/plain") rawText = data;
            }
            if (payload.parts) {
                payload.parts.forEach(findBody);
            }
        }
        findBody(message.data.payload);

        const body = rawHtml ? turndown.turndown(rawHtml) : (rawText || "(Empty body)");

        // 6. Format Content for Heptabase
        const cardContent = `# [Gmail] ${subject}\n\n` +
            `> **From**: ${from}\n` +
            `> **Date**: ${dateStr}\n` +
            `> **Link**: https://mail.google.com/mail/u/0/#inbox/${msg.id}\n\n` +
            `---\n\n` +
            body;

        // 7. Save to Heptabase
        console.log(`  📝 Syncing: ${subject}...`);
        try {
            saveToNoteCardFunc(cardContent);
            syncState.push(msg.id);
            successCount++;
        } catch (err) {
            console.error(`  ❌ Failed to save "${subject}":`, err.message);
        }
    }

    // 8. Update State (only keep last 1000 IDs to avoid file bloat)
    if (syncState.length > 1000) {
        syncState = syncState.slice(-1000);
    }
    fs.writeFileSync(SYNC_STATE_PATH, JSON.stringify(syncState, null, 2));

    console.log(`\n✅ Gmail Sync Summary:`);
    console.log(`   Processed: ${messages.length}`);
    console.log(`   Imported:  ${successCount}`);
    console.log(`   Skipped:   ${skipCount} (already imported)`);
}

module.exports = { cmdGmailSync };
