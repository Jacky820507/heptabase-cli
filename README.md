# Heptabase CLI 使用說明

從終端機搜尋、閱讀、寫入你的 Heptabase 個人知識庫。

## 安裝

以下方式擇一：

### 方式 1：npm 安裝（推薦 Windows 使用者）

```bash
npm install -g heptabase-cli
heptabase --help
```

需先安裝 [Node.js](https://nodejs.org/)，Windows / macOS / Linux 皆可。

### 方式 2：Homebrew（推薦 macOS 使用者）

```bash
brew tap madeyexz/tap
brew install madeyexz/tap/heptabase-cli
```

### 方式 3：bunx（免安裝，需 [Bun](https://bun.sh/)）

```bash
bunx heptabase-cli --help
```

---

## 首次登入（OAuth 驗證）

執行任意指令後，會自動開啟瀏覽器進行 Heptabase OAuth 登入。

| 項目 | macOS / Linux | Windows |
|------|---------------|---------|
| Token 快取位置 | `~/.mcp-auth/` | `%USERPROFILE%\.mcp-auth\` |
| 重新登入 | `rm -rf ~/.mcp-auth/` | `Remove-Item -Recurse -Force "$env:USERPROFILE\.mcp-auth"` |

- Token 會自動重新整理，不需手動處理
- 若瀏覽器未自動開啟，請從終端機複製登入網址手動打開

---

## 指令一覽

| 指令 | 說明 |
|------|------|
| `search-whiteboards` | 以關鍵字搜尋白板 |
| `semantic-search-objects` | 語意搜尋筆記、PDF、日誌等物件 |
| `get-object` | 讀取單一物件的完整內容 |
| `get-whiteboard-with-objects` | 取得白板上所有物件與連結 |
| `get-journal-range` | 依日期範圍取得日誌 |
| `save-to-note-card` | 儲存內容為新筆記卡片 |
| `append-to-journal` | 將內容附加到今天的日誌 |
| `search-pdf-content` | 在 PDF 中搜尋關鍵字 |
| `get-pdf-pages` | 讀取 PDF 指定頁碼內容 |
| `heptabase organize` | 歸納日誌主題並建議存放白板 |
| `heptabase export` | 匯出白板中的卡片為本地 Markdown 檔案 |

---

## 使用範例

### 搜尋

```bash
# 搜尋白板（關鍵字可多個，以逗號分隔）
heptabase search-whiteboards --keywords "專案管理,工作流程"

# 語意搜尋：根據「意思」而非關鍵字來尋找相關筆記
heptabase semantic-search-objects \
  --queries "如何保持身體健康" \
  --result-object-types card
```

### 閱讀

```bash
# 讀取特定卡片或物件
# --object-id: 欲讀取的卡片或物件 ID
# --object-type: 物件類型（如 card, journal, pdfCard）
heptabase get-object \
  --object-id [卡片ID] \
  --object-type card

# 取得指定範圍的日誌內容
# --start-date / --end-date: 開始與結束日期（YYYY-MM-DD）
# 單次請求範圍上限為 92 天
heptabase get-journal-range \
  --start-date 2026-02-01 \
  --end-date 2026-02-24

# 獲取白板內容
# --whiteboard-id: 欲獲取的白板 ID
# 回傳內容包含白板上的所有卡片資訊與排列邏輯
heptabase get-whiteboard-with-objects \
  --whiteboard-id [白板ID]
```

### 寫入

```bash
# 建立新筆記卡片 (支援樣式標註，\n 代表換行)
heptabase save-to-note-card --content "# 讀書心得\n\n今天讀了《原子習慣》，獲益良多。"

# 快速附加內容到今日日誌
heptabase append-to-journal --content "買午餐時想到一個新點子：可以用 CLI 同步標籤"

# AI 知識整理助手 (Auto-Organization)
# --days: 回溯天數（預設 7 天）
heptabase organize 7
```

### PDF 操作

```bash
# 搜尋 PDF 內的文字
heptabase search-pdf-content \
  --pdf-card-id [PDF卡片ID] \
  --keywords "重點,摘要"

# 讀取指定頁碼範圍的文字內容
# --start-page-number: 起始頁碼
# --end-page-number: 結束頁碼
heptabase get-pdf-pages \
  --pdf-card-id [PDF卡片ID] \
  --start-page-number 1 \
  --end-page-number 5
```

---

## 常見工作流程

### 搜尋 → 閱讀 → 儲存

1. `semantic-search-objects` — 找到相關筆記
2. `get-object` — 讀取完整內容
3. `save-to-note-card` 或 `append-to-journal` — 將結果寫回
4. 分析、摘要或回答問題

### 探索白板

1. `search-whiteboards` — 依主題搜尋白板
2. `get-whiteboard-with-objects` — 查看所有物件與連結
3. `get-object` — 深入閱讀特定卡片

### 回顧日誌

1. `get-journal-range` — 取得一段時間的日誌（超過 92 天需分次）
2. `append-to-journal` — 將摘要寫入今日日誌
### 彙整或分析規律

### AI 知識整理 (Auto-Organization)

1. `heptabase organize 7` — 採集最近一週日誌資料
2. 將輸出的 JSON 提供給 AI 助手 (Antigravity)
3. AI 生成「整理提案」：歸納主題並匹配建議白板
4. 根據建議手動將卡片移動至對應白板

### 匯出白板 (Export)

將白板內容完整匯出為本地 Markdown 檔案，適合備份或與其他 AI 工具配合。

1. `heptabase export --keyword "白板名稱"` — 搜尋並準備匯出資料
2. **自動分類**：依據白板 Section 自動建立子資料夾
3. **附件處理**：自動擷取 PDF 內容並插入圖片佔位標記
4. **產生索引**：自動生成 `_index.md` 並依區塊分組列出卡片
5. **內容清洗**：移除 XML 標籤並將 HTML 表格轉為 Markdown 格式

```bash
# 範例指令
heptabase export --keyword "建築設計" --output-dir ./backup
```

---

## 輸出格式

所有指令都支援 `--output <格式>`：

| 格式 | 說明 |
|------|------|
| `text` | 人類可讀（預設） |
| `json` | 結構化 JSON，可搭配 `jq` 使用 |
| `markdown` | Markdown 格式 |
| `raw` | 原始 MCP 回應 |

## 全域選項

| 選項 | 說明 |
|------|------|
| `-t, --timeout <ms>` | 逾時時間（預設 30000 毫秒） |
| `-o, --output <format>` | 輸出格式 |
| `--raw <json>` | 直接傳入 JSON 參數 |

---

## 疑難排解

| 問題 | 解決方式 |
|------|----------|
| Windows：`'heptabase' 不是內部或外部命令` | 確認 npm 全域路徑在 PATH 中，或使用 `npx heptabase-cli ...` |
| macOS：`command not found: heptabase` | 使用 `bunx heptabase-cli ...` 或將 `~/.local/bin` 加入 PATH |
| 瀏覽器未開啟 OAuth | 從終端機複製網址並手動打開 |
| 需要重新登入 | 刪除 token 快取資料夾（見上方表格） |

---

## 更多資訊

- [Heptabase MCP 官方文件](https://support.heptabase.com/en/articles/12679581-how-to-use-heptabase-mcp)
- [GitHub 專案頁面](https://github.com/Jacky820507/heptabase-cli)
