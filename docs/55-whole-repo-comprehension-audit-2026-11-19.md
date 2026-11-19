# 55 — 全倉「Agent 理解度」審查（2026-11-19）：邊度會令另一個 AGENT 睇唔明／做錯

> **用戶指令**：「用金魚模式睇下成個真理倉有無令其他 AGENT 睇唔明既地方」。
> **方法**：[docs/52](52-fresh-eyes-review.md) 嘅改寫先行 ＋ 三條審查向量（未定義名詞／假設咗嘅前提／前後打架），**加一輪機械掃描**（見附錄 A，可重跑）。
> **範圍**：全倉 102 份 MD（`README`／`AGENTS`／`PLAYBOOK`／`BUILD`／`EXTERNAL`／`docs/00–53`／`templates/`）。
> **身分**：新對話嘅金魚（同一個對話嘅第 2 份文件，判準見 [docs/52 §0.2](52-fresh-eyes-review.md)）。**第一份**：[docs/54](54-goldfish-a-group-2026-11-19.md)（審 `A-GROUP-INSTRUCTION.md`，23 條）。

## 0. 身分：係金魚，唯一保留講清楚

> **2026-11-19 用戶裁決**：「Arena 每次開嘅連底層都唔同，還不是新 AGENT？」—— 係。我原本把呢份寫成「模擬」係**過度保守**，已經改正（見 [docs/52 §0.2](52-fresh-eyes-review.md) 新加嘅判定）。

| 項 | 實情 |
|---|---|
| 係唔係作者 | **唔係**。我未見過呢個倉點寫、為咩咁寫、你改過幾多次。docs/52 §0 真正禁嘅係「審你份文件嘅人，唔可以係寫嗰個人，亦唔可以睇過你點解咁寫」——兩樣我都唔中。 |
| 係唔係新 AGENT | **係**。新對話＝新 context＋可能唔同底層模型（[52 §0.1](52-fresh-eyes-review.md)）；我唔知你上一輪同邊個 AGENT 講過乜。 |
| 唯一保留（唔影響 findings，影響「重審獨立性」） | 呢個對話**第 3 輪**；第 1 輪我審過 `A-GROUP-INSTRUCTION.md`，第 2 輪開過 `docs/52`／`docs/53`／`docs/10`／`README` 頭部／`AGENTS` 頭部。即係「入口鏈」有一小截我**之前**已經讀過，唔算全新。 |
| 所以我點處理 | ① 我由入口**重行一次**（README → AGENTS → START → INTAKE → PREFLIGHT → docs/00 → docs/17 → PLAYBOOK §0/§9/§10 → docs/10），遇「要假設讀者已知」就停手；② 全倉機械掃描（附錄 A，唔靠記憶）；③ 凡我之前讀過嘅檔，findings 要**另有可 grep 證據**才留。 |
| 邊啲係全新 | `docs/17`、`START`、`INTAKE`、`PREFLIGHT`、起手包 `AGENTS`／`README`／`docs/quickcard.md`、`docs/19` §2、`docs/47`、`docs/00` —— 呢批我第一次開，零上文。A1／A2／A5／D1／D2 全部出自呢批。 |
| 照 docs/52 §2 紀律 | 我**冇改任何一份被審文件**，亦**冇講「應該點改」**。我只講「我讀到咩」同「我缺咩」。 |

## 1. 改寫先行：我以為呢個倉點運作 vs 實際行一次

**① 呢個倉主張做乜（我嘅理解）**

> 所有 SCOUT app 嘅規則總部。一份 `PLAYBOOK` 用 88–94 個編號規則（S／F／A／W／V／L／I／UP／SG／C／P）講「必守乜」，每條指去 `docs/NN` 詳情；`docs/10` 係人手 checklist；`guard`／`consistency`／`final_check`／`preflight` 四支 script 機械驗結構；`templates/repo-starter/` 係一抄即用嘅起手包；任何子 App 唔准自己決定細節，一律跟真理倉。開新 repo 嘅 AGENT 由 `README` 6 步（0–5）入，經 `INTAKE` 問清需求 → `START` 抄檔 → `repo-setup` skill → `PREFLIGHT` gate。

