---
name: heptabase-code-reviewer
description: 專案專屬的程式碼審查與知識管理助手。適用於當開發者需要審查 Heptabase CLI 的程式碼變更、確認開發規範，或是要求提煉經驗 (如 `/lessons`) 與建立標準作業程序 (如 `/domain`) 時。
# ─── OPTIONAL FIELDS (uncomment as needed) ───
# context: fork                    # Run in subagent context. IMPORTANT: Required for skills that subagents should use via Task tool
# agent: Explore                   # Subagent type when context: fork (Explore, Plan, general-purpose, or custom)
# disable-model-invocation: true   # Only allow manual /skill-name invocation, prevent auto-triggering
# user-invocable: false            # Hide from / menu (for background knowledge only)
# allowed-tools: Read, Grep, Bash(git *), Bash(npm *)  # Tools allowed without permission prompts (wildcards supported)
# argument-hint: [filename]        # Autocomplete hint for arguments. Use $ARGUMENTS in content to access user input
---

# Heptabase Code Reviewer & Knowledge Manager

## Overview

本 Skill 同時扮演專案的「程式碼審查員」與「知識管理員」。
它負責確保程式碼與架構符合 `heptabase-cli` 的特殊規範 (如 ESM 相容性與 Windows 傳參限制)，並且在開發者下達特殊指令時將寶貴的經驗自動沉澱下來。

## 💡 學習與經驗沉澱機制 (Learning)

專案採用「上下文工程 (Context Engineering)」策略。當使用者於對話中給予特定指令時，請依據以下流程維護專案知識：

### 1. 提煉避坑經驗 (`/lessons`)
**觸發時機**：當使用者輸入 `/lessons` 時。
**執行動作**：
1. 從剛結束的成功對話中，提取高階開發規則或避坑經驗（嚴禁只記錄瑣碎的代碼細節）。
2. 將新經驗附加到 `references/lessons_learned.md` 的末尾。
3. 遵循格式：`### [L-XXX] 經驗標題\n- **規則**：...\n- **實踐**：...`。
4. 順便同步將這條新經驗一併附加到專案根目錄的 `GEMINI.md` 的 `## 🔬 智慧提煉 (Lessons Learned)` 區塊下，以確保其他非 Skill 環境的 AI 也能讀取。

### 2. 建立標準作業程序 (`/domain`)
**觸發時機**：當使用者輸入 `/domain` 時。
**執行動作**：
1. 將成功的複雜工作流程，轉換成標準的 Domain SOP 文件。
2. 以 Markdown 格式撰寫，開頭必須包含 YAML frontmatter (如 `description: ...`)。
3. 將該文件儲存至專案目錄下的 `domain/` 資料夾（如 `domain/new-feature-sop.md`）。
4. (選項) 若此 SOP 對於未來 AI 執行任務至關重要，也可考慮將其拷貝一份至本 Skill 的 `references/` 目錄中，並將其名稱加至 `SKILL.md` 中做導覽。

## 🔍 程式碼審查核心守則 (Core Review Rules)

在審查或撰寫 `heptabase-cli` 的程式碼時，**必須** 優先檢查以下幾點鐵則（提取自 `lessons_learned.md`）：

1. **跨平台與 Windows 執行限制 ([L-001], [L-003])**
   - 檢查是否使用了 `execFileSync` 呼叫包含空格參數的批次檔？若是，應改呼叫 `.mjs` 檔並透過陣列傳遞 args。
   - 檢查是否直接將大型 Markdown 內容透過 CLI 參數傳遞？若是，應改為寫入暫存檔後再傳遞。

2. **ESM 模組相容性 ([L-002])**
   - 專案是 `"type": "module"`，檢查是否有使用不相容的 CJS `require` 語法？
   - 確保所有本地檔案的 `import` 結尾都有加上 `.js` 副檔名。
   - 啟動器腳本必須使用 `.cjs` 副檔名以避免 ESM 衝突。

3. **Heptabase MCP API 限制 ([L-005], [L-006], [L-009])**
   - 檢查 `save-to-note-card` 的內容第一行是否為 `# 標題`？
   - 檢查是否有試圖使用 `heptabase://` 或 XML tag 來做內部物件連結？(不支援，應改用純文字標記)
   - 檢查是否正確用 Text Placeholder 替換了 `<img>` 標籤以保留 LLM 視覺脈絡？

## 📚 參考資源 (References)

此 Skill 附帶了以下資源，當執行相關任務時可載入參考：

### `references/lessons_learned.md`
包含完整的專案歷史避坑經驗（目前有 L-001 ~ L-011）。當需要深入除錯時可主動檢索。

### `references/qa_checklist.md` (規劃中)
部署與提交流程的品質檢查清單。
