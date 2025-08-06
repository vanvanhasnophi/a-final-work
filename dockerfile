# 使用多阶段构建
FROM node:18-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制前端文件
COPY src/frontend/package*.json ./
RUN npm ci --only=production

# 复制前端源代码
COPY src/frontend/ ./
RUN npm run build

# 后端构建阶段
FROM maven:3.9.6-openjdk-21 AS backend-builder

# 设置工作目录
WORKDIR /app

# 复制Maven配置文件
COPY pom.xml ./
COPY src/ ./src/

# 构建后端应用
RUN mvn clean package -DskipTests

# 运行阶段
FROM openjdk:21-jdk-slim

# 设置工作目录
WORKDIR /app

# 安装必要的包
RUN apt-get update && apt-get install -y \
    curl \
    mysql-server \
    mysql-client \
    && rm -rf /var/lib/apt/lists/*

# 创建MySQL数据目录
RUN mkdir -p /var/lib/mysql && \
    mkdir -p /var/run/mysqld && \
    chown -R mysql:mysql /var/lib/mysql && \
    chown -R mysql:mysql /var/run/mysqld

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 从后端构建阶段复制jar文件
COPY --from=backend-builder /app/target/roomX-*.jar app.jar

# 从前端构建阶段复制构建文件到静态资源目录
COPY --from=frontend-builder /app/build/ ./src/main/resources/static/

# 复制启动脚本
COPY start.sh ./
RUN chmod +x start.sh

# 复制数据库初始化脚本
COPY init.sql ./

# 设置文件权限
RUN chown -R appuser:appuser /app

# 切换到应用用户
USER appuser

# 暴露端口
EXPOSE 8080 3306

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# 使用start.sh启动应用
CMD ["./start.sh"]