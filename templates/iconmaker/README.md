# Icon Maker — G11 圖標產生器（Type A 工具）

> `icon_maker_v1.0.html`：上載一張母圖，喺瀏覽器本地出齊 [docs/33 G11](../../docs/33-icon-standard.md) 要嘅 9 個圖標檔，順手出埋 `<head>` 掛法同 `manifest.webmanifest`。一個 HTML，冇 API key、冇後端、張圖唔離開部機（Type A，[docs/09 C2](../../docs/09-gemini-canvas.md)）。

## 點用

1. 直接開 `icon_maker_v1.0.html`（或者抄去新 repo 再開）。
2. 母圖點嚟都得：自己畫、AI 生、**手繪草稿經 LogoDiffusion／Gemini 轉成 logo 母圖**（工作流見 [docs/40 §2.1](../../docs/40-canvas-diy-candidates.md)）。母圖要求跟 docs/33 §4：正方形、滿版（full bleed）、主體置中佔 60–70%、至少 4 隻色。
3. 喺「16×16 手繪格」逐格執細圖（起稿嚟自母圖縮小，最終要用人眼驗認唔認得出，唔好當自動版係手繪版）。
4. 睇產出卡：maskable 嗰兩張有圓裁＋66% 安全區預覽；9 個檔合計要 ≤ 260 KB（超咗會出聲，做法係母圖減色／簡化，唔係換格式）。
5. 逐個下載或者「全部下載」（瀏覽器攔多個下載嗰陣，要允許本頁多個下載）；copy head snippet 同 manifest 入新 repo。
6. 設定（App 名／網址／主題色）可匯出／匯入 JSON（`schemaVersion: 1`）。

## 限制（老實寫）

- `favicon.ico` 係瀏覽器本地砌嘅 PNG-in-ICO（16／32／48），未喺所有瀏覽器實測過相容性；第一次用要照 docs/33 §9 驗收（分頁有圖、iOS 加入主畫面無白邊、WhatsApp 有 1200×630 預覽）。
- 工具只做縮放／置中／砌圖，唔會幫母圖減色到 PNG8；出嚟超 260 KB 就返去母圖度減色（docs/33 §8 指令），唔好喺工具加多套壓縮邏輯扮做到。
- 圖標檔本身唔落隱形水印（W2 唔適用）：圖標係用戶母圖嘅尺寸衍生物，唔係 AI 生成成品圖；來源證明靠母圖同 repo 紀錄。`audit_single_html` 會就呢點出 WARN，屬預期，唔係 FAIL。
- 用 AI 出母圖嗰陣記住 docs/33 §10 陷阱：prompt 要明講 `full bleed`、`no border`、`no rounded corners`、列明 4–6 隻指定顏色。

## 驗收

```bash
node scripts/audit_single_html_v1.0.mjs templates/iconmaker/icon_maker_v1.0.html
```

2026-11-07 實跑：AUDIT PASS（0 FAIL；WARN 係 C13「冇 AI slot」同 W2「冇水印常數」，兩樣都係 Type A 工具嘅預期）。
