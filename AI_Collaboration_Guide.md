# 🤖 Heptabase CLI - AI 協作與知識提煉指南

這份指南說明了如何活用專案專屬的 AI 技能 (`heptabase-code-reviewer` Skill) 來加速您的開發流程。這個系統的核心理念是**「上下文工程 (Context Engineering)」**：讓 AI 助手在除錯與開發過程中，自動幫您將經驗「沉澱」為未來的資產。

---

## 🚀 日常開發的三大協作情境

在與 AI (如 Antigravity / Claude) 對話修改程式碼時，您可以透過這三個指定的關鍵字指令，觸發 AI 的特定行為：

### 1. 踩到新坑，想立刻把經驗記下來：`/lessons`

當您與 AI 剛千辛萬苦解決了一個難纏的 Bug (例如：某個 Heptabase API 隱藏的限制，或是不好處理的 Windows 傳遞字串問題)。

*   **您的動作**：在解完 Bug 的當下，輸入：
    > 「請執行 **/lessons**」 或 「請幫我提煉這段對話的經驗」
*   **AI 的行為**：
    AI 會自動閱讀對話脈絡，總結出「發生了什麼問題、怎麼解決的」，然後把它寫成新的 `[L-XXX] xxx` 規則。這條規則會被同步儲存到：
    1. 專案根目錄的 `GEMINI.md` 的 `## 🔬 智慧提煉` 區塊。
    2. `.agent/skills/heptabase-code-reviewer/references/lessons_learned.md` 的末尾。
*   **效益**：未來處理類似問題時，AI 就能自己避開這個坑，不需要您再次提醒。

### 2. 完成了一套好用的流程，想設為標準作業程序：`/domain`

當您成功實作了一個複雜的腳本操作（例如「將雙語字典自動同步到特定白板」），並且找出了最完美的 Node.js 參數指令組合與步驟。

*   **您的動作**：流程順利跑通後，說：
    > 「請執行 **/domain**，幫我把這個同步流程記錄下來」
*   **AI 的行為**：
    AI 會把剛剛散亂的試錯步驟，整理成結構分明的標準 SOP 文件，加上 YAML frontmatter 標頭，並存入 `domain/` 目錄中（例如 `domain/bilingual-sync-sop.md`）。
*   **效益**：未來如果有人（或 AI 自己）要再跑一次這個特定流程，只要提到關鍵字，AI 就會直接讀取這份 SOP 按表操課。

### 3. 寫完新功能，準備發布或 Commit 了：`review` / `QA`

當您剛寫完一大段腳本，想要確保沒有打破專案規定（如 ESM 限制）。

*   **您的動作**：把要檢查的檔案丟給 AI，並說：
    > 「請幫我 **review 程式碼**，並且跑一次 **QA 檢查**」
*   **AI 的行為**：
    AI 會觸發技能，自動讀取 `.agent/skills/heptabase-code-reviewer/references/qa_checklist.md` 裡的規定。開始逐條檢查：
    - 有沒有寫錯 ESM 的 `.js` 引用？
    - Windows 傳參數會不會因為有空格或換行壞掉？
    - API 卡片標題格式正不正確？
    如果不符合，AI 會給您一份完整的審查報告，幫您修改到好。

---

## 📂 知識與經驗存放在哪裡？

為了遵守 Progressive Disclosure (漸進式揭露) 原則，這些經驗不會全部塞在同一個文本裡，而是按照層級擺放：

1. **`GEMINI.md`（專案根目錄）**：存放專案的地圖與基礎規則，讓所有外部 AI 也能第一時間抓到重點。
2. **`domain/*.md`**：存放高階的業務邏輯 SOP，例如「匯入 PDF 時的標準流程」。
3. **`.agent/skills/.../SKILL.md`**：存放 AI 的鐵則與指令行為定義。
4. **`.agent/skills/.../references/lessons_learned.md`**：存放所有累積的避坑經驗 (`L-001` 到 `L-999`)。
5. **`.agent/skills/.../references/qa_checklist.md`**：存放程式碼審查的標準查核表。

> **💡 小知識**：您可以隨時打開上述檔案，手動刪減或編輯這些規則。這些文本就是 AI 大腦的一部份，當寫得越精確，AI 寫出來的程式碼就越安全、越符合您的期待！
