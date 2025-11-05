# Deployment Guide

This guide provides instructions for deploying Trello Vibe to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Docker Deployment](#docker-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Backend Server:**

- **OS**: Ubuntu 22.04 LTS or similar
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 20GB+ SSD
- **Node.js**: v20.x LTS
- **PostgreSQL**: v15+
- **Redis**: v7+

**Frontend CDN:**

- Static file hosting (Vercel, Netlify, CloudFront, etc.)

### Software Dependencies

```bash
# Node.js v20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm@latest

# PostgreSQL 15
sudo apt-get install -y postgresql-15 postgresql-contrib-15

# Redis
sudo apt-get install -y redis-server

# PM2 (Process Manager)
npm install -g pm2

# Nginx (Reverse Proxy)
sudo apt-get install -y nginx

# Certbot (SSL Certificates)
sudo apt-get install -y certbot python3-certbot-nginx
```

## Environment Setup

### Environment Variables

Create production environment files:

**Backend (`packages/backend/.env.production`):**

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=trello_vibe_prod
DATABASE_USER=trello_vibe
DATABASE_PASSWORD=<strong-password>
DATABASE_SSL=true
DATABASE_LOGGING=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>
REDIS_DB=0

# JWT
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
FRONTEND_URL=https://app.trello-vibe.com

# WebSocket
WEBSOCKET_CORS_ORIGIN=https://app.trello-vibe.com

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# Logging
LOG_LEVEL=info
```

**Frontend (`packages/frontend/.env.production`):**

```env
VITE_API_URL=https://api.trello-vibe.com/api/v1
VITE_WS_URL=wss://api.trello-vibe.com
```

### Generate Secrets

```bash
# Generate JWT secret (use this in JWT_SECRET)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate Redis password
openssl rand -base64 32
```

## Database Setup

### PostgreSQL Configuration

1. **Create database and user:**

```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database
CREATE DATABASE trello_vibe_prod;

-- Create user
CREATE USER trello_vibe WITH ENCRYPTED PASSWORD '<strong-password>';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE trello_vibe_prod TO trello_vibe;

-- Exit
\q
```

2. **Configure PostgreSQL for production:**

Edit `/etc/postgresql/15/main/postgresql.conf`:

```conf
# Connections
max_connections = 100
shared_buffers = 256MB

# Logging
log_min_duration_statement = 1000  # Log slow queries (>1s)
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d '

# Performance
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

3. **Run migrations:**

```bash
cd packages/backend
pnpm run migration:run
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:

```conf
# Bind to localhost only (use Unix socket for better security)
bind 127.0.0.1

# Require password
requirepass <redis-password>

# Persistence
save 900 1
save 300 10
save 60 10000

# Memory
maxmemory 256mb
maxmemory-policy allkeys-lru

# Logging
loglevel notice
```

Restart Redis:

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
```

## Backend Deployment

### Build Application

```bash
cd packages/backend

# Install dependencies
pnpm install --prod=false

# Build TypeScript
pnpm run build

# Install production dependencies only
pnpm install --prod

# The build output is in dist/
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'trello-vibe-api',
      script: 'dist/main.js',
      cwd: '/var/www/trello-vibe/packages/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/trello-vibe/error.log',
      out_file: '/var/log/trello-vibe/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
    },
  ],
};
```

### Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs trello-vibe-api
```

### Nginx Configuration

Create `/etc/nginx/sites-available/trello-vibe-api`:

```nginx
# Upstream backend
upstream trello_api {
    least_conn;
    server 127.0.0.1:3000;
}

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name api.trello-vibe.com;

    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.trello-vibe.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.trello-vibe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.trello-vibe.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/trello-api-access.log;
    error_log /var/log/nginx/trello-api-error.log;

    # Proxy settings
    location / {
        proxy_pass http://trello_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://trello_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

Enable site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/trello-vibe-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate

```bash
# Install SSL certificate
sudo certbot --nginx -d api.trello-vibe.com

# Auto-renewal (certbot creates a cron job automatically)
sudo certbot renew --dry-run
```

## Frontend Deployment

### Build for Production

```bash
cd packages/frontend

# Install dependencies
pnpm install

# Build
pnpm run build

# Output is in dist/
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd packages/frontend
vercel --prod

# Configure custom domain in Vercel dashboard
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd packages/frontend
netlify deploy --prod

# Follow prompts to configure
```

### Deploy to Nginx

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.trello-vibe.com;

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.trello-vibe.com;

    ssl_certificate /etc/letsencrypt/live/app.trello-vibe.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.trello-vibe.com/privkey.pem;

    root /var/www/trello-vibe/packages/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Docker Deployment

### Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: trello_vibe_prod
      POSTGRES_USER: trello_vibe
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    env_file:
      - ./packages/backend/.env.production
    ports:
      - '3000:3000'
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Dockerfile for Backend

`packages/backend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN pnpm run build

# Production image
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main"]
```

### Deploy with Docker

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop
docker-compose -f docker-compose.prod.yml down
```

## Monitoring & Maintenance

### Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 web dashboard
pm2 web

# View logs
pm2 logs

# Restart application
pm2 restart trello-vibe-api

# Reload (zero-downtime)
pm2 reload trello-vibe-api
```

### Database Backups

```bash
# Create backup script
cat > /usr/local/bin/backup-trello-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/trello-vibe"
mkdir -p $BACKUP_DIR

pg_dump -U trello_vibe trello_vibe_prod | gzip > $BACKUP_DIR/trello_vibe_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "trello_vibe_*.sql.gz" -mtime +30 -delete
EOF

chmod +x /usr/local/bin/backup-trello-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-trello-db.sh
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor system resources
htop

# Monitor disk I/O
iotop

# Monitor network
nethogs
```

### Log Rotation

Create `/etc/logrotate.d/trello-vibe`:

```conf
/var/log/trello-vibe/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs trello-vibe-api --err

# Check environment variables
pm2 env <process-id>

# Verify database connection
psql -U trello_vibe -d trello_vibe_prod -h localhost

# Check Redis connection
redis-cli -a <password> ping
```

### High Memory Usage

```bash
# Restart application
pm2 reload trello-vibe-api

# Adjust PM2 max memory restart
pm2 stop trello-vibe-api
# Edit ecosystem.config.js: max_memory_restart: '2G'
pm2 start ecosystem.config.js
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Check connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

### SSL Certificate Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Restart Nginx
sudo systemctl reload nginx
```

## Security Checklist

- [ ] Strong database passwords set
- [ ] JWT secret is cryptographically random
- [ ] Redis password enabled
- [ ] Firewall configured (ufw/iptables)
- [ ] SSH key authentication only
- [ ] Regular security updates applied
- [ ] SSL/TLS certificates valid
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Backups automated and tested

## Performance Optimization

### Database

```sql
-- Create indexes
CREATE INDEX CONCURRENTLY idx_cards_list_id ON cards(list_id);
CREATE INDEX CONCURRENTLY idx_cards_board_id ON cards(board_id);

-- Analyze tables
ANALYZE cards;
ANALYZE boards;
ANALYZE lists;
```

### Redis Caching

Verify cache hit rates:

```bash
redis-cli INFO stats | grep keyspace
```

### Load Testing

```bash
# Run k6 performance tests
cd packages/backend/test/performance
k6 run load-test.js
```

## Rollback Procedure

```bash
# List PM2 applications
pm2 list

# Stop current version
pm2 stop trello-vibe-api

# Deploy previous version
cd /var/www/trello-vibe-previous
pm2 start ecosystem.config.js

# Rollback database migrations (if needed)
cd packages/backend
pnpm run migration:revert
```

---

For questions or issues, refer to the documentation in `/docs` or create an issue on GitHub.
