sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '515155Xxx'; FLUSH PRIVILEGES;"
sudo mysql -u root -p
sleep 10
sudo mysql -e "CREATE DATABASE IF NOT EXISTS roomx;"