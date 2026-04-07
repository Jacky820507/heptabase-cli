---
description: Gmail 自動化同步至 Heptabase SOP
version: 1.0.0
trigger_keywords: [gmail, sync, oauth, newsletter]
tools: [heptabase-cli, gmail-sync]
---

# [Domain] Gmail 自動化同步至 Heptabase SOP

本 SOP 規範如何將 Gmail 郵件自動轉換為 Heptabase 卡片，適用於電子報（Newsletters）、重要通知與知識擷取。

## 1. 環境需求與認證設定 (Setup)

### 1.1 Google Cloud Console 憑證
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 建立專案並啟用 **Gmail API**。
3. 建立 **OAuth 2.0 Client ID**（類型選 `Desktop App`）。
4. 下載憑證並重新命名為 `credentials.json`。
5. 將其放入 `C:\Users\user\heptabase-cli\config\` 夾中。

### 1.2 Heptabase 連線權杖
1. 確保 `config/.env` 中包含 `HEPTABASE_SESSION_ID`。
2. 若通訊失敗，請檢查 `~/.mcp-auth/` 下的 `tokens.json` 或從瀏覽器 `localStorage` 擷取。

## 2. 操作指令 (Usage)

### 2.1 基礎同步 (預設 7 天)
```powershell
node bin/heptabase.cjs gmail-sync --days 7
```

### 2.2 指定寄件者擷取
使用 `--sender` 過濾來自特定對象的郵件：
```powershell
node bin/heptabase.cjs gmail-sync --sender "someone@example.com" --days 3
```

### 2.3 關鍵字過濾
使用 `--query` 透過 Gmail 搜尋語法進行過濾：
```powershell
node bin/heptabase.cjs gmail-sync --query "重要通知"
```

## 3. 注意事項 (Maintenance)
- **防重複機制**：同步狀態會儲存在 `config/gmail-sync-state.json`。
- **認證過期**：若出現 `invalid_grant`，請刪除 `config/token.json` 並重新執行指令進行瀏覽器授權。
- **HTML 轉換**：採用 `turndown` 進行 Markdown 轉換，複雜的排版可能會簡化。
