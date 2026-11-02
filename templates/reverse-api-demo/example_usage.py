#!/usr/bin/env python3
"""跑一次就明：python3 example_usage.py

呢個檔對應 reverse-api-engineer 生成嘅 example_usage.py，但零依賴、
唔使 LLM、唔使 HAR，方便你睇清楚「自製 API」到底產出咗啲乜。
"""
import json

from api_client import list_files, repo_info

if __name__ == "__main__":
    print("① 原本要開網頁睇嘅 repo 資料 → 一個 function：")
    print(json.dumps(repo_info("playerkousas-rgb", "readme"), ensure_ascii=False, indent=2))

    print("\n② 原本要碌檔案列表睇嘅路徑 → 一個 function（頭 12 條）：")
    for p in list_files("playerkousas-rgb", "readme"):
        print("  -", p)

    print("\n③ 換做私有 API：只改 api_client.py 入面 BASE + headers 兩格，")
    print("   上面兩行呼叫完全唔使改 —— 呢個就係「接後台唔接畫面」嘅意思。")
