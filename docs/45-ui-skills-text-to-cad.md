# 45 — UI 設計 Skills／文字生成 CAD：分類、借鑑同使用邊界

> 2026-11-09 按用戶提供嘅兩個 GitHub repo 分類：UI 設計／動效屬未來 App 開發參考；CAD 屬有實物製作需求先考慮嘅工具。本頁係**資源評估與建議，唔新增規則 ID，亦唔代表已安裝、已實測或已改起手包 Skill**。現有動畫施工入口仍係 [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md)，UI 入口係 [`design-review`](../templates/repo-starter/skills/promoted/design-review/SKILL.md)。

## 0. 分類同決定

| 分類 | 資源／上游快照 | 定位 | 本倉決定 |
|---|---|---|---|
| **UI 設計／動效／手機體驗** | [emilkowalski/skills](https://github.com/emilkowalski/skills) · [commit `5206a95`](https://github.com/emilkowalski/skills/tree/5206a950b715e0cabe7043ea0b2304332b91494e) · MIT | 教 Agent 做介面設計、動畫同測試嘅指引，唔係要放入網站嘅 UI 元件庫 | **優先參考**：最壞資料、手機體驗、先判斷應否加動畫；只收錄建議，暫未合併入起手包 |
| **實物設計／參數化 CAD／3D 打印** | [earthtojake/text-to-cad](https://github.com/earthtojake/text-to-cad) · [commit `1cfd73c`](https://github.com/earthtojake/text-to-cad/tree/1cfd73cbbf0be943e0ff7aa0c672f824935b98a7) · MIT | Agent 用 Python 建立可修改尺寸嘅 CAD 模型，經本機服務預覽及匯出 | **有實物場景先試**；唔係網頁 App 必需依賴，唔裝入起手包 |

兩個 repo 嘅根授權檔均為 MIT；如果日後複製或修改上游原文／程式碼，保留適用嘅 copyright notice 同 MIT permission notice，並按 [W8](12-copyright-scout-system.md) 記錄來源、commit 同授權；依賴、模型或服務可能另有各自條款。星數會變，本頁唔以星數當品質證明。

## 1. UI 設計／動效：借方法，唔搬成套

上游 [README](https://github.com/emilkowalski/skills/blob/5206a950b715e0cabe7043ea0b2304332b91494e/README.md) 列出多份 `SKILL.md`。我哋已有 `design-review` 嘅三寬望圖、[`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md) 嘅動畫施工同 reduced-motion 驗收；上游係補充，唔係要換 UI 框架或加 runtime 套件。

| 優先 | 可借鑑 | 未來點用／驗收 | 上游依據 |
|---|---|---|---|
| 1 | **最壞但合理資料** | 按實際 schema／驗證限制，測長姓名、長電郵、中英文長標籤、缺欄位、空列表、一項同大量項目；從資料入口餵測試資料，唔靠手改 CSS 製造問題。檢查溢出、換行、空狀態及效能，先記問題再決定修法；測試切換掣只留開發環境 | [`break-ui`](https://github.com/emilkowalski/skills/blob/5206a950b715e0cabe7043ea0b2304332b91494e/skills/break-ui/SKILL.md) |
| 2 | **手機平台體驗** | 按需要檢查安全區域、動態 viewport、觸控 hover、輸入框與手機鍵盤；保留用戶縮放，唔好為求似原生 App 而禁止 zoom。桌面模擬唔等於真機，分開記錄未能在手機驗證嘅項目 | [`mobile-native`](https://github.com/emilkowalski/skills/blob/5206a950b715e0cabe7043ea0b2304332b91494e/skills/mobile-native/SKILL.md) |
| 3 | **先決定動畫有冇必要** | 頻繁操作先考慮即時或減少動畫；彈窗／提示等有助理解狀態嘅動效才考慮加入。跟現有 `web-motion` 選引擎、驗 reduced motion；上游對鍵盤動作嘅絕對禁令作參考，唔自動變成本倉硬規則 | [`animate`](https://github.com/emilkowalski/skills/blob/5206a950b715e0cabe7043ea0b2304332b91494e/skills/animate/SKILL.md) · [`emil-design-eng`](https://github.com/emilkowalski/skills/blob/5206a950b715e0cabe7043ea0b2304332b91494e/skills/emil-design-eng/SKILL.md) |

**狀態／次序**：以上係日後可加入現有 Skill 嘅候選，**本輪只分類，未改 `design-review`／`web-motion`，未設自動測試或新增必做 gate**。現有環境冇 Skill tool／plugin harness，指引唔會因為列喺本頁而自動觸發；真要採用時要明確接駁既有入口、更新來源並實測（見 [`skills/CATALOG.md`](../templates/repo-starter/skills/CATALOG.md)）。現有雙語規則同適用範圍仍以 [44](44-bilingual-ui.md) 為準，唔追溯舊 App。

## 2. 實物設計／CAD：有場景先試

上游 [README](https://github.com/earthtojake/text-to-cad/blob/1cfd73cbbf0be943e0ff7aa0c672f824935b98a7/README.md) 描述嘅流程係：自然語言提出零件要求 → Agent 寫 Python／build123d 模型 → 本機 CAD 服務建立及預覽 → 按需要匯出 STEP、STL、3MF、GLB 等。呢個係**參數化工程模型**，唔等同一般 3D 圖片、網頁 Three.js 場景或已經可安全製造嘅成品。

| 場景 | 建議 | 收貨要睇 |
|---|---|---|
| 3D 列印名牌、簡單收納盒或展示座 | 有明確需求先用非敏感例子小試 | 單位、長闊高、孔位、壁厚、匯出格式、打印機及材料限制；實際打印同量度 |
| 有尺寸要求嘅支架、扣件或切割圖 | 可用作初稿，先確認加工方式同供應商要求 | 公差、受力、材料及製造可行性由有經驗嘅人核實；涉及承重或安全用途唔好單靠 AI 或自動檢查 |
| 一般 Vercel／GAS／Supabase／Canvas App | **唔需要**為咗佢加 CAD server 或 Python 套件 | 保持現有技術棧同體積限制；唔假設本機服務可直接畀網頁用戶使用 |

**使用前成本與安全**：

- 上游 [安裝文件](https://github.com/earthtojake/text-to-cad/blob/1cfd73cbbf0be943e0ff7aa0c672f824935b98a7/docs/install.md) 表示首次需要 CAD 核心時約下載 240 MB、佔約 620 MB 磁碟；實際按版本／環境變動。安裝器會設定 Agent 整合及本機服務；先閱讀內容同變更計劃，唔好未審查就執行遠端安裝腳本。
- 上游 [README](https://github.com/earthtojake/text-to-cad/blob/1cfd73cbbf0be943e0ff7aa0c672f824935b98a7/README.md) 表示預設傳送使用統計及崩潰報告，並稱不包含檔案、路徑或 prompts；如要關閉，先參考上游安裝文件嘅 `--no-telemetry`，再自行驗證設定。唔將「本機」當成無網絡／零資料外傳保證。
- 上游 [SECURITY.md](https://github.com/earthtojake/text-to-cad/blob/1cfd73cbbf0be943e0ff7aa0c672f824935b98a7/SECURITY.md) 寫明服務以使用者權限執行模型及可能安裝依賴，sandbox 內能連接服務不代表模型受 sandbox 限制；只跑可信程式。Viewer 有帶憑證嘅連結，要當密碼保管；唔好公開服務或分享連結。上游做法唔改變我哋 App 嘅 key／URL 安全規則。
- CAD 模型、生成檔同大型依賴唔好隨意 commit 入 Git；按專案 ignore／外部儲存做法處理。未公開設計、成員資料及其他敏感內容唔好送畀未核准嘅外部模型或服務。

## 3. 查證範圍與維護

- **已做（2026-11-09）**：用 GitHub API 查兩個 repo 嘅 metadata、main commit、README、MIT 授權；讀上表連結嘅部分 Skill，及 text-to-cad 安裝／安全文件。上游能力與資源需求係文件聲稱，唔係本倉實測結果。
- **未做**：未安裝／執行任何外部 Skill 或 CAD 工具、未測 Agent 觸發、未產生或打印 CAD 模型、未量尺寸／效能、未測真機 UI。未逐項審計上游全部程式碼或依賴授權。
- **更新時機**：實際採用前重查 commit、授權、安裝／私隱與安全文件；保留測試環境、操作結果同未驗證項。呢頁屬分類入口；既有施工規則仍以 PLAYBOOK 同對應 Skill 為準。
