#!/bin/bash

# RoomX 数据库连接测试脚本
echo "Testing RoomX Database Connection..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 测试MySQL端口
test_mysql_port() {
    log_info "Testing MySQL port 3306..."
    
    if command -v netstat &> /dev/null; then
        if netstat -tuln 2>/dev/null | grep -q ":3306 "; then
            log_success "MySQL port 3306 is listening"
            return 0
        fi
    elif command -v lsof &> /dev/null; then
        if lsof -i :3306 2>/dev/null | grep -q "LISTEN"; then
            log_success "MySQL port 3306 is listening"
            return 0
        fi
    fi
    
    log_error "MySQL port 3306 is not listening"
    return 1
}

# 测试数据库连接
test_database_connection() {
    log_info "Testing database connection..."
    
    # 检查配置文件
    if [ ! -f "src/main/resources/application-dev.yml" ]; then
        log_error "Development configuration file not found"
        return 1
    fi
    
    # 提取数据库配置
    DB_URL=$(grep "url:" src/main/resources/application-dev.yml | head -1 | sed 's/.*url: //')
    DB_USER=$(grep "username:" src/main/resources/application-dev.yml | head -1 | sed 's/.*username: //')
    DB_PASS=$(grep "password:" src/main/resources/application-dev.yml | head -1 | sed 's/.*password: //')
    
    log_info "Database URL: $DB_URL"
    log_info "Database User: $DB_USER"
    
    # 尝试使用Java测试连接
    if command -v java &> /dev/null; then
        log_info "Testing connection with Java..."
        
        # 创建临时测试类
        cat > TestDBConnection.java << 'EOF'
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class TestDBConnection {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/roomx?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
        String user = "root";
        String password = "515155Xxx";
        
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection conn = DriverManager.getConnection(url, user, password);
            System.out.println("Database connection successful!");
            conn.close();
            System.exit(0);
        } catch (ClassNotFoundException e) {
            System.err.println("MySQL JDBC Driver not found: " + e.getMessage());
            System.exit(1);
        } catch (SQLException e) {
            System.err.println("Database connection failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
EOF
        
        # 编译并运行测试
        if javac TestDBConnection.java 2>/dev/null; then
            if java TestDBConnection 2>/dev/null; then
                log_success "Database connection test passed"
                rm -f TestDBConnection.java TestDBConnection.class
                return 0
            else
                log_error "Database connection test failed"
                rm -f TestDBConnection.java TestDBConnection.class
                return 1
            fi
        else
            log_warn "Cannot compile test class, skipping Java test"
            rm -f TestDBConnection.java
        fi
    fi
    
    return 0
}

# 显示设置指导
show_setup_guide() {
    echo ""
    echo "Database Setup Guide:"
    echo "===================="
    echo ""
    echo "1. Install MySQL:"
    echo "   macOS: brew install mysql"
    echo "   Ubuntu: sudo apt install mysql-server"
    echo "   Windows: Download from mysql.com"
    echo ""
    echo "2. Start MySQL service:"
    echo "   macOS: brew services start mysql"
    echo "   Ubuntu: sudo systemctl start mysql"
    echo "   Windows: Start MySQL service"
    echo ""
    echo "3. Create database:"
    echo "   mysql -u root -p -e 'CREATE DATABASE roomx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;'"
    echo ""
    echo "4. Set root password (if needed):"
    echo "   mysql -u root -p -e 'ALTER USER \"root\"@\"localhost\" IDENTIFIED BY \"515155Xxx\";'"
    echo ""
    echo "5. Verify connection:"
    echo "   mysql -u root -p515155Xxx -e 'USE roomx; SHOW TABLES;'"
    echo ""
}

# 主函数
main() {
    echo "RoomX Database Connection Test"
    echo "============================="
    echo ""
    
    # 测试MySQL端口
    if test_mysql_port; then
        # 测试数据库连接
        if test_database_connection; then
            log_success "All database tests passed!"
            echo ""
            echo "You can now run: ./start-dev.sh"
        else
            log_error "Database connection test failed"
            show_setup_guide
        fi
    else
        log_error "MySQL service is not running"
        show_setup_guide
    fi
}

# 运行主函数
main "$@" 