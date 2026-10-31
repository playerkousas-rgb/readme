# 24 — 現有項目與相近產品參考

以下整理用戶提供的比較及來源，供研發前調查參考，**不是功能實測或完整競品清單**。外部產品和項目會更新，功能、價格、授權及可用性須於決策前重新核實；部分項目為原型、範本或仍待實測，不能假設已投入使用。

## 童軍行政與獎章

- `troop-portal`、`scoutsystem-2.0`、`troop-attendance`、`ecportal`、`82venture`、`vs_portal`：最相近的是 **Online Scout Manager**，都有成員資料、點名、活動及獎章管理等功能。你的項目較集中處理香港旅團、支部及表格流程；不過 `troop-portal` 的公開 README 亦將它描述為重構中的 UI prototype，不能假設所有功能已正式投入使用。[Online Scout Manager](https://www.onlinescoutmanager.co.uk/) · [troop-portal](https://github.com/playerkousas-rgb/troop-portal)
- `cubsbadge`、`scoutbadge`、`vsbadge`、`roverbadge`：香港童軍總會的 **YMIS** 亦有進度性獎章紀錄。你的工具更集中各支部的詳細進度及工作流程；`scoutbadge` README 已列出 **YMIS 匯入**，兩者不只是競爭關係。YMIS 的比較依據是總會 2018 年文件，未登入核實現況。[總會文件](https://www.scout.org.hk/article_attach/30945/acr502018_c.pdf) · [scoutbadge](https://github.com/playerkousas-rgb/scoutbadge)
- `dbs3.0`、`DGA`：**Award Force** 有申請、評審、評分及結果管理，部分流程相似；但你的系統分別針對香港童軍專科報章和優異旅團評分，不能當成完全相同產品。[Award Force](https://awardforce.com/solutions/contest-management-software/) · [dbs3.0](https://github.com/playerkousas-rgb/dbs3.0) · [DGA](https://github.com/playerkousas-rgb/DGA)
- `course`、`scout-district-portal`、`member-portal`、`skw-booking-system`：香港童軍總會 **TMS 訓練管理系統**已有課程網上報名及付款；**Teamup** 則有場地預約、防撞期功能。Teamup 已出現在區管理平台借場流程中，是正在使用的服務，不只是外部競品。[TMS](https://tms.scout.org.hk/member/course/2157/circular) · [Teamup](https://www.teamup.com/resource-bookings/) · [scout-district-portal](https://github.com/playerkousas-rgb/scout-district-portal)
- `event`、`CERT`：**Eventbrite** 可處理活動報名和 QR 報到，但不等於整套大型活動行政流程；`event` 的部分 2027 內容仍屬範本或待完成。證書方面，**Word＋Excel 合併列印**可完成批量套印；`CERT` 另外針對預印證書對位及校準，並支援匯入官方 Word 範本。[Eventbrite](https://www.eventbrite.com/features/registration/) · [Microsoft](https://support.microsoft.com/en-us/word/mail-merge-using-an-excel-spreadsheet) · [CERT](https://github.com/playerkousas-rgb/CERT)

## 地圖、遠足與戶外

- `HM20C`：最接近的是地政總署 **MyMapHK**：已有離線 iB20000、GPX 匯入和已匯入路線瀏覽。**香港遠足路線**亦有離線地圖、繪線、距離、高度及 GPX 功能。你的定位是童軍手機讀圖、按要求**不用 GPS**，並嘗試鎖定比例及方向；但真實政府圖幅下載、CORS 和整幅離線效果仍待手機實測，暫不能說已完全替代它們。[MyMapHK](https://apps.apple.com/hk/app/mymaphk/id793615275?l=en-GB) · [香港遠足路線](https://apps.apple.com/hk/app/hiking-trail-hk/id1403380232?l=en-GB)
- `HKMAP`：**Purple Pen** 同樣可設計定向檢查點、路線及列印地圖。差別是 Purple Pen 主要是電腦端定向設計軟件；`HKMAP` 偏向直接在瀏覽器製作香港城市定向紙圖。[Purple Pen](https://purplepen.golde.org/) · [HKMAP](https://github.com/playerkousas-rgb/HKMAP)
- `drawtheroute`：**plotaroute** 支援畫路線、查看高度、列印及 GPX 等格式；你的項目則特別加入香港格網、Naismith 估時和行程表等用途。[plotaroute](https://www.plotaroute.com/runningrouteplanner) · [drawtheroute](https://github.com/playerkousas-rgb/drawtheroute)
- `hkcamping`、`scoutworld`：**GoCampingHK** 有香港營地資料；**營火部落**有台灣營地資料庫，也是項目曾參考的同類例子，但服務地區不同。`scoutworld` 部分內容可與世界童軍組織的 **SCENES** 資料對照；後者亦可作資料來源。[GoCampingHK](https://gocamping.hk/%E5%9C%B0%E5%9C%96-%E9%A6%99%E6%B8%AF%E7%87%9F%E5%9C%B0%E7%B8%BD%E8%A6%BD/) · [營火部落](https://campfiretw.com/camp-database/) · [SCENES](https://treehouse.scout.org/scenes)
- `skw-tracking-signs`：**Actionbound** 有 QR、地點、任務及問答，工具形式部分相似；但它偏向互動尋寶，而你的項目明確是**觀察地面追蹤符號，不預先顯示下一個符號**，玩法並不一樣。[Actionbound](https://en.actionbound.com/bound/actionbound-and-museums) · [skw-tracking-signs](https://github.com/playerkousas-rgb/skw-tracking-signs)

## 集會、遊戲與學習

- `ghmeeting`、`cubsmeeting`、`scoutmeeting`、`vsmeeting`：香港童軍總會的**旅團支援平台**已有行政文件和團集會套包；你的項目則按不同支部整理成互動式集會助手。[總會](https://www.scout.org.hk/tc/scout-units/association-headquarters/index.html?id=8)
- `GAME`、`minigame`、`CUBSGAME`：**Kahoot!** 有多人問答；**skribbl.io** 有多人猜畫。它們只對應遊戲庫的部分玩法，不是整套替代。[Kahoot!](https://support.kahoot.com/hc/en-us/articles/4409807867539-How-to-use-Kahoot-for-free-as-a-participant-or-student) · [skribbl.io](https://skribbl.io/)
- `code`、`decode`、`knotmaster`：**dCode** 有密碼編碼及解碼；**Animated Knots** 有逐步繩結動畫。`knotmaster` 實站較偏繩結卡牌圖鑑與收集，和動畫教學網站並非同一玩法。[dCode](https://www.dcode.fr/caesar-cipher) · [Animated Knots](https://www.animatedknots.com/figure-8-knot)
- `AYP`、`upgrade`：官方 **AYP 網站**已有紀錄簿及評核程序；你的 `AYP` 是輔助指南，不能取代官方認可。`upgrade` 則將香港童軍升團、制服及家長需要的資料整理成互動指南。[AYP](https://ayp.org.hk/join/) · [upgrade](https://github.com/playerkousas-rgb/upgrade)
- `scout-circulars`、`MD`、`answer`：官方網站本身提供通告和教材；**NotebookLM** 可按上載文件問答及引用來源，與 `MD` 的文件檢索方向部分相近。資料是否最新、引用是否準確仍要核對。[NotebookLM](https://support.google.com/notebooklm/answer/16269187?hl=en)

## 設計、相片與語音

- `scoutdesign`：**TruePatch Designer** 可在線設計和訂製布章，功能相近；你的項目另有童軍巾圈與製作規格方向，但概念圖仍需工廠核稿及打樣。[TruePatch](https://owlbadges.com/truepatch-designer) · [scoutdesign](https://github.com/playerkousas-rgb/scoutdesign)
- `doll`、`DRAWSCOUT`：**Cartoonify** 可組合卡通人物；**Canva** 有漫畫格排版。你的項目較針對童軍角色及教材；`DRAWSCOUT` 公開描述包括提示詞、貼入圖片和 A4 排版，未核實它能否在站內直接自動生圖。[Cartoonify](https://www.cartoonify.de/) · [Canva](https://www.canva.com/create/comic-strips/) · [DRAWSCOUT PR](https://github.com/playerkousas-rgb/DRAWSCOUT/pull/2)
- `card`、`cardmaster`、`prompt`：**MakePlayingCards** 可設計卡牌正反面並訂製；**Dextrous** 可設計遊戲卡及匯出列印。你的項目分別偏向撲克牌排版、TCG 卡牌與提示詞，因此只是部分重疊。[MakePlayingCards](https://www.makeplayingcards.com/) · [Dextrous](https://www.dextrous.com.au/blog/dextrous-the-online-card-game-maker)
- `photo-edit`：**Photopea** 同樣可在瀏覽器本機修圖；你的工具另外列有相片轉 3D 浮雕、STL／OBJ 輸出，這部分不宜直接當成 Photopea 的相同功能。[Photopea](https://www.photopea.com/) · [photo-edit](https://github.com/playerkousas-rgb/photo-edit)
- `AvianDex`、`skw-birdex2`、`birddex3`：**Merlin Bird ID** 提供相片及聲音辨鳥；你的項目還有鳥類圖鑑和收集玩法。`AvianDex` 已連結 Cornell／eBird 等資料；公開 PR 亦提過聽聲辨雀需要配置模型，現時是否已配置要再核實。[Merlin](https://merlin.allaboutbirds.org/) · [AvianDex](https://github.com/playerkousas-rgb/AvianDex) · [PR](https://github.com/playerkousas-rgb/AvianDex/pull/3)
- `troop-carema`：**Google Photos** 有共享相簿；你的工具則集中拍攝後分類及上傳到旅團 Google Drive，本機模式不會自動同步。[Google Photos](https://support.google.com/photos/answer/6131416?hl=en&co=GENIE.Platform%3DDesktop) · [troop-carema](https://github.com/playerkousas-rgb/troop-carema)
- `MCScript`、`voice_slide_web`：**PromptSmart** 可跟隨聲音捲動講稿；**VoiceFlow** 可用語音控制 PowerPoint。`voice_slide_web` 是先將投影片匯出為圖片，再以講稿或關鍵句觸發換頁；與直接載入 `.pptx` 有分別。[PromptSmart](https://promptsmart.com/) · [VoiceFlow](https://www.voiceflow.us/) · [voice_slide_web](https://github.com/playerkousas-rgb/voice_slide_web)
- `website`、`GEMINI`：**Linktree** 同樣提供一頁多連結入口；`website` 有童軍級別及分類篩選，`GEMINI` 則是 Gemini 分享工具目錄。[Linktree](https://linktr.ee/features/link-in-bio) · [GEMINI](https://github.com/playerkousas-rgb/GEMINI)
