# 30 — 每個 Repo 要點檢查（L0 / L1 / L2）

> 接 [27](27-repo-starter.md) 開局 + [28](28-repo-taxonomy.md) 分類 · 工具：[`scripts/preflight_v1.0.mjs`](../scripts/preflight_v1.0.mjs)（**AGENT 開局 gate**）· [`scripts/repo_health_v1.0.mjs`](../scripts/repo_health_v1.0.mjs)（零依賴）· [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)
> 一句：**體檢唔係一次過幫 85 個 repo 補檔，係分三層、按風險排隊。**

---

## 1. 三層

| 層 | 幾時 | 做乜 | 命令 |
|---|---|---|---|
| **L0 開局** | 新 repo 第一個 commit 前，**AGENT 設定前** | [PREFLIGHT](../templates/repo-starter/PREFLIGHT.md)：12 樣 + 授權決定 + placeholder + UTF-8 + 4 支真理 script 一次過 | `node scripts/preflight_v1.0.mjs . --json` |
| **L1 每次 commit / PR** | 每次施工前後（**本機**，唔係 push YML） | 真理倉 `guard.mjs` + 交付前 `final_check --json` + 本工具 `--json` 做本機 gate | `node scripts/guard.mjs && node scripts/final_check_v1.0.mjs --json` |
| **L2 每季全倉** | 每季一次／重大改版後 | 85 個 repo 逐個體檢 + GitHub metadata 對照 + 手動 checklist（§5） | 見 §4 |

**Gate 定義**：`FAIL > 0` 就 exit 1，AGENT 停手；`WARN` 入 backlog，**唔阻塞交付**。開局 gate 係 [PREFLIGHT](../templates/repo-starter/PREFLIGHT.md)（本機、未 commit），CI 只做改動後 regression。

> **L0 用 PREFLIGHT，唔用 YML**：`preflight_v1.0.mjs` 係零依賴 orchestrator，一次過 `spawn` `guard`／`final_check`／`repo_health`／`check_skills`，再加 placeholder／UTF-8／`node --check`。由 **AGENT 喺設定／commit repo 之前本機跑**，`exit 1` 即刻停手 —— 唔係 push 之後先由 CI 話你知。詳見 [PREFLIGHT.md](../templates/repo-starter/PREFLIGHT.md)。CI 留返 L1 做 regression。

## 2. 工具檢查乜（11 個 check）

| id | 級別 | 查乜 | 出處 |
|---|---|---|---|
| `git` | PASS/WARN | 係咪 git repo、branch、未提交改動數、最後 commit | [05](05-git.md) |
| `starter` | WARN | 12 樣起手檔缺邊樣（R/L/A/O/Y/C/H/G/D/S/T/W 代碼） | [27](27-repo-starter.md) |
| `license` | WARN | 無 LICENSE = 公開 repo 預設版權保留 | [20](20-repo-health-audit.md) |
| `secrets` | **FAIL** | `sk-*`／`gh*_*`／private key／Bearer 字面值／Google key | [A1](03-security.md)／[W6](12-copyright-scout-system.md) |
| `env` | **FAIL** | `.env`／`.env.local` 入咗 repo（`.env.example` 例外） | [06](06-vercel.md) |
| `placeholders` | WARN | 非模板檔仲有未填 `{{...}}` | [27](27-repo-starter.md) §5 |
| `size` | WARN | 總體積、>5MB 大檔、`dist/`／`build/` 存在 | [S](01-slim.md)／[20](20-repo-health-audit.md) |
| `links` | **FAIL** | MD 內部連結（跳過 code fence） | guard G10 |
| `scaffold` | WARN | README 仲係 `create-next-app`／Vite 預設文 | [28](28-repo-taxonomy.md) §7 陷阱表 |
| `cron-data` | WARN | workflow 同時有 `schedule:` + `git commit` | [20](20-repo-health-audit.md)／[21](21-fix-plans.md) |
| `skills` | **FAIL**/WARN | 有 `SKILL.md` 就驗 frontmatter | [29](29-reading-map.md) 章 C |

