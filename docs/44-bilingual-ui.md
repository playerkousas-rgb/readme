# 44 — 雙語介面 L1–L6（中英對照・右上角一鍵切換）

> **2026-11-08 用戶定案**：「如果該 APP 唔係太重，就加入英文版，中英對照，右上角有切換掣嗰種，像 4 個 BOOK 那樣。」
> 判定用 **雙閘**（體積 ＋ 字串量，兩項都達標就要做）；強制程度係 **預設要做、可豁免**（豁免要喺 PR／SCOPE 寫 `EXCEPTION: L1 — 原因 — 補償措施`）。
> **唔係第五套鐵律以外嘅新底線**：S/F/A/W/V 仍然係硬底線；L 系列係「預設交付項」，同 [P1](../PLAYBOOK.md#0-開工前三分類決定做幾多) 一樣屬**有紀錄嘅人工判斷**，guard 只靜態驗到部分（下面每條寫明驗到乜）。
> **範圍（用戶 2026-11-08 定案）**：本頁係**為未來 app 預先定義**嘅規則＋範本，**只適用於本定案之後新開嘅 app**。用戶明確講「各自 APP 唔使做」同「我只想為未來 APP 定義」——**現有 repo 一律唔追溯**，大改／重構都唔會因此觸發 L；要某個舊 app 加英文，等用戶主動開口。

## 0. 參考實作：4 個 BOOK 嘅真實做法（pinned）

唔係靠估，四個 repo 全部有 `web/src/i18n.jsx`，做法一致（2026-11-08 讀 GitHub source）：

| Repo | pinned commit | i18n 入口 | 掣位置 |
|---|---|---|---|
| SCOUTBOOK | [`3d68fc5`](https://github.com/playerkousas-rgb/SCOUTBOOK/commit/3d68fc564323aa15ba5d6a18326e867e391c62c2) | [`web/src/i18n.jsx`](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/web/src/i18n.jsx) | [`App.jsx` L226–234](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/web/src/App.jsx#L226-L234) |
| CUBSBOOK | [`9da64d9`](https://github.com/playerkousas-rgb/CUBSBOOK/commit/9da64d92426f14ea6dcfe7adea434368075b8201) | [`web/src/i18n.jsx`](https://github.com/playerkousas-rgb/CUBSBOOK/blob/9da64d92426f14ea6dcfe7adea434368075b8201/web/src/i18n.jsx) | [`App.jsx` L248–256](https://github.com/playerkousas-rgb/CUBSBOOK/blob/9da64d92426f14ea6dcfe7adea434368075b8201/web/src/App.jsx#L248-L256) |
| ROVERBOOK | [`4341ebf`](https://github.com/playerkousas-rgb/ROVERBOOK/commit/4341ebf868b501176a9dfd29402c095018fe52c5) | [`web/src/i18n.jsx`](https://github.com/playerkousas-rgb/ROVERBOOK/blob/4341ebf868b501176a9dfd29402c095018fe52c5/web/src/i18n.jsx) | [`App.jsx` L337–345](https://github.com/playerkousas-rgb/ROVERBOOK/blob/4341ebf868b501176a9dfd29402c095018fe52c5/web/src/App.jsx#L337-L345) |
| VSBOOK | [`37dc98e`](https://github.com/playerkousas-rgb/VSBOOK/commit/37dc98eadf18a4c5d63df0711d3699745231ea81) | [`web/src/i18n.jsx`](https://github.com/playerkousas-rgb/VSBOOK/blob/37dc98eadf18a4c5d63df0711d3699745231ea81/web/src/i18n.jsx) | [`App.jsx` L220–228](https://github.com/playerkousas-rgb/VSBOOK/blob/37dc98eadf18a4c5d63df0711d3699745231ea81/web/src/App.jsx#L220-L228) |

共同結構：`LangProvider`（React context）→ `useLang()` 攞 `{ lang, isEn, setLang, toggle }` → 掣放 header 右側 chipbar → `localStorage` 記住選擇 → 切換時改 `document.documentElement` 嘅 `data-lang` 同 `lang`。

**檢查器校準（2026-11-08，靜態讀 source，冇安裝冇 build）**：`node scripts/i18n_check_v1.0.mjs /path/to/web/src` 對四個 BOOK 嘅結果 — SCOUTBOOK／CUBSBOOK／VSBOOK **0 FAIL 0 WARN**；ROVERBOOK **0 FAIL 1 WARN**（就係下面嗰個掣顯示當前語言嘅偏離）。即係規則同現有實作對得上，唔係紙上設計。「日期 Date」呢類硬塞字串另外用合成個案驗到會出 WARN；`出示 QR`／`匯出 JSON` 呢類中文夾縮寫唔會誤判。

**一個要修正嘅不一致**：SCOUTBOOK／CUBSBOOK／VSBOOK 掣顯示「顯示目標語言」（中文模式顯示 `EN`，英文模式顯示 `中文`）；ROVERBOOK 顯示「當前語言」（`EN`／`中`）而且 title 同 aria-label 唔對稱。L2 定死跟**多數做法：顯示目標語言**，因為掣係動作，唔係狀態標籤。

## L1 — 雙閘判定（要做定豁免）

**前提：呢個係本定案之後新開嘅 app**（舊 app 唔追溯，直接跳過 L1）。兩項**都**達標 → **預設要做**；任何一項超標 → 可豁免，但要寫紀錄。

| 閘 | 達標條件 | 點量 |
|---|---|---|
| **體積閘** | 加咗英文之後仍然過現有體積閘：Vercel/dist 類 `dist < 5MB`、bundle `< 2MB`（[S7](01-slim.md)）；單一 HTML `≤ 5MB`（[C13-g](09-gemini-canvas.md)） | 實測 build 後 `du -sb dist`；單一 HTML 用 `audit_single_html_v1.0.mjs` |
| **字串閘** | 要翻譯嘅 UI 字串 **≤ 300 條**（按鈕／標籤／標題／錯誤訊息／提示；唔計用戶資料同長文內容） | 人手數或抽 `bi()`／字典條目數；寫喺 PR |

- 字串閘嘅理由：**翻譯工作量**先係真正成本，唔係檔案大小。300 條以上通常係長文書冊／法規內容，要靠專業翻譯，唔應該硬塞入一次施工。
- **豁免格式**（跟 [PLAYBOOK §11](../PLAYBOOK.md#11-違規處理)）：`EXCEPTION: L1 — <原因：邊個閘超標、實際數字> — <補償：例如只做核心頁面英文／登記落 backlog> — <復原日期或「持續」>`，並喺 [10 §2](10-checklists.md) 登記。
- **唔准靜靜跳過**：冇寫 EXCEPTION 又冇英文 = 施工未完成（但唔係 CI 硬擋，見 L6）。
- 長文內容（書冊正文、法規、免責聲明）可以豁免逐句翻譯，但**導覽／按鈕／錯誤訊息仍要有英文**——否則英文用戶連操作都做唔到。

## L2 — 右上角切換掣（位置、語義、可達性）

```
header / sticky top bar
├─ 左：標題／返回
└─ 右：…其他掣… [🌐 EN] [☰]      ← 語言掣喺右上，選單掣之前
```

- **位置**：右上角 header／top bar 內，**唔可以收埋入選單或設定頁**（用戶要一眼見到）。sticky bar 就跟 sticky。
- **顯示目標語言**：中文模式顯示 `EN`，英文模式顯示 `中文`。唔好顯示當前語言（會令人以為撳咗冇反應）。
- **一個掣切換**，唔好做下拉選單（得兩種語言，下拉係多餘一步）。
- **可達性**：`<button type="button">` + `aria-label` 講明動作（例：中文模式 `Switch to English`，英文模式 `切換至中文介面`）；`title` 同步；鍵盤 focus 到、Enter／Space 撳到。
- **唔使翻譯嘅嘢**：品牌名、版號、`© SCOUT SYSTEM`（[W1](12-copyright-scout-system.md)）維持原樣。
- 列印／匯出 PDF 嗰陣語言掣應該隱藏（跟 BOOK 嘅 `.no-print` 做法）。

## L3 — 狀態保存 + `lang` 屬性（唔可以淨係換字）

抄 BOOK [`i18n.jsx` L18–27](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/web/src/i18n.jsx#L18-L27)：

```js
// 切換時兩樣一齊改
root.setAttribute('data-lang', lang);                        //畀 CSS 用
root.setAttribute('lang', lang === 'en' ? 'en' : 'zh-Hant-HK'); //畀瀏覽器／螢幕閱讀器／SEO 用
try { localStorage.setItem(LANG_KEY, lang); } catch { /* 私隱模式唔可以炸 */ }
```

- **預設中文**（`zh`）；`localStorage` 讀唔到／壞值一律 fall back 中文，唔好白屏。
- **`localStorage` 全部 try/catch**——Safari 私隱模式會 throw，呢個同 [C13 `safeStore`](09-gemini-canvas.md) 同一底線。
- **key 要有 app 前綴**（例 `scoutbook.lang`），避免幾個 app 同一 domain 互相踩。
- `lang` 屬性直接影響螢幕閱讀器讀音同搜尋引擎；[seo_check](../scripts/seo_check_v1.0.mjs) 本來就會驗 `<html lang>`，切換之後唔可以留住錯值。
- **唔好**用 `navigator.language` 自動決定首次語言（我哋主力港繁用戶，自動切換會令人困惑）；跟 BOOK：預設中文，用戶自己撳。

## L4 — 乾淨分離，唔係並排塞滿（重要）

用戶講「中英對照」，但四個 BOOK 嘅實作係 **一鍵切換、乾淨分離**，而且 SCOUTBOOK 有測試守住了呢個決定：
[`ui_contracts.test.mjs` L274–290](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/tests/ui_contracts.test.mjs#L274-L290) — 測試名就叫「中英文完全分離：一鍵切換、不以並排方式塞入表格」，仲攔埋 `日期 Date`／`姓名 Name` 呢類硬塞字串。

所以 L4 定案：

- **螢幕顯示：一次一種語言**。中文模式隱藏英文小字（BOOK 用 [`html[data-lang="zh"] … em { display:none }`](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/web/src/styles.css#L620-L644)），英文模式全英。
- **唔准**將「日期 Date」寫死成一個字串——要 `bi(lang, '日期', 'Date')` 或者拆兩個元素，否則切英文嗰陣會殘留中文。
- **例外：列印／官方表格**可以中英並排（紙本要對照官方格式）；BOOK 就係用 `@media screen` 只喺螢幕隱藏。要並排就限列印範圍，唔好污染螢幕。
- 術語要有**單一字典**（[F1](02-foolproof.md)）：同一個詞喺成個 app 譯法一致，唔好一頁 `Group` 一頁 `Troop`。BOOK 用 `TERMS` 對照表，值得抄。

## L5 — 實作形狀（兩種棧）

**React／Vite／Next（我哋主力，26＋9 個 repo）**：抄 BOOK 嘅 `i18n.jsx` 形狀——`LangProvider` + `useLang()` + `bi(lang, zh, en)`。「英文模式但該處冇英文」要 fall back 中文，**唔可以出空白**（BOOK [`bi()`](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/3d68fc564323aa15ba5d6a18326e867e391c62c2/web/src/i18n.jsx#L46-L48) 就係咁）。

**單一 HTML／Canvas（Type A/B/C）**：零依賴 vanilla 做法，範本見 [`templates/i18n/lang_toggle_v1.0.js`](../templates/i18n/lang_toggle_v1.0.js)：`data-i18n` 屬性 + 一份字典 + `applyLang()`。**唔准**為咗翻譯引入 i18n 套件（撞 [S1](01-slim.md)／[C13-g](09-gemini-canvas.md) 精神；純字串對照唔需要 library）。

Type C 腦殼分離：語言選擇屬 UI 狀態，**留喺殼**；唔好為咗記住語言而加 GAS 寫入（無謂耗 quota，亦唔係用戶資料）。

## L6 — 驗收（機器驗到乜、人手驗乜）

| 項 | 點驗 | 性質 |
|---|---|---|
| 有語言掣、有 `data-lang`／`lang` 切換、`localStorage` 有 try/catch | `node scripts/i18n_check_v1.0.mjs <檔或目錄>` | **靜態自動**（新增） |
| 字典兩邊鍵一致、冇空英文值 | 同上 | **靜態自動** |
| 冇「中文 English」硬塞字串 | 同上（WARN，可能有例外） | 靜態提示 |
| 體積仲過閘 | `guard`／`audit_single_html`（S7／C13-g） | 靜態自動 |
| 撳掣真係換到字、重整頁面記住選擇 | **人手**：撳一次、F5、開私隱窗口再開 | **人手實測** |
| 英文模式下冇殘留中文、冇空白位、表格唔爆版 | **人手**：逐頁望，特別係窄螢幕 390px | **人手實測** |
| 螢幕閱讀器讀音、鍵盤 focus | **人手** | **人手實測** |

**guard 唔會硬擋冇英文嘅 app**（L 係可豁免規則，而且 guard 判唔到字串量同翻譯質素）。`i18n_check` 係**有做英文嗰陣**驗做得啱唔啱；豁免與否要喺 PR／SCOPE 寫清楚。呢個界線同 [F6-b](02-foolproof.md#f6-b--寫入結果狀態送咗之後點算) 一樣：機器驗結構，人手驗行為。

## 未做／限制

- 本頁只係規則＋範本＋靜態檢查器，**為未來新開 app 而設**。**冇逐個現有 repo 加英文，亦唔會追溯**（用戶 2026-11-08：「各自 APP 唔使做」／「我只想為未來 APP 定義」）。四個 BOOK 只係參考實作，唔係要佢哋跟新規。
- 4 個 BOOK 只讀咗 `i18n.jsx`／`App.jsx` 掣部分／`styles.css` 語言段／`ui_contracts.test.mjs`，**冇安裝、冇跑佢嘅 build 或測試**，冇逐頁核對翻譯質素。
- 300 條字串閘係**本次定案嘅工程估值**，唔係實測統計；日後覺得唔合理喺 PR 提出改，改要跟 [F16](02-foolproof.md#f16--三處同步-checklist最常出事) 四處同步。
- 範本嘅瀏覽器行為（私隱模式、列印、螢幕閱讀器）**未在真機實測**；用到自己 app 要按 L6 人手項行一次。
