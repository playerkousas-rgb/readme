---
version: v4.9.0
---
# Registry與解析 - 修 #2, #12, #18

Registry表: id,name,backend,apikey,type,enabled - apikey永不回前端

/api/resolve (server做): verifySession() -> 用server端key call backend getRegistrySafe(已剝apikey) -> cache 5分鐘 -> 回前端 chain[{id,name,type}] 

normId統一 (修 #12):
function normId(s){
  const v=String(s).trim().toUpperCase();
  const m=v.match(/^(\d+)([A-Z]?)$/);
  return m?m[1].padStart(4,'0')+m[2]:v;
}
0082V->0082V不撞號

## Registry 分層 (v4.9.0 新增 — 之前三層混寫)
1. **平台 registry** (獨立前端用): units.json 公開 metadata + Vercel env `TROOP_<id>_BACKEND/_APIKEY`。**只有 ADMIN** 經 14.1 收件匣管理
2. **旅 registry** (有旅系統用): 旅層後端 (TROOP_OPS Sheet) 一張表，存各支部 key。**只有旅長**寫 (13.1 接入三條路)；Vercel /api/proxy server-to-server 讀取 + cache 5 分鐘 (02 同一機制)
3. **信任鏈 key** (01): 上級持有下級 key 簽 sig — 旅 registry 正係第2層嘅數據來源
- 共通規矩: apikey 永不回前端、權限最少化、key 更新/停用行 09.4 runbook (兩層 registry 各自適用)

Vercel env: BACKEND,APIKEY,NAME,TYPE - server only
