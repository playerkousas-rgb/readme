# APP STORE 補 slug 指令（可直接複製貼去 `playerkousas-rgb/website` 對話）

> 用途：白名單落地「第 0 步」**已經完成**（`bd721421`）；剩低嘅只有**資料**工作，唔使改 code。
> **只改一個 repo**：`playerkousas-rgb/website`。**唔使改任何子 App、唔使改圖書館。**
> 貼之前唔需要改任何嘢。

---

=== 開始（複製以下全部） ===

請先讀真理倉 `playerkousas-rgb/readme` 呢兩份，然後照做：

1. `docs/51-whitelist-rollout-list.md` 嘅 **§1.1**（A 組 slug 對照表 ＋ `appSlug()` 實查結論）
2. `docs/50-app-store-whitelist-and-shutdown.md` 嘅 **§1 SG9／SG9-a**、**§4.4-6**

## 背景（唔使重做）

你已經完成（`bd721421`）：
- `?app=<slug>` 深層連結（`appDeepLink()` L79、`appSlug()` L73、`findAppByDeepKey()` L100、`handleDeepLink()` L120）
- 所有分享出口改指深層連結：`app.js` L838／L842／L854／L861、`index.html` L2453
- 卡片／排行榜 href、今期主打改開詳情
- `openApp()` L50–54 同 sheet「開啟」L227 **保持真 url**（呢兩處係正確嘅，唔准動）

而家只剩兩件**資料**工作。

## 任務 1：補 5 個缺咗嘅 slug

來源：`migrations/20261116-app-slug-seed.sql`（已有 67 條），以下 5 隻唔在其中。
必須按「正式 Vercel host」精確配對，**唔准靠 repo 名猜**。

| Repo | 正式 host | 建議 slug |
|---|---|---|
| `card` | ⚠️ 現時 homepage 係 branch 預覽 `card-git-arena-01a0f5ad-…vercel.app` | `card` |
| `scoutdesign` | scoutdesign.vercel.app | `scoutdesign` |
| `skw-radar-hunt2` | skw-radar-hunt2.vercel.app | `skw-radar-hunt2` |
| `skw-score` | skw-score.vercel.app | `skw-score` |
| `Veritas` | veritas-delta-seven.vercel.app | `veritas` |

填之前逐個核對冇撞 unique index（`apps_slug`）。

> ⚠️ **重要澄清**：真理倉早前寫「缺 slug 會令分享退回主站首頁」係**未證實嘅推測**，已撤回。
> 我實查你 `app.js` L73–76：
> ```js
> function appSlug(app) {
>   if (!app) return "";
>   return String(app.slug || app._id || "").trim();   // 冇 slug 就用 _id
> }
> ```
> 所以冇 slug 都**照樣開得到該 App 詳情卡**，只係網址變成 `?app=<uuid>`（難睇、日後換 DB 會斷）。
> **所以補 slug 唔係落閘前置條件，係「質素」工作。**

## 任務 2（比 slug 更重要）：確認 `apps.url` 冇 branch 預覽網址

`card` 嘅 `apps.url` 現時係 `https://card-git-arena-01a0f5ad-card-playerkousas-rgbs-projects.vercel.app/`。
呢個係 **git branch 預覽網址**，特徵：
- 每次 push 都可能失效／變新 host
- 子 App 一旦落 `entry-gate`，白名單係靠 **Referer origin** 比對 —— 預覽網址同正式網址係**唔同 origin**
- 後果：由 APP STORE 撳入會照樣放行（因為 origin 相同），但**分享出去嘅深層連結永遠落唔到正確嘅詳情卡**

請答清楚：
1. `card` 有冇穩定 production 網域？係唔係 `card-*.vercel.app`（無 `-git-`）？
2. 如果**冇**：`card` 應該 ① 唔加入白名單（跳過），定係 ② 先部署正式網域？
3. 全 A 組 35 隻，仲有冇其他 `apps.url` 帶 `-git-` 或 `-preview-`？（請逐個查並列出）

## 任務 3：驗 30 個 slug 全部解析得到

用你現有 `?app=` 機制，逐個試，確認開到對應 App 詳情卡（唔會停首頁、唔會出「搵唔到呢個 App」）：

```
aircraft-encyclopedia / ayp / bp / course / cubsgame / cubsmeeting / dbs / doll /
drawtheroute / forward / game / ghmeeting / hkcamping / hkmap / icon-maker / knotmaster /
map3d / mcscript / minigame / mirror / photo-edit / photo-prep / pioneer / router /
scoutmeeting / skw-tracking-signs / troop-router / upgrade / voice-slide-web / vsmeeting
```

（headless 或手動逐個貼都得；重點係「對唔到」嗰啲要列出。）

## 任務 4：確認兩件唔使做嘅事（答「係」就夠）

1. 卡片／詳情 sheet **唔需要**顯示「須經 APP STORE 開啟」標籤 —— 由 APP STORE 撳入本身會放行，加標籤只會令用家以為有問題。
2. **唔需要**為白名單加統計欄位或 tracking —— `clicks／stars／hearts` 已足夠（SG10）。

## 唔准做（違反任何一項就停手，先問我）

- ❌ 唔准喺 `openApp()`（L50–54）或 sheet「開啟」（L227）加 `noopener`／`noreferrer` —— 會清空 Referer，全部子 App 撞卡
- ❌ 唔准改 `apps` 表 RLS policy（`visible=false` 匿名睇唔到係設計，唔關白名單事）
- ❌ 唔准把分享連結改返做子站直連（SG9）
- ❌ 唔准改 `appSlug()` 嘅 `_id` fallback（呢個係防止缺 slug 時完全失效嘅保險）
- ❌ 唔准改 `scout-circulars` 或任何子 App 倉（你只改 `website`）
- ❌ 唔准因為某隻 App 落咗閘就喺 APP STORE 收起佢（收起係另一個齒輪，由我決定）
- ❌ 唔准加彈窗／倒數／通知 bubble

## 真機測試（必做）

1. 無痕開 `https://scoutappstore.vercel.app/?app=aircraft-encyclopedia` → 自動切分頁＋彈詳情
2. 詳情卡撳「開啟」→ 正常入到子 App（唔會見白名單卡）
3. 詳情卡撳「分享」→ 網址係 `?app=aircraft-encyclopedia`（唔係子站直連）
4. 補咗 slug 嗰 5 隻，逐個開 `?app=<新slug>` → 開得到
5. 開唔存在 slug（`?app=notexist`）→ 出「搵唔到呢個 App」＋清走 query，唔好白屏

## 回報（照抄）

```
1 appSlug() fallback：確認係 app.slug || app._id（是/否）
2 已補 slug：card __ / scoutdesign __ / skw-radar-hunt2 __ / skw-score __ / veritas __
3 card 正式 production 網域：____________（冇就寫「冇，建議跳過」）
4 其他帶 -git-/-preview- 嘅 apps.url：____________（冇就寫「全部乾淨」）
5 30 個 slug 解析失敗嘅：____________（冇就寫「全部成功」）
6 真機 5 項：?app= ✓/✗ ｜ 開啟 ✓/✗ ｜ 分享深層連結 ✓/✗ ｜ 新slug ✓/✗ ｜ 唔存在slug ✓/✗
7 未動：openApp() ____ ｜ sheet 開啟 ____ ｜ RLS ____
8 未做／風險：____________
```

**唔准講「已完成」而冇真機結果。未做就寫「未做」。**

=== 結束 ===