**② 按佢所講，一個新 AGENT 開工會點行（我照行一次）**

> 我打開 `README`，見到「第 0 步先問用戶」，跟 `INTAKE` 問 8 條（Q8 係白名單／關站）。之後跟 `START` ⓪–⑤ 抄檔、跑 PREFLIGHT 8 個 check、讀 `repo-setup` 做 12 樣。跟住我為咗知「寫完功能點驗」，去咗 `docs/17 §2 STEP BY STEP`（README 同 docs/00 都叫呢個做「最短入門」），跟 STEP 0–10 做完，`final_check` 六角度全綠。**到呢一步我以為做完**——因為 `AGENTS` boot ③ 就係咁講。

**③ 我嘅改寫同實際要求邊度唔同（就係下面嘅 findings）**

> 我「以為做完」嗰一步，同 `PLAYBOOK §10` 嘅 17 項 Definition of Done 差咗**最少 6 組規則**：SG1–SG19 白名單、L1–L6 雙語、I1–I8／UP PWA、金魚審、`npm run` 類建置檢查、SG18／SG19 細節。而 `docs/17` 由頭到尾**冇一個字**提過呢 6 組（我 grep 過：`SG` 0 次、`雙語` 0 次、`PWA` 0 次、`金魚` 0 次）。→ 呢個係全份報告最貴嘅一條（A1）。

## 2. Findings：17 條（CRITICAL 2／HIGH 4／MEDIUM 8／LOW 3）＋ 1 條撤回（見附錄 A2）

> 位置全部可 grep。**「機械」欄**＝現有檢查捉唔捉到（呼應 [docs/53 §4](53-self-audit-2026-11-19.md) 嘅「已知上限」）。

### A 類 — 入口鏈：邊份文件叫我做幾多，四份講四個數

