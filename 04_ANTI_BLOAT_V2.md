---
version: v4.8.0
---
# 瘦身原則 - 真正爆炸原因

1. function零依賴: /api/proxy, /api/resolve 用原生fetch+crypto
2. 關preview deployment
3. 設retention 7天
4. 圖轉AVIF, .vercelignore, dist<5MB, bundle<2MB
