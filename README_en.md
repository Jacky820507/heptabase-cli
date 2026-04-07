# Heptabase CLI

CLI for your personal Heptabase knowledge base. Search whiteboards, read cards/journals/PDFs, and write notes from the terminal.

Ported from Official [Heptabase MCP](https://support.heptabase.com/en/articles/12679581-how-to-use-heptabase-mcp) via [MCP Porter](https://github.com/steipete/mcporter/).


## Install

Pick one:

### Option 1: npm (recommended on Windows)

```bash
npm install -g heptabase-cli
heptabase --help
```

Requires [Node.js](https://nodejs.org/). Works on Windows, macOS, and Linux.

### Option 2: Homebrew (recommended on macOS)

```bash
brew tap madeyexz/tap
brew install madeyexz/tap/heptabase-cli
heptabase --help
```

### Option 3: Standalone binary (macOS arm64 only)

After install, use `heptabase` for all commands.

> **Note**: The standalone binary is currently macOS arm64 only.
> On Windows or other platforms, use Option 1 (npm) or Option 4 (bunx).

```bash
mkdir -p ~/.local/bin
curl -L https://github.com/Jacky820507/heptabase-cli/releases/latest/download/heptabase -o ~/.local/bin/heptabase
chmod +x ~/.local/bin/heptabase
~/.local/bin/heptabase --help
```

If `~/.local/bin` is not in your `PATH`, add it:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Optional system-wide install:

```bash
curl -L https://github.com/Jacky820507/heptabase-cli/releases/latest/download/heptabase -o heptabase
chmod +x heptabase
sudo mv heptabase /usr/local/bin/
```

### Option 4: `bunx` (no install, requires [Bun](https://bun.sh/))

```bash
bunx heptabase-cli --help
```

## Agent Setup

For agents, prefer installing `heptabase` on `PATH`.

If you use AI agents (Claude Code, Codex, etc.), install the Heptabase [agent skill](SKILL.md):

```bash
npx skills add madeyexz/heptabase-cli
```

Agent command convention: use `heptabase ...` (not `bunx heptabase-cli ...`).

## Authentication (First Run)

Run any command (examples below). The first run opens a browser for Heptabase OAuth.

- Tokens are cached in `~/.mcp-auth/` (macOS/Linux) or `%USERPROFILE%\.mcp-auth\` (Windows)
- Tokens auto-refresh
- Reset login:
  - macOS/Linux: `rm -rf ~/.mcp-auth/`
  - Windows: `rmdir /s /q %USERPROFILE%\.mcp-auth`

## Usage

Examples below use installed binary `heptabase`.
If you use no-install mode, replace `heptabase` with `bunx heptabase-cli`.

```bash
# Search
heptabase search-whiteboards --keywords "project"
heptabase semantic-search-objects --queries "machine learning" --result-object-types card

# Read
heptabase get-object --object-id <id> --object-type card
heptabase get-journal-range --start-date 2026-01-01 --end-date 2026-02-21

# Write
heptabase save-to-note-card --content "# Title\n\nBody text"
heptabase append-to-journal --content "Some entry"

# AI Auto-Organization
# heptabase organize <days>
heptabase organize 7

### Export Whiteboard (Export)

Full export of whiteboard cards to local Markdown files. Ideal for backups or LLM-assisted workflows.

1. `heptabase export --keyword "whiteboard name"` — Search and prepare export data
2. **Auto-Grouping**: Automatically creates subfolders based on whiteboard **Sections**
3. **Media Handling**: Extract PDF content and insert image placeholders
4. **Auto-Indexing**: Generates a grouped `_index.md` for navigation
5. **Content Cleaning**: Strips XML tags and converts HTML tables to Markdown

```bash
# Example command
heptabase export --keyword "Project Alpha" --output-dir ./backup
```

### Bulk Import Local Markdown (Import)

Batch import Markdown files from a local directory (including subdirectories) into Heptabase cards. Due to API limitations, cards cannot be automatically added to a specific Whiteboard during import.

To facilitate subsequent organization, the system will use the directory structure as a "tag prefix" and append it to the front of the card title.

1. `heptabase import <directory_path>` — Scan and import files
2. **Auto Title Merging**: For example, `/docs/api/login.md` will generate a card with the title `# [docs/api] login`
3. **Subsequent Classification**: Open Heptabase, search for `[directory_name]` to find the entire batch of imported cards, and then manually select and drag them into the designated Whiteboard.

```bash
# Example command
heptabase import ./my-project-notes
```

### Auto-Generate Hub (Hub)

Quickly create a navigation index card when you have scattered topics across multiple whiteboards.

1. `heptabase hub <topic_keyword>` — Search for all related whiteboards
2. **Auto-Aggregation**: Counts cards, PDFs, and Sections for each whiteboard
3. **Link Creation**: Generates Markdown content with `→ 白板『Name』` markers
4. **Save Card**: Automatically creates a new Hub card in Heptabase

```bash
# Example command
heptabase hub Dynamo
```
```

List all commands:

```bash
heptabase --help
heptabase <command> --help
```

Supported output formats (`--output`): `text` (default), `json`, `markdown`, `raw`.

## Commands

- `search-whiteboards`
- `semantic-search-objects`
- `get-object`
- `get-whiteboard-with-objects`
- `get-journal-range`
- `save-to-note-card`
- `append-to-journal`
- `search-pdf-content`
- `get-pdf-pages`
- `organize` (AI Auto-Organization)
- `export` (Export whiteboard cards as Markdown)
- `import` (Recursively scan folder and bulk import Markdown files)
- `hub` (Auto-generate a Hub navigation card)

## Troubleshooting

- `command not found: heptabase` (macOS/Linux): use `bunx heptabase-cli ...` or ensure `~/.local/bin` (or `/usr/local/bin`) is in your `PATH`.
- `'heptabase' is not recognized` (Windows): ensure npm global bin is in your `PATH`, or use `npx heptabase-cli ...`.
- Browser did not open for OAuth: copy the login URL from terminal and open it manually.
- Need to re-authenticate:
  - macOS/Linux: `rm -rf ~/.mcp-auth/`
  - Windows (PowerShell): `Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"`

## Development (Advanced)

Requires [Node.js](https://nodejs.org/) and [Bun](https://bun.sh/).

```bash
npx mcp-remote@latest https://api.heptabase.com/mcp --transport http-only

npx mcporter@latest generate-cli \
  --command 'npx -y mcp-remote@latest https://api.heptabase.com/mcp --transport http-only' \
  --output ./heptabase-cli.ts \
  --compile ./heptabase \
  --description "Heptabase knowledge base CLI"
```

## More

- Heptabase MCP docs: https://support.heptabase.com/en/articles/12679581-how-to-use-heptabase-mcp
- This CLI is generated with [mcporter](https://github.com/steipete/mcporter/) + [mcp-remote](https://github.com/geelen/mcp-remote)
