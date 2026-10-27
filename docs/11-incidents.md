# 11 — 出事 Runbook

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> 原則：**先止血，後查因；先復服務，後追責任**。每個動作寫入 AUDIT_LOG。
> 出完事一定要更新 `PLAYBOOK.md` / `docs/` / `guard.mjs`（F16），否則同一件事會再發生。

---

## 1. Key 外洩

**徵兆**：Git scan 警報、Vercel log 有異常出站、GAS 見到唔識嘅 `via`、有人報收到唔應該收到嘅資料。

```
① 止血（5 分鐘內）
   - 停 SIG：上游暫停對外簽名（或設全域 kill switch）
   - 收本地密碼入口：下游 ALLOW_LOCAL_LOGIN = false（經上游 sig，唔好下游自改）
   - 如果係 Supabase service_role：即刻喺 Dashboard rotate

② 換 key（三處同步，F16）
   - 下游 GAS：刪 ScriptProperties.API_KEY → showApiKey() 生新 key
   - 上游：重新登記 DOWNSTREAM_<id>_KEY
   - Vercel：改 UNIT_<id>_APIKEY + Redeploy
   - 測：用舊 key 打一次必須失敗；用新 key sig 測試連線成功

③ 換上游 secret
   - SESSION_SECRET / SUPER_KEY rotate → 所有 session 失效（預先通知用戶要重新登入）
   - 有 token 喺外面流 → jti blacklist 或全域 pv+1

④ 查審計
   - AUDIT_LOG / ACCESS_LOG 由最後已知良好時間開始
   - 搵：唔識嘅 IP、海量讀取、新開帳號、權限改動、audit 鏈有冇斷

⑤ 恢復
   - 逐步開返 SIG → 本地入口（視乎需要）→ 通知受影響單位
   - 更新 runbook + guard rule（如果 scan 漏咗）
```

---

## 2. 壞 deploy

```
① Vercel Dashboard → Deployments → 上一個成功 deployment → Promote（或 vercel rollback）
② 開 kill switch 停寫入（如果資料可能已經污染）
③ 睇 log（只記 metadata）→ 搵 error code（F13）
④ git revert <sha>（一個 commit 一件事，先至 revert 得乾淨，G3）
⑤ 如果牽涉 schema：行 expand/migrate/contract 嘅逆向，唔好硬改
⑥ 事後：CI 加一條測試守住呢個 regression（F14）
```

---

## 3. 資料損毀 / 唔見

```
① 即刻停止寫入（kill switch），避免備份都被覆蓋
② 搵最近一份 exportAll / pg_dump（F11），驗 sha256 + schemaVersion
③ importAll 原子還原（驗 hash + 保留 hash 直插 + transferId 冪等）
④ 對 AUDIT_LOG 補差：由備份時間到而家，逐筆重放（要冪等，唔好雙寫）
⑤ 檢查衝突：撞號 / 撞版要人手處理，唔好自動覆寫
⑥ 通知受影響用戶邊段時間嘅資料要重新輸入
⑦ 事後：縮短備份間隔、加「升級前自動備份」提示（F11）
```

---

## 4. 超管通道被濫用

```
① 即刻 rotate SUPER_KEY（Vercel env + Redeploy）
② 拉 AUDIT_LOG：所有 actor=SUPER / via=breakglass 嘅 entry
③ 檢查：有冇新增 admin row、有冇人改咗 permissions_override、audit 鏈有冇斷
④ 對受影響帳號：重設密碼 + pv+1 + 撤權限
⑤ 檢查告警接收者有冇被改（email / webhook）
⑥ 兩人規則加嚴：之後用超管要第二人 out-of-band 確認
⑦ 如果懷疑 nonce store 被繞過 → 檢查 CacheService / KV 有冇被清
```

> 超管**一定要留痕**；如果 AUDIT 搵唔到對應 entry，當最嚴重事件處理（可能審計都被改）。

---

## 5. 體積 / quota 爆

```
① du -sb dist；du -sh .vercel；git count-objects -vH
② 檢查 .vercelignore 係咪存在 + 有冇擋 node_modules/.git/docs（S2）
③ 刪舊 deployment（retention 改 7 日）+ 非 main Preview 關閉（S8）
④ find . -name '*.bak' -o -name '*.tmp' -o -name '*.old' -o -name '*.log' → 清
⑤ 圖轉 AVIF（<500KB），移除無引用 assets（S5/S6）
⑥ CI 加 / 確認 S7 size gate
⑦ 如果係 Git 大檔：git filter-repo --strip-blobs-bigger-than 1M（通知協作者重新 clone）
```

---

## 6. Supabase / GAS quota 或服務異常

| 症狀 | 動作 |
|------|------|
| Supabase free project 暫停 | 每日 health cron（U11）；必要時升級 Pro；由備份還原 |
| GAS 執行逾時（6 min） | 拆 job + 冪等鍵（X7）；批量 `setValues`；減少 `Logger.log` |
| GAS body > 900KB | 分件 `saveDbPart` / 分段 `loadDbPart`（S11/X7） |
| Script Properties 配額 | 清孤兒 `DOWNSTREAM_*`；合併設定 |
| 推送重複 | cron lock + 冪等鍵（U10）；同一通告只推一次 |
| remote config 服務死 | 用 last-known-good + 唯讀降級（[04-settings-super §1.5](04-settings-super.md#15-設定服務死咗點算)） |

---

## 7. 下游閂口後入唔返去（最易自己整死自己）

**預防**（閂口前必做）：
```
[ ] 上游 sig 轉發路徑已實測（測試下游連線成功）
[ ] 已完成搬數（筆數核對）
[ ] 至少一個本地領袖戶 + SUPER
[ ] 下游選單「🔓 開啟本機直接入口」可用（災難模式）
```

**急救**：
```
① 上游重新開：sig 打 setLocalLogin(allow=true)
② 如果上游都死咗：下游選單直接開本機入口（災難恢復）
③ 兩邊都死：SUPER /api/super → resetPassword → 由最近 exportAll importAll 還原
④ 事後：寫低點解會兩邊死，更新 F18 kill switch 次序
```

---

## 8. 事件後檢討（Post-mortem，30 分鐘）

```markdown
# Incident <date> — <一句>
影響：邊個 app / 幾多用戶 / 幾耐 / 有冇資料外洩
時間線：detect → stop → fix → recover
根因：（唔好寫「人手錯誤」就算，要寫邊條防線缺口）
對應規則 ID：S/F/A/G/V/X/U/C 邊條冇守住
修正：
  - guard.mjs 新增/修改檢查：
  - 測試：
  - 文件：
  - 流程：
復原日期 / 負責人：
```

**每一單 incident 最少要產生一個新測試**（F14），否則根因未修。

---

## 9. 聯絡 / 升級路徑（自己填）

```
平台持有人（ADMIN）：________（2FA 密碼管理器保存 SUPER_KEY）
第二確認人（兩人規則）：________
Vercel / Supabase / Google ownership：機構專用帳戶 + 兩名管理人
告警接收：________（唔好用個人 email 做唯一接收）
最近備份位置：________（私有 Drive / Storage，驗過 hash）
```
