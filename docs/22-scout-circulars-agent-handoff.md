# 22 — 貼去 `scout-circulars` AGENT 嘅對話式問題清單

> 日期 2026-10-27。呢份係**畀你複製去另一個 repo 嘅 AGENT 對話**用，唔係通用規則。
> 證據來源：[20 repo 健康審計](20-repo-health-audit.md)、[21 修復方案 §2](21-fix-plans.md)、[19 旅團案例](19-ecportal-troop-case.md)。
> 我（`readme` repo 嘅 agent）**只係審計，冇改過 `scout-circulars` 任何檔案**。

---

## 1. 【完整版，可直接複製貼過去】由下一行開始複製到 `=== 完 ===`

```text
你好，我係另一個 repo（playerkousas-rgb/readme）嘅 agent。2026-10-27 我做咗一次 repo 健康審計，實際 clone 咗 scout-circulars 嘅 main / stories / 全部 refs 去 /tmp 度計數。想請你幫手處理以下問題，全部係建議，最終你同 repo owner 決定。

【先講約束，呢幾點最重要】
1. cache.json / enrich.json / fingerprints.json 好重要，唔好刪、唔好停止更新。前端係讀 GitHub Raw CDN 拎最新一份，所以要繼續有一個穩定公開 URL 讀到最新 JSON。
2. 你之前做嘅 Vercel 防爆（vercel-prune.yml / vercel-retention.yml / vercel-bundle-guard.yml / .vercelignore）係啱嘅，唔好破壞。我睇過你哋註解：2026-09-16/17 Functions Storage 由 10.49GB 爆到 11.82GB，病源係根目錄 requirements.txt 嘅 playwright（137MB）被 pip install 入每個 function bundle；你已經清空 requirements、依賴搬去 .github/requirements-*.txt、加 .vercelignore 令 deployment 由 8.4MB 落到 1.2MB。呢部分做得好好。
3. 但係上面嗰啲係清 Vercel deployments，唔係清 Git history。今次我要講嘅係 Git 嗰邊。
4. 零停機；唔好 hard rewrite main history 而冇事先講；唔好 commit 任何 secret。

【問題 1 — Git repo 太帳，而且係結構性】
實測數字（2026-10-27）：
- GitHub API size ≈ 158 MiB；全部 refs 嘅 pack = 155.83 MiB。
- 只有 main 嘅話 pack = 40.82 MiB（615 commits，2026-05-20 → 10-27）。
- 只有 main + stories 嘅話 pack = 156.02 MiB → 即係 stories branch 一條已經食咗約 115 MiB。
- stories branch：22 commits（2026-09-22 → 10-25）、210 個 PNG blob 共 122.8 MiB，每個 1–2MB。
- 8 條舊 arena/* branch 仍然存在，每條 556–614 commits；佢哋同 main 共享物件，對 pack 增量好少，但係會 pin 住 refs。
- 68 個 refs/pull/*/head 仍然指住舊 commit。

GitHub 官方建議 repo < 1GB、強烈建議 < 5GB；單檔 >100MB 會被 block（你最大單檔 3.5MB，呢方面安全）。
Docs: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
Docs: https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits

而家 158MB 唔會即刻死，但增長率約 5 MiB/日（main ~8 MiB/月 + stories ~3.5 MiB/日），半年左右會過 1GB 建議線；full clone 亦會越嚟越慢（working tree 得 46 MiB，但要落 156 MiB pack）。

【問題 2 — 每日 bot commit 入咗 Git history】
- 615 commits 入面約 266 個（43%）係 bot commit：🤖 Auto-update circulars [skip ci] / 📊 Update subscription stats / 📲 Instagram Story assets ...
- cache.json（3.6MB）改過 269 次；enrich.json（2.0MB）改過 156 次。
- scrape.yml 同 scrape-appstore.yml 每日 cron "15 16 * * *" 做：
  git add cache.json enrich.json fingerprints.json && git commit -m "🤖 Auto-update circulars [skip ci]" && git push
- notify.yml / org-icons.yml / story-queue.yml / update-appstore-snapshot.yml 都會自動 push。

【問題 3 — stories branch force-push 但 history 仍然累積】
story-draft.yml 每日 git push --force origin HEAD:stories，但佢嘅流程係：
  git fetch --depth 1 origin stories:stories-tmp → git checkout -f stories-tmp → git commit → force push
即係每日喺舊 commit 上面加一個新 commit。Force-push 只係換 branch tip，唔會刪舊 commit。所以 22 日 = 22 個 commit，每個 commit 都包住 7 日 story 圖（你哋有 code 只留最近 7 日，但舊 commit 入面嘅舊圖仍然喺 history）。

【問題 4 — bot commit 唔會有人定期洗】
GitHub 唔會自動刪除 commit。git gc 只會清「冇任何 ref 指住」嘅 unreachable 物件；你 615 個 bot commit 全部由 main 可達，永遠留低。就算 force-push，舊 commit 仍然可以經 refs/pull/*、fork、cached view、直接用 SHA 存取。要完全清走需要 git filter-repo + force-push + 聯絡 GitHub Support 做 server-side GC；非敏感資料嘅背景 GC 通常要幾日到兩星期，唔係即時。
Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
討論: https://github.com/orgs/community/discussions/190183

【問題 5 — 其他（次要）】
- 全 repo 無 LICENSE（公開 repo 預設版權保留）。
- 安全方面反而算乾淨：我 scan 過現況檔案同 git log -S，冇真 key 外洩；.env.example / PUSH_SETUP.md / notify.py 入面嘅 PEM 係 placeholder 或註解；appstore.json 個 JWT decode 出嚟 role=anon（Supabase 公開 key，靠 RLS）。呢個要保持。
- 你哋有 11 條 workflows，CI 覆蓋比其他 repo 好，呢個係優點。

【請你做 — P0（止血，零停機）】
P0-1  改 scrape.yml / scrape-appstore.yml：唔再 commit JSON 落 main。
       建議做法 A：開一條固定 orphan "data" branch，每日 git commit --amend 同一個 commit + force-push；前端 raw URL 改指 data branch。
       建議做法 B（可同時做）：actions/upload-artifact 上傳每日 snapshot，retention-days: 30（官方默認 90 日自動清，可設 1–90）: https://github.com/actions/upload-artifact
       main 只留一份最新 JSON 或者一個 pointer manifest，唔好再每日 append commit。
       驗收：git rev-list --count origin/data == 1；main 唔再出現新的 🤖 Auto-update commit；前端實際開一次新 raw URL 仍讀到當日 JSON。

P0-2  改 story-draft.yml：每日真正 git checkout --orphan（唔係只限第一次）。
       先由舊 stories branch 備份最近 7 日圖去 RUNNER_TEMP，再 orphan、重新加檔、只留 7 日、commit 一個、force-push。
       驗收：git rev-list --count origin/stories == 1；story 圖仍然 7 日可讀；pack size 明顯回落。

【請你做 — P1（清潔）】
P1-1  刪 8 條 stale arena/* branch（先確認冇人仲用）：
       arena/1c29341e-scout-circulars, 52a87a4c, 65b03637, 74af9677, ac4d1736, b66c0ad3, bc4d9dd5, f74d41bf
       驗收：git ls-remote --heads origin | grep arena → 0 條。
P1-2  加一條 repo-size-guard workflow：每週跑 gh api repos/playerkousas-rgb/scout-circulars --jq .size + git count-objects -vH，
       超過 300MB 就出 annotation / issue。驗收：workflow 存在並成功跑過一次。

【請你做 — P2（可選，最後先做，唔急）】
P2-1  git filter-repo 清現有 history（cache.json / enrich.json / stories/ 嘅舊 blob）。
       警告：會改寫所有 commit SHA、影響 68 個 refs/pull/*、所有 fork 同本地 clone；要先通知所有協作者。
       舊 blob 仍可能留喺 GitHub cached view，要開 Support ticket 先完全清。
       建議先做 P0/P1 止血，觀察一兩個星期先至決定使唔使做呢步。

【唔好做錯】
- 唔好直接刪 cache.json / enrich.json，佢哋係重要數據。
- 唔好停止每日更新，只係改「點樣儲存」。
- 唔好改 .vercelignore 嘅核心 ignore list 或將 playwright / requirements 搬返去根目錄。
- 唔好因為 [skip ci] 以為 Vercel 都唔會 deploy（你哋註解已經講咗：skip ci 只 skip Actions，skip 唔到 Vercel）。

【做完請你回覆以下 5 點】
1. 改咗邊幾個 workflow / 檔案（逐個列出）。
2. 驗收數字：GitHub size（MiB）、main commit 數、stories commit 數、data commit 數。
3. 前端 raw URL 新位置係乜（如果有改），我哋呢邊要唔要配合改其他 repo。
4. 有冇任何一步你判斷唔應該做，原因係乜（我接受反建議）。
5. 有冇需要我提供額外數據（例如逐日 pack size、邊個 commit 最大）。

如果你覺得某個建議唔啱，直接講，我哋可以一齊改方案。唔該。
=== 完 ===
```

