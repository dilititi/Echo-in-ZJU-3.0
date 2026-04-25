# 使用官方Python镜像作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 安装gunicorn作为WSGI服务器
RUN pip install --no-cache-dir gunicorn

# 暴露端口
EXPOSE 10000

# 环境变量默认值
ENV DEBUG=False
ENV SECRET_KEY=your_secret_key_here
ENV API_KEY=default_api_key
ENV PORT=10000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "--workers", "1", "--timeout", "120", "server:app"]
