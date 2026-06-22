# Database Setup — PostgreSQL

## Bước 1: Tạo Database và User

```bash
sudo -u postgres psql
```

```sql
-- Tạo user
CREATE USER ntp_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Tạo database
CREATE DATABASE ntp_members OWNER ntp_user;

-- Cấp quyền
GRANT ALL PRIVILEGES ON DATABASE ntp_members TO ntp_user;

-- Kết nối vào database
\c ntp_members

-- Cấp quyền schema (PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO ntp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ntp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ntp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ntp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ntp_user;

\q
```

## Bước 2: Verify kết nối

```bash
psql -U ntp_user -d ntp_members -h localhost
# Nhập password → kết nối thành công
\dt
# Chưa có table (sẽ tạo qua Prisma migrate)
\q
```

## Bước 3: Cấu hình .env

```env
DATABASE_URL="postgresql://ntp_user:YOUR_STRONG_PASSWORD@localhost:5432/ntp_members"
```

## Bước 4: Chạy Prisma Migration

```bash
cd /var/www/ntp

# Development (tạo migration mới)
npx prisma migrate dev --name init

# Production (apply migration)
npx prisma migrate deploy

# Verify tables
npx prisma studio
# Hoặc
psql -U ntp_user -d ntp_members -c "\dt"
```

Kết quả mong đợi:
```
            List of relations
 Schema |      Name       | Type  |  Owner
--------+-----------------+-------+----------
 public | households      | table | ntp_user
 public | members         | table | ntp_user
 public | users           | table | ntp_user
 public | visit_requests  | table | ntp_user
 public | visit_teams     | table | ntp_user
```

## Bước 5: Seed Data

```bash
npx prisma db seed
```

Tạo:
- 1 admin account (username: `admin`, password: `admin123`)
- 2 tổ thăm viếng mẫu
- 3 hộ gia đình mẫu
- 10 thành viên mẫu

**⚠️ Đổi password admin ngay sau khi seed trên production!**

---

## Backup Database

### Manual backup

```bash
pg_dump -U ntp_user -d ntp_members -F c -f /var/backups/ntp_members_$(date +%Y%m%d).dump
```

### Restore

```bash
pg_restore -U ntp_user -d ntp_members -c /var/backups/ntp_members_20260622.dump
```

### Auto backup (cron)

```bash
# Tạo thư mục backup
sudo mkdir -p /var/backups/ntp
sudo chown ntpadmin:ntpadmin /var/backups/ntp

# Thêm cron job
crontab -e
```

```cron
# Backup hàng ngày lúc 2:00 AM, giữ 30 ngày
0 2 * * * pg_dump -U ntp_user -d ntp_members -F c -f /var/backups/ntp/ntp_$(date +\%Y\%m\%d).dump && find /var/backups/ntp -name "*.dump" -mtime +30 -delete
```

---

## Bảo mật PostgreSQL

```bash
# Chỉ cho phép local connection
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Đảm bảo chỉ có:
```
local   all   all   peer
host    all   all   127.0.0.1/32   scram-sha-256
```

```bash
sudo systemctl restart postgresql
```

PostgreSQL **không** expose ra internet — chỉ Next.js app kết nối local.

---

## Monitoring

```bash
# Kiểm tra kích thước DB
psql -U ntp_user -d ntp_members -c "SELECT pg_size_pretty(pg_database_size('ntp_members'));"

# Kiểm tra số records
psql -U ntp_user -d ntp_members -c "SELECT 'members' as table, count(*) FROM members UNION ALL SELECT 'households', count(*) FROM households UNION ALL SELECT 'visit_teams', count(*) FROM visit_teams UNION ALL SELECT 'visit_requests', count(*) FROM visit_requests UNION ALL SELECT 'users', count(*) FROM users;"

# Active connections
psql -U ntp_user -d ntp_members -c "SELECT count(*) FROM pg_stat_activity WHERE datname='ntp_members';"
```
