---
version: v4.9.0
---
# 家長超然模型

定位: 家長是旅層帳號，超然於各團，權限=子女聯集

DISTRICT存PARENT: children_ids=["S123456","S123789"]
(v4.3.0 修正: children_ids 存「全域SCOUT_ID」，唔好用支部前綴ID — SCOUT_ID移到邊家長sig就解析到邊，升團遷移家長mapping零改動，見 09.1)

登入旅簽發:
sig_cub=HMAC(TROOP_CUB_apikey, `TROOP_CUB|parentEmail|{children_ids,targetYmis}|exp`)
sig_scout=HMAC(TROOP_SCOUT_apikey,...)
sig_prog=HMAC(PROG_...)

TROOP驗: 用自己key重算HMAC，檢查children_ids中有自己團員 -> 放行非公開資料

有旅才有超然，無旅(獨立團模式B)做不到跨支部，家長只能同時用兩個系統 /troop/?t=CUB 和 /troop/?t=SCOUT，不設中央PARENTS表硬穿

子女見到咩家長見到咩
