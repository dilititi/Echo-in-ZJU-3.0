import json

# ── 你的 MAPPING ────────────────────────────────────────────────────────────
MAPPING = {
    'qiushi_auditorium':              '求是大讲堂',
    'old_management_building':        '浙江大学行政楼',
    'south_gate':                     '浙江大学南大门',
    'zju_gymnasium':                  '体育馆',
    'zju_library':                    '主图书馆',
    'zju_crescent_building':          '月牙楼',
    'qizhen_hotel':                   '圆正·启真酒店',
    'nanhua_garden':                  '南华园',
    'medical_college':                '浙江大学医学院',
    'pharmacy_college':               '浙江大学药学院',
    'life_science_college':           '生命科学学院',
    'agricultural_college':           '农业与生物技术学院',
    'environmental_resource_college': '环境与资源学院',
    'animal_science_college':         '动物科学学院',
    'bioengineering_food_college':    '生物系统工程与食品科学学院',
    'nano_building':                  '浙江加州国际纳米技术研究所',
    'mengmingwei_building':           '蒙民伟楼 / 图书信息C楼',
    'public_administration_college':  '公共管理学院',
    'humanities_college':             '人文学院',
    'education_college':              '教育学院',
    'art_archaeology_museum':         '浙江大学艺术与考古博物馆',
}

# 反查：中文名 → js key
NAME_TO_KEY = {v: k for k, v in MAPPING.items()}

# ── 读取 OSM 数据 ────────────────────────────────────────────────────────────
with open(r'C:\Users\chen\CascadeProjects\interactive-school-map\osm_data.json', encoding='utf-8') as f:
    osm = json.load(f)

# ── 提取每个 way 的名称和轮廓 ────────────────────────────────────────────────
results = {}   # js_key → { footprint, height }
unmatched = [] # OSM 里有但 MAPPING 没匹配到的

for el in osm.get('elements', []):
    if el['type'] != 'way':
        continue
    tags = el.get('tags', {})
    # OSM 中文名可能在 name、name:zh 或 name:en
    osm_name = tags.get('name:zh') or tags.get('name') or ''
    if not osm_name:
        continue

    geometry = el.get('geometry', [])
    if len(geometry) < 3:
        continue

    coords = [[round(pt['lon'], 6), round(pt['lat'], 6)] for pt in geometry]

    # 尝试精确匹配
    js_key = NAME_TO_KEY.get(osm_name)

    # 尝试模糊匹配（OSM 名字可能只是 MAPPING 值的一部分）
    if not js_key:
        for zh_name, key in NAME_TO_KEY.items():
            if zh_name in osm_name or osm_name in zh_name:
                js_key = key
                break

    if js_key:
        height = None
        if 'building:levels' in tags:
            try:
                height = int(tags['building:levels']) * 3  # 每层约 3 米
            except:
                pass
        if 'height' in tags:
            try:
                height = float(tags['height'].replace('m', '').strip())
            except:
                pass

        results[js_key] = {
            'footprint': coords,
            'height': height or 12,  # 默认 12 米（4 层）
            'osm_name': osm_name,
        }
    else:
        unmatched.append(osm_name)

# ── 输出结果 ─────────────────────────────────────────────────────────────────
print("=" * 60)
print("✅ 匹配成功，可复制进 data.js：")
print("=" * 60)

for js_key, data in results.items():
    coords_str = json.dumps(data['footprint'], ensure_ascii=False)
    print(f"""
// {MAPPING[js_key]}（OSM: {data['osm_name']}）
{js_key}: {{
  ...  // 保留你原有的字段
  footprint: {coords_str},
  height: {data['height']},
}},""")

print("\n" + "=" * 60)
print(f"✅ 匹配到 {len(results)}/{len(MAPPING)} 栋建筑")
print(f"❌ MAPPING 未匹配：{set(MAPPING.values()) - {d['osm_name'] for d in results.values()}}")
print(f"⚠️  OSM 有但未匹配：{unmatched[:10]}")  # 只显示前 10 个
print("=" * 60)

# ── 同时输出一个干净的 JSON 供调试 ───────────────────────────────────────────
with open('footprints_output.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
print("\n📁 完整结果已写入 footprints_output.json")