| # | 級 | 位置 | 我讀到咩／缺咩 | 影響面 | 機械 |
|:--:|:--:|---|---|---|---|
| **A1** | **CRITICAL** | [`docs/17`](../docs/17-final-check-and-tutorial.md) §2 STEP 0–10 vs [`PLAYBOOK`](../PLAYBOOK.md) §10 | `docs/17` 自稱「由零到一個 app」、被 README／docs/00／AGENTS 指為最短入門；但佢**完全冇**白名單／SG、雙語 L、PWA I／UP、金魚審四族規則。跟佢做完 → 交付時 §10 最少 6 個 bullet 一定紅，而我唔知嗰 6 個 bullet 存在。 | 每個新 repo／新 app；34–35 隻 A 組＋所有新開 app | ❌ 冇檢查會比對「教學覆蓋幾多 DoD」 |
| **A2** | **HIGH** | `templates/repo-starter/README.md`「驗收（交付前）」＋`templates/repo-starter/AGENTS.md`＋`docs/quickcard.md` | 起手包三份入口文件嘅驗收合共只有：五大鐵律、P1、無 key／大檔、`repo_health` 0 FAIL、`guard`、`final_check`。同 §10 嘅 17 項比，**四族條件式規則（L／I／SG／金魚）一份都冇提**（我 grep：`SG` 0、`雙語` 0、`PWA` 0、`金魚` 0）。 | 每個新 repo 嘅 agent（佢第一行讀嘅就係起手包 `AGENTS.md`） | ❌ 同上 |
| **A3** | **HIGH** | [`BUILD.md`](../BUILD.md) L3 vs `README` L11–13／`AGENTS` ②／`docs/README` L4 | `BUILD.md` 開頭寫「**本檔係唯一真理。所有 Agent 以此為準施工。**」；另外三份寫「衝突時以 `PLAYBOOK` 為準」。`BUILD` 自己**冇**標明佢係 ecportal 案例（只有 `AGENTS` ④ 咁講）。我第一個開嘅係 `BUILD` 嘅話，就會當佢通用。 | 任何唔係 ecportal 嘅 app；`docs/19` 由頭到尾叫我去 `BUILD §1–§9` | ❌ 兩句都唔係連結／錨點，G10 唔會踫 |
| **A4** | **MEDIUM** | [`AGENTS`](../AGENTS.md) ②b vs §1–§2 vs [`docs/19`](../docs/19-ecportal-troop-case.md) §2 | boot 講「§1–2 已集中去 19」，但 §1–2 **仍然原封不動喺 `AGENTS` 裏面**，`docs/19 §2` 又有一份（標題寫「（`AGENTS.md` §1–2）」）。兩份日後會漂；而家我唔知邊份為準。 | 所有做 ecportal／進度追蹤嘅對話 | ❌ F1（一個事實一次）冇機械檢查 |
| **A5** | **MEDIUM** | `README` 🆕 6 步（0–5）／`START` ⓪–⑤／起手包 `AGENTS` pre-step＋`0.`／`INTAKE` 第 0 步 | 四份都自稱「第一步／第 0 步」，四個唔同次序：README 0=問用戶；START ⓪=問、⓪b=驗起手包、①=填 placeholder；起手包 AGENTS 特別聲明「pre-step 同 0. 唔同層」；INTAKE 只講問。我第一個撞到嘅係「究竟 `git init` 之前跑唔跑 PREFLIGHT」——START 話要（⓪b，喺真理倉跑），起手包 AGENTS 話 PREFLIGHT 係開工第一步（喺新 repo 跑）。 | 每個開新 repo 嘅 agent | ❌ 四份文件互相對唔到 |
| **A6** | **MEDIUM** | [`AGENTS`](../AGENTS.md) boot ③ | 「交付前跑 `final_check_v1.0.mjs --json`；六角度全綠先至交付」——呢句令「綠 = 交付得」。但同倉 [`docs/47`](../docs/47-readme-discipline.md) 原則一正正係「**檢查全綠唔等於 App 用得**」，而 §10 DoD 有 17 項。 | 所有 agent（呢句係 boot 第三行） | ❌ |

### B 類 — 同一組規則，三個範圍

| # | 級 | 位置 | 我讀到咩／缺咩 | 影響面 | 機械 |
|:--:|:--:|---|---|---|---|
| **B1** | **CRITICAL** | `PLAYBOOK` §7.7：標題 L232「SG1–SG19」、同節 **L236**「必須跟 **SG1–SG6**」；`docs/50` 標題 L1「SG1–SG6」、L4「SG1–SG17」；`README` L223 檔案樹「SG1–SG6」 | 同一節規則，**四個範圍**。我照 L236（最似「層級要求」嗰句）做 → 只做 SG1–SG6，漏 SG7–SG19（含 SG10-a「圖書館唔可以 `closed`」、SG12「唔需要簽票」、SG17／SG18／SG19）。`docs/50` 我打開第一行見到「SG1–SG6」，最自然嘅反應係「6 條」。 | 34–35 隻 A 組＋所有要落閘嘅 app；`docs/51` 全清單 | ❌ `guard` 只驗「SG1–SG6 六處同步」有冇出現，**唔驗範圍對唔對** |
| **B2** | **HIGH** | `PLAYBOOK` §10 第 1 個 SG bullet | 一個 `- [ ]` 入面塞咗 SG1–SG19 嘅 6 個子句（圖書館維持 open／四齒輪／`supportNudge` 文案／書架政策／`BOOK` 豁免／`redirects permanent:false`／加入主畫面次序／分享 QR／Delist→Gate→Soft→Hard／備份通知）。我唔可能逐條剔，只能整條打勾。 | 所有交付 | ❌ |

### C 類 — 指針：叫我去睇一節唔存在嘅章節

