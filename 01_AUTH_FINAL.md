---
version: v4.1.0
---
# 帳號與信任鏈 - 最終安全版

## 登入
- 領袖/家長: EMAIL+PW，首次用一次性邀請連結(隨機12字24h過期)，非1234
- 成員: SCOUT_ID/YMIS+PW
- SUPER: sheep + EC_SUPER_KEY HttpOnly

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

## 帳號單一來源 (修 #15)
被吃後下級停用password模式，只接受sig

## 家長超然見 06_PARENT_SUPER.md
