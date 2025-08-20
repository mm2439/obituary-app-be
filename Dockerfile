# Dockerfile
FROM debian:stable-slim

# System tools + MariaDB + tini (PID 1)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg tini procps \
    mariadb-server mariadb-client \
  && rm -rf /var/lib/apt/lists/*

# Node (20 or 22)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get update && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# DB data dir (Render disk will mount here)
RUN mkdir -p /var/lib/mysql && chown -R mysql:mysql /var/lib/mysql

# Use tini for clean signal handling
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start script
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# Expose your local dev port (Render will inject $PORT at runtime)
EXPOSE 3001

CMD ["/start.sh"]
