# Antigravity Heptabase CLI 完全操作手冊

> **適用對象**：使用 Antigravity (Gemini CLI) 並想要配置與使用 Heptabase CLI 的使用者  
> **版本**：0.1.0  
> **最後更新**：2026-02-28  
> **環境需求**：Node.js (>= 18.0) 或 Bun

---

## 📋 目錄

1. [快速索引](#快速索引)
2. [Part 1: 如何移除與重置 Heptabase CLI](#part-1-如何移除與重置-heptabase-cli)
3. [Part 2: 系統架構與連接邏輯](#part-2-系統架構與連接邏輯)
4. [Part 3: 官方與專案參考文件](#part-3-官方與專案參考文件)
5. [Part 4: 正式部署與操作教學](#part-4-正式部署與操作教學)
6. [Part 5: 在 Antigravity 中配置介面化 MCP (防止 AI 幻覺)](#part-5-在-antigravity-中配置介面化-mcp-防止-ai-幻覺)
7. [除錯與常見問題](#除錯與常見問題)

---

## 快速索引

| 需求 | 跳轉章節 |
|:-----|:---------|
| 我想重置/登出 OAuth | [Part 1](#part-1-如何移除與重置-heptabase-cli) |
| 我想了解系統架構 | [Part 2](#part-2-系統架構與連接邏輯) |
| 我想查看相關文件 | [Part 3](#part-3-官方與專案參考文件) |
| 我想學習安裝與使用方式 | [Part 4](#part-4-正式部署與操作教學) |
| 我想在 IDE 中開關切換工具 | [Part 5](#part-5-在-antigravity-中配置介面化-mcp-防止-ai-幻覺) |
| 執行指令時遇到錯誤 | [除錯章節](#除錯與常見問題) |

---

# Part 1: 如何移除與重置 Heptabase CLI

## 🗑️ 情境說明

當您想要：
- 重新進行 Heptabase 帳號登入 (OAuth)
- 完全移除系統中的 Heptabase CLI 工具

請按照以下步驟操作。

---

## 步驟 1: 清除 OAuth Token 快取 (重新登入)

Heptabase CLI 首次執行時會開啟瀏覽器進行 OAuth 登入，並將 Token 快取於本地端。若需切換帳號或權限失效，請手動刪除快取資料夾：

| 作業系統 | 清除指令 |
|:---------|:---------|
| **Windows** | `Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"` |
| **macOS / Linux** | `rm -rf ~/.mcp-auth/` |

刪除後，下次執行任何 `heptabase` 指令都會再次喚起瀏覽器登入畫面。

---

## 步驟 2: 移除 CLI 工具

根據您當初安裝的方式選擇移除指令：

### 2.1 透過 npm 安裝 (全域)
```powershell
npm uninstall -g heptabase-cli
```

### 2.2 透過 Homebrew 安裝 (macOS)
```bash
brew uninstall madeyexz/tap/heptabase-cli
brew untap madeyexz/tap
```

### 2.3 透過 bunx 執行
若使用 `bunx`，套件為快取執行模式，一般無需特別解除安裝。若要清除 bun 全域快取，可執行 `bun cache clean`。

---

# Part 2: 系統架構與連接邏輯

## 🛠️ 專案核心結構與檔案清單

Heptabase CLI 是基於 Heptabase 官方 MCP API 封裝而成的指令列工具。

| 目錄/檔案 | 用途 | 必須性 |
|:-----|:-----|:------|
| `heptabase-cli.ts` | MCP 伺服器核心定義 (由 mcporter 自動生成，**不可編輯**) | ✅ 核心 |
| `bin/heptabase.cjs` | 跨平台指令啟動器 (處理 node/bun 執行環境) | ✅ 核心 |
| `bin/heptabase-sync.cjs`| 擴充功能腳本 (針對匯入、匯出、Hub 等複合業務流程) | ✅ 擴充 |
| `package.json` | Node.js 專案設定 (`"type": "module"` ESM 相容) | ✅ 核心 |
| `domain/*.md` | Heptabase SOP 及知識提煉文件 | 📖 參考 |
| `GEMINI.md` | 本專案 AI 協作指南及開發守則 | 📖 參考 |

---

## 🔗 Antigravity ↔ CLI ↔ Heptabase API 連接邏輯

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Antigravity  │  呼叫   │ bin/heptabase│  呼叫   │   tsx/bun    │
│     IDE      │ ──────> │    .cjs      │ ──────> │ 執行環境編譯 │
└──────────────┘         └──────────────┘         └──────────────┘
                                                          │
                                                          │ 載入
                                                          ↓
                                                   ┌──────────────┐
                                                   │ heptabase-   │
                                                   │   cli.ts     │
                                                   └──────────────┘
                                                          │
                                                          │ HTTPS / OAuth
                                                          ↓
                                                   ┌──────────────┐
                                                   │ Heptabase    │
                                                   │ Cloud / MCP  │
                                                   └──────────────┘
```

**架構重點注意事項：**
1. **執行器降級機制**：`bin/heptabase.cjs` 會優先嘗試使用 `bun` 執行。若失敗，則 fallback 使用 Node.js 的 `tsx` 模組執行（確保跨平台相容性）。
2. **ESM 相容性**：`mcporter` 產生的程式碼為 ESM 模組，因此 `package.json` 必須宣告 `"type": "module"`，且驅動腳本需使用 `.cjs` 副檔名。
3. **無 .cmd 直接呼叫**：在 Windows 環境下，直接由腳本呼叫 `.cmd` 容易發生參數截斷錯誤，因此所有底層呼叫皆直接對齊 Node 執行檔。

---

# Part 3: 官方與專案參考文件

## 📚 參考連結

| 資源 | 網址 | 說明 |
|:-----|:-----|:-----|
| **Heptabase MCP** | https://support.heptabase.com/en/articles/12679581-how-to-use-heptabase-mcp | 官方 MCP API 文件 |
| **GitHub 專案** | https://github.com/Jacky820507/heptabase-cli | 專案原始碼儲存庫 |
| **Node.js** | https://nodejs.org/ | Node.js 官方網站 |
| **Bun** | https://bun.sh/ | Bun 執行環境 (速度更快) |

---

# Part 4: 正式部署與操作教學

## 🚀 完整執行流程（Step by Step）

### 前置作業：環境檢查

執行以下指令確認系統已安裝所需的執行環境：

```powershell
# 檢查 Node.js 版本（建議 >= 18.0.0）
node --version

# 檢查 npm 版本
npm --version
```
> ※ 建議安裝 [Node.js](https://nodejs.org/) 或是 [Bun](https://bun.sh/) 以獲得更快的執行速度。

---

### 階段一：安裝 Heptabase CLI

#### 選項 A：使用 npm 全域安裝（推薦 Windows 使用者）

```powershell
npm install -g heptabase-cli

# 驗證安裝
heptabase --help
```

#### 選項 B：使用免安裝方式（推薦已安裝 Bun 之使用者）

您不需要進行全域安裝，可直接透過 `bunx` 執行：
```bash
bunx heptabase-cli --help
```

---

### 階段二：初始化與 OAuth 登入

首次執行任何操作時，會觸發 OAuth 認證以授權 CLI 存取您的 Heptabase：

1. 在終端機執行任意指令，例如：`heptabase organize 1` 或 `heptabase search-whiteboards --keywords "測試"`。
2. 系統會自動開啟預設瀏覽器（若未開啟，請點擊終端機內出現的網址）。
3. 登入 Heptabase 帳號並點擊「授權」。
4. 驗證成功後，Token 會快取在 `~/.mcp-auth/` (Mac/Linux) 或 `%USERPROFILE%\.mcp-auth\` (Windows) 內。

---

### 階段三：常見指令與使用情境

以下介紹透過 CLI 或在 Antigravity 內常用的 Heptabase 操作情境。

#### 1. 搜尋白板與筆記

```bash
# 語意搜尋卡片 (Semantic Search)
heptabase semantic-search-objects --queries "AI 寫作技巧" --result-object-types card

# 關鍵字搜尋白板
heptabase search-whiteboards --keywords "專案管理,工作流程"
```

#### 2. 閱讀與讀取

```bash
# 根據 ID 抓取物件內容 (支援 card, pdfCard, journal)
heptabase get-object --object-id [卡片ID] --object-type card

# 取得特定日期範圍內的日誌
heptabase get-journal-range --start-date 2026-02-01 --end-date 2026-02-28
```

#### 3. 寫入與建立卡片

```bash
# 建立新筆記卡片 (注意：首行必須為標題形式 '# 標題')
heptabase save-to-note-card --content "# 學習筆記\n\n今天讀了關於 AI 整合的文章。"

# 將內容快速附加至今日日誌
heptabase append-to-journal --content "思考：可以用這套 CLI 來自動化發文流程。"
```

#### 4. 高階擴充功能 (藉由 heptabase-sync 執行)

```bash
# 依據主題自動尋找並彙整建立一張導航 Hub 卡片
heptabase hub Dynamo

# 自動歸納與獲取過去 7 天的日記資料 (提供給 AI 進行分析整理)
heptabase organize 7

# 將白板匯出為本機 MD 檔案
heptabase export --keyword "建築設計" --output-dir ./backup

# 批次匯入本機 MD 資料夾至 Heptabase (卡片標題會加上資料夾前綴以利分類)
heptabase import ./my-project-notes
```

# Part 5: 在 Antigravity 中配置介面化 MCP (防止 AI 幻覺)

為了讓 AI 能夠更精準地呼叫 Heptabase 的功能（例如 `search_whiteboards`, `save_to_note_card` 等），並且可以在 IDE 的介面上透過「開關按鈕」決定要開啟哪些工具，您可以直接將 Heptabase MCP 註冊到 Antigravity 中 (如同 Revit MCP 的配置)。

## 為什麼要這樣做？
當 AI 在沒有明確約束的情況下，可能會「猜測」指令或參數（即 AI 幻覺）。透過將 Heptabase MCP 正式列入 Antigravity IDE 的 Server 列表，您可以：
1. **可視化管理**：在 Manage MCP servers 面板中，看見所有可用的工具。
2. **精準控制**：透過開關按鈕 (Toggle) 啟用或停用特定工具，確保 AI 只能執行您目前目標授權的動作。
3. **無縫整合**：AI 會直接透過 MCP 協定傳遞 JSON 參數，不再受限於命令字元 (CLI) 的跳脫字元或字數過長的問題。

---

## 建立 Server 步驟

### 1. 進入 MCP 設定介面
1. 打開 **Antigravity IDE**。
2. 點選右上角的選單，選擇 **「MCP Servers」**。
3. 點選 **「View raw config」** 進入原始 JSON 設定檔。

### 2. 新增 Heptabase MCP 原始碼
將以下 JSON 區塊複製，並貼入 `mcpServers` 內（如果您已經有其他 Server 區塊，請注意括號之間的逗號分隔 `,`）：

```json
    "heptabase-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://api.heptabase.com/mcp",
        "--transport",
        "http-only"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
```

### 3. 更新與驗證
1. 儲存 JSON 設定後，點擊 Manage MCP servers 面板右上角的 **Refresh**。
2. 您應該會在清單中看到 `heptabase-mcp`。
3. 點開後，會顯示出如 `save_to_note_card`, `search_whiteboards`, `get_object` 等原生工具的列表與個別的開關按鈕（就如同您在 Revit MCP 看到的一樣）。
4.- **管理工具**：您可以自由點擊每個工具旁邊的開關，隨時決定目前的對話中是否要讓 AI 調用該功能。

### 4. 工具功能對照表 (繁體中文)
由於 IDE 介面會直接抓取官方伺服器的英文說明，您可以參考以下對照表來了解各個開關的功能：

| 工具名稱 | 功能說明 (繁體中文) |
| :--- | :--- |
| **1. save_to_note_card** | 將任何資訊儲存至 Heptabase 主空間的筆記卡片中。 |
| **2. append_to_journal** | 將內容附加至 Heptabase 今天的日記中。如果今天的日記不存在，則會自動建立。 |
| **3. get_journal_range** | 取得指定日期範圍內的每日日記。支援最多 92 天的資料，日期格式為 YYYY-MM-DD。 |
| **4. get_whiteboard_with_objects** | 列出指定白板上的所有物件及其內容（如卡片、Section、連接線等）。 |
| **5. get_object** | 取得單一物件（卡片、日記、白板元素、聊天訊息等）的完整內容。 |
| **6. get_pdf_pages** | 根據頁碼取得特定 PDF 卡片的頁面內容（從 1 開始計數）。 |
| **7. search_pdf_content** | 在大型 PDF 中進行關鍵字搜尋（BM25 算法），適合尋找特定資訊。 |
| **8. semantic_search_objects** | 使用語意搜尋尋找與主題相關的物件（卡片、PDF、日記等）。 |
| **9. search_whiteboards** | 透過關鍵字搜尋白板，了解知識庫的組織結構。 |

> 💡 **小撇步**：如果您希望 AI 只專注於「寫筆記」，可以只開啟 `save_to_note_card` 並關閉所有 `search` 相關工具，這樣能有效防止 AI 在不需要時亂翻您的筆記。

---

# 除錯與常見問題💡 **注意事項**：
> - 首次在 Antigravity 內觸發 Heptabase MCP 原生工具時，系統同樣會打開瀏覽器要求進行 OAuth 登入。這與 CLI 的機制是互通的。
> - **⚠️ 擴充功能限制**：請注意，`heptabase export`, `import`, `organize` 與 `hub` 為 CLI 特有的擴充實作腳本，不會出現在這份介面的工具清單中，若需呼叫這類批次行為，仍需透過 CLI（即 Part 4 之方式）執行。

---


## ❌ 問題 1: 參數傳遞失敗或中斷（Windows 系統）

**症狀**：
當使用 `save-to-note-card` 或匯入大量 Markdown 文字時，系統出現解析錯誤、引號配對錯誤或是指令過長錯誤。

**原因與解決方案**：
Windows Cmd/PowerShell 對於 CLI 的參數長度有限制，且特殊字元 (例如括號、管線區段符號) 容易造成命令提示字元解析中斷。
**解決方針**：
- 切勿直接透過 shell 腳本或命令提示字元直接將過長的 Markdown 文字塞入 `--content`。
- `heptabase-cli` 建議採用如 `heptabase-sync.cjs` 獨立 `.cjs` 腳本的模式，用 `fs.readFileSync` 讀取實體檔案，再以 `execFileSync` 的 `args` 陣列方式傳入（不經過 shell 處理）。這能有效迴避跳脫字元的問題。

---

## ❌ 問題 2: 缺少 ESM 支援導致錯誤

**症狀**：
執行時發生 `Cannot use import statement outside a module` 或類似錯誤。

**解決方案**：
`mcporter` 編譯出來的模組限制為 ESM-only (`"type": "module"`)。
請確認 `package.json` 中的 `"type": "module"` 宣告是否存在。並且確保所有對應的啟動器均改用 `.cjs` 作為副檔名，使 CommonJS 與 ESM 邏輯能區隔開來。

---

## ❌ 問題 3: 圖片無法下載或缺失 (Image Placeholders)

**症狀**：
透過 `get-object` 或 `get-whiteboard-with-objects` 下載內容並要求 AI 摘要時，AI 無法辨識原本放在卡片內的圖片脈絡。

**原因與解決方案**：
目前 Heptabase MCP API 不支援直接下載圖片二進位原始檔，提供的是帶有 `fileId` 的 `<image>` 標籤。
如果您在開發擴充腳本 (如 `export`) 時，**請保留或轉換佔位符**。例如：
把 `<image fileId="12345"/>` 轉換成 `> 📷 *[Image Placeholder: 12345]*`
藉此確保 AI 在閱讀純文字時不會產生上下文邏輯跳躍。

---

## ❌ 問題 4: 卡片中的內部連結無法點擊

**症狀**：
透過 CLI 寫入卡片內容時，嘗試使用 `<mention>` 標籤或 markdown 連結，但在 Heptabase 中呈現為純文字，無法點擊。

**原因與解決方案**：
透過 MCP API 建立的內容目前只會被當作純 Markdown 儲存，**系統無法將其轉換為 Heptabase 的豐富內部關聯物件**。
建議方案：在如 Hub 等匯整卡面中，直接採用易於搜尋的視覺標示設計（例如：`→ 白板『XYZ』`），方便使用者直接在 Heptabase 中以此字串進行全域搜尋。

---

> 🎉 **祝您使用愉快！如需更多開發指引，請參考本專案下的 `GEMINI.md`。**
