# 47 — README 寫作紀律（五條原則）

> **2026-11-12 定案**。來源案例：morse-beacon-app v5.1.0 → v5.2.0 README 重寫——唔係文筆問題，係「寫法呃自己」嘅問題。
> **適用**：所有 app repo 嘅 README（真理倉本身都要守）。
> **唔重抄**：F14／S7／V1–V6／I7 嘅詳細規則去對應 docs/；本頁只講「點樣應用喺 README 寫作」。

## 0. 一句總結

> **README 講嘅每一句，都要有一條跑得嘅檢查或者一個誠實嘅限制聲明兜住。**

寫唔出驗證方法嘅句子，唔好放喺功能表呃自己——歸入「已知限制」。

## 1. 五條原則

### 原則一：「檢查全綠」唔等於「App 用得」

| 項 | 內容 |
|---|---|
| **做法** | 凡加檢查，都要問一句「呢個檢查會唔會照樣綠住壞嘢過關？」 |
| **來源** | v5.1.0 嘅 15 組全部通過，但 App 一開頁就被教學卡蓋死——檢查只 grep 標記（`id="installHelpModal"` 喺度），冇驗 CSS 串接（`[hidden]` 特異性輸畀 `.flex`）。第 16 組（CSS 串接）就係呢句嘅產物 |
| **判斷基準** | 標記齊 ≠ 行為對。檢查要驗「真係 work」而唔係「有字喺度」 |
| **對應規則** | [F14](02-foolproof.md)（守護測試 = 可執行文件） |

### 原則二：「已修」要寫得出邊個 commit、邊個實測

| 項 | 內容 |
|---|---|
| **做法** | 每個 ✅ 都要對應一條跑得嘅檢查或 jsdom 行為測試。寫唔出驗證方法嘅，一律歸入「已知限制」 |
| **來源** | morse-beacon-app 審核報告每項「已修」都掛住 `verify.mjs §X` 或 jsdom 測試名 |
| **對應規則** | [F14](02-foolproof.md) |

### 原則三：「未做」要老實列喺「已知限制」

| 項 | 內容 |
|---|---|
| **做法** | 唔好用「即將支援」「規劃中」蒙混。做完就改成寫覆蓋率同限制 |
| **來源** | 英文介面 v5.1.0 時屬豁免，README 直接寫「未做英文介面」；v5.4.0 做完就改寫 216 條字串覆蓋率＋限制 |
| **對應規則** | [F14](02-foolproof.md) |

### 原則四：體積同版號係紀律，唔係一次性任務

| 項 | 內容 |
|---|---|
| **做法** | `verify.mjs` §9（payload 模擬）／§12（版號同步）就係防止「今次瘦完，下次又肥返」。每次改版跑一次 |
| **來源** | v5.2.0 真係瘦咗 1.32→0.70 MB（刪 4 個 .ttf），§19 加 1 MB 硬上限 |
| **對應規則** | [S7](01-slim.md)、[V1–V6](13-versioning.md) |

### 原則五：唔好寫「理論上應該 work」

| 項 | 內容 |
|---|---|
| **做法** | 安裝、更新、Wake Lock、share_target、長按捷徑全部未經真機，README 就照寫未經真機。真機驗收永遠係人做，唔係 README 做 |
| **來源** | morse-beacon-app README 冇「理論上」字樣；審核報告重複「仍未做人手真機驗收」 |
| **對應規則** | [I7](46-pwa-install-and-update.md)（真機驗收） |

## 2. 版面原則

> **Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.**

唔好加唔必要嘅次級標籤同說明——用版面（留白、字級層次、分組）自己講嘢。

- 對應 [design-review.md §2 house style](../templates/repo-starter/docs/design-review.md#2-house-style反-slop-清單)：eyebrow label、monospace caption、index 編號 → 直接講或用字級層次
- 呢個原則同時適用於 README 排版：唔好用「說明」欄重複表格標題已講嘅嘢

## 3. 點樣落地

| 幾時 | 做乜 |
|---|---|
| 寫 README 之前 | 對一次五條原則：每句「已修」有冇檢查、每句「未做」有冇寫限制、有冇「理論上」字樣 |
| 加檢查之前 | 問「呢個檢查會唔會綠住壞嘢過關？」——只 grep 標記嘅檢查要補行為測試 |
| 每次改版 | 跑 verify.mjs §9／§12（體積／版號紀律） |
| 交付前 | 真機驗收係人做，README 唔好代做 |

## 4. 維護

- 本頁係 **README 寫作紀律**，唔係新規則 ID；對應 S／F／V／I 系列現有規則。
- 新案例（唔好嘅 README 寫法）→ 更新本頁；新檢查方法 → 更新對應 docs。
- 連結：[PLAYBOOK §10](../PLAYBOOK.md#10-驗收閘definition-of-done)、[docs/10-checklists.md](10-checklists.md)、[docs/17](17-final-check-and-tutorial.md)
