#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版 OSM 解析脚本 - 直接运行
"""
import json
import math

# ========== 配置 ==========
OSM_FILE = "zijinggang.osm"
DATA_JS = "static/js/data.js"
OUTPUT_JSON = "osm_data.json"

# 预先定义的 OSM 边界（从文件头读取）
OSM_BOUNDS = {
    'min_lat': 30.2968900,
    'max_lat': 30.3131400,
    'min_lng': 120.0652000,
    'max_lng': 120.0876300
}

# 2D 地图边界
MAP_2D = {
    'width': 1000,
    'height': 1000
}

# 建筑名称映射
NAME_MAPPING = {
    'qiushi_auditorium': '求是大讲堂',
    'old_management_building': '浙江大学行政楼',
    'south_gate': '浙江大学南大门',
    'zju_gymnasium': '体育馆',
    'zju_library': '主图书馆',
    'zju_crescent_building': '月牙楼',
    'qizhen_hotel': '圆正·启真酒店',
    'nanhua_garden': '南华园',
    'medical_college': '浙江大学医学院',
    'pharmacy_college': '浙江大学药学院',
    'life_science_college': '生命科学学院',
    'agricultural_college': '农业与生物技术学院',
    'environmental_resource_college': '环境与资源学院',
    'animal_science_college': '动物科学学院',
    'bioengineering_food_college': '生物系统工程与食品科学学院',
    'nano_building': '浙江加州国际纳米技术研究所',
    'mengmingwei_building': '蒙民伟楼 / 图书信息C楼',
    'public_administration_college': '公共管理学院',
    'humanities_college': '人文学院',
    'education_college': '教育学院',
    'art_archaeology_museum': '浙江大学艺术与考古博物馆'
}


def parse_simple():
    """简单 XML 解析 OSM"""
    print("正在解析 OSM 文件...")
    
    nodes = {}
    buildings = []
    
    import xml.etree.ElementTree as ET
    tree = ET.parse(OSM_FILE)
    root = tree.getroot()
    
    # 1. 先读取所有节点
    print("  读取节点...")
    for node in root.findall('node'):
        node_id = int(node.get('id'))
        lat = float(node.get('lat'))
        lng = float(node.get('lon'))
        nodes[node_id] = (lat, lng)
    
    print(f"  共 {len(nodes)} 个节点")
    
    # 2. 读取建筑
    print("  读取建筑...")
    for way in root.findall('way'):
        # 检查是否是建筑
        tags = {t.get('k'): t.get('v') for t in way.findall('tag')}
        if 'building' not in tags and 'amenity' not in tags:
            continue
            
        # 获取节点引用
        node_refs = [int(n.get('ref')) for n in way.findall('nd')]
        
        # 获取坐标
        coords = []
        for ref in node_refs:
            if ref in nodes:
                coords.append(nodes[ref])
        
        if not coords:
            continue
            
        # 计算中心点
        lats = [c[0] for c in coords]
        lngs = [c[1] for c in coords]
        center_lat = sum(lats) / len(lats)
        center_lng = sum(lngs) / len(lngs)
        
        buildings.append({
            'osm_id': int(way.get('id')),
            'name': tags.get('name', ''),
            'name_en': tags.get('name:en', ''),
            'type': tags.get('building', tags.get('amenity', 'yes')),
            'center': [center_lng, center_lat],
            'tags': tags
        })
    
    print(f"  共 {len(buildings)} 个建筑")
    return buildings


def convert_coords(lng, lat):
    """经纬度 → 像素坐标"""
    x = (lng - OSM_BOUNDS['min_lng']) / (OSM_BOUNDS['max_lng'] - OSM_BOUNDS['min_lng'])
    y = (lat - OSM_BOUNDS['min_lat']) / (OSM_BOUNDS['max_lat'] - OSM_BOUNDS['min_lat'])
    
    px = x * MAP_2D['width']
    py = MAP_2D['height'] - y * MAP_2D['height']
    
    return px, py


def main():
    print("="*60)
    print("紫金港 OSM 解析工具")
    print("="*60)
    
    # 1. 解析
    buildings = parse_simple()
    
    # 2. 显示有名称的建筑
    print("\n已命名建筑:")
    named = [b for b in buildings if b['name']]
    for b in sorted(named, key=lambda x: x['name']):
        px, py = convert_coords(b['center'][0], b['center'][1])
        print(f"  {b['name']:30s} @ ({b['center'][0]:.6f}, {b['center'][1]:.6f}) → ({px:.0f}, {py:.0f})")
    
    # 3. 保存
    output = {
        'osm_bounds': OSM_BOUNDS,
        'map_2d': MAP_2D,
        'buildings': buildings,
        'name_mapping': NAME_MAPPING
    }
    
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n保存到: {OUTPUT_JSON}")
    
    # 4. 创建坐标转换的 JS 文件
    create_coordinate_js(buildings)


def create_coordinate_js(buildings):
    """创建前端用的坐标转换 JS"""
    js_content = f"""/**
 * 坐标转换系统
 * 自动生成 - 基于 OSM 数据
 */
const CoordinateSystem = {{
    osmBounds: {json.dumps(OSM_BOUNDS, ensure_ascii=False)},
    map2DSize: {MAP_2D},
    
    wgs84ToPixel(lng, lat) {{
        const x = (lng - this.osmBounds.min_lng) / (this.osmBounds.max_lng - this.osmBounds.min_lng);
        const y = (lat - this.osmBounds.min_lat) / (this.osmBounds.max_lat - this.osmBounds.min_lat);
        return [
            x * this.map2DSize.width,
            this.map2DSize.height - y * this.map2DSize.height
        ];
    }},
    
    pixelToWgs84(px, py) {{
        const x = px / this.map2DSize.width;
        const y = 1 - (py / this.map2DSize.height);
        return [
            this.osmBounds.min_lng + x * (this.osmBounds.max_lng - this.osmBounds.min_lng),
            this.osmBounds.min_lat + y * (this.osmBounds.max_lat - this.osmBounds.min_lat)
        ];
    }},
    
    wgs84To3D(lng, lat, height = 0) {{
        const [px, py] = this.wgs84ToPixel(lng, lat);
        const scale = 10;
        return [
            (px - this.map2DSize.width / 2) / scale,
            height / scale,
            (py - this.map2DSize.height / 2) / scale
        ];
    }}
}};

const OSMBuildings = {json.dumps([b for b in buildings if b['name']], ensure_ascii=False, indent=2)};
"""
    
    with open("static/js/coordinate_system.js", 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    print("创建: static/js/coordinate_system.js")


if __name__ == '__main__':
    main()
