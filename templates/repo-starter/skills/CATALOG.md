# skills/CATALOG.md — 所有 SKILL.md 嘅唯一目錄

> 2026-11-02 起：**任何新加嘅 `SKILL.md` 一定要入呢張表**，唔係「記得就加」。一個事實只寫一次 —— skill 嘅名／路徑／bucket／邊個呼叫／幾時用，全部以呢份為準；[`docs/skills/README.md`](../docs/skills/README.md) 同兩份總索引只放指針。

## 1. 目錄（每份 SKILL.md 一行）

| Skill (`name`) | 檔 | Bucket | 邊個呼叫 | 來源／授權 | 幾時用 |
|---|---|---|---|---|---|
| `repo-setup` | `skills/promoted/repo-setup/SKILL.md` | promoted | **Model-invoked** | 本地（借 mattpocock 分類治理／code-review 兩軸） | 開新 repo、12 樣＋第 13／14 項、兩軸 review、PREFLIGHT |
| `design-review` | `skills/promoted/design-review/SKILL.md` | promoted | **Model-invoked** | 本地（借 taste-skill rubric／望圖） | 有 UI／要出畫面、390/768/1440 望圖、反 slop |
| `grilling` | `skills/external/grilling/SKILL.md` | external | Model-invoked（**只作引用**） | **外部原文 verbatim** · mattpocock/skills **MIT** · 2026-11-02 讀取 | 問需求方法嘅溯源；**實際執行跟 [`INTAKE.md`](../INTAKE.md)** |

> `external/` 嘅嘢**唔改、唔 promote、唔喺根 README 列出**；要改方法就改本地 [`INTAKE.md`](../INTAKE.md) 同 `repo-setup` 第 0 步。

## 2. 加新 SKILL 四步（AGENT 必跟，唔好靠估）

1. 用 [`docs/skills/0000-template.md`](../docs/skills/0000-template.md) 生 `skills/<bucket>/<name>/SKILL.md`：四段（What／When／Common questions／It's working if）+ frontmatter（`name` kebab-case、`description` rich trigger；user-invoked 版唔好列「Use when…」）。
2. 跑 `node scripts/check_skills_v1.0.mjs .` 驗 frontmatter（strict YAML；`word: word` 未 quote 會令成個 skill 靜靜被 drop）。
3. **加一行落上面張表**：要同時有 `name` 同**完整相對路徑**（`skills/.../SKILL.md`），兩樣都要齊 —— `check_skills` 同 `consistency` 會逐份對，漏一様即 FAIL。再喺 [`AGENTS.md`](../AGENTS.md) 開工順序**明確指名**呢個 skill；promoted 先加去 [docs/README](https://github.com/playerkousas-rgb/readme/blob/main/docs/README.md) 同根 README 索引。
4. 跑 `node scripts/preflight_v1.0.mjs . --json`（新 repo 8 個 check）／`node scripts/consistency_v1.0.mjs .`（真理倉）；**兩樣綠先好 commit**。

> **點解要自動驗**：2026-11-02 之前 `INTAKE.md` 只係文字引用外連 `grilling/SKILL.md`，repo 入面無實體檔，AGENT 搵唔到會當你呃佢。而家 `check_skills` 見到 `skills/CATALOG.md` 就逐份對；**冇 catalog 嘅舊 repo 唔會被逼改**（向後兼容，例如單數 `skill/` 嘅 repo 照 PASS）。

## 3. 點驗

| 檢查 | 命令 | 管乜 |
|---|---|---|
| frontmatter **＋ 目錄** | `node scripts/check_skills_v1.0.mjs .` | 每份 SKILL.md 合格，**同埋**喺 CATALOG.md 有 `name` + 路徑；缺一即 FAIL |
| 全倉標準／Spec | `node scripts/consistency_v1.0.mjs .` | `skills-catalog`／`skills-wired`／`intake-wired` 三條硬檢查 |
| 開局一次過 | `node scripts/preflight_v1.0.mjs . --json` | 8 個 check，包 `check_skills` |

## 未核實

- 無 Skill tool／plugin harness：CATALOG.md 係**目錄 + 文件約定**，唔係 manifest，唔會令 skill 自動載入，亦未喺 Claude Code／Codex 實測。
- `external/grilling` 原文叫 dispatch sub-agent 搵 fact，呢個環境做唔到；本地化版喺 [`INTAKE.md`](../INTAKE.md)。
