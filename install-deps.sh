#!/bin/bash

sudo rm -rf ./target

set -e

echo "开始安装依赖..."

# 检查并安装 Node.js 和 npm
if ! command -v node &> /dev/null; then
  echo "未检测到 Node.js，正在安装..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# 安装前端依赖
if [ -f "src/frontend/package.json" ]; then
  echo "安装前端依赖..."
  cd src/frontend
  npm install
  cd ../..
fi

# 检查并安装 JDK 21
if ! java -version 2>&1 | grep "21" &> /dev/null; then
  echo "未检测到 JDK 21，正在安装..."
  sudo apt-get update
  sudo apt-get install -y openjdk-21-jdk
fi

# 检查并安装 Maven
if ! command -v mvn &> /dev/null; then
  echo "未检测到 Maven，正在安装..."
  sudo apt-get install -y maven
fi

# 下载后端依赖
if [ -f "pom.xml" ]; then
  echo "下载后端依赖..."
  mvn dependency:resolve
fi

# 检查并安装 MySQL
echo "检查并安装 MySQL..."
if ! command -v mysql &> /dev/null; then
  echo "未检测到 MySQL，正在安装..."
  sudo apt-get update
  sudo apt-get install -y mysql-server
  echo "MySQL 安装完成。"
else
  echo "已检测到 MySQL，无需安装。"
fi

echo "依赖安装完成！"