---

## 2. 【短版】如果 AGENT 有字數限制，貼呢個就夠

```text
我想請你檢查 scout-circulars 嘅 Git 體積問題（我喺 2026-10-27 實測，冇改過你個 repo）：

現況：GitHub size ≈ 158 MiB。main 全 history 40.8 MiB / 615 commits；stories branch 一條約 115 MiB / 22 commits / 210 個 1–2MB PNG；8 條舊 arena/* branch 同 68 個 refs/pull/* 仍然 pin 住舊 commit。615 commits 入面 43% 係 bot commit，cache.json 改過 269 次、enrich.json 156 次。

最重要約束：cache.json / enrich.json / fingerprints.json 好重要，唔好刪、唔好停止更新；前端要繼續有穩定 raw URL 讀到最新一份。你之前做嘅 Vercel 防爆（prune / retention / bundle-guard / .vercelignore）係啱嘅，唔好破壞 —— 但佢清嘅係 Vercel deployments，唔係 Git history。

核心問題：GitHub 唔會自動洗 bot commit；git gc 只清 unreachable 物件。scrape.yml 每日 git commit JSON 落 main，story-draft.yml 每日喺舊 commit 上加新 commit（force-push 只換 tip 唔刪舊）→ history 一路谷。

請你做（按優先）：
P0 改 scrape.yml / scrape-appstore.yml：唔再 append commit；改用固定 orphan data branch 每日 commit --amend + force-push，或者 actions/upload-artifact（retention-days: 30）。main 只留最新一份。
P0 改 story-draft.yml：每日真正 git checkout --orphan（先備份最近 7 日圖），stories branch 永遠 1 個 commit。
P1 刪 8 條 stale arena/* branch；加一條 repo-size-guard workflow（超過 300MB 出 warning）。
P2 可選：git filter-repo 清舊 history（會改 SHA、影響 PR refs / forks，要最後先做同先通知）。

驗收：GitHub size 回落、stories commit 數 = 1、data commit 數 = 1、前端 raw URL 仍讀到當日 JSON。做完請回覆改咗邊幾個檔 + 上述數字 + 有冇需要我配合。有反建議直接講。
```

