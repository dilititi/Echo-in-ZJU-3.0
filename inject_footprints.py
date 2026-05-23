#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 运行方式：python3 inject_footprints.py
# 把新 footprint 和 height 注入 data.js

import json, re

DATA_JS = "static/js/data.js"
FOOTPRINTS_JSON = "new_footprints.json"

with open(FOOTPRINTS_JSON, encoding="utf-8") as f:
    footprints = json.load(f)

with open(DATA_JS, encoding="utf-8") as f:
    content = f.read()

ok = []
fail = []

for js_key, info in footprints.items():
    fp_str = json.dumps(info["footprint"])
    h      = info["height"]

    # 先移除旧的 footprint 和 height（如果有）
    content = re.sub(
        rf"(\s*footprint\s*:[^,\n]+,?\n?)(?=(?:(?!{re.escape(js_key)}).)*{re.escape(js_key)}|)",
        "", content
    )

    # 在 js_key: { 之后插入新值
    pattern = rf"({re.escape(js_key)}\s*:\s*\{{)"
    replacement = rf"\1\n            footprint: {fp_str},\n            height: {h},"
    new_content, n = re.subn(pattern, replacement, content)
    if n:
        content = new_content
        ok.append(js_key)
    else:
        fail.append(js_key)

with open(DATA_JS, "w", encoding="utf-8") as f:
    f.write(content)

print(f"✅ 注入成功 {len(ok)}/{len(footprints)}: {ok}")
if fail:
    print(f"❌ 未找到 key: {fail}")