| # | 級 | 位置 | 我讀到咩／缺咩 | 影響面 | 機械 |
|:--:|:--:|---|---|---|---|
| ~~C1~~ | ~~HIGH~~ | ~~全倉 23 處~~ | **撤回（2026-11-19 同日，見附錄 A2）**：我第一次個 scanner 有兩個 bug（`lstrip('0')` 令 `§0.1` 變假陽性；regex 允許跨 70 字 → 撈隔籬個連結嘅 `§`）。修正後**實測 0 處**死 § 指針（`docs/23 §5.3`／`docs/10 §1.4`／`docs/50 §4.1` 我逐個開檔核對過，全部存在）。**呢條唔係漏洞。** | — | — |
| **C2** | **LOW** | `README` L34、`docs/00` L7 | 叫「`docs/17` **§3** STEP BY STEP」，實際 STEP BY STEP 係 **§2**（§3 係「捷徑：單一 HTML」）。`README` L161 就寫 §2。同一件事兩個節號。 | 5 分鐘路線嘅讀者（最常撞） | ❌ |
| **C3** | **MEDIUM** | `docs/README` L3／L8「00–49」；`README` L7「更新日期：2026-11-12」；`docs/README` L4「整理日期：2026-11-13」 | 倉已經有 `docs/50`–`docs/54`（2026-11-15～19），索引首兩行仍然講「00–49」；根 README 更新日期停在 11-12。我作為「第二個 AGENT」會以為 11-12 之後嘅規則（SG16–SG19、金魚審、白名單）係未生效嘅草稿。 | 所有讀首頁嘅 agent | ❌ 冇日期／範圍檢查 |

### D 類 — 指令執行唔到

| # | 級 | 位置 | 我讀到咩／缺咩 | 影響面 | 機械 |
|:--:|:--:|---|---|---|---|
| **D1** | **HIGH** | `PLAYBOOK` §10「`npm run check && npm run build` 綠」；`docs/10` §2 同一句；`docs/00`「guard 綠 + build 綠」 | 真理倉**冇 `package.json`**（只有 `templates/vercel/package.json`），起手包亦冇。純文件／單一 HTML／Canvas app 根本冇 `npm run check`。我跟住做只會**卡死或者假裝綠**。而文件冇寫「冇 package.json 就跳過」。 | 所有純靜態／單一 HTML／Canvas app（A 組大部分） | ❌ |
| **D2** | **MEDIUM** | `START` L71 標題「第 13 項（13a–13c 按形式加、13d PREFLIGHT 必跑）」 | 表入面有 **13e（金魚審，所有新 repo 留低）**，標題範圍漏咗佢。我照標題揀 → 永遠唔會見到 13e。 | 每個新 repo | ❌ |
| **D3** | **MEDIUM** | `docs/17` STEP 8 vs 文件頭／§4 | 文件頭同 §4 都講「**7 條**人手實測」，STEP 8 只列 6 條（第 7 條＝架構師真機跑，只喺 §4）。我跟 STEP BY STEP 做 → 少做一條，而 §10 要求「7 條人手實測做咗」。 | 所有交付 | ❌ 冇「清單條數 = 聲稱條數」檢查 |

### E 類 — 名詞同數字

