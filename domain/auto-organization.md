---
description: Heptabase AI 知識整理助手 (Auto-Organization) SOP
trigger_keywords: [整理, 混亂, 歸納, 日誌, 白板]
version: 1.0
last_updated: 2026-02-24
---

# Heptabase AI 知識整理助手 SOP

## 📋 概述
當 Heptabase 中的資料（尤其是 Daily Journal）累積過多、顯得凌亂時，可以使用此工具進行自動化分析與整理建議。

## 🔧 使用步驟

### 1. 執行資料採集
在終端機執行以下指令，收集最近 $N$ 天的日誌資料：

```bash
node bin/heptabase-sync.cjs organize --days 7
```

### 2. 提供給 AI 助手
指令執行後會輸出標記為 `[AUTO-ORG-DATA-START]` 的 JSON 區塊。請將該區塊內容複製並發送給 AI 助手（Antigravity），並下達指令：
> 「請根據這些日誌內容，幫我進行歸納整理，並搜尋現有的白板建議存放位置。」

### 3. AI 分析行為
AI 助手將會：
1. **主題化 (Thematic Clustering)**：將散亂的內容歸納為 3-5 個具體知識主題。
2. **白板匹配 (Whiteboard Matching)**：針對每個主題，主動調用 `search-whiteboards` 尋找是否已有相關的主題白板。
3. **整理提案 (Proposal)**：列出哪些卡片/內容應該移動到哪個白板，或建議建立新白板。

## ⚠️ 注意事項
- 預設分析天數為 7 天。
- 如果資料量極大，建議分段執行（例如先執行 `--days 3`）。
- 整理過程僅提供「建議」，不會自動刪除或移動你的原始卡片。
