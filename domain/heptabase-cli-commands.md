---
description: Heptabase CLI 指令使用工作流程
trigger_keywords: [heptabase, CLI, 搜尋, 筆記, 白板, 日誌, PDF]
tools: [search-whiteboards, semantic-search-objects, get-object, get-whiteboard-with-objects, get-journal-range, save-to-note-card, append-to-journal, search-pdf-content, get-pdf-pages]
version: 1.0
last_updated: 2026-02-23
---

# Heptabase CLI 指令使用工作流程

## 📋 概述

Heptabase CLI 提供 9 個核心指令，可從終端機操作個人知識庫。所有指令透過 MCP (Model Context Protocol) 與 Heptabase API 通訊。

## 🔧 核心指令

### 搜尋類

| 指令 | 說明 | 關鍵參數 |
|:-----|:-----|:---------|
| `search-whiteboards` | 以關鍵字搜尋白板 | `--keywords <value1,value2>` |
| `semantic-search-objects` | 語意搜尋筆記、PDF、日誌等物件 | `--queries <value1,value2>` `--result-object-types <card\|pdfCard\|...>` |
| `search-pdf-content` | 在 PDF 中搜尋關鍵字 | `--pdf-card-id <id>` `--keywords <value1,value2>` |

### 讀取類

| 指令 | 說明 | 關鍵參數 |
|:-----|:-----|:---------|
| `get-object` | 讀取單一物件的完整內容 | `--object-id <id>` `--object-type <card\|journal\|...>` |
| `get-whiteboard-with-objects` | 取得白板上所有物件與連結 | `--whiteboard-id <id>` |
| `get-journal-range` | 依日期範圍取得日誌 | `--start-date <YYYY-MM-DD>` `--end-date <YYYY-MM-DD>` |
| `get-pdf-pages` | 讀取 PDF 指定頁碼內容 | `--pdf-card-id <id>` `--start-page-number <n>` `--end-page-number <n>` |

### 寫入類

| 指令 | 說明 | 關鍵參數 |
|:-----|:-----|:---------|
| `save-to-note-card` | 儲存內容為新筆記卡片 | `--content <markdown>` (第一行 `# 標題`) |
| `append-to-journal` | 將內容附加到今天的日誌 | `--content <markdown>` |

## 🔄 標準工作流程

### 流程 1：搜尋並讀取白板內容

```
1. search-whiteboards --keywords "關鍵字"
   → 取得白板 ID
2. get-whiteboard-with-objects --whiteboard-id <id>
   → 取得白板上所有物件
3. get-object --object-id <id> --object-type card
   → 讀取個別卡片完整內容
```

### 流程 2：語意搜尋深入閱讀

```
1. semantic-search-objects --queries "查詢" --result-object-types "card"
   → 找到最相關的物件
2. get-object --object-id <id> --object-type card
   → 閱讀完整內容
```

### 流程 3：PDF 內容檢索

```
1. search-pdf-content --pdf-card-id <id> --keywords "關鍵字"
   → 找到相關頁面
2. get-pdf-pages --pdf-card-id <id> --start-page-number N --end-page-number M
   → 讀取指定頁面內容
```

### 流程 4：跨工作區知識匯入

```
1. 讀取本地檔案 (如 walkthrough.md, domain/*.md)
2. 使用 Node.js 腳本組合內容
3. save-to-note-card --content "# 標題\n\n內容"
   → 匯入為 Heptabase 筆記卡片
```

## ⚠️ 使用注意事項

1. **首次執行**：需完成 OAuth 瀏覽器驗證，Token 快取於 `~/.mcp-auth/` (Unix) 或 `%USERPROFILE%\.mcp-auth\` (Windows)
2. **日期範圍限制**：`get-journal-range` 最多 92 天
3. **語意搜尋限制**：`semantic-search-objects` 最多 3 個查詢字串
4. **卡片標題**：`save-to-note-card` 的 `--content` 第一行必須為 `# 標題`
5. **Windows 長文本**：大量內容應透過 Node.js 腳本傳入，避免 shell 參數分割問題

## 🔗 輔助工具

| 工具 | 用途 |
|:-----|:-----|
| `heptabase-sync.cjs domain <file.md>` | 匯入 Domain SOP 到 Heptabase |
| `heptabase-sync.cjs domain-all <dir>` | 批次匯入整個 domain 目錄 |
| `heptabase-sync.cjs lessons <GEMINI.md>` | 匯入 Lessons Learned |