| # | 級 | 位置 | 我讀到咩／缺咩 | 影響面 | 機械 |
|:--:|:--:|---|---|---|---|
| **E1** | **MEDIUM** | 全倉冇「自己嘅」術語表；`templates/repo-starter/GLOSSARY.md` 只有兩個未填佔位（`TERM_1`／`TERM_2`，30 行） | 入口文件要求我「唔好用 20 個字講 1 個概念」，但真理倉本身**冇一份**定義自己嘅專有名詞：`portalIds`／`silentPortalIds`／`PORTAL_REGISTRY`／`supportNudge`／`entry-gate`／`EXCEPTION:`／13d／L2／SG19／`appSlug()`。唯一靠山係 `docs/50` 同 `store_gate_v1.0.js` 檔頭——即係要我先識去邊度搵。 | 全部 agent | ❌ |
| **E2** | **MEDIUM** | `INTAKE` L12「85 個 repo baseline」（叫我 fact 自己查）；`README` L73「85 個 repo 盤點」、L95「89 個 repo」；`docs/README` L89「89 個 repo 實測」、L82「85 個」；`docs/51` L4「全部 **95** 個 repo」；`docs/28` L4「shallow clone **83** 個」 | 四個數：83／85／89／95。我「fact 自己查」查完見到四個，仍然唔知邊個係 baseline；`INTAKE` 要我用「85」做前提問用戶。 | `INTAKE` 第 0 步（每個新 repo）＋所有引用 repo 數嘅段落 | ❌ `CLAIMS` 只封 6 個統計，唔包 repo 數 |
| **E3** | **LOW** | `docs/52` L54 舉例 `store-hidden.json` | 全倉**零次**出現（我 grep 過）。我以為係一份真實檔案，搵唔到。 | 讀 docs/52 嘅人 | ❌ |
| **E4** | **LOW** | `PLAYBOOK` F5／A8 嘅「白名單」 vs §7.7「準入白名單入口」 | 同一個詞兩個意思：F5＝action／origin allowlist；SG＝入口網站白名單。`docs/10` 兩者都出現（「新 action 入咗白名單」 vs 「白名單入口」）。 | 所有 agent | ❌ |

## 3. 點解 `guard`／`consistency`／`final_check` 全綠都捉唔到

| 現有檢查 | 捉到 | 捉唔到（本報告 17 條入面） |
|---|---|---|
| `guard` G10 | 死連結（1535 條）、錨點（177 條） | A3／A4（兩句各自通順，但意思相反） |
| `guard` F16 系列 | 規則「四處／六處有冇出現」 | B1（出現咗，但範圍寫錯）、D2（標題漏 13e） |
| `consistency` `CLAIMS` | 6 個統計數（輕／中／重／有後台／空殼／AI） | E2（repo 數 83/85/89/95） |
| `consistency` 索引覆蓋 | `docs/NN` 有冇索引行 | C3（索引內容過時） |
| `final_check` 六角度 | 結構、版權、版號、體積 | A1／A2／A6（「夠唔夠」係覆蓋率問題，唔係格式問題） |
| `PREFLIGHT` 8 check | 起手包完整性 | A1（起手包完整 ≠ 起手包教齊） |

> 一句：**現有檢查全部係「有冇寫」，本報告 17 條大部分係「寫咗但範圍／次序／版本錯」。** 同 [docs/53 §4](53-self-audit-2026-11-19.md) 講嘅已知上限一致，但今次量化咗：18 條之中 **17 條**屬呢類。

## 4. 我查完先發現「唔係問題」（免得你白修）

| 我一度以為 | 查完 |
|---|---|
| 起手包缺 `scripts/`，叫人「抄 5 支 script」但冇得抄 | **唔係**：`START` ② 明寫由真理倉 `cp`，五支＝`guard`／`final_check`／`check_skills`／`repo_health`／`preflight`，數目對得上。 |
| 「12 樣核心」同「第 13／14 項」數目亂 | **唔係**：12＋13a–13e＋14 係刻意分層（13a–13c 按形式、13d 必跑、13e 留低），只有 D2 個**標題**漏寫 13e。 |
| `INTAKE` Q1 講「`docs/28 §3` 8 種形式」同 docs/28 實際唔夾 | **未證實**：我冇逐節對 docs/28，唔敢報（列入 §5 未審）。 |
| `docs/52` 教「最多重審 1 次」但冇講之後點 | **已修**（docs/53 #6 加咗「改結構」）。 |

## 5. 我冇審到嘅（照實列，唔好當呢份係全覆蓋）

