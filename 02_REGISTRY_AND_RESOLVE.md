---
version: v4.2.0
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

Vercel env: BACKEND,APIKEY,NAME,TYPE - server only
