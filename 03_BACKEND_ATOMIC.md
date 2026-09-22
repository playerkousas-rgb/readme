---
version: v4.8.0
---
# 後端原子化防洗庫 - 修 #7-11

merge3後端Lock內做:
lock=LockService.getScriptLock(); waitLock(20000); try{remote=readDbChunked(key); merged=merge3(base,local,remote); writeDbChunkedAtomic(key,merged);}finally{releaseLock()}

read也要Lock，否則讀到空

write原子: 先寫tmp rows database_tmp_{key}_{uuid} -> 寫pointer -> 刪舊

chunk: key,chunkIndex,chunkData(40k),totalChunks,version - 解50k上限

version+serverTime: 不用Date.now()，後端Date.now()+version自增

syncOnce修 #9: 比updatedAt才刪staging，成功後更新db和base，處理null字串
