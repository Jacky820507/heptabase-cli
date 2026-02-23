# Gemini Context & Project Map — Heptabase CLI

此檔案旨在協助 AI 助手快速理解 heptabase-cli 專案結構與開發規則。

## 📁 專案結構

| 路徑 | 說明 | 關鍵檔案 |
| :--- | :--- | :--- |
| **`bin/`** | CLI 入口與輔助腳本 | `heptabase.cjs` (啟動器)<br>`heptabase-sync.cjs` (同步工具)<br>`heptabase.cmd` (Windows 批次檔) |
| **`domain/`** | 業務流程與使用 SOP | `heptabase-cli-commands.md`<br>`cross-workspace-import.md` |
| **`config/`** | MCP 伺服器設定 | `mcporter.json` |

## 🚀 常用任務

| 任務 | 指令 |
| :--- | :--- |
| 搜尋白板 | `node bin/heptabase.cjs search-whiteboards --keywords "關鍵字"` |
| 建立筆記卡片 | `node bin/heptabase.cjs save-to-note-card --content "# 標題\n\n內容"` |
| 匯入 Domain SOP | `node bin/heptabase-sync.cjs domain <file.md>` |
| 匯入 Lessons | `node bin/heptabase-sync.cjs lessons <GEMINI.md>` |

## 🧠 AI 協作指令

| 指令 | 行為規範 |
| :--- | :--- |
| **`/lessons`** | 從成功對話中提取高階規則，追加到此 `GEMINI.md` 的 `## 🔬 智慧提煉` 區塊 |
| **`/domain`** | 將成功工作流程轉換為 SOP 格式的 `domain/*.md` 檔案（含 YAML frontmatter） |

## ⚠️ 開發注意事項

1. **`heptabase-cli.ts` 不可編輯**：由 `mcporter` 自動生成，標註 `DO NOT EDIT`
2. **跨平台啟動器**：`bin/heptabase.cjs` 先試 `bun`，失敗後用 `node + tsx/dist/cli.mjs`
3. **ESM 相容性**：`package.json` 設定 `"type": "module"`，啟動器必須用 `.cjs` 副檔名
4. **Windows 參數**：大型文字內容必須透過 Node.js 腳本傳入，不能直接 CLI 參數

---

## 🔬 智慧提煉 (Lessons Learned)

> 此章節由 AI 助手透過 `/lessons` 指令自動維護。

### [L-001] Windows 上 execFileSync 不可呼叫 .cmd 檔案
- **規則**：在 Windows 上，`execFileSync` 無法直接呼叫 `.cmd` 批次檔（會產生 `EINVAL` 錯誤），但加上 `shell: true` 又會導致包含空格的參數被錯誤分割。
- **實踐**：直接用 `execFileSync("node", [tsxCliPath, ...])` 呼叫 `tsx/dist/cli.mjs`，繞過 `.cmd` 和 shell 問題。

### [L-002] mcporter 產生的 CLI 是 ESM-only
- **規則**：`mcporter` 套件只輸出 ESM (`"type": "module"`)。若 `package.json` 未設定 `"type": "module"`，`tsx` 會以 CJS 模式載入 `.ts` 檔案，無法解析 mcporter 的 `import` 語法。
- **實踐**：在 `package.json` 加入 `"type": "module"`，同時將 CJS 啟動器改名為 `.cjs`。

### [L-003] 大型 Markdown 內容的 Windows 傳輸方式
- **規則**：Windows cmd/PowerShell 對 CLI 參數長度有限制，且特殊字元（如中文括號、管線符號）會導致解析失敗。
- **實踐**：建立獨立的 `.cjs` 腳本，用 `fs.readFileSync` 讀取檔案，再以 `execFileSync` 的 `args` 陣列傳入（不經過 shell）。

### [L-004] Heptabase OAuth Token 快取
- **規則**：首次執行任何指令都會觸發瀏覽器 OAuth 登入。Token 快取成功後，後續執行不需再次登入。
- **路徑**：
  - macOS/Linux：`~/.mcp-auth/`
  - Windows：`%USERPROFILE%\.mcp-auth\`

### [L-005] save-to-note-card 的標題規則
- **規則**：`--content` 的第一行必須是 `# 標題`，Heptabase 會自動將其設為卡片標題。
- **實踐**：匯入外部檔案時，應在內容前加上 `# [前綴] 描述性標題\n\n` 以確保卡片有明確的標題。
