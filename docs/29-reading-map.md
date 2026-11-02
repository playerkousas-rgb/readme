# 29 — 閱讀地圖：API 設計、Agent Skills、點分類放好

> 接 [docs/README](README.md) 章 3／章 6 · 整理日期 **2026-11-02**
> 目標：唔係堆書單，係答「想將 API 設計／SKILL／文件分類放好，應該讀邊幾份、读完改邊個檔」。
> **核實範圍**：GitHub 上嘅 repo 用 `api.github.com` 查過（星星／授權／結構）；非 GitHub 網頁（diataxis.fr、cloud.google.com 等）本 sandbox 出站唔通，**未實測，只列作公認參考**，請自行開。

---

## 0. 三條閱讀路線

| 你得 | 讀 | 做完會 |
|---|---|---|
| 30 分鐘 | §1 章 A 前 3 行 + §5 + [docs/README](README.md) | 知 `docs/` 點分章、兩個外國 repo 借乜 |
| 2 小時 | §1–§4 + [27](27-repo-starter.md) + [28](28-repo-taxonomy.md) | 新 repo 起手包 + 85 個 repo 分類 |
| 要落地 | §2 + §3 + [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs) + [30](30-repo-health-check.md) | API contract 格式 + Skill CI 檢查 |
| 開有身份系統 | [31](31-system-basics.md) + [起手包 `docs/system-basics.md`](../templates/repo-starter/docs/system-basics.md) | 帳號生命週期 8 樣（含忘記密碼）+ ADMIN 回報系統驗收 |

---

## 1. 章 A — Repo／文件點組織（對應 Q2、Q4）

