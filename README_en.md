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
curl -L https://github.com/madeyexz/heptabase-cli/releases/latest/download/heptabase -o ~/.local/bin/heptabase
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
curl -L https://github.com/madeyexz/heptabase-cli/releases/latest/download/heptabase -o heptabase
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

## Troubleshooting

- `command not found: heptabase` (macOS/Linux): use `bunx heptabase-cli ...` or ensure `~/.local/bin` (or `/usr/local/bin`) is in your `PATH`.
- `'heptabase' is not recognized` (Windows): ensure npm global bin is in your `PATH`, or use `npx heptabase-cli ...`.
- Browser did not open for OAuth: copy the login URL from terminal and open it manually.
- Need to re-authenticate:
  - macOS/Linux: `rm -rf ~/.mcp-auth/`
  - Windows (PowerShell): `Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"`

## Common Workflows

### Search → Read → Write

1. `semantic-search-objects` — Find relevant notes.
2. `get-object` — Read the full content.
3. `save-to-note-card` or `append-to-journal` — **Analyze & Record (AI/Manual)**: After analysis or summarization, write back results.

### Exploring Whiteboards

1. `search-whiteboards` — Search whiteboards by topic.
2. `get-whiteboard-with-objects` — View all objects and links on the board.
3. `get-object` — Read specific cards in depth.

### Review Journals

1. `get-journal-range` — Get journals over a period (split if > 92 days).
2. `append-to-journal` — **Review & Summarize (AI/Manual)**: Consolidate progress or patterns, then write the summary into today's journal.

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
