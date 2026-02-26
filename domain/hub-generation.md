---
title: Hub Auto-Generation SOP
description: 如何使用 heptabase hub 指令自動建立主題導航索引卡卡片。
category: SOP
tags: [hub, navigation, automation]
---

# Hub Auto-Generation SOP

此文件說明如何使用 `heptabase hub` 指令自動建立主題索引卡。

## 🛠️ 指令規格

```bash
# 為特定主題建立 Hub
heptabase hub <主題關鍵字>
```

## 🌟 核心功能

### 1. 自動搜尋與彙整
系統會自動搜尋 Heptabase 中所有與關鍵字相關的白板。
- **統計資訊**：統計每個白板上的卡片數量與 PDF 數量。
- **區塊列表**：擷取並列出白板上的區塊 (Sections) 名稱。

### 2. 工整的格式化輸出
為了解決白板過多時資訊雜亂的問題：
- **智慧排列**：若區塊數在 3 份以下，採單行顯示；超過 3 份則自動轉為縮排列表，方便閱讀。
- **物件連結**：使用 `→ 白板『名稱』` 標記。由於 Heptabase API 限制，目前無法建立可點擊的 @mention，但此標記可協助使用者透過搜尋快速跳轉。

### 3. 自動存檔
完成彙整後，系統會自動呼叫 `save-to-note-card` 並將結果儲存為一張標題為 `🗂️ <主題> Hub` 的新卡片。

## ⚠️ 使用建議
- **關鍵字精準度**：建議使用較具體的關鍵字（如 "Dynamo" 或 "Revit"），若關鍵字太廣（如 "A"）會導致搜尋出過多白板，生成過程會變久。
- **定期更新**：Hub 卡片是「快照」性質。若白板內容有重大變動，建議重新執行指令生成新的 Hub 以獲取最新統計。