---

## 3. 如果 AGENT 反問，你可以咁答（對話式 Q&A）

**Q：點解唔直接刪咗啲 JSON？**
A：因為佢哋係爬蟲成果同前端資料源，唔係可再生嘅 build artifact。我建議嘅係「改儲存位置」，唔係「刪數據」。

**Q：我哋已經有 vercel-prune 同 retention，點解仲爆？**
A：因為嗰兩條清嘅係 Vercel 嘅 deployment / function bundle（Hobby 10GB 限），Git repo 嘅 `.git` history 係另一個儲存空間，兩者獨立。你 Vercel 嗰邊其實做得好好；Git 呢邊冇人理。

**Q：`[skip ci]` 唔係已經阻止咗自動化？**
A：你哋註解自己都寫咗：`skip ci` 只 skip GitHub Actions，**skip 唔到 Vercel**。而且就算 Vercel 唔 deploy，commit 仍然寫入咗 Git history。

**Q：force-push 唔係會覆盖舊 commit 咩？**
A：只係將 branch tip 指去新 commit；舊 commit 變成 unreachable，但仍然經 `refs/pull/*`、fork、cached view、SHA 直接存取，要 GitHub server-side GC 先清到，而且唔係即時。

**Q：可唔可以用 Git LFS？**
A：可以但要計 quota。GitHub Free 嘅 LFS 約 1GB 儲存 + 1GB/月頻寬；你每日 5MB × 30 日 = 150MB/月頻寬，短期 OK，但唔係長遠。我建議 artifact / object storage 優先。

**Q：會唔會影響而家啲用戶？**
A：如果只改「點樣儲存最新 JSON」而保持同一個 raw URL 语义（或者我哋配合改前端 URL），用戶零感覺。最大風險係改咗 URL 但其他 repo 未跟住改 —— 所以上面要求你回報「前端 raw URL 新位置」。

---

## 4. 我呢邊嘅證據（方便你轉發）

| 數字 | 點計出嚟 |
|------|----------|
| 158 MiB | `gh api repos/playerkousas-rgb/scout-circulars --jq .size` = 161741 KB |
| main 40.82 MiB / 615 commits | `git init --bare` + 只 fetch `refs/heads/main` + `git count-objects -vH` |
| main+stories 156.02 MiB | 只 fetch main + stories |
| 全部 refs 155.83 MiB | `git fetch origin '+refs/heads/*:refs/remotes/origin/*'` |
| stories 122.8 MiB / 210 blobs | `git rev-list --objects origin/stories \| git cat-file --batch-check` |
| cache.json 269 次 / enrich 156 次 | `git log --oneline -- cache.json` / `-- enrich.json` |
| 43% bot commit | `git log --format='%s' \| grep -ciE 'auto-update\|skip ci\|🤖\|📊\|📲...'` |
| 8 條 arena branch / 68 PR refs | `git ls-remote --heads origin` / `git ls-remote origin 'refs/pull/*/head'` |

> 詳細拆解同 workflow 改法（含 YAML／bash snippet）喺 [21 §2](21-fix-plans.md)。
