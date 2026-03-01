---
name: qa-checklist
description: 專案品質檢查流程。當用戶要求審查程式碼或驗證發布版本時啟用。
tags: [QA, 品質, 檢查, 驗證, review]
---

# Heptabase CLI 專案品質檢查清單 (QA Checklist)

本文件定義 `heptabase-cli` 的品質檢查標準和執行步驟。AI 在進行審查時，應逐條確認以下事項。

---

## 何時執行 QA

- 提交 Pull Request 或新增功能前
- 用戶要求「檢查」「驗證」「確認相容性」時
- 修改 CLI 參數傳遞邏輯後
- 更新 `mcporter.json` 或修改工具定義後

---

## ✅ 檢查項目

### 1. 跨平台相容性檢查 (Windows/macOS/Linux)

**目的**：確保 CLI 在所有系統上都能穩定運作

**檢查邏輯**：
- [ ] 執行外部指令時，是否正確處理了 Windows 的限制？(避免使用 `.cmd` 直接 `execFileSync`)
- [ ] 若遇到長字串或特殊符號傳參，是否將其儲存至暫存檔 (如 `/tmp/` 或 `.gemini/`) 再作為參數傳遞？
- [ ] 是否遵守了環境變數與路徑的跨平台取得方式 (如 `os.homedir()`)？

### 2. ESM 模組規範檢查

**目的**：確保 `tsx` 與 Node.js 生態系的相容性

**檢查邏輯**：
- [ ] 如果修改了 `bin/` 目錄下的啟動器，副檔名是否確實為 `.cjs` (若內含 CommonJS) 或 `.js` (若為純 ESM)？
- [ ] 專案內的 TypeScript 編譯輸出，引用其他檔案時是否正確加上 `.js` 副檔名（如 `import { foo } from "./utils.js"`）？
- [ ] `mcporter.json` 自動生成的檔案 (`heptabase-cli.ts`) 絕對不可手動修改，檢查是否有誤觸？

### 3. API 內容相容性檢查

**目的**：確保呼叫 Heptabase API 的內容不被拒絕

**檢查邏輯**：
- [ ] `save-to-note-card` 工具：第一行是否為標題（`# 標題內容`）？
- [ ] 匯入 Markdown 的內容：是否過濾了不支援的 `<image>` 或 `<mention>` 標籤，並以 Text Placeholders 替換？
- [ ] 若處理大型 PDF，是否正確使用了分頁抓取邏輯 (如 `start-page-number` / `end-page-number`) 以避免逾時？

### 4. 工具一致性檢查

**目的**：確保 README 工具清單與實際可用的 MCP Tools 一致

**執行步驟**：
1. 檢視 `config/mcporter.json` 中定義的所有工具。
2. 檢查 `README.md` 的「🛠️ Available Tools」是否涵蓋了新工具。
3. 若有新增工具，確保其參數定義清楚並符合實際用途。

---

## 📋 錯誤排除與修復指南

| 發現問題 | 修復建議 |
| :--- | :--- |
| `execFileSync` 在 Windows 回報 `EINVAL` | 把執行檔換成 `node`，並將真實的 JS 腳本路徑放在 args 中傳遞。 |
| LLM 一直拋出 `SyntaxError: Cannot use import statement outside a module` | 確保 `package.json` 包含 `"type": "module"`，且 CJS 啟動腳本改為 `.cjs` 副檔名。 |
| MCP 連線一直中斷 | 檢查處理大量資料 (如 `get-pdf-pages`) 時是否有實作分頁/分批處理。 |

---

**最後更新**：2026-03-01
