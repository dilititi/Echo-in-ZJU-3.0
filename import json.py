import json, re

# 读取 footprints
with open(r'C:\Users\chen\CascadeProjects\interactive-school-map\footprints.json', encoding='utf-8') as f:
    footprints = json.load(f)

# 读取 data.js
with open(r'C:\Users\chen\CascadeProjects\interactive-school-map\static\js\data.js', encoding='utf-8') as f:
    content = f.read()

# 对每栋建筑注入 footprint 和 height
for js_key, info in footprints.items():
    fp_str = json.dumps(info['footprint'])
    height  = info['height']

    # 找到 js_key: { 这个块，在第一个字段前插入 footprint/height
    # 匹配形如  js_key: {\n 或 js_key:{\n
    pattern = rf'({re.escape(js_key)}\s*:\s*\{{)'
    replacement = rf'\1\n            footprint: {fp_str},\n            height: {height},'

    new_content, count = re.subn(pattern, replacement, content)
    if count:
        content = new_content
        print(f'✅ {js_key} 注入成功')
    else:
        print(f'⚠️  {js_key} 未找到，请检查 data.js 里的 key 名')

# 写回 data.js
with open(r'C:\Users\chen\CascadeProjects\interactive-school-map\static\js\data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('\n✅ data.js 更新完成')