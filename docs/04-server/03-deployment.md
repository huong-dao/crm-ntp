# Deployment Guide

## Deploy Flow

```
Code changes → git push → SSH server → git pull → install → migrate → build → restart → verify
```

---

## Deploy Script

Tạo file `deploy.sh` trên server:

```bash
#!/bin/bash
set -e

APP_DIR="/var/www/ntp"
cd $APP_DIR

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

echo "=== Running migrations ==="
npx prisma migrate deploy

echo "=== Building ==="
pnpm build

echo "=== Restarting app ==="
pm2 restart ntp-app

echo "=== Deploy complete ==="
pm2 status
```

```bash
chmod +x deploy.sh
```

Chạy deploy:
```bash
./deploy.sh
```

---

## First-time Production Deploy

```bash
# 1. SSH vào server
ssh ntpadmin@your-server-ip

# 2. Clone project
cd /var/www/ntp
git clone https://github.com/your-repo/ntp.git .

# 3. Setup env
cp .env.example .env
nano .env  # Điền DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET

# 4. Install & build
pnpm install
npx prisma migrate deploy
npx prisma db seed  # Tạo admin account

# 5. Build production
pnpm build

# 6. Start with PM2
pm2 start npm --name "ntp-app" -- start
pm2 save
pm2 startup

# 7. Configure Nginx (xem 01-server-setup.md)

# 8. SSL
sudo certbot --nginx -d your-domain.com

# 9. Verify
curl -I https://your-domain.com
```

---

## Update Deploy (hàng ngày)

```bash
ssh ntpadmin@your-server-ip
cd /var/www/ntp
./deploy.sh
```

---

## Rollback

```bash
# Xem commit history
git log --oneline -10

# Rollback code
git checkout <previous-commit-hash>
pnpm install
pnpm build
pm2 restart ntp-app

# Rollback database (nếu cần)
pg_restore -U ntp_user -d ntp_members -c /var/backups/ntp/ntp_YYYYMMDD.dump
```

---

## Environment Variables (Production)

```env
# .env (KHÔNG commit file này)
DATABASE_URL="postgresql://ntp_user:STRONG_PASSWORD@localhost:5432/ntp_members"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NODE_ENV="production"
```

---

## PM2 Commands

```bash
pm2 status              # Xem trạng thái
pm2 logs ntp-app        # Xem logs
pm2 logs ntp-app --lines 100  # 100 dòng log gần nhất
pm2 restart ntp-app     # Restart
pm2 stop ntp-app        # Stop
pm2 delete ntp-app      # Xóa process
pm2 monit               # Monitor real-time
```

---

## Nginx Log

```bash
# Access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log
```

---

## Health Check

Tạo endpoint kiểm tra (optional):

```typescript
// src/app/api/health/route.ts
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', timestamp: new Date() });
  } catch {
    return Response.json({ status: 'error' }, { status: 500 });
  }
}
```

```bash
curl https://your-domain.com/api/health
# {"status":"ok","timestamp":"..."}
```

---

## Go-live Checklist

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| 1 | Code trên main branch stable | `[ ]` |
| 2 | All tests passed | `[ ]` |
| 3 | .env production configured | `[ ]` |
| 4 | Database migrated | `[ ]` |
| 5 | Admin password changed (không dùng default) | `[ ]` |
| 6 | SSL working | `[ ]` |
| 7 | PM2 running | `[ ]` |
| 8 | Nginx configured | `[ ]` |
| 9 | Backup cron active | `[ ]` |
| 10 | Smoke test all pages | `[ ]` |
| 11 | Import real member data | `[ ]` |
| 12 | Create user accounts | `[ ]` |
| 13 | User training completed | `[ ]` |

---

## Post-go-live Monitoring

| Tool | Mục đích | Free? |
|------|----------|-------|
| PM2 | Process monitoring | ✅ |
| UptimeRobot | Uptime check (5 min interval) | ✅ |
| Nginx logs | Access/error tracking | ✅ |
| PostgreSQL logs | DB issues | ✅ |
| Cron backup | Daily DB backup | ✅ |
