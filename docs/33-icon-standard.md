# 33 — G11 全站圖標標準（Icon／Favicon）

> 2026-11-02 由根 README §9 抽出：**圖標唔係每次開新 repo 都要睇**，但 9 個 PNG／ICO 嘅尺寸、maskable 66%、16px 手繪、體積預算同驗收仍然係唯一標準。原 §9 只留一句原則 + 指針。


> **狀態**：定案（2026-10-28），G 系列第 11 條（G1–G10 見 [docs/05](05-git.md)）。
> **實測來源**：`hkcamping` v1.12.1（icons/ 244 KB、dist 467.5 KB、guard 18/18、test 21/21、ui 112/112）。
> **用法**：每個新 app 開工第一件事就照抄呢一節，**唔再逐次重新設計、唔再逐次討論格式**。出檔工具：[`templates/iconmaker/icon_maker_v1.0.html`](../templates/iconmaker/icon_maker_v1.0.html)（上載母圖→本地出齊 9 檔＋16px 手繪格＋maskable 66% 預覽，用法同限制見其 [README](../templates/iconmaker/README.md)）。
> 完整對照（色票＋每個檔實際體積）見 `playerkousas-rgb/hkcamping` README「App Icon／favicon（v1.12.1）」一節。

### 1. 一句話原則

每個 app 開工第一件事，就係**出齊 9 個圖標檔，全部 PNG／ICO**。
唔准 SVG、唔准 AVIF／WebP、唔准擺 1024×1024 入 repo。

### 2. 必要檔案（9 個，一個都不能少）

| 檔案 | 尺寸 | 邊個讀佢 | 冇咗會點 |
|---|---|---|---|
| `icons/favicon.ico` | 16／32／48 三合一 | 書籤、舊瀏覽器 | 書籤冇圖 |
| `icons/favicon-16.png` | 16×16 | 瀏覽器分頁 | 分頁白板 |
| `icons/favicon-32.png` | 32×32 | 分頁 Retina | Retina 分頁模糊 |
| `icons/apple-touch-icon.png` | 180×180 | iOS「加入主畫面」 | iOS 主畫面變白板 |
| `icons/icon-192.png` | 192×192 | Android／PWA／網站 header | 安裝提示冇圖 |
| `icons/icon-512.png` | 512×512 | Android／PWA 安裝 | PWA 安裝失敗 |
| `icons/icon-maskable-192.png` | 192×192 | Android 裁圓 | 主體被裁走 |
| `icons/icon-maskable-512.png` | 512×512 | Android 裁圓 | 同上 |
| `icons/og-image.png` | 1200×630 | WhatsApp／Signal／FB 預覽 | 貼連結只剩一行字 |

> ⚠️ **冇 1024×1024**：冇任何程式會讀佢，只有「上 App Store／Play Store 交審」先要。
> 要交先由母圖另存一張，交完就刪，唔好長期擺喺 repo。

### 3. 四種格式一律否決（附實測原因）

| 格式 | 否決原因 |
|---|---|
| **SVG** | App icon／favicon 冇標準 SVG 支援；iOS 同 Android 安裝流程都唔食 |
| **AVIF** | `apple-touch-icon`（iOS 只認 PNG）、manifest icons（Android）、`favicon.ico`（必須 ICO）、`og:image`（WhatsApp／FB 唔支援）四個位置一轉即壞。實測 `icon-512` 由 46.6 KB 跌到 12.2 KB 都**唔准用** |
| **WebP** | 同上，iOS 主畫面唔認 |
| **JPEG** | 冇透明、og 文字邊緣起格 |

**要省位就減色，唔係換格式。**
（同 [S6](01-slim.md) 嘅「圖轉 AVIF／WebP」唔衝突：S6 講**上載內容圖**，本節講**站台圖標**，圖標一律 PNG／ICO。）

### 4. 設計要求（每個 app 都要有「場景」，唔係一個 logo）

1. 一定要係**有主角嘅風景**，唔係單色幾何圖形。
2. **顏色至少 4 隻**，唔准只用 2 隻色（hkcamping 第一版用綠＋奶白被退回）。
3. 圖示**全部滿版（full bleed）**，唔准加白邊、唔准加圓角外框 —— iOS／Android 自己會裁圓，你再加框就會出現四個白角。
4. 主體（帳篷／建築／標誌物）永遠放**正中央，佔畫面 60–70%**。
5. **純色平塗為主**，最多天空一層漸變；唔用陰影、唔用發光。
6. 一定要有一粒「**縮到 16px 都認得出**」嘅高對比形狀（例如大圓太陽）。
7. **主色要同 manifest 嘅 `theme_color`／`background_color` 一致。**

### 5. maskable 規格

- 直接用**同一張滿版圖**出 maskable，唔需要另做一個設計。
- 但主體必須收喺**中央 66% 安全區**內，邊緣只可以放樹梢／天空／草地。
- **實測放 80% 會被裁走，一定要用 66%。**

### 6. 16×16 一定要手繪，唔准縮

1024 縮到 16px 實測係**一團糊**。16px 版另外用 ImageMagick 手繪三層色：

