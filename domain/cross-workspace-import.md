---
description: 跨工作區知識匯入工作流程
trigger_keywords: [匯入, import, sync, 同步, 跨工作區, workspace]
tools: [save-to-note-card, heptabase-sync.cjs]
version: 1.0
last_updated: 2026-02-23
---

# 跨工作區知識匯入工作流程

## 📋 概述

將 AI 工作空間（如 Antigravity brain artifacts）或專案中的知識文件匯入 Heptabase 筆記卡片，實現跨平台的知識整合。

## 🎯 適用場景

- 將 AI 對話中的 `walkthrough.md` 匯入 Heptabase
- 批次匯入專案的 `domain/*.md` SOP 文件
- 匯入 `GEMINI.md` 中的 Lessons Learned
- 將任何 Markdown 文件轉為 Heptabase 筆記卡片

## 🔧 方法

### 方法 1：使用 heptabase-sync.cjs（推薦）

```powershell
# 匯入單一 domain SOP
node bin/heptabase-sync.cjs domain <file.md>

# 批次匯入
node bin/heptabase-sync.cjs domain-all <directory>

# 匯入 Lessons
node bin/heptabase-sync.cjs lessons <GEMINI.md>
```

### 方法 2：使用 Node.js 腳本（大型檔案）

> [!IMPORTANT]
> 在 Windows 上，大型 Markdown 檔案不能直接透過 CLI 參數傳入，
> 必須用 Node.js 腳本讀取檔案再呼叫 CLI。

```javascript
// import-file.cjs
const { execFileSync } = require('child_process');
const fs = require('fs');

const content = fs.readFileSync('path/to/file.md', 'utf8');
const tsx = 'node_modules/tsx/dist/cli.mjs';

execFileSync('node', [tsx, 'heptabase-cli.ts',
  'save-to-note-card', '--content', content
], { stdio: 'inherit' });
```

### 方法 3：直接 CLI（短內容）

```powershell
node bin/heptabase.cjs save-to-note-card --content "# 標題

簡短的內容"
```

## ⚠️ 注意事項

1. **卡片標題**：`--content` 的第一行必須是 `# 標題`
2. **Windows 長文本**：超過 ~2000 字元的內容必須用方法 1 或 2
3. **重複建立**：目前 CLI 不會檢查是否已存在同名卡片，重複執行會建立多張