| 範圍 | 為何 |
|---|---|
| `docs/23`、`docs/34`–`docs/43`、`docs/48`、`docs/49`（工具評審／爆紅清單） | 屬「揀唔揀用某工具」參考章，唔屬 agent 開工必經路徑；只抽讀過幾段。 |
| `docs/50` 全文（99 KB，最大一份） | 只讀頭部＋§0.1＋§3.8 附近。**SG7–SG19 逐條有冇前後打架，我未逐條對**——建議列入下一輪金魚（委託書次序 #4）。 |
| `docs/32`（33 KB 一致性審計） | 屬方法論記錄，未逐段讀。 |
| `BUILD.md`／`EXTERNAL.md`／`進度追蹤旅系統升級版.md` | 只讀開頭判斷「係案例定通用」（得出 A3）；內容未審。 |
| 子 App repo 實況 | 一個都冇開。所有「34–35 隻」係照 `docs/51`／`FRESH-EYES-REQUEST` 引述。 |
| 設計／文案質素 | 唔關「睇唔明」事，冇評。 |

## 附錄 A — 機械掃描（修正版；第一版有 bug，見附錄 A2）

三支一次性 script，冇寫入 repo（[docs/52 §2](52-fresh-eyes-review.md)：reviewer 唔准改檔）。你可以照抄落 `scripts/` 自己驗。

**⚠️ 第一版嘅兩個 bug（就係要撤回 C1 嘅原因）**：① 我用 `s.lstrip('0')` 比對 `0.1` → 變成 `.1`，所有 `§0.x` 章節全部假陽性；② regex 容許檔名同 `§` 之間隔 40–70 字，會**跨過隔籬個連結**撈到人哋嘅 `§`（例如同一行先出現 `docs/00-quickcard.md`，之後隔幾十個字才出現 `docs/17 §2`，就會被報成「docs/00 §2」）。修正：只認緊貼形式、用數字 segment 比對。

```bash
python3 - <<'PY'
import re, pathlib

head = re.compile(r'^#{1,4}\s*§?\s*(\d+(?:\.\d+)*)\s*(?:[\.、]|\s|—|–|-|（|\()')
heads = {}
for p in pathlib.Path('.').rglob('*.md'):
    if '.git' in p.parts: continue
    heads[str(p)] = {m.group(1) for m in (head.match(l) for l in
        p.read_text(encoding='utf-8', errors='ignore').split('\n')) if m}

docmap = {p.name[:2]: str(p) for p in pathlib.Path('docs').glob('*.md')}
pat_link = re.compile(r'\[(\d{2})(?:\s+[^\]]*?)?\s*§\s*(\d+(?:\.\d+)*)\]')
pat_file = re.compile(r'(?:docs/)?(\d{2})-[a-z0-9\-]+\.md\s*(?:\)|嘅|的|\s)*\s*§\s*(\d+(?:\.\d+)*)')

def found(target, sec):
    want = tuple(int(i) for i in sec.split('.'))
    for h in heads[target]:
        hn = tuple(int(i) for i in h.split('.'))
        if want == hn or (len(hn) > len(want) and hn[:len(want)] == want): return True
    return False

bad = 0
for p in sorted(pathlib.Path('.').rglob('*.md')):
    if '.git' in p.parts: continue
    for i, line in enumerate(p.read_text(encoding='utf-8', errors='ignore').split('\n'), 1):
        for rx in (pat_link, pat_file):
            for n, sec in rx.findall(line):
                tg = docmap.get(n)
                if tg and not found(tg, sec):
                    bad += 1; print(f'{p}:{i}  docs/{n} §{sec}')
print('TOTAL', bad)
PY
```

> **2026-11-19 實測：0 處。** 「叫你去睇一節唔存在嘅章節」呢類問題而家**冇**；C1 已撤回，唔需要修。

**② 規則範圍**（統一前有 4 處寫成 6／17）

```bash
grep -rnoE 'SG1[–-]SG[0-9]+' --include='*.md' . | sed 's/:[0-9]*:/ /' | sort | uniq -c | sort -rn
```

**③ 入口文件覆蓋**（起手包 3 份對四族條件式規則：全部 0 次）

```bash
for f in templates/repo-starter/AGENTS.md templates/repo-starter/README.md \
         templates/repo-starter/docs/quickcard.md; do
  printf '%-44s SG:%s 雙語:%s PWA:%s 金魚:%s\n' "$f" \
    "$(grep -c 'SG[0-9]' $f)" "$(grep -c '雙語' $f)" \
    "$(grep -c 'PWA' $f)" "$(grep -c '金魚' $f)"
done
```

