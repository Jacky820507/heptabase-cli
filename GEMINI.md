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

### [L-006] CLI 無法建立可點擊的 @mention 連結
- **規則**：透過 MCP API 的 `save-to-note-card` 寫入的內容，無論使用 `<mention>` XML 標籤、`heptabase://` deeplink 或 Markdown 連結格式，都**不會被渲染為可點擊的內部物件連結**。API 僅接受純 Markdown 文字。
- **實踐**：在 Hub/TOC 類型的卡片中，直接使用白板名稱（如「→ 白板『AR-BIM_Dynamo常用節點』」）作為文字標記，方便使用者透過搜尋功能跳轉。

### [L-007] 白板 XML 中的 Section 與卡片歸屬關係
- **規則**：在 `get-whiteboard-with-objects` 的 XML 中，`<section>` 標籤包含 `title` 和逗號分隔的 `objectIds`。
- **實踐**：匯入時可解析此關係，將卡片歸類到對應名稱的資料夾中。若卡片不屬於任何 section，則放在根目錄。

### [L-008] PDF 分頁讀取與參數修正
- **規則**：`get-pdf-pages` 的參數正確名稱為 `--pdf-card-id` (非 pdf-id)、`--start-page-number` (非 start-page) 與 `--end-page-number`。且大型 PDF 需分批（如每 10 頁）讀取以避免逾時或 MCP 連線中斷。
- **實踐**：在 `heptabase-sync.cjs` 中實作分批抓取邏輯，並對 PDF 內容進行 XML/中繼資料清洗。

### [L-009] 圖片佔位標記 (Image Placeholders)
- **規則**：MCP API 不支援直接下載圖片檔或取得永久 URL。直接刪除 `<image>` 標籤會導致 LLM 失去視覺脈絡。
- **實踐**：將 `<image fileId="..."/>` 轉換為 `> 📷 *[Image Placeholder: fileId]*`。這能告知 LLM 此處有視覺資訊，維持文字邏輯的連貫性。
### [L-010] Hub 自動生成與清單格式化
- **規則**：當單一卡片內容包含大量白板 Section 時，全部擠在同一行會導致閱讀極其困難。
- **實踐**：在 `heptabase hub` 實作中，根據 Section 數量動態切換格式：
  - ≤ 3 個：單行頓號分隔（保持精簡）。
  - > 3 個：改為層級縮排列表（提升可讀性與掃視效率）。
### [L-011] 混合自然排序 (Hybrid Natural Sort) 策略
- **規則**：純字串排序（localeCompare）無法處理 `2.` 在 `2.1` 前面，也無法處理 `API 1` 與 `API 6` 因為前面文字差異導致的亂序。
- **實踐**：實施三層排序邏輯：
  1. **版本號優先**：開頭為 `2.` 或 `2.1` 的標題按版本元組比較，確保父章節在前。
  2. **末尾數字排序**：針對 `API 1`、`#10` 等模式，優先提取「最後一個數字」進行數值比較。
  3. **前綴分組渲染**：偵測 `[標籤]`、`文字:` 等前綴，自動將多個同類卡片折疊進一個不帶點的父項目中。

### [L-012] Gmail API 同步與 OAuth 權杖修復
- **規則**：Gmail API 需在本地 `config/token.json` 緩存權杖。若出現 `invalid_grant` 或 `missing credentials`，通常是因為權杖過期或路徑錯誤。
- **實踐**：在 `gmail-sync-logic.cjs` 中實作偵測邏輯。若發生錯誤，引導使用者從 Google Cloud 下載 `credentials.json` 並手動獲取 `code`。若 Heptabase 連線失效，可從 `%USERPROFILE%\.mcp-auth\` 找回 Access Token。

### [L-013] CJS 啟動器中的環境變數加載 (dotenv)
- **規則**：在 `.cjs` 啟動器中，`require("dotenv").config()` 必須在任何調用 `execFileSync` 之前執行，且必須指定 `{ path: ... }` 以確保路徑正確連動。
- **避坑**：Shebang (`#!`) 必須位於檔案絕對第一行。且在手動貼入代碼時，需注意 `path` 或 `fs` 是否重複宣告，否則 Node.js 會報 `SyntaxError: Identifier '...' has already been declared`。
