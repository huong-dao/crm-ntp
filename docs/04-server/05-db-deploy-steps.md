# Deploy sau bước 3.6 — Database + Login

## Trên server (SSH)

```bash
cd ~/nodejs   # thư mục app
git pull origin main
npm install

# Cập nhật .env — bắt buộc có DATABASE_URL + AUTH_SECRET
nano .env
```

```env
DATABASE_URL="postgresql://user:pass@host:5432/ntp_members"
AUTH_SECRET="openssl-rand-base64-32"
AUTH_URL="https://thamvieng.ntpchurch.org"
NEXTAUTH_URL="https://thamvieng.ntpchurch.org"
```

```bash
# Tạo tables + Prisma Client + admin + ban ngành
npm run db:migrate
npm run db:generate
npm run db:seed

# Build & restart
npm run build
# Restart app trên DirectAdmin panel
```

## Đăng nhập

- URL: https://thamvieng.ntpchurch.org/login
- **admin** / **admin123** (đổi password sau khi test)

## Lưu ý PostgreSQL trên DirectAdmin

Hosting **MySQL** (phổ biến trên DirectAdmin): xem [`06-mysql-directadmin.md`](./06-mysql-directadmin.md).

Schema Prisma dùng **MySQL** (`provider = mysql`).

Nếu có PostgreSQL riêng, có thể chuyển lại `provider = postgresql` trong `prisma/schema.prisma`.
