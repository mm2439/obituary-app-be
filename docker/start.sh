#!/usr/bin/env bash
# docker/start.sh
set -Eeuo pipefail

# --- Config from env with sane defaults ---
export APP_PORT="${PORT:-${APP_PORT:-3001}}"
DB_NAME="${DB_DATABASE:-obituary_db}"
DB_USER="${DB_USERNAME:-app}"
DB_PASS="${DB_PASSWORD:-change_me}"

DATA_DIR="/var/lib/mysql"
SOCKET_DIR="/run/mysqld"
DB_SOCKET="${SOCKET_DIR}/mysqld.sock"
DB_PID="${SOCKET_DIR}/mysqld.pid"

# --- Clean shutdown of mysqld on exit ---
cleanup() {
  if [[ -f "$DB_PID" ]] && kill -0 "$(cat "$DB_PID")" 2>/dev/null; then
    echo "Stopping MariaDB…"
    mariadb-admin --socket="$DB_SOCKET" shutdown || true
  fi
}
trap cleanup EXIT

echo "Preparing MariaDB directories…"
# Ensure runtime (socket/pid) dir exists each boot
mkdir -p "$SOCKET_DIR"
chown -R mysql:mysql "$SOCKET_DIR"
rm -f "$DB_SOCKET" "$DB_PID"

# Ensure data dir ownership (important when a Render disk is mounted here)
mkdir -p "$DATA_DIR"
chown -R mysql:mysql "$DATA_DIR"

# Initialize data dir on first run
if [[ ! -d "${DATA_DIR}/mysql" ]]; then
  echo "Initializing MariaDB data directory…"
  mariadb-install-db --user=mysql --datadir="$DATA_DIR" >/dev/null
fi

# --- Start MariaDB (loopback only; not exposed publicly) ---
echo "Starting MariaDB…"
mysqld \
  --user=mysql \
  --datadir="$DATA_DIR" \
  --bind-address=127.0.0.1 \
  --socket="$DB_SOCKET" \
  --pid-file="$DB_PID" &
MYSQLD_PID=$!

# --- Wait until DB is ready ---
echo "Waiting for MariaDB to accept connections…"
for i in {1..60}; do
  if mariadb-admin --socket="$DB_SOCKET" ping --silent; then
    echo "MariaDB is up."
    break
  fi
  if ! kill -0 "$MYSQLD_PID" 2>/dev/null; then
    echo "❌ mysqld exited unexpectedly."
    exit 1
  fi
  sleep 1
done

# --- Bootstrap DB & user (safe to re-run) ---
echo "Bootstrapping database & user…"
mariadb --socket="$DB_SOCKET" <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

# --- Run migrations (retry once if needed) ---
echo "Running Sequelize migrations…"
npx sequelize-cli db:migrate || (echo "Retrying migrations in 3s…" && sleep 3 && npx sequelize-cli db:migrate)

# --- Start the Node app ---
echo "Starting Node app on port ${APP_PORT}…"
exec ${APP_START:-node index.js}
