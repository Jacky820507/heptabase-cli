---
title: Whiteboard Export SOP
description: 如何將 Heptabase 白板內容匯出為本地 Markdown 檔案，並保留結構與附件資訊。
category: SOP
tags: [export, markdown, pdf, images]
---

# Whiteboard Export SOP

此文件說明如何使用 `heptabase export` 指令將白板內容完整匯出。

## 🛠️ 指令規格

```bash
# 依關鍵字匯出
heptabase export --keyword "白板名稱" --output-dir "輸出路徑"

# 依 ID 匯出
heptabase export --whiteboard-id "ID" --output-dir "輸出路徑"
```

## 🌟 核心功能

### 1. Section 資料夾分類
匯出時會自動解析白板上的 **Section (區塊)**。
- 屬於某個 Section 的卡片會被放在以該區塊名稱命名的子資料夾中。
- 不屬於任何 Section 的卡片會放在根目錄。
- 產生的 `_index.md` 會依照 Section 進行分組列出目錄。

### 2. PDF 分頁匯出
支援將白板上的 PDF 卡片轉換為 Markdown。
- **自動分批**：因應 API 限制，每 10 頁自動分批抓取內容，避免逾時。
- **狀態檢查**：若 PDF 尚未在 Heptabase 中完成解析 (Parsed)，會自動跳過並提醒。
- **內容清洗**：自動移除 PDF 中的 XML 標籤與 API 中繼資料。

### 3. 圖片佔位標記 (Image Placeholders)
由於 API 目前無法直接下載圖片，系統會將 `<image>` 標籤轉換為佔位標記：
- 格式：`> 📷 *[Image Placeholder: fileId]*`
- 目的：保留視覺脈絡，協助 LLM 理解該處有圖片輔助說明。

### 4. 內容清理管線 (Cleaning Pipeline)
- 移除 `<card>`, `<chunk>`, `<mention>` 等 XML 標籤。
- 移除 API 產生的 "IMPORTANT" 提示文字。
- 將 HTML 表格轉換為 Markdown Pipe Table 格式。
- 壓縮多餘的換行，保持 Markdown 簡潔。

## ⚠️ 注意事項
- **API 頻率**：匯出大型白板（50+ 卡片）時，會觸發大量 `get-object` 請求，請確保網路穩定。
- **檔名衝突**：檔名會經過 `sanitize` 處理，移除非法字元。若有重複標題，建議在 Heptabase 中先修正規範。
