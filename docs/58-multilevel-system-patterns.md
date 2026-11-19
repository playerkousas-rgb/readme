# 58 — 多層／多單位系統：可選模式 R1–R8（通用化）＋ VSPORTAL 現況

> **由邊嚟**：2026-11-19 用戶指示 ecportal 已退役（新系統 = VSPORTAL），本倉 6 份 ecportal 案例檔（`BUILD.md`／`EXTERNAL.md`／`進度追蹤旅系統升級版.md`／`docs/18`／`docs/19`／`docs/21`）同日刪除（退場記錄見 [57](57-ecportal-to-vsportal-migration.md)）。
> **本頁做兩件事**：① 保留由舊案例抽出、**仍然有用**嘅 R1–R8 可選模式（拎走舊專案名）；② 寫低 **2026-11-19 用戶定案**嘅新系統關係。
> **同通用規則嘅界線**：技術機制（`sig` 雙通道、fail closed、備份、hash、票據、身份錨點）**屬通用**，喺 PLAYBOOK；組織階梯、模組名、ID 格式、`<purpose>` 字串**屬專案**，唔好當底線。

## 0. 一句

**R1–R8 係「可選模式」，唔係通用底線**。新 app 只需守 S/F/A/W/V ＋ P1 ＋ 技術棧契約；見到「多層／多單位／有身份」先返嚟揀幾條用。

## 1. 現行系統關係（2026-11-19 用戶定案）

| 項 | 定案 |
|---|---|
| **VSPORTAL** | 即 [`playerkousas-rgb/vs_portal`](https://github.com/playerkousas-rgb/vs_portal) —— **深資童軍支部管理系統**（public，`pushedAt` 2026-11-14） |
| **架構** | **同追蹤系統共用後端、唔同前端**；同現有 **成員系統（`member-portal`）／管理系統（`scout-district-portal`）** 屬同一種關係：**一個後端，多個前端**按角色／場景呈現 |
| **舊做法唔再用** | ecportal 時代嘅 **GAS→GAS `sig` 鏈式接駁**（`ScriptProperties` `DOWNSTREAM_*`）、**上游寫下游 `ALLOW_LOCAL_LOGIN`**、五級 `ADMIN／TROOP／BRANCH／SHEET／EXTERNAL` 階梯 —— **全部唔係 VSPORTAL 嘅做法** |
| **新功能點做** | 前端唔係安全邊界：每個 action 由**共用後端**按 **session／role／scope** 驗；前端只決定「顯示乜」（同 `vs_portal` README 寫法一致） |
| **跨支部** | 支部之間**不可互連**、不可保存另一支部嘅 URL／Key、不可互相讀寫（`vs_portal` README 明寫） |

> ⚠️ **唔好套錯**：如果你喺 `vsbadge`／`scoutbadge`／`cubsbadge`／`roverbadge`／`scout-circulars` 做嘢，佢哋**仍然係舊模式**（見 §3）。新架構嘅假設（共用後端）**唔可以**套落佢哋身上。

## 2. R1–R8 可選模式（通用化，冇舊專案名）

| 模式 | 一句話 | 幾時有用 |
|---|---|---|
| **R1** | **定級別先開工**：寫低「我係邊個級／我改嘅係咪我轄下」 | 系統有多層（平台／旅／支部／leaf） |
| **R2** | **每層要有「唔做清單」**：寫死「呢層冇 X 係正常，唔係缺失」 | 有人成日問「點解呢層冇嗰個功能」 |
| **R3** | **功能註冊制**：新功能先入 registry，導航由 registry 生成，未登記唔准加導航 | 功能會愈加愈多、需要開關／分享目標過濾 |
| **R4** | **接駁追加唔搬**：`normId` 單一實現、換 key 三處同步 | 有跨系統接駁、ID 會出現多種寫法 |
| **R5** | **上游控下游寫 ＋ fail closed ＋ 留一戶災難恢復** | 上游要能停下游；下游要能在上游死時自救 |
| **R6** | **回傳三條寫死 ＋ 下游永不回打上游 ＋ 跨 repo 邊界寫清** | 多方互寫、責任邊界易漂 |
| **R7** | **身份錨點 ＋ 子 leaf 唔開戶 ＋ 含 hash 搬數即刪** | 有身份、有搬數（舊資料遷移） |
| **R8** | **三色燈／診斷資訊／`rel=noopener`／驗密碼限次／MOCK 教材三層／新部署真機跑一次** | 要交畀非技術同事自己診斷 |

> 想睇舊系統**點解**要呢八條（原案例細節、五個 repo 對照）→ `git log` 查 `docs/19-ecportal-troop-case.md`（2026-11-19 刪除前版本）；退場理由見 [57](57-ecportal-to-vsportal-migration.md)。
> 通用化咗嘅部分（唔喺本頁重複）：`sig` 雙通道（[A7](03-security.md)／[X4](07-apps-script.md)）、fail closed（F4）、`exportAll` 備份（F11）、`push_subscriptions` 只存 hash（U4）、`/api/super` 60 秒票據（A 系列）、身份錨點（[README 兩條公理](../README.md)）。

## 3. 仍然跑舊模式嘅 5 個 repo（改動要小心）

| repo | 現況 | 改之前要知 |
|---|---|---|
| `vsbadge`／`scoutbadge`／`cubsbadge`／`roverbadge` | 支部層 **BADGE 輕量前端** | 舊式 `ecSigLogin`／`verifyPortalSig` 路徑仍有（[docs/20](20-repo-health-audit.md) 記過「兩套 sig 並存、舊嗰套可重放」） |
| `scout-circulars` | 通告圖書館（對外入口之一，屬五個官方入口） | 佢係**入口**，唔係 leaf；改動要對 [docs/50 §0.1](50-app-store-whitelist-and-shutdown.md) |
| 全部 5 個 | 仍用 ecportal 時代定落嘅權限邊界 | **唔好**因為「VSPORTAL 用共用後端」就走去改佢哋嘅接駁；要做先問用戶 |

## 4. 未核實（照實列）

| 項 | 狀態 |
|---|---|
| VSPORTAL 同追蹤系統**具體邊條後端**（同一支 GAS？同一張 Sheet？） | **未核實** —— 用戶只講「共用後端、不同前端」；我冇開 `vs_portal` 以外嘅 repo 對證 |
| 舊 `sig` 契約有冇**部分**仍然用喺支部 ↔ 旅 | **未核實** —— 依用戶講法當「冇沿用」 |
| 5 個 badge repo 幾時搬去新架構 | **未定** |

---
- 相關：[57 ecportal → VSPORTAL 退場](57-ecportal-to-vsportal-migration.md)（依賴清單、真刪記錄）、[56 術語表](56-glossary.md)、[20 repo 健康](20-repo-health-audit.md)、[50 入口白名單](50-app-store-whitelist-and-shutdown.md)。
