# 05 — Git（G1–G10）

> Git 喺呢度嘅角色：**唯一真理 + 歷史 + 審查 + 自動閘**。唔係得個「擺 code 嘅地方」。

---

## G1 — 一個 repo 一份真理

| 檔 | 角色 |
|----|------|
| `README.md` | 入口／導覽（呢個真理倉就係咁用） |
| `PLAYBOOK.md` | 規則唯一編號表 |
| `docs/` | 詳情、checklist、runbook |
| `BUILD.md` | 專案級建構定案（每個 app 自己一份） |
| `templates/` | 可複製範本（唔會部署） |
| `scripts/guard.mjs` | 自動檢查（CI 同本機同一條） |

**規則改動要四處同步**（[F16](02-foolproof.md#f16--三處同步-checklist最常出事)）：PLAYBOOK → docs → guard → templates。

---

## G2 — Branch model（簡單就夠）

```
main（受保護）
  └── feat/<scope>-<short>   由 main 開
  └── fix/<scope>-<short>
  └── chore/<short>
```

- 只有 `main` 會 deploy 去 Production。
- feature branch → **PR** → CI 綠 + 1 個 review → squash merge。
- 唔准直接 push `main`；唔准 force push `main`。
- 長期實驗用 tag / 另一個 repo，唔好留僵屍 branch。

```bash
git switch main && git pull --ff-only
git switch -c feat/notice-subscription
# ... 改嘢 ...
node scripts/guard.mjs && npm run check && npm run build
git add -A && git commit -m "feat(notice): 加個人化訂閱設定頁"
git push -u origin feat/notice-subscription
gh pr create --fill
```

---

## G3 — Commit message（Conventional Commits）

```
<type>(<scope>): <一句做咗乜>

type: feat | fix | refactor | docs | chore | test | security | perf
scope: api | gas | supabase | canvas | config | ui | ci | guard

例：
security(api): /api/super 加一次性 nonce 防重放
docs(playbook): 新增 A14 隱藏超管規則
perf(gas): load 改批量 getValues，減少 90% API 呼叫
```

每行 commit 應該可以**獨立回滾**。一個 commit 做一件事。

---

## G4 — PR 要有嘢睇

PR 描述模板（可放 `.github/PULL_REQUEST_TEMPLATE.md`）：

```markdown
## 做咗乜
## 對應規則 ID（S/F/A/G/V/X/U/C）
- [ ] 身份錨點有冇改？
- [ ] registry 有冇加／改？
- [ ] 有冇新 env？.env.example 加咗未？
- [ ] 有冇新 action？白名單 + 測試加咗未？
- [ ] 有冇新 secret？rotation 步驟寫咗未？
- [ ] 危險動作有冇 dry-run + 回滾？
## 體積影響（dist / bundle / 新圖）
## 回滾方法
git revert <sha> ／ Vercel 上一個 deployment ／ GAS 部署還原版本
## 測試
guard / check / build / 真機步驟
```

---

## G5 — 唔好 commit 嘅嘢

```
.env / .env.*（除 .env.example）
node_modules/ dist/ build/ .vercel/ .cache/ coverage/
*.log *.bak *.tmp *.old *.zip *.psd *.mp4
私鑰 / credential JSON / service account / backup dump
```

`.gitignore` 範本：[templates/git/gitignore](../templates/git/gitignore)。
Push protection + secret scanning 一定要開（GitHub repo Settings → Security）。

---

## G6 — 大檔 / binary

- 每個檔 `< 1MB` 為原則；guard 會掃。**單一 HTML 例外：5MB（C13-g）**。
- 需要 binary（圖／PDF）→ Git LFS + 放 `assets/`，唔好放 `public/` 直接部署。
- 誤 commit 大檔：

```bash
git filter-repo --strip-blobs-bigger-than 1M
git push --force-with-lease
# 通知所有協作者重新 clone
```

- 定期 `git count-objects -vH` 睇 repo 有冇發胖。

---

## G7 — Lockfile + 供應鏈

```
[ ] package-lock.json / pnpm-lock.yaml 入 Git
[ ] npm ci（CI）唔用 npm install（保證可重現）
[ ] npm audit --audit-level=high 入 CI
[ ] GitHub Actions 用 SHA pin：uses: actions/checkout@<40-char-sha>
[ ] Dependabot 開（[templates/github/dependabot.yml](../templates/github/dependabot.yml)）
[ ] CODEOWNERS：config/ 、api/ 、migrations/ 要有指定審查人
```

---

## G8 — CI 一定要有嘅 job

```yaml
jobs:
  guard:      # 文件完整性 + secret scan + 大檔 + 連結
  lint:       # check
  test:       # 守護測試（F14）
  build:      # + S7 size gate
  audit:      # npm audit
```

範本：[.github/workflows/guard.yml](../.github/workflows/guard.yml)（呢個 repo 自己都跑，dogfooding）。
**CI 紅 = 唔准 merge**，唔好「之後先補」。

---

## G9 — Tag / 版本

- **檔名＋內文雙版號**（[V 系列](13-versioning.md)）：`app_v1.0.html` ↔ 內文全部 v1.0；code 用 `APP_VERSION` 常數，唔寫散裝 `// vX.X` 註解（[F15](02-foolproof.md)）。
- Release 用 annotated tag：`git tag -a v2026.10.26 -m "..."`。
- 歷史版本／審查報告存 Git 歷史，工作目錄只留最終定案（呢個 repo 嘅既有做法）。
- 每次 release 記錄：改咗邊啲規則 ID、有冇 migration、有冇 key rotation。

---

## G10 — 文檔跟版本走

- 教材／runbook 放 `docs/`，跟 repo 版本；唔好放喺個人 Drive。
- 改 code 唔改 docs = 未完成（Definition of Done）。
- 專案文件同通用規則衝突 → 喺 PR 寫明，並更新其中一份；唔好兩份並存互相矛盾（實戰教訓：[進度追蹤 §11](../進度追蹤旅系統升級版.md)）。

---

## Git 驗收

```
[ ] main 受保護（PR + review + CI）
[ ] .gitignore / push protection / secret scanning 開
[ ] lockfile 入 Git + Actions pin SHA + Dependabot
[ ] guard 喺 CI 跑，而且本機同一條命令
[ ] PR template 有身份／registry／env／action／回滾問題
[ ] 無 >1MB 檔（單一 HTML 例外 5MB）、無 secret、無 binary
[ ] 每次改規則四處同步（F16）
```