| 參考 | 係乜 | 我哋點用 | 狀態 |
|---|---|---|---|
| [Diátaxis](https://diataxis.fr/) | Tutorial／How-to／Reference／Explanation 四分流 | 解決「一份 MD 又教又查又解釋」；[docs/README](README.md) 章 0–6 已按「幾時讀」分 | 外網未實測 |
| [Keep a Changelog](https://keepachangelog.com/)／[olivierlacan/keep-a-changelog](https://github.com/olivierlacan/keep-a-changelog)（6.7k★, MIT） | CHANGELOG 格式 | 起手包 `CHANGELOG.md`；配合 V 雙版號 | GitHub 已核實 |
| [adr/madr](https://github.com/adr/madr)（2.6k★）／[mattpocock ADR-FORMAT](https://github.com/mattpocock/skills/blob/main/skills/engineering/domain-modeling/ADR-FORMAT.md) | ADR：一段就夠 + 三條「幾時寫」 | 起手包 `docs/adr/0000-template.md`；[19](19-ecportal-troop-case.md) 嘅定案可回溯寫成 ADR | GitHub 已核實 |
| [mattpocock/skills `AGENTS.md`](https://github.com/mattpocock/skills/blob/main/AGENTS.md) | 一個檔講清楚「skills 分 bucket、邊啲要入 README／manifest、docs tree 點 mirror」 | 借做 [27](27-repo-starter.md) 嘅 `AGENTS.md`「開工順序 + 可改／不可改」 | 已讀全文 |
| [mattpocock/skills `SCOPE.md` + `.out-of-scope/`](https://github.com/mattpocock/skills/blob/main/SCOPE.md) | 收貨兩條 bar；一個被拒概念一個檔 | 起手包 `SCOPE.md` + `docs/out-of-scope/`；本 repo 嘅「案例隔離」都係同一種思考 | 已讀全文 |
| [mattpocock/skills `GLOSSARY.md`](https://github.com/mattpocock/skills/blob/main/GLOSSARY.md) | 定義／避免用／關係／已釐清歧義 | 起手包同名檔；減少 Agent 自創術語 | 已讀全文 |
| [mattpocock/skills `CONTRIBUTING.md`](https://github.com/mattpocock/skills/blob/main/CONTRIBUTING.md) | 路由表 + 「AI 寫 issue 五條」 | 起手包同名檔 | 已讀全文 |
| 本 repo [docs/README](README.md) | `docs/` 00–30 分章 + 命名約定 + 加新檔四步 | **呢份就係 Q2「執拾好、分章分類」嘅成品** | 本倉 |

## 2. 章 B — API 設計（對應 Q4「API 設計分類放好」）

| 參考 | 管乜 | 我哋點用 |
|---|---|---|
| [microsoft/api-guidelines](https://github.com/microsoft/api-guidelines)（23.3k★） | REST 命名、錯誤格式、版本、長跑操作 | 寫 `docs/api-contract.md` 時嘅底；特別係 error envelope 同 Consistent naming |
| [zalando/restful-api-guidelines](https://github.com/zalando/restful-api-guidelines)（3.3k★, CC-BY-4.0） | 更貼日常：HTTP status、pagination、`Retry-After`、compatibility | 對應 [26](26-reverse-api-walkthrough.md) §5 嘅 429／退避；client 標準化欄位 |
| [OAI/OpenAPI-Specification](https://github.com/OAI/OpenAPI-Specification)（31.3k★, Apache-2.0） | 用 YAML/JSON 描述 endpoint／schema | 私有 API 逆向完，將「拆出嚟四格」寫成一份 `openapi.yaml`，即刻有文件有 mock |
| [Google API Design Guide](https://cloud.google.com/apis/design) | 資源導向命名、標準 method、error model | 外網未實測；概念同 microsoft 版互補 |
| [JSON:API](https://jsonapi.org/) | `data`／`included`／relationship 約定 | `scout-circulars` 嘅 `contentful_api` 就係呢種形狀（`includes.Asset`） |
| [DATA.GOV.HK 使用條款](https://data.gov.hk/tc/terms-and-conditions) | 署名、商用、轉售限制 | [`api/README.md`](https://github.com/playerkousas-rgb/api/blob/main/README.md) 已引用；任何官方 feed 接入都要再核 |
| 本倉 [api](https://github.com/playerkousas-rgb/api) + [15](15-resource-index.md) + [26](26-reverse-api-walkthrough.md) | 254 條已實測 API 索引、client 形狀、ToS 決策 | **先查官方，冇先至逆向**（P1） |

### 「API 設計」喺 repo 入面應該放邊

```
docs/api-contract.md       對外／對內 contract（endpoint、欄位、error、版本）
docs/api-sources.md        每條上游：官方定私有、ToS、auth、rate limit、實測日期、失效應對
docs/adr/NNNN-*.md         難逆轉嘅 API 決定（例如「用 data 分支快照而唔係即時 ETA」）
scripts/                  client + health check（api_client.py / repo_health）
docs/00-quickcard.md       一頁紙：出事搵邊份
```

> 呢個擺法同 [25](25-reverse-api-reuse.md) 嘅 `hkcamping/TRANSPORT-API-FEASIBILITY.md` + `AUTOMATION.md` + `scripts/transit-poc.mjs` 三層係同一套：**可行性／條款 → 決定 → 實作 → 監察**。

## 3. 章 C — Agent Skills（對應 Q4「SKILL 分類放好」）

| 參考 | 學乜 | 已核實 |
|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | 官方 Agent Skills 規格、`SKILL.md` frontmatter | 186k★，GitHub API |
| [vercel-labs/skills](https://github.com/vercel-labs/skills)（37.6k★, MIT） | `npx skills add <repo>` CLI；即係上一段影片用嗰條指令 | ✅ |
| [mattpocock/skills](https://github.com/mattpocock/skills) | **點分類**：`skills/engineering/`／`productivity/`／`misc/`／`in-progress/`／`deprecated/`；promoted 先入 README + plugin.json | §5 詳評 |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | **點拆一個 skill**：`SKILL.md` + `references/` + `library/` + `scripts/` + `assets/` + `evals/` + `tests/`；CI 驗 frontmatter | §5 詳評 |
| [`answer/skill/hk-scout-kb/SKILL.md`](https://github.com/playerkousas-rgb/answer/blob/main/skill/hk-scout-kb/SKILL.md) | 你哋已有嘅 Skill：frontmatter 有 name／description／license／compatibility／metadata／disclaimer | 上一輪已讀 |

### 建議嘅收納約定（寫入 `skills/README.md`）

```
skills/
  promoted/<name>/SKILL.md       已採用、會喺 README 列出
  in-progress/<name>/SKILL.md    測試中，唔好入 manifest
  deprecated/<name>/SKILL.md     留檔但唔載入
  <name>/references/             長文（按需載入，唔好塞晒入 SKILL.md）
  <name>/scripts/                可執行檢查
  <name>/assets/                 模板／資料
  <name>/evals/                  驗收案例
docs/<name>.md                   人讀頁：What it does / When to reach for it / Common questions / It's working if
tests/frontmatter.mjs            CI 驗 frontmatter
```

**Frontmatter 硬規則**（由 taste-skill `tests/frontmatter.mjs` 抄，已寫入 [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)）：

- `---` 區塊喺第一行；`name` 係 kebab-case、≤64 字；`description` 非空、≤1024 字。
- 名唔可以重複；`disable-model-invocation` 要 boolean。
- `description` 入面 `word: word` 要 quote，否則 strict YAML parser 會靜靜 drop 成個 skill。
- **User-invoked vs model-invoked**（mattpocock `.agents/invocation.md`）：前者 `disable-model-invocation: true` + description 寫俾人睇；後者保留觸發句「Use when…」。兩者喺 README 分兩組。
- 一個事實一份：`plugin.json`／README 只列 promoted set，改 skill 要同步三處（README、manifest、docs 人讀頁）。

## 4. 章 D — 「分類」本身點諗（對應 Q2、Q3）

| 概念 | 出處 | 落到本倉 |
|---|---|---|
| 形式分類（輕重 × 後台 × Gemini） | [28](28-repo-taxonomy.md) §1–2 | 唔好用內容／主題分；要按交付形狀分 |
| Lifecycle bucket（promoted／in-progress／misc／deprecated） | mattpocock `AGENTS.md` | Skills／模板／工具都用；[27 §4](27-repo-starter.md) 對照表 |
| SCOPE + `.out-of-scope/` | mattpocock `SCOPE.md` | 起手包；本倉「案例隔離去 19」係同款決定 |
| GLOSSARY 共用語言 | mattpocock `GLOSSARY.md` | 起手包；第日自動化 `topics` 要靠一致用字 |
| ADR 三條件（難逆轉／會覺得奇怪／有取捨） | mattpocock `ADR-FORMAT.md` | 起手包 `docs/adr/0000-template.md` |
| 單一真理 + 指針 | 本倉 [AGENTS.md](../AGENTS.md)／[docs/README](README.md) | 通用規則去 PLAYBOOK、案例去 19、`docs/` 只放入口 |

---

## 5. 兩個外國 Repo 評審（Q6）

> 數據：GitHub API **2026-11-02** 快照。兩者都係 MIT、都極活躍（前一日仲有 push）。

| | [mattpocock/skills](https://github.com/mattpocock/skills) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) |
|---|---|---|
| 定位 | 「Skills for Real Engineers」：作者自己每日用嘅 agent skills | 「Anti-slop frontend skill」：俾 agent 有美術方向 + 真瀏覽器自檢 |
| Stars / Forks | 309,218 / 26,025 | 107,744 / 7,278 |
| 授權／建立 | MIT／2026-02-03 | MIT／2026-02-19 |
| 結構 | `skills/engineering/`(20+) + `skills/productivity/`(8) + `misc/` + `in-progress/` + `deprecated/`；`docs/<bucket>/<skill>.md` mirror；`.claude-plugin/plugin.json` 列 promoted set；`.agents/` 放 ADR／寫作規範；`.out-of-scope/` 放拒絕紀錄 | 單一 `skills/taste-skill/`：`SKILL.md`(39KB) + `references/`(11 份) + `library/`(9 個 JSON) + `scripts/` + `assets/` + `evals/`；`tests/` 4 支；`.github/workflows/check-skills.yml` |
| 最值得抄 | **① `AGENTS.md` 當分類憲法**（邊啲 bucket、邊啲要入 README/manifest、docs 點 mirror）② `SCOPE.md` 兩條 bar ③ `.out-of-scope/` 一決定一檔 ④ `GLOSSARY.md` ⑤ 一段式 ADR ⑥ frontmatter 分 user/model-invoked | **① CI 驗 frontmatter**（strict YAML、name/description 長度、唯一名、manifest 路徑存在、library JSON 合法）② progressive disclosure：`SKILL.md` 只載入口，長文落 `references/` ③ `evals/` + `tests/` 驗收 ④ UTF-8／`node --check` 檢查 ⑤ 30–45 分鐘「look-and-fix」自建自檢循環，概念等同你哋 `final_check` 六角度 |
| **唔好抄** | 佢係 Claude Code／Codex／Copilot **plugin 生態**：`.claude-plugin/`、`.codex-plugin/`、marketplace.json、每 skill 一個 `agents/openai.yaml`、house rule「全 repo 禁用 em-dash」都係佢自己嘅脈絡；你哋棧係 Git + Vercel + GAS + Supabase + Gemini Canvas，唔需要整套搬 | 要 **Node 22+ 同已裝 Chrome／Chromium**，一次 build 30–45 分鐘、搵圖要網絡、無 API key；佢個 39KB `SKILL.md` 同 9 個設計 library 係為「出靚網頁」服務，同你哋 S 瘦身／零依賴規矩有衝突；亦唔適合放晒入單一 HTML Canvas app |
| 對我哋嘅結論 | **高參考價值，主要借「分類同治理檔」**，已落實喺 [27](27-repo-starter.md) + [docs/README](README.md) + 起手包 13b（含 `repo-setup` SKILL.md） | **中高參考價值，主要借「檢查內容 + 檔案分層 + 望圖自檢」**（**唔借 CI 觸發時機**），已落實喺 [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs) + [`preflight_v1.0.mjs`](../scripts/preflight_v1.0.mjs) + [30](30-repo-health-check.md) + 起手包 13a（含 `design-review` SKILL.md，按形式加）／13d（必跑） |

### 具體採用（唔使安裝任何嘢）

1. 已做：起手包加 `AGENTS.md`／`SCOPE.md`／`GLOSSARY.md`／`CONTRIBUTING.md`／`CHANGELOG.md`／ADR 範本（[27](27-repo-starter.md)）。
2. 已做：`docs/README.md` 分 7 章 + 命名約定 + 加新檔四步（Q2）。
3. 已做：零依賴 frontmatter checker，對應 taste-skill 嗰支 CI **frontmatter 規則嘅核心子集**（`word: word`／name／description／boolean／唯一名）；`|`／巢狀 YAML／inline JSON **唔支援**，唔好當等價（[32 §8.6](32-consistency-audit.md) 有 strict parser 負面對照）。
4. **已做（2026-11-02 補）**：`skills/` 三分收納 ＋ invocation 軸 ＋ 四段範本，落成起手包**第 13 項**（[27 §2b](27-repo-starter.md)）；**再補**：`skills/promoted/` 放咗 `repo-setup`／`design-review` 兩份**真正嘅 `SKILL.md`**，寫入 [`AGENTS.md`](../templates/repo-starter/AGENTS.md) 開工順序，frontmatter 過到 taste-skill 原版 strict parser（[32 §8.6](32-consistency-audit.md)）。每季用 [30](30-repo-health-check.md) L2 對照一次。
5. **已改（2026-11-02 修正）**：原本加咗一條 `on: push` 嘅 `check-skills.yml`，用戶指出「只想 AGENT 設定 repo 前先檢查好」→ **移除 YML**，改做 [`PREFLIGHT.md`](../templates/repo-starter/PREFLIGHT.md) + [`preflight_v1.0.mjs`](../scripts/preflight_v1.0.mjs)：同一組檢查（frontmatter／UTF-8／`node --check`／G10／六角度）由 AGENT 喺 **commit 之前**本機跑，`exit 1` 就停手。CI 留返做改動後嘅 regression，唔做開局 gate。
6. **已做（2026-11-02 補）**：taste-skill 嘅「望圖自檢」變成 [`templates/repo-starter/docs/design-review.md`](../templates/repo-starter/docs/design-review.md)（6 條 critique + 390/768/1440 look-and-fix），但**無引入** Chrome inspector／247 站 library／39KB prompt。
7. **唔建議**：為咗跟風裝 309k★ 個 plugin 或 taste-skill 個 Chrome inspector 落現有 85 個 repo；先解決 [27 §1](27-repo-starter.md) 嘅 80 個無 LICENSE、20 個無 README，同 [28 §3](28-repo-taxonomy.md) 嘅 12 個空殼／預留。

## 6. 未核實／限制

- `diataxis.fr`／`cloud.google.com/apis/design`／`jsonapi.org`／`keepachangelog.com`／`data.gov.hk` 等非 GitHub 網頁，本 sandbox 出站只准 `github.com`／`api.github.com`／`pypi.org`／`registry.npmjs.org`，**未逐一實測**，只列作公認參考；決策前請自行開一次。
- 星星數／fork 係 2026-11-02 快照，會變；兩 repo 嘅 plugin manifest 格式只適用佢哋支援嘅 agent，唔等於通用標準。
- `mattpocock/skills` 我只讀咗 13 份檔（AGENTS／SCOPE／GLOSSARY／CONTRIBUTING／SKILL 範例／ADR／workflow 等），未讀晒 30+ 個 skill；`taste-skill` 讀咗 SKILL.md 頭段、frontmatter test、CI、CHANGELOG 頭段，未執行過佢個 browser inspector。
- 本倉 `answer/skill/hk-scout-kb/SKILL.md` 已有 frontmatter，但未跑過 strict YAML 檢查；建議列入 [30](30-repo-health-check.md) L2。
