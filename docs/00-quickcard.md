# 一頁紙速查卡（印出嚟貼枱）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **最短入門**：[17 §3 STEP BY STEP](17-final-check-and-tutorial.md#2--step-by-step由零到一個-app) · 完整版：[PLAYBOOK.md](../PLAYBOOK.md) · Checklist：[10-checklists.md](10-checklists.md)
> 交付前一條命令：`node scripts/final_check_v1.0.mjs`（六角度報告）

---

## 開新 app

```
[ ] 0. 判定類型：工具 / App / 系統  （系統＝一定要設定層 + 隱藏超管）
[ ] 1. 抄 templates/ → 新 repo
[ ] 2. .env.local 填 secret（只喺本機 + Vercel Dashboard）
[ ] 3. .gitignore / .vercelignore / vercel.json 就位
[ ] 4. node scripts/guard.mjs 綠
[ ] 5. getConfig() + fail closed + env 自檢
[ ] 6. 先做安全底層（PLAYBOOK §9 第 1–8 步），先至做功能
```

## 每次 commit

```
[ ] 冇 secret、冇 .env、冇 node_modules、冇 dist、冇 *.bak/tmp/old/log
[ ] 新 action 入咗白名單 + 有測試
[ ] 新 env 有 .env.example 條目
[ ] 新設定有 fail closed 預設值
[ ] guard 綠 + build 綠
[ ] commit message: type(scope): 做咩  （Conventional Commits）
```

## 上線前 Go / No-Go

```
[ ] dist < 5MB / bundle < 2MB / 圖 < 500KB          (S6,S7 — Vercel/dist 類)
[ ] 單一 HTML ≤ 5MB、唔強制瘦身                        (C13-g)
[ ] 9 個圖標齊、≤260 KB、maskable 66%、og 絕對網址       (G11)
[ ] .vercelignore 擋 node_modules/.git/docs          (S2)
[ ] Preview 非 main 關閉 + retention 7 日            (S8)
[ ] 全部 secret 喺 env，前端零 service key           (A1)
[ ] RLS / requireAuth / sig 白名單全部生效           (A6,A7,A10)
[ ] 限流 + origin allowlist + 輸入消毒              (A8,A9,A11)
[ ] AUDIT_LOG 寫到嘢 + 一鍵診斷報告可用             (A13,F8)
[ ] 隱藏超管測過一次，而且有留痕                   (A14)
[ ] 備份啱啱做過 + importAll 實測還原過             (F11)
[ ] 回滾指令寫咗喺 PR（上一個 deployment URL）      (F18)
[ ] 頁尾 + meta 有 © SCOUT SYSTEM                   (W1)
[ ] 生成圖有隱形水印，解碼器讀到                    (W2/W3)
[ ] 檔名 + 內文版號一致；部署拷貝已 sync            (V1/V4)
[ ] 交付 HTML 零真 key：C13 三軌；無 _local_ 檔      (W6)
```

## 五大鐵律（記唔到其他都要記呢五句）

```
瘦身：唔好用嘅嘢一件都唔部署。
防呆：人手一定會錯，要畀系統兜住。
安全：永遠假設前端已經被攻陷。
版權：© SCOUT SYSTEM 要講出口、寫入圖、留紀錄。
版號：每次更新檔名同內文一齊改。
```

## Gemini 三種結構 + 通用規則

```
A 全開放（一個 HTML）／B 隱藏水印（HTML + DCT 水印 + 解碼器）/ C 腦殼分離（HTML 殼 + GS 腦）
C = 原本 1 個 HTML 拆做 brain_vX.Y.gs（腦：prompt／原圖成品圖／使用紀錄／key）
    ＋ shell_vX.Y.html → index.html（殼）；Canvas 只准改殼，唔准改腦
三種都要守 S 瘦身／F 防呆／A 安全／W COPYRIGHT SCOUT SYSTEM／V 雙版號
改版：app_v1.0.html → app_v1.1.html，meta/title/APP_VERSION/頁尾/註解 全部改

C13 自動注入（已實作、真係用到嘅正確做法）= 三軌同一套：
  ① 全檔唯一 const API_KEY = ""; 平台注入 slot
  ② credentials:'include' + 冇 key 唔加 ?key= → 平台請求代理
  ③ safeStore BYOK 後備（localStorage try/catch）；③ 嘅 key 用 x-goog-api-key header
C13-g：單一 HTML 5MB 上限、唔強制瘦身（越輕 load 越快）；S7/S10 唔適用
交付任何單一 HTML 前：node scripts/audit_single_html_v1.0.mjs <檔名>（FAIL 即 No-Go）

香港：零 key 單一 HTML（水印解碼器）永久可用；Canvas preview 靠代理；file:// 直打 Gemini 唔通
```

## 兩條公理 + 三條永遠

```
① 一切身份 = 一個正規化 ID + 佢嘅資料源
② 一切接入 = 交俾邊個管 + 登記喺邊個 registry
永遠：apikey 唔落 URL／QR／前端／Sheet 格；下游唔自開戶反寫上游；
      閂下游入口前，上游 sig 轉發路徑要已起好。
多單位系統：先定職責邊界／唔做清單／功能 registry（可選模式見 [19](19-ecportal-troop-case.md)，**唔係通用底線**）
本地回歸綠唔算完成 —— 新部署要真機跑一次（[17 §4](17-final-check-and-tutorial.md)）
```

## 出事第一句做乜

| 事 | 第一動作 | 詳情 |
|----|----------|------|
| Key 外洩 | 停用入口 → 換 key → 三處同步 → rotate session secret → redeploy → 查審計 → 恢復 | [11-incidents](11-incidents.md#1-key-外洩) |
| Deploy 壞咗 | Vercel 回滾上一個 deployment → 開 kill switch → 先復服務後查因 | [11-incidents](11-incidents.md#2-壞-deploy) |
| 資料唔見 | 停止寫入 → 最近備份 `importAll` 驗 hash → 對 AUDIT_LOG 補差 | [11-incidents](11-incidents.md#3-資料損毀--唔見) |
| 超管被用 | 即刻 rotate `SUPER_KEY` → 拉 AUDIT_LOG → 檢查有冇新 admin row | [11-incidents](11-incidents.md#4-超管通道被濫用) |
| Vercel 爆 quota | 查 `.vercelignore` + `du -sb dist` + 刪舊 deployment | [11-incidents](11-incidents.md#5-體積--quota-爆) |
