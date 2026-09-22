---
version: v4.9.0
date: 2026-09-22
status: FINAL
---

# 接入申請/帳號申請、ADMIN APP 與 MOCK 教學

## 14.1 ADMIN APP 收件匣 — 只服務「獨立前端」接入 (v4.8.1 依用戶定案修正)
- **定位 (死規矩)**: 成個 ADMIN **只有管理員一人**；ADMIN APP 嘅目的 = **保護管理員電郵地址不外露** — 收件匣 (GAS Web App) 代替個人 email 做公開接收入口，僅此而已。佢唔係組織、唔係委員會、冇第二個審批人
- **ADMIN 只負責「獨立前端」**: 想**單獨用支部系統**（唔經旅）嘅單位先至交 ADMIN 登記入平台 (units.json + Vercel env)。**有旅系統嘅接入唔經 ADMIN** — 交旅長，旅長登記入旅系統 (旅 registry，13.1)
- **兩條路並行** = 同一單位交兩邊（旅長 + ADMIN），各自登記，01 雙入口
- 前端獨立版旅團閘「新旅團申請接入」表單: `{troopId, troopName, scriptUrl(/exec), apiKey, 聯絡, 備註}`
- 路徑: 同源 /api/proxy action=submitRegistration (白名單) → 伺服器端常數 SCOUT_ADMIN_API (ADMIN APP 收件匣 GAS，目的地前端改唔到) → 寫入收件匣 Sheet
- **收件匣無回執**: POST 過得去就當送到；前端只話「已提交，等管理員跟進」
- 管理員 (一人) 流程: 收件匣見申請 → 核對 (試 ping/status) → units.json 加公開 entry + Vercel 加 `TROOP_<id>_BACKEND/_APIKEY` → Redeploy → 通知申請人
- 安全 (X9 + 09.4):
  - proxy per-IP 限流; 收件匣 GAS 按 unit+contact 去重，防灌爆
  - **收件匣內有 API KEY = 高敏**: 管理員帳戶 2FA、Sheet 權限只限本人；ADMIN APP GAS 唔好同任何 unit leaf 共用
  - 登記完成後管理員可叫該 unit rotate key 一次再更新 env (key 曾經過申請人手+收件匣)
- 唔想入平台: 唔申請就得 (13.1)；想走: 管理員刪 registry entry + env — 數據一直在自己 Sheet，冇鎖

## 14.2 unit 內帳號開戶申請 (accountApps 模式，正式寫入)
- 團員/家長自助: 成員入口「申請帳號」(YMIS+姓名+聯絡) → 寫入該 unit db `accountApps` (待批)
- 領袖批核: 對名冊核對 → 批 = 開戶 (09.3 預設密碼+mustChangePw) 或出邀請連結 (01)；拒 = 記錄原因
- 家長申請: 對子女 SCOUT_ID 核對 → 開家長帳號 (children_ids，06)
- 防濫: 同 YMIS 待批唯一；領袖可以關閉自助申請改純邀請制 (10.5 開關精神)

## 14.3 MOCK 模式 (正式寫入)
- 平台內建「示範旅團」: 假名冊/假帳目/假進度/假物資，全部功能行得到，**純前端，唔會寫任何後端/Sheet**
- 明確標示: 頂欄「示範模式」水印；匯出帶 `_exportedFrom:'mock'` 並與真數據匯出分開命名 — 唔會同真旅團混 (ecportal 已有基礎)
- MOCK 唔可以: 同步上後端、登記 registry、開真帳號、收真報名
- 用途: 新領袖訓練、開季演示、旅團未交 SHEET URL 前試晒功能

## 14.4 教學製作 (正式寫入)
- 三層教材:
  1. **每角色一頁快速入門** (成員/執委/領袖/旅長/家長): 首次登入必見，五步講晒
  2. **每模組一頁說明**: 跟 12.3 模組註冊制走 — 說明頁屬於模組，開咗模組先見到，唔會出現「說明講一個冇嘅功能」
  3. **MOCK + 引導任務**: 「試吓開一張通告」— 喺 MOCK 度做一次先掂真嘢
- 沙盒 (08 C7): MOCK 就係沙盒第一版；進階 = 管理員開示範 Sheet 畀領袖練習真同步
- 教學連結/QR 用公開 URL (12.6)，領袖開季轉發得
- 教材放 repo docs/，版本跟 v4.x 走；CHANGELOG 每次改功能要列「教學要不要更新」
