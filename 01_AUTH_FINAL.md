---
version: v4.5.1
---
# 帳號與信任鏈 - 最終安全版

## 登入
- 領袖/家長: EMAIL+PW，首次用一次性邀請連結(隨機12字24h過期)，非1234
- 成員: SCOUT_ID/YMIS+PW
- SUPER: sheep + EC_SUPER_KEY HttpOnly

> **ScoutBadge 實作備註（v4.1.0+）**：
> - SUPER 登入採用**直接驗證**機制：Proxy（Vercel）驗證密碼後，透過 `isSuperAdmin` flag 直接授權，
>   **不再需要** trusted-ticket 回調（因此不需要 `script.external_request` 授權）。
> - 本地密碼登入**保留**（三點進入並存），上層 sig 只係多一條免檢入口，不會停用本端密碼。

## Session (修 #1)
頂層登入後 set-cookie sessionToken=JWT{HMAC(SESSION_SECRET,userId|role|exp)} HttpOnly
/api/proxy 必須帶session，server先verifySession()才注入apikey，否則401

## 信任鏈用下級key簽 (修 #3, #4)
TROOP已有PROG的key(registry)，所以用PROG的key簽，PROG用自己key驗:

sig = HMAC(childKey, `${childId}|${sub}|${JSON.stringify(scope)}|${exp}`)
sub=EMAIL(領袖/家長)或YMIS(成員), scope={role, children_ids, targetYmis}, exp=3600

PROG驗: HMAC(自己apikey,...)==sig 且 scope在簽名內不可篡改，家長scope只能是children_ids，exp未過期 -> 免密碼認人

## 全體requireAuth (修 #5)
doGet/doPost首行requireAuth()，無apikey或sig -> 403，/exec直接打無效

## 全域ID不變 (修 #13)
PROG_0082V, TROOP_0082V, DISTRICT_0082 永遠不變，舊書籤redirect

## members schema (修 #14)
ymis, scout_id, email, name, type, role, district_id, troop_id, patrol_id, parent_ids, children_ids, permissions_override, passwordHash, salt, mustChangePw, inviteToken, inviteExp

## 帳號單一來源 (修 #15, v4.3.0 邏輯反轉)
懷疑 key外洩: **停SIG、只收本地密碼**(攻擊者有key冇密碼)，換apikey完成後先恢復sig。
本地密碼入口(ScoutBadge偏離聲明)就係災難恢復通道，唔可以鎖走。Runbook見 09.4

> **ScoutBadge 偏離聲明**：ScoutBadge 作為 leaf 端**不**照辦此條，本地密碼入口保留，
> 上層 sig 只係多一條免檢入口。理由：上層接入唔應該鎖走本團自己嘅登入。

## 家長超然見 06_PARENT_SUPER.md
