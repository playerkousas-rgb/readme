# 42 — 兩個新 repo 開工對話（Icon Maker／Photo Prep，各一段，成段貼去新 repo 第一個對話）

> 用戶 2026-11-07 決定：[Icon Maker](../templates/iconmaker/icon_maker_v1.0.html) 同 [Photo Prep](../templates/iconmaker/photo_prep_v1.0.html) 各開一個新 repo 公開畀多人用（唔入 Gemini、唔加 AI——兩個都係死運算工具，理由見 [41 §3](41-free-self-build-shortlist.md) F1／F2）。下面兩段係開新 repo 之後貼去第一個 AI 對話嘅開工稿，建議 repo 名：`icon-maker`／`photo-prep`（用戶可改名，對話內容唔使改）。
> 注意：兩個模板而家喺 readme 倉嘅 `arena/676e77bf-readme` 分支；merge 入 main 之後喺 main 抄都得。

## 第一段：Icon Maker 新 repo

```
我要開一個新 GitHub repo 做「G11 圖標產生器」公開工具站，唔該跟以下規格開工：

【背景】我哋嘅真理倉係 github.com/playerkousas-rgb/readme，入面 templates/iconmaker/icon_maker_v1.0.html 已經有一份做好、通過靜態審計嘅 Type A 單一 HTML 工具（上載方形母圖 → 瀏覽器本地出齊 9 個圖標檔：16/32/180/192/512/maskable×2/favicon.ico/og-image，連 <head> code 同 manifest 畀人 copy），同埋 templates/iconmaker/README.md 講晒用法同限制。圖標規格以真理倉 docs/33-icon-standard.md 為準，唔好自己改規格。

【要做】① 將 icon_maker_v1.0.html 抄入新 repo 做主頁，保留檔內雙版號（檔名＋內文，readme docs/13 規矩）；② 加 README（用途、點用、限制，內容抄真理倉嗰份改）；③ 加 .gitignore 同真理倉 scripts 入面嘅 guard/audit 檢查（抄得到就抄，抄唔到就照真理倉 templates/README.md 嘅一鍵抄指令）；④ 用 Vercel 部署做公開靜態站，唔使登入就用到；⑤ 交付加 © SCOUT SYSTEM（真理倉 W1 規矩）。

【紅線】唔加 AI（縮圖、出尺寸、砌 ICO 係死運算，唔好 call 任何模型）；唔起後端、唔收用戶上載嘅圖去任何 server（全部喺用戶瀏覽器本地處理，呢個係賣點）；唔加模板以外嘅新功能（唔做 AI 生圖、唔做 ZIP 打包、唔扮自動生成 16px 手繪版）；唔好喺真理倉改模板當交付，改動喺新 repo 做。

【驗收】交付前跑 audit_single_html 要 PASS；跟住做真機驗收（真理倉 docs/33 §9）：favicon 喺瀏覽器分頁認唔認到、iPhone 加去主畫面圖標啱唔啱、Android maskable 圓裁有冇切走個樣、WhatsApp 分享預覽出唔出到 og-image、多檔逐個下載順唔順——測完將結果寫入新 repo README，未測到嘅明寫未測，唔好扮測咗。
```

## 第二段：Photo Prep 新 repo

```
我要開一個新 GitHub repo 做「相片預備工具」公開工具站，唔該跟以下規格開工：

【背景】我哋嘅真理倉係 github.com/playerkousas-rgb/readme，入面 templates/iconmaker/photo_prep_v1.0.html 已經有一份做好、通過靜態審計嘅 Type A 單一 HTML 工具（上載相 → 瀏覽器本地壓到目標 KB（預設 500KB）／轉 JPEG·WebP·PNG／揀最長邊／前後大小對照，相重新編碼時 EXIF 自動移除）。

【要做】① 將 photo_prep_v1.0.html 抄入新 repo 做主頁，保留檔內雙版號（檔名＋內文，readme docs/13 規矩）；② 加 README（用途、點用、限制：做唔到無損壓縮、壓得太細會起格，寫明）；③ 加 .gitignore 同真理倉 scripts 入面嘅 guard/audit 檢查（照真理倉 templates/README.md 嘅一鍵抄指令）；④ 用 Vercel 部署做公開靜態站，唔使登入就用到；⑤ 交付加 © SCOUT SYSTEM（真理倉 W1 規矩）。

【紅線】唔加 AI（壓縮、轉格式、去 EXIF 係死運算，唔好 call 任何模型）；唔起後端、絕對唔好將用戶嘅相上載去任何 server（全部喺用戶瀏覽器本地處理，相唔離開部機係呢個工具最大賣點，寫入 README 當承諾）；唔加模板以外嘅新功能（唔做 AI 修圖、唔做放大修復）；唔好喺真理倉改模板當交付，改動喺新 repo 做。

【驗收】交付前跑 audit_single_html 要 PASS；跟住實試：JPEG/WebP/PNG 三種格式各出一張、目標 500KB 壓唔壓得入、壓完用工具驗 EXIF 真係冇咗、手機瀏覽器開唔開到同順唔順——測完將結果寫入新 repo README，未測到嘅明寫未測，唔好扮測咗。
```

## 用完點算

- 兩個 repo 起好部署好之後，返嚟真理倉更新 [41](41-free-self-build-shortlist.md) F1／F2 狀態（加公開連結）同 [40](40-canvas-diy-candidates.md) §2.1／§2.4 驗收結果，唔好等啲狀態喺文件同現實之間 drift。
- 新 repo 之後嘅改版跟返嗰邊自己嘅雙版號規矩，唔好返嚟改真理倉模板當交付；模板要改就兩邊各自升版兼寫明來源。
