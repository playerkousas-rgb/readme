# 15 — 資源查找總索引（API ／ Prompt ／ PROMPTS.CHAT）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **點解有呢份**：三個 repo 各有真理，唔好將內容複製過嚟（會 drift，違反 F1 單一真理）。
> 呢份只做**查找入口**：一張表話你知「想搵 X → 去邊個 repo 邊個檔」。
> 對應：[README §7](../README.md#7-相關-repo你-github-帳戶-playerkousas-rgb-入面)、[09 三種結構](09-gemini-canvas.md)、[14 API KEY 注入](14-api-key-injection.md)。

---

## 1. 三層資產鏈（方便查找嘅心智圖）

```
① f/prompts.chat        開源 prompt 庫（上游靈感／可抄嘅 prompt 寫法）
   https://github.com/f/prompts.chat · https://prompts.chat · ~175k stars · HTML · 可 self-host
        ↓ 搵到啱用嘅 prompt
② prompt / Prompt Studio  你自己嘅工作台（欄位 ↔ 卡面區塊 ↔ 提示詞片段）
   https://github.com/playerkousas-rgb/prompt · https://prompt-smoky-pi.vercel.app
   出圖 server route：app/api/generate/route.ts（default = Pollinations 免金鑰）
        ↓ 個 app 要駁邊條 API？
③ api / HK Free APIs       香港免費 API 天書（機讀總索引 data/apis.csv + 20+ docs）
   https://github.com/playerkousas-rgb/api
   尤其：docs/ai.md（AI 香港可用性）／docs/hk-blocked.md（封港名單）／docs/glue.md（零成本架構）
        ↓ 點樣安全咁用？
④ readme（呢個 repo）     S/F/A/W/V 通用規則 + 模板 + guard
   特別 [14-api-key-injection.md](14-api-key-injection.md) 講「GEMINI 自動注入」同香港做法
⑤ 專案案例（旅團 as-built 5 repo）  → [19 §12](19-ecportal-troop-case.md)（**唔係通用資源**）
```

---

## 2. 我想搵… 去邊？（快速表）

| 我想搵 | 去 |
|--------|-----|
| 一條現成 prompt／點寫 system prompt | [`f/prompts.chat`](https://github.com/f/prompts.chat)（開源庫）；自己版本放 [`prompt`](https://github.com/playerkousas-rgb/prompt) |
| 將 prompt 拆成可視化欄位／生圖 | [`prompt` README](https://github.com/playerkousas-rgb/prompt#readme)（三向連動、簡易／進階） |
| 出圖但唔想用 API key | [`prompt/app/api/generate/route.ts`](https://github.com/playerkousas-rgb/prompt/blob/main/app/api/generate/route.ts) 嘅 **Pollinations 免金鑰** default；對照 [14 §2.2](14-api-key-injection.md#22--24-三條要-runtime-ai嘅路揀一條) |
| 香港有乜免費 API 用 | [`api/README.md`](https://github.com/playerkousas-rgb/api#readme) → [`api/data/apis.csv`](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv)（可直接開 Excel／Sheet） |
| 天文台／交通／醫療／地圖 API | [`api/docs/weather.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/weather.md)／[`transport.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/transport.md)／[`health.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/health.md)／[`geo.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/geo.md) |
| AI API 喺香港用唔用到 | [`api/docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md) ＋ [`hk-blocked.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/hk-blocked.md) → 對應 [14 §2](14-api-key-injection.md#2-香港真正用得到嘅做法你個水印-html-就係) |
| 零成本後端膠水（Sheets 當 DB、cron、bot） | [`api/docs/glue.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/glue.md) |
| Gemini Canvas 自動注入 API KEY 點運作 | [14 §1 官方機制](14-api-key-injection.md#1-官方自動注入機制ai-studio-build--canvas)（server-side secret） |
| 隱形水印／版權／原圖成品圖紀錄 | [12 W 系列](12-copyright-scout-system.md) ＋ [`templates/watermark/`](../templates/watermark/README.md) |
| 檔名＋內文雙版號點做 | [13 V 系列](13-versioning.md) |

---

## 2.5 專案案例 repo → 去 19（唔喺呢度重複）

> 五個旅團 as-built repo（`vsbadge`／`roverbadge`／`cubsbadge`／`scoutbadge`／`scout-circulars`）
> 連同真檔名（`operations/TROOP_LINK_UPGRADE.md`、`docs/TROOP_UPGRADE_2026.md`）、`<purpose>` 常數、現況差異對照表，**全部屬專案案例** → [19 §12](19-ecportal-troop-case.md)。
> 呢份索引只放**通用資源**（API／Prompt／開源庫），唔好再將專案 repo 表抄返入嚟（F1 單一真理）。
> 邊個 repo 有 critical 漏洞／158MB 問題 → [20 repo 健康審計](20-repo-health-audit.md)。

---

## 3. `api` repo 分類索引（由 `data/apis.csv` 自動產生）

> `auth=none` = 唔使 API key；`hk_status=ok` = 2026-09-29 實測成功。
> 更新呢個表：`node scripts/refresh_resources_v1.0.mjs`（需要 `gh` 已登入）。表只列 **top 15 + 其他**，完整 40 類喺 CSV。

<!-- BEGIN:api-category-index -->
| 分類 | 條數 | 免 key | 去向 |
|------|-----:|-------:|------|
| 公共設施 | 36 | 36 | [公共設施](https://github.com/playerkousas-rgb/api/blob/main/docs/facilities.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| AI | 21 | 1 | [AI 香港可用](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 3D-AR遊戲 | 15 | 10 | [3D/AR](https://github.com/playerkousas-rgb/api/blob/main/docs/xr-games.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 圖標徽章 | 14 | 13 | [圖標](https://github.com/playerkousas-rgb/api/blob/main/docs/icons.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 人物素材 | 12 | 11 | [人物素材](https://github.com/playerkousas-rgb/api/blob/main/docs/avatar.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 香港政府-交通 | 11 | 11 | [交通](https://github.com/playerkousas-rgb/api/blob/main/docs/transport.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 膠水 | 11 | 4 | [零成本膠水](https://github.com/playerkousas-rgb/api/blob/main/docs/glue.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 遊戲化 | 9 | 1 | [遊戲化](https://github.com/playerkousas-rgb/api/blob/main/docs/gamification.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 教育 | 8 | 7 | [教育](https://github.com/playerkousas-rgb/api/blob/main/docs/edu-fun.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 媒體 | 8 | 3 | [媒體](https://github.com/playerkousas-rgb/api/blob/main/docs/media.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 證書生成 | 8 | 6 | [證書](https://github.com/playerkousas-rgb/api/blob/main/docs/certs.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 日常 | 7 | 3 | [日常](https://github.com/playerkousas-rgb/api/blob/main/docs/daily.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| GitHub神人 | 7 | 4 | [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 世界-天氣 | 6 | 4 | [天氣](https://github.com/playerkousas-rgb/api/blob/main/docs/weather.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 香港政府-民生 | 6 | 6 | [民生](https://github.com/playerkousas-rgb/api/blob/main/docs/civic.md) · [CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| 其他 25 類 | 75 | 56 | [完整 CSV](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
| **合計** | **254** | **176** | [playerkousas-rgb/api](https://github.com/playerkousas-rgb/api/blob/main/data/apis.csv) |
<!-- END:api-category-index -->

---

## 4. `prompt` repo 重點檔

| 檔 | 用途 |
|----|------|
| `README.md` | 產品概念（三向連動、影響力標示、圖生圖、輸出 JSON 格式） |
| `app/api/generate/route.ts` | **server-side 生圖代理**：Pollinations 免金鑰 default；OpenAI／Gemini／Stability 用 BYOK；key 用完即丟、唔 log、唔入庫 |
| `app/card/page.tsx`／`app/badge/page.tsx`／`app/gift/page.tsx` | 做卡／做章／禮品三條產品線 |
| `lib/card/classic.ts` | `test1` 原版 JSON prompt 移植（鍵順序、字典、預設值） |
| `lib/card/systems/*.ts` | onepiece／pokemon／yugioh 三套系統 |
| `lib/badge/*.ts` | 章／布章類型、形狀、工藝規則 |
| `components/SettingsModal.tsx` | 供應商 + API Key（BYOK）設定 |
| `docs/` | 章套裝／布章規劃 |

> `prompt` repo 用 Next.js 14 + React 18 + Tailwind，**零 AI SDK dependency**：直接 `fetch` 供應商 REST，所以 key 只喺 request 入面流過 —— 呢個就係「唔需要設 server env」嘅 BYOK 設計。

---

## 5. `f/prompts.chat` 點用（上游開源庫）

- 前名 *Awesome ChatGPT Prompts*；官方描述：「Share, discover, and collect prompts from the community. Free and open source — **self-host for your organization with complete privacy**」。
- 用途：搵 prompt 寫法、做自己內部 prompt library、對照人哋點寫 system prompt。
- **唔好**直接將佢嘅 prompt 當自己版權（[W8 第三方素材標來源](12-copyright-scout-system.md#w8--第三方素材要標來源)）；抄咗要喺 `CREDITS.md` 列明。
- 你個 [`prompt`](https://github.com/playerkousas-rgb/prompt) 唔係佢嘅 fork，係你自己寫嘅工作台 —— 兩者係「上游靈感 → 自己工具」關係。

---

## 6. 維護約定

- 呢份**只放連結同摘要**，唔複製內容（F1）。內容真理喺各自 repo。
- 每月（或 `api` repo 有 push 時）跑 `node scripts/refresh_resources_v1.0.mjs` 更新分類表。
- 連結改咗 → 更新呢份 + [README §7](../README.md#7-相關-repo你-github-帳戶-playerkousas-rgb-入面)；`node scripts/guard.mjs` 會驗內部連結。
- 任何新增資源要對應返一條規則 ID（S/F/A/W/V/C），否則只係 bookmark，唔係規範。
