# CHANGELOG v4.2.0 FINAL
v4.0.0 初版
v4.1.0 修復#1-18 + 家長超然=子女聯集,有旅才有超然無旅只能同時用兩個系統
v4.2.0 新增07_CONCURRENCY_AND_PERMISSIONS.md: 問2-7定案 (多人寫入merge3欄位級+LWW、支部/直入雙入口並存、上級設權限封頂原則、三級密碼管理:自己改/上級重設/超管靠Vercel)
v4.2.1 新增08_RISK_REVIEW.md: 三角度審查 - P0(LWW時鐘/tombstone/rate limit/密碼雜湊/key rotation runbook/備份) P1(踢線失效/sig重放/鎖塞/跨支部領袖/升團遷移/ownership/審計/PDPO) P2 19+8項
v4.3.0 新增09_TRANSFER_AND_OPS.md: 升團遷移(歷史不帶/membership移動/家長零改動)、領袖branch_access旅長開通、成員預設1234首登強制改、被吃runbook(01#15反轉:停SIG收本地密碼)、一鍵全庫JSON備份+自動Drive、ACCESS_LOG/AUDIT_LOG、PDPO模板
v4.4.0 新增10_ANNOUNCE_CALENDAR.md: 通告/行事曆/相簿公開資料模型(支部自定義公開類別、寫入旅系統TROOP_OPS、領袖訂閱接收、相簿家長同意閘)、密碼統一(支部改密碼一次改兩個setPw同步、verifyPw parity偵測+常駐提示改齊、oracle rate limit)、09.1修正轉旅/調區家長帳號帶唔走要新旅重開、用語規範取代「吃」
v4.5.0 10.2相簿改提示制(外連結核實唔到內容,發佈提示+領袖確認剔記審計)、新增10.5全模組開關TROOP_MODULES(旅自主權,server-side執行)、10.6行事曆細化(6日曆6色可SORT、支部自訂標籤FILTER、跨支部分享鏈:分享方揀對象→接收領袖揀成員可見、隨時收返)、10.7財務TROOP_FIN(支部key簽寫入、旅長/管理員睇晒+整合現況、成員預設無入口)
v4.5.1 新增11_CODE_REVIEW_ECPORTAL.md: 實際代碼審查 - P0(X1 proxy無驗證注入key=全DB匿名讀寫/X2密碼hash落前端+單次SHA256/X3 fail-open+進度免key公開/X4 withLock失敗照做) P1(X5-X9) P2(X10-X17); 證實01-10 cover晒P0解法; 07衝突處理改merge3 ask模式
v4.6.0 新增12_FRAMEWORK_PRINCIPLES.md: 框架vs支部微調分層、「兩套真理」病根五規矩、UI模組註冊制、標準同步診斷、JSON備份一等公民(離線可匯/剝密碼欄/三時機提醒)、QR公開資料標準輸出(QR永不帶key)