`check_skills` 驗：第一行 `---`、`name` kebab-case ≤64、`description` 非空 ≤1024、名唔重複、`disable-model-invocation` boolean、未 quote 嘅 `word: word`、manifest 列嘅路徑存在。**全倉搵 `SKILL.md`**，唔假設一定喺 `skills/`（`answer` 用單數 `skill/`）。

## 3. 點跑

```bash
# AGENT 開局 gate（8 個 check 一次過；exit 1 = 唔好設定／commit）
node scripts/preflight_v1.0.mjs . --json
# 驗真理倉／起手包範本本身（範本有 placeholder 屬正常）
node /path/to/readme/scripts/preflight_v1.0.mjs /path/to/readme --allow-placeholders --json

# 單 repo（人讀）
node /path/to/readme/scripts/repo_health_v1.0.mjs /path/to/REPO

# CI / 機讀（stdout 只有一份 JSON；exit 1 = 有 FAIL）
node /path/to/readme/scripts/repo_health_v1.0.mjs . --json > health.json

# 有 Skill 嘅 repo 單獨驗
node /path/to/readme/scripts/check_skills_v1.0.mjs . --json

# 真理倉自己：全倉一致性審計（跨檔矛盾，唔係單 repo 體檢）
node scripts/consistency_v1.0.mjs . --json       # 見 docs/32
```

CI 加一步（抄 [`templates/github/guard.yml`](../templates/github/guard.yml) 嘅 job）：

```yaml
- name: Repo health
  run: node scripts/repo_health_v1.0.mjs . --json
```

> 腳本要放喺目標 repo 嘅 `scripts/`（或由 truth repo 路徑直接呼叫）；PREFLIGHT 會 `spawn` 同目錄嘅 `guard.mjs`／`final_check_v1.0.mjs`／`repo_health_v1.0.mjs`／`check_skills_v1.0.mjs`，**四支要一齊抄**（[27 §5](27-repo-starter.md)）。全部零第三方依賴，符合 S 瘦身。

## 4. L2 全倉（85 個）

```bash
# ① metadata 快篩：授權／topic／size／archive，唔使 clone
gh api --paginate "user/repos?per_page=100&type=owner" \
  --jq '.[] | [.name, (.license.spdx_id // "NO-LICENSE"), .size, .archived] | @tsv'

# ② 深檢：shallow clone 後逐個跑
mkdir -p /tmp/audit
for r in $(gh api --paginate "user/repos?per_page=100&type=owner" --jq '.[].name'); do
  git clone --depth 1 -q "https://github.com/playerkousas-rgb/$r.git" "/tmp/audit/$r" 2>/dev/null || continue
  node scripts/repo_health_v1.0.mjs "/tmp/audit/$r" --json > "/tmp/audit/$r.json" || echo "FAIL: $r"
done
# ③ 汇总
node -e "const fs=require('fs');for(const f of fs.readdirSync('/tmp/audit').filter(x=>x.endsWith('.json'))){const j=JSON.parse(fs.readFileSync('/tmp/audit/'+f));console.log(f.replace('.json',''),j.ok?'PASS':'FAIL',JSON.stringify(j.counts),j.checks.filter(c=>c.level==='FAIL').map(c=>c.id).join(','))}"
```

## 5. 2026-11-02 實測（5 個 sample，全部 shallow clone 後跑）

| Repo | 結果 | PASS/WARN/FAIL | 主要發現 |
|---|---|---|---|
| `readme` | PASS（補完本輪文件後） | 8/2/0 | 自己都缺 LICENSE／SCOPE／GLOSSARY／CONTRIBUTING／CHANGELOG／tests（**起手包係寫俾新 repo，舊倉按 L2 排隊**）；CI workflow 已有 |
| `api` | **FAIL** | 7/2/1 | `docs/certs.md` 連去唔存在嘅 `demo/證書生成示範.pdf`；code block 內嘅 Overpass 座標曾被誤判，已加 fence skip |
| `forward` | PASS | 8/2/0 | 缺 10 樣起手檔，但無 secret、連結全通 |
| `answer` | PASS | 9/2/0 | `skill/hk-scout-kb/SKILL.md` frontmatter **合格**（1 份）；`SKILL.md` 唔喺 `skills/` 亦照驗到 |
| `birddex3` | PASS | 8/2/0 | 3.1MB / 86 檔、10 份 MD 連結全通 |

