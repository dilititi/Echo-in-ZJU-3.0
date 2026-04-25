#!/bin/bash
"""部署脚本"""

set -e

echo "开始部署交互式校园地图项目..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误：Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误：Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 构建Docker镜像
echo "构建Docker镜像..."
docker-compose build

# 启动容器
echo "启动容器..."
docker-compose up -d

# 检查容器状态
echo "检查容器状态..."
docker-compose ps

# 测试健康检查端点
echo "测试健康检查端点..."
sleep 5
curl -s http://localhost:8000/health

echo "\n部署完成！"
echo "服务已运行在 http://localhost:8000"