## 附錄 A2 — 更正紀錄（2026-11-19 同日，寫完之後自己覆核）

| 項 | 原本 | 更正 | 影響 |
|---|---|---|---|
| **C1（原本標 HIGH）** | 「全倉 **23 處**」 `docs/NN §X` 指去唔存在嘅章節，並舉例「`docs/00 §2` 出現 4 次」 | **撤回**：修正 scanner 後實測 **0 處**。我逐個開檔核對 `docs/23 §5.3`、`docs/10 §1.4`、`docs/50 §4.1`——全部存在 | findings 18 → **17**；HIGH 由 5 → 4 |
| 標題級數 | 「HIGH 7／MEDIUM 6」 | 實際逐條數係 **HIGH 4／MEDIUM 8**（我第一版加錯） | 唔影響任何 finding 內容 |
| 根本原因 | — | 兩個 scanner bug ＋ **我冇抽樣核對就把數字寫落報告** | 教訓：機械掃描嘅數字，最少抽 3 個樣本開檔核對先可以入報告 |

## 附錄 B — 收貨（作者自己做）

- [ ] 先讀 §1 第 ①、② 段：**「跟 `docs/17` 做完就以為做完」係唔係你真實預期？** 唔係 → 問題喺文件。
- [ ] 17 條逐條分類：真缺上文／我誤解（可能文件寫得衰）／噪音。凡屬「改語言／改風格／換架構」一律丟。
- [ ] **修完最多重審 1 次**；重審完仍有 CRITICAL → 改結構（[docs/52 §2](52-fresh-eyes-review.md)）。
- [ ] 建議修序（只按「幾多個 AGENT 會因此做錯」排，唔係改法）：**B1 → A1 → A2 → D1 → 其餘**。
- [ ] 記錄：`> 金魚審（新對話，同對話第 2 份文件，見 docs/52 §0.2）2026-11-19：CRITICAL 2／HIGH 4／MEDIUM 8／LOW 3（另撤回 1 條，見附錄 A2）；已修 a，接受風險 b（原因：…）。`
- [ ] 下一輪真金魚建議：`docs/50` 全文（99 KB、SG1–SG19 最易前後打架）→ 委託書次序 #4。

## 附錄 C — 已修（2026-11-19，審完即日做；我由 reviewer 變作者，所以**之後唔再算金魚**）

> 紀律：[docs/47](47-readme-discipline.md) 原則二「已修要寫得出邊個 commit、邊個實測」。以下每一行都可以自己重跑驗證。