> 五個 sample 全部 **無 LICENSE** —— 同 [27 §1](27-repo-starter.md) 嘅 80/85 一致（[28](28-repo-taxonomy.md) 唔係呢個統計嘅出處）。呢個係 backlog，唔係即刻 FAIL。

## 6. 工具檢查唔到，要人手對（唔好當自動化已包晒）

```
[ ] P1：研發前查過相近產品 + 自己現有方案，日期／關鍵字／來源／未核實項寫低（人工）
[ ] ToS / robots.txt / 資料授權／署名（特別係官方 feed 同私有 API）
[ ] 三分類：工具 / App / 系統 → 系統要有設定層 + 隱藏超管 + registry + 審計鏈
[ ] 系統基本功能：帳號生命週期 8 樣（含忘記密碼）逐格實測 → [31](31-system-basics.md) §2
[ ] ADMIN 回報系統：入口／收件箱／限流／保留期／私隱／狀態機閉環實測 → [31](31-system-basics.md) §3（通用）
[ ] A12 私隱：同意文案、數據清單、保留期、log 唔記 PII
[ ] W1/W8：交付檔可見版權、第三方素材 CREDITS
[ ] V：檔名 ↔ 內文 ↔ 頁尾雙版號（本倉 guard 已有）
[ ] 功能性實測：真機開一次、斷網／手機／file:// 各一次（final_check 六角度）
[ ] 內容準確性：官方文件係咪現行版（answer 個 Skill 就係為呢個存在）
[ ] 全倉一致性：`node scripts/consistency_v1.0.mjs . --json` 無 FAIL（[32](32-consistency-audit.md)）
```

## 7. 點排優先

1. **P0 即刻**：`secrets`／`env` FAIL → rotate key、清 history、加 `.gitignore`（[25 §6](25-reverse-api-reuse.md) 有個真實 Bearer token 例子）。
2. **P1 今季**：`links` FAIL、`cron-data` WARN、>90MB 大倉（`MD`／`scout-circulars`）→ 跟 [20](20-repo-health-audit.md)／[21](21-fix-plans.md)。
3. **P2 排隊**：12 個空殼／預留 repo（[28](28-repo-taxonomy.md) §3）決定留／合併／archive；要留嘅補起手包。
4. **P3 例行**：其餘 WARN 逐季清；每季重跑 §4 並保存 JSON 做趨勢。

## 8. 限制

- 係**靜態檔案檢查**，唔執行 app、唔打 API、唔驗 ToS／內容準確；功能性驗收仍靠 `final_check` 六角度同人手 checklist。
- Secret scan 係 regex，可能漏（例如自訂格式 token）或誤中（長 base64 當 Bearer）；命中要人手覆核，唔好自動刪。
- 連結檢查跳過 code fence，但 Markdown 入面嘅 HTML `<a href>`、錨點、`?query` 後嘅路徑未完整處理；本倉 `guard.mjs` G10 會再驗一次（含錨點）。
- `size` 用 working tree，唔計 `.git` history；`git clone --depth 1` 亦會低估舊 history 嘅肥胖（[20](20-repo-health-audit.md) 個案要另用 `git count-objects -vH`）。
- 只驗 public clone 到嘅 repo；private repo、4 個空 `_portal` 要人手確認。
- `skills` check 用簡化 YAML 子集（唔係完整 strict parser）；要最嚴格可照 [taste-skill 嘅 `tests/frontmatter.mjs`](https://github.com/Leonxlnx/taste-skill/blob/main/tests/frontmatter.mjs) 用 `yaml@2.6.1` 再跑一次（[29 §5](29-reading-map.md)）。
