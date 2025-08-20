#!/usr/bin/env bash
set -euo pipefail

# Required envs (with defaults for local)
: "${DB_DATABASE:=obituary_db}"
: "${DB_USERNAME:=app}"
: "${DB_PASSWORD:=change_me}"
: "${APP_START:=node index.js}"

# Ensure data dir ownership (important when Render mounts a disk here)
chown -R mysql:mysql /var/lib/mysql

# Initialize MariaDB data dir if empty
if [ ! -d "/var/lib/mysql/mysql" ]; then
  echo "Initializing MariaDB data directory..."
  mariadb-install-db --user=mysql --datadir=/var/lib/mysql >/dev/null
fi

# Start MariaDB bound to loopback only (not publicly exposed)
mysqld --user=mysql --datadir=/var/lib/mysql --bind-address=127.0.0.1 &
MYSQL_PID=$!

echo "Waiting for MariaDB to accept connections..."
until mariadb-admin ping --silent; do
  sleep 1
done
echo "MariaDB is up."

# Create DB & app user (safe to re-run)
mariadb <<SQL
CREATE DATABASE IF NOT EXISTS ${DB_DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USERNAME}'@'127.0.0.1' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_DATABASE}.* TO '${DB_USERNAME}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo "Running Sequelize migrations..."
npx sequelize-cli db:migrate || (echo "Retrying migrations in 3s..." && sleep 3 && npx sequelize-cli db:migrate)

echo "Starting Node app..."
exec ${APP_START}
