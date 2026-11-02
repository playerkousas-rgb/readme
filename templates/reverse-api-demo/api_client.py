"""最小可用 API client（零第三方依賴，stdlib urllib）。

呢個就係「自製 API」嘅產物形狀：將瀏覽器已經喺度用緊嘅 HTTP request，
拆成 URL / method / headers / params 四格，再包成一個普通 Python function。

注意：示範用嘅係 GitHub **官方** API（sandbox 唯一准許出站嘅 JSON endpoint），
目的係俾你真係跑一次、見到「一個 function -> 一篤 JSON」。
換做網站嘅私有 API 時，client 結構一模一樣，只係要自己由 HAR 搵出
endpoint / headers，而且冇官方文件、冇相容承諾（見 docs/26）。
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://api.github.com"
USER_AGENT = "reverse-api-demo/1.0 (+https://github.com/playerkousas-rgb/readme)"


def _get(path: str, params: dict | None = None) -> dict:
    """打一支 GET，回傳已 parse 嘅 JSON；失敗要出聲，唔好靜靜吞。"""
    url = BASE + path
    if params:
        url += "?" + urllib.parse.urlencode(params)

    # ---- 呢兩行就係由 DevTools「Copy as cURL」拆出嚟嘅 headers ----
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    req = urllib.request.Request(url, headers=headers, method="GET")

    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", "Bearer " + token)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code in (403, 429):
            retry = exc.headers.get("Retry-After")
            raise RuntimeError(
                f"HTTP {exc.code}：被限流／封鎖；Retry-After={retry}。要加退避同 cache。"
            ) from exc
        raise RuntimeError(f"HTTP {exc.code}: {exc.reason} ({url})") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"連線失敗：{exc.reason}") from exc


def repo_info(owner: str, repo: str) -> dict:
    """原本你要開 github.com 個網頁先睇到嘅資料，而家一個 function 就有。"""
    data = _get(f"/repos/{owner}/{repo}")
    return {
        "full_name": data.get("full_name"),
        "description": data.get("description"),
        "stars": data.get("stargazers_count"),
        "default_branch": data.get("default_branch"),
        "license": (data.get("license") or {}).get("spdx_id"),
        "updated_at": data.get("updated_at"),
    }


def list_files(owner: str, repo: str, ref: str = "main", limit: int = 12) -> list[str]:
    """原本要碌檔案列表先睇到嘅路徑，而家直接問後台棵 tree。"""
    data = _get(f"/repos/{owner}/{repo}/git/trees/{urllib.parse.quote(ref)}", {"recursive": "1"})
    if data.get("truncated"):
        raise RuntimeError("tree 被截斷：要改用 Git Trees API 逐層攞，唔好當完整")
    return [item["path"] for item in data.get("tree", [])[:limit]]
