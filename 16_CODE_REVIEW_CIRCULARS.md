# CODE REVIEW — scout-circulars (通告圖書館) 實際代碼審查

審查對象: github.com/playerkousas-rgb/scout-circulars @ 62f1991
方法: 全讀 schema.sql / api/* (push_config, push_subscriptions, push_common, pdf_proxy) / notify.py / subscription_stats.py / GitHub Actions workflows / README PUSH_SETUP
總評: **呢個 repo 嘅私隱與安全設計係示範級**——同 ecportal 磨心多、邊修邊行唔同，呢個係一次過起得好嘅。無 P0。用戶最關心嘅兩條問題答案都係 ✅。以下只列真正值得記低嘅項目。

---

## 用戶最關心兩條 — 直接答

**「訂閱數會唔會增長？」** ✅ 會。經任何前端 (圖書館/旅系統) 訂閱，全部入同一張 Supabase `push_subscriptions` 表 (endpoint_hash 唯一鍵 upsert)。`subscription_stats.py` 照出: 總數/啟用/30日活躍/每支部/每項目。
**「大數據收唔收到？」** ✅ 收到，而且**永遠唔知邊個**——表結構天生匿名: endpoint_hash+client_token_hash (SHA-256)，無姓名/電郵/電話/帳戶/旅團欄位 (schema 註解明言)。設計正確，唔使改。

## 推送鏈現況 (BUILD.md §4 已照此修正)

每日 scrape → cache.json (公開) → Supabase `push_subscriptions`
→ GitHub Actions 06:00 HKT `notify.py`: 比對新增通告 → 每訂閱者「支部 AND 項目」交集 → 全部命中合併成一則 → pywebpush (VAPID) → `push_deliveries` 去重 (UNIQUE subscription+notice_key) → 410/404 自動清死 endpoint → 7 日 rolling 補漏 → >50% 失敗率熔斷。

---

## 做得啱、應該照抄入其他系統嘅嘢 ✅

1. **RLS 鎖死**: `push_subscriptions`/`push_deliveries` REVOKE anon+authenticated 全部權限，只有 service_role — 瀏覽器永遠摸唔到表
2. **匿名從設計開始**: 端點/金鑰係 Web Push 協定必需先至存；token 淨係存 SHA-256 hash；log 刻意唔記 endpoint
3. **same-origin 閘**: 訂閱 API 只認本站 Origin — 防其他網站借瀏覽器亂寫
4. **刪除保護**: 要 client token + endpoint 兩樣先刪到，冇得刪人哋裝置；冪等不洩露存在性
5. **pdf_proxy 防.open-relay**: 附件 URL 必須存在於 live cache.json 先至 proxy (SSRF 防線) + 4MB 上限 + %PDF magic bytes + 零寫入 + CDN cache
6. **金鑰衛生**: VAPID 私鑰只喺 GitHub Actions；Vercel 只有 public key；notify 明言 private key 唔准落 Vercel
7. **去重+熔斷**: push_deliveries 唯一鍵、單 endpoint 失敗唔阻全局、過半失敗判定系統性問題停手
8. **體積紀律**: stdlib-only、依賴搬走 .github/requirements-notify、bundle guard — v2.6.0 嗰次 11.82GB 教訓有制度化

## 弱點 (無 P0；三項 P1-P2 記低)

| # | 級 | 發現 | 建議 |
|---|----|------|------|
| C1 | P1 | `/api/push-subscriptions` 無 rate limit；same-origin 只防瀏覽器跨站，curl 偽造 Origin header 照過 → 隨機 endpoint 可灌表；`validate_endpoint` 若只驗 https 格式，攻擊者可塞任意 URL，令 notify.py 對任意主機做加密 POST (有限度 SSRF/GitHub Actions 資源濫用) | ① endpoint 域名白名單 (fcm.googleapis.com/*.push.apple.com 等推播服務) ② per-IP 簡易限流 (Vercel edge 或 in-process 計數) ③ upsert 對 last_seen_at 加頻率限制 |
| C2 | P2 | VAPID 私鑰洩漏無 runbook: 私鑰一出，任何人都推得假通告畀全部訂閱者 | 寫低 rotation 步驟 (換 key pair → 舊訂閱全失效 → 通知用戶重訂)；配合 09.4 例行 rotate 精神 |
| C3 | P2 | `subscription_stats.json` 自動 commit 入公開 repo — 彙總無私隱問題，但等於公開「訂閱人數」增長曲線 | 知情確認: 呢個係特性唔係 BUG；唔想公開就改放 private gist |
| C4 | P2 | 訂閱單位係「裝置」唔係「人」(一人多裝置會計多) | 已知設計，stats 報告標明「裝置數」 |
| C5 | P2 | 旅系統內建訂閱 (BUILD.md §4) 需要圖書館改 `require_same_origin` → origin allowlist | 實現時加 `ALLOWED_ORIGINS` env (認住各單位系統網址)；建議 `push_subscriptions` 加 `source` 欄分 library/system 統計 |

## 結論

- scout-circulars: **合格，無需急修**；C1 建議喺實現「旅系統內建訂閱」時一併做 (加 origin allowlist 順手加域名白名單+限流)
- ecportal (X1-X4 P0) vs scout-circulars (無 P0): 兩個 repo 嘅安全成熟度差距，正好證明「有後端寫入」嘅地方先至係風險所在——通告圖書館全鏈匿名+唯讀公開+窄 API，天然安全
- BUILD.md §4 個人化訂閱定案已照實況修正完畢，實現時零重新設計