```bash
convert -size 16x16 xc:'#F0B285' \
  -fill '#2C5A3C' -draw 'rectangle 0,11 15,15' \
  -fill '#E8822B' -draw 'circle 8,6.5 8,2.8' \
  -fill '#F5F1E2' -draw 'polygon 8,4 13.2,14 2.8,14' \
  -fill '#2C3B33' -draw 'polygon 8,8.4 10.2,14 5.8,14' \
  -strip PNG8:favicon-16.png
```

> 顏色換成該 app 主題色，**形狀保持三層：天、主體、地。**

### 7. HTML／manifest 掛法

`index.html` 嘅 `<head>` 必須有 **5 條 link ＋ 4 條 meta**：

```html
<link rel="icon" href="/icons/favicon.ico" sizes="any" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
<link rel="apple-touch-icon" type="image/png" sizes="180x180" href="/icons/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#XXXXXX" />
<meta property="og:image" content="https://<絕對網域>/icons/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

> ⚠️ **`sizes` 同 `type` 一定要寫明**，尤其 `apple-touch-icon`。
> 冇寫 `sizes` 的話，按尺寸排優嘅取用方（索引站、書籤管理器）會當佢「未知尺寸」排到 32px 細圖之後 —— 結果有 180px 大圖都唔用，攞 32px 放大化開。
> - `sizes` 一律寫明（`16x16`／`32x32`／`180x180`／`192x192`／`512x512`；`.ico` 寫 `any`）
> - **PNG 一定要有 `type="image/png"`**；`.ico` 可以唔寫 `type`（瀏覽器一定識）

> ⚠️ **`og:image` 必須絕對網址**。用相對路徑＝分享平台攞唔到＝貼落 WhatsApp 淨係得一行字。

`manifest.webmanifest` 要 **4 個 icon**（`any` 192／`any` 512／`maskable` 192／`maskable` 512），
`display` 用 `standalone`，`theme_color` 同 `background_color` 要同圖標主色一致。

### 8. 體積預算同減色指令

- **9 個檔加埋 ≤ 260 KB。**
- **成個 `dist/`／`build/` ≤ 1 MB。**
- 一律減色，肉眼睇唔出分別：

```bash
convert in.png -dither None -colors 48 -strip PNG8:out.png            # 512 級
convert in.png -dither None -colors 32 -strip PNG8:out.png            # 192 及以下
convert in.png -dither FloydSteinberg -colors 64 -strip PNG8:og-image.png
```

- ⚠️ **唔准「先縮再放大」**：實測 `-resize 50% -colors 32 -resize 200%` 反而由 15.8 KB 變 **18.2 KB**。
- `favicon.ico` 由三個 PNG 合成：

```bash
convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
```

### 9. 驗收（唔可以靠肉眼）

1. **9 個檔存在，尺寸正確**（用程式讀 PNG IHDR，CI 未必有 ImageMagick `identify`）。
2. **三個 HTML 實測**：
   - 分頁有圖
   - iOS Safari「加入主畫面」有圖且四角**無白邊**
   - 貼連結落 WhatsApp 有 **1200×630 預覽**
3. manifest **4 個 icon 全部 200 OK**。
4. 體積符合 §8 體積預算。
5. `/icons/*` 設 `Cache-Control: public, max-age=31536000, immutable`。
   ⚠️ 因此**圖標一改就要改檔名**（例如 `icon-512-v2.png`），**唔可以原地覆蓋**。

### 10. 已知陷阱（踩過嘅坑）

1. AI 生成圖標好易**加白邊＋圓角外框** → prompt 要明講 `full bleed`、`no border`、`no rounded corners`。
2. AI 生成圖標可能**只得 2 隻色** → prompt 要列明 **4–6 隻指定顏色**。
3. **唔可以靠縮做 16px**，必須手繪。
4. **maskable 安全區用 66%**，唔好用 80%。
5. 換圖標後用戶主畫面**仍然見舊圖**（系統 cache）→ 要通知用戶「刪咗再加一次」。
6. **`og:image` 用相對路徑 = 分享冇圖。**

### 11. 來源

以上數字全部來自 `hkcamping` **v1.12.1** 實測（icons/ 244 KB、dist 467.5 KB、guard 18/18、test 21/21、ui 112/112）。
如要對照實際檔案，去 [`playerkousas-rgb/hkcamping`](https://github.com/playerkousas-rgb/hkcamping) 嘅 README
「App Icon／favicon（v1.12.1）」一節，有完整表格同設計色票。

### 12. 取用方配合原則（如有入口站／索引頁抓其他站圖標）

日後如有新 app 扮演「取用方」（例如入口站、書籤頁、目錄頁去抓其他站嘅圖標），按呢四條通用原則配合：

1. **大圖優先**：按實際顯示尺寸 × 2（高密度螢幕）揀大圖（512 → 180/192 → 細圖），唔好優先揀 32–128px。
2. **合併 `<link>` 同 `manifest` 候選**：唔好讀完 `<link rel="icon">` 就停 —— 唔少 app 嘅 `512×512` 只放喺 `manifest.webmanifest`。
3. **缺屬性容錯**：`apple-touch-icon` 冇寫 `sizes` 當 `180×180`；冇寫 `type` 由副檔名推斷。
4. **外部細圖降級，唔好硬放大**：控制唔到素材嘅外部連結，若攞到嘅圖細過顯示門檻（如 `<64px`），降級顯示字母牌／預設圖示，好過將 16px 硬拉大成一嚿糊。
