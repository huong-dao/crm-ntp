# Server Setup — Cài đặt VPS từ đầu

## Yêu cầu VPS

| Spec | Minimum | Recommended |
|------|---------|-------------|
| OS | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| CPU | 1 vCPU | 2 vCPU |
| Disk | 20 GB | 40 GB |
| Bandwidth | 1 TB | Unlimited |

**Nhà cung cấp gợi ý:** Vultr, DigitalOcean, Contabo, Viettel IDC

---

## Bước 1: Kết nối SSH

```bash
ssh root@your-server-ip
```

## Bước 2: Cập nhật system

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip build-essential
```

## Bước 3: Tạo user (không dùng root)

```bash
adduser ntpadmin
usermod -aG sudo ntpadmin
# Copy SSH key nếu cần
rsync --archive --chown=ntpadmin:ntpadmin ~/.ssh /home/ntpadmin
```

Đăng nhập lại với user mới:
```bash
ssh ntpadmin@your-server-ip
```

## Bước 4: Cài Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v    # v20.x.x
npm -v     # 10.x.x

# Cài pnpm
sudo npm install -g pnpm
pnpm -v
```

## Bước 5: Cài PostgreSQL 15

```bash
sudo apt install -y postgresql postgresql-contrib

# Verify
sudo systemctl status postgresql
```

Chi tiết tạo database: [`02-database-setup.md`](./02-database-setup.md)

## Bước 6: Cài Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify: truy cập http://your-server-ip → thấy Nginx welcome page
```

## Bước 7: Cài PM2

```bash
sudo npm install -g pm2
pm2 -v
```

## Bước 8: Cấu hình Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

Ports mở:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)

## Bước 9: Cài SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Sau khi cấu hình Nginx + domain trỏ về server
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal (certbot tự cài cron)
sudo certbot renew --dry-run
```

## Bước 10: Tạo thư mục project

```bash
sudo mkdir -p /var/www/ntp
sudo chown ntpadmin:ntpadmin /var/www/ntp
cd /var/www/ntp
```

## Bước 11: Clone project

```bash
git clone https://github.com/your-repo/ntp.git .
# Hoặc tạo project mới (xem 03-dev/01-development-phases.md)
```

## Bước 12: Tạo file .env

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://ntp_user:YOUR_STRONG_PASSWORD@localhost:5432/ntp_members"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

## Bước 13: Cấu hình Nginx

```bash
sudo nano /etc/nginx/sites-available/ntp
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ntp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Bước 14: Cấu hình PM2

```bash
cd /var/www/ntp
pnpm install
npx prisma migrate deploy
pnpm build

pm2 start npm --name "ntp-app" -- start
pm2 save
pm2 startup
# Copy và chạy lệnh mà pm2 startup hiển thị
```

## Bước 15: Verify

```bash
# Check services
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Check app
curl -I http://localhost:3000
# Truy cập https://your-domain.com trên browser
```

---

## Checklist Server Setup

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| 1 | Ubuntu updated | `[ ]` |
| 2 | User ntpadmin created | `[ ]` |
| 3 | Node.js 20 installed | `[ ]` |
| 4 | PostgreSQL 15 installed | `[ ]` |
| 5 | Database created | `[ ]` |
| 6 | Nginx installed & configured | `[ ]` |
| 7 | PM2 installed | `[ ]` |
| 8 | Firewall configured | `[ ]` |
| 9 | SSL certificate | `[ ]` |
| 10 | Project cloned | `[ ]` |
| 11 | .env configured | `[ ]` |
| 12 | App running on PM2 | `[ ]` |
| 13 | Domain accessible | `[ ]` |

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Port 3000 không accessible | Check PM2: `pm2 logs ntp-app` |
| 502 Bad Gateway | App chưa chạy: `pm2 restart ntp-app` |
| DB connection error | Check `.env` DATABASE_URL, PostgreSQL running |
| SSL error | `sudo certbot renew`, check Nginx config |
| Permission denied | `sudo chown -R ntpadmin:ntpadmin /var/www/ntp` |