| # | 改咗邊度 | 改成咩（一句） | 驗證 |
|:--:|---|---|---|
| **B1** | `PLAYBOOK §7.7` L236、`docs/50` 標題＋L4、`README` 檔案樹、`guard.mjs` 檢查名 | 四處範圍統一 **SG1–SG19**；§7.7 嗰句加「唔係只有前 6 條」 | `python3` 掃 `SG1[–-]SG\d+` → 只剩 24 次 `SG1–SG19`（其餘 `SG1–SG6` 係 §10 分組標籤同本報告引述舊錯） |
| **A1** | `docs/17` §2 開頭 ＋ 新 `STEP 11` | 加警語：本教學只包通用骨架；四族（L／I／SG／金魚）唔會出現喺 STEP 0–10，但 §10 會查；STEP 11 叫逐條對 §10，未做 = 未交付 | `grep -c "SG1–SG19\|L1–L6\|I1–I8\|金魚審" docs/17` → 4 |
| **A2** | 起手包 `README`／`AGENTS`／`docs/quickcard.md` | 驗收加四族條件式規則（中唔中都要寫 N/A）；`AGENTS` 新增「條件式規則」表；quickcard 加一行 | `grep -c SG\|雙語\|PWA\|金魚` 三份 → 各 1（quickcard 用「SG（白名單）」字樣） |
| **A3** | `BUILD.md` 第 3 行 | 由「本檔係唯一真理」→「ecportal 專案案例；通用規則同衝突以 PLAYBOOK 為準」 | 開檔首 6 行 |
| **A4** | `AGENTS.md` ②b | 加「唯一真理係 `docs/19 §2`，本檔只留摘要，唔一致以 19 為準」 | 開檔第 7 行 |
| **A5** | `README.md` 🆕 段落尾 | 加一段講清三個「0」唔同層（README 6 步 0／START ⓪＋⓪b／新 repo AGENTS `0.`） | 開檔 🆕 段尾 |
| **A6** | `AGENTS.md` ③ | 「六角度全綠**只係入場券**」，要再對 §10 17 項 | 開檔第 5 行 |
| **B2** | `PLAYBOOK §10` | 一條 SG bullet 拆成 **SG1–SG6／SG7–SG14／SG15–SG19** 三條，可以逐條剔 | §10 尾三條 bullet |
| ~~C1~~ | — | **撤回**（scanner bug，實測 0 處） | 附錄 A 修正版 script → `TOTAL 0` |
| **C2** | `README` L34、`docs/00` L7 | `docs/17 §3` → `§2`（§3 係「捷徑：單一 HTML」） | `grep -n "17 §" README.md docs/00-quickcard.md` |
| **C3** | `docs/README` L3／L8／L4、`README` L7 | `00–49` → `00–55`；更新日期 11-12 → 11-19；整理日期 11-13 → 11-19 | 兩份首 10 行 |
| **D1** | `PLAYBOOK §10`、`docs/10 §2`、`docs/00` | `npm run check && npm run build` 加「有 `package.json` 先做；冇就 N/A（C13-g）」 | `grep -n "package.json" PLAYBOOK.md docs/10-checklists.md docs/00-quickcard.md` |
| **D2** | `START` 第 13 項標題 | 標題補 **13e 金魚審** | `grep -n "^## 第 13 項" templates/repo-starter/START.md` |
| **D3** | `docs/17` STEP 8 | 補第 **7** 條（系統類／新部署真機再跑），同 §4「7 條」對齊 | STEP 8 尾 |
| **E1** | **新增 [`docs/56-glossary.md`](56-glossary.md)** | 一頁術語表（5 類、30 條）＋「一詞兩義」對照（白名單／P1／L／A 組） | 開檔；`docs/README` 同根 `README` 已加入口 |
| **E2** | `INTAKE` L12 | 「85 個 repo baseline」→ 列明 85／89／95 三個快照同「即時以 `gh api` 為準」 | 開檔第 12 行 |
| **E3** | `docs/52` §1.2 例子 | `store-hidden.json`（全倉 0 次）→ `Delist → Gate → Soft → Hard` 四個下架齒輪（真實存在） | `grep -c store-hidden` 全倉 → 0 |
| **E4** | `PLAYBOOK` F5 欄 | 加註「呢度嘅白名單＝action／欄位 allowlist，唔係 §7.7 入口白名單」 | `grep -n "F5" PLAYBOOK.md` |

**驗證（同一日跑）**：`guard` 25 項全綠、`consistency` 無 FAIL（159 檔／104 MD）、`final_check` PASS、`node --test scripts/*.test.mjs` **125 pass / 0 fail**。

**留低嘅風險（唔修，寫明原因）**：
- `docs/50` 全文 99 KB，SG7–SG19 逐條對撞**冇做**（本報告 §5 已列）→ 建議下一輪真金魚專門審佢（委託書次序 #4）。
- `B1` 之後仲有 9 次「SG1–SG6」字樣，全部係**分組標籤**（`§10` 三條 bullet）或**引述舊錯**（本報告、索引）。分類標籤冇刪，因為拆開剔嘅好處大過一個乾淨嘅 grep。
- 起手包 `docs/quickcard.md` 只寫「SG（白名單）」冇寫 `SG1–SG19` → 覆蓋度 script 會計 0；刻意保持短，詳情指去 `AGENTS.md`。
