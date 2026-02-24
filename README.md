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

---

## 使用範例

### 搜尋

```bash
# 搜尋白板
heptabase search-whiteboards --keywords "專案管理,工作流程"

# 語意搜尋筆記（支援 1-3 個查詢）
heptabase semantic-search-objects --queries "機器學習,深度學習" --result-object-types "card,pdfCard"
```

### 閱讀

```bash
# 讀取特定物件
heptabase get-object --object-id <id> --object-type card

# 取得日誌（日期範圍，最多 92 天）
heptabase get-journal-range --start-date 2026-01-01 --end-date 2026-02-23

# 瀏覽白板
heptabase get-whiteboard-with-objects --whiteboard-id <id>
```

### 寫入

```bash
# 建立新筆記卡片（第一行 h1 為標題）
heptabase save-to-note-card --content "# 標題

內容主體（Markdown 格式）"

# 附加到今日日誌
heptabase append-to-journal --content "今天完成了 CLI 的 Windows 支援"
```

### PDF 操作

```bash
# 先搜尋 PDF 內容
heptabase search-pdf-content --pdf-card-id <id> --keywords "關鍵字1,關鍵字2"

# 再讀取特定頁面
heptabase get-pdf-pages --pdf-card-id <id> --start-page-number 1 --end-page-number 10
```

---

## 常見工作流程

### 搜尋 → 閱讀 → 儲存

1. `semantic-search-objects` — 找到相關筆記
2. `get-object` — 讀取完整內容
3. **分析與記錄 (AI/手動)** — 經分析或摘要後，使用 `save-to-note-card` 或 `append-to-journal` 寫回結果

### 探索白板

1. `search-whiteboards` — 依主題搜尋白板
2. `get-whiteboard-with-objects` — 查看所有物件與連結
3. `get-object` — 深入閱讀特定卡片

### 回顧日誌

1. `get-journal-range` — 取得一段時間的日誌（超過 92 天需分次）
2. **彙整與分析 (AI/手動)** — 彙整進度或規律後，使用 `append-to-journal` 將摘要寫入今日日誌

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
- [GitHub 專案頁面](https://github.com/madeyexz/heptabase-cli)
