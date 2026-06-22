# Hosting Node.js (cPanel / DirectAdmin) — build & chạy app

## Lỗi thường gặp

```
⚠ You are using a non-standard "NODE_ENV" value
Error: <Html> should not be imported outside of pages/_document
Export encountered an error on /_error: /500
```

**Nguyên nhân:** Panel hosting set `NODE_ENV=development` (hoặc giá trị lạ) khi chạy `npm run build`.

**Đã fix trong repo:** `npm run build` dùng `cross-env NODE_ENV=production`.

## Build trên server

```bash
cd ~/nodejs   # hoặc thư mục app của bạn
git pull origin main
npm install
npm run build
```

Không cần `unset NODE_ENV` thủ công — `cross-env` trong script build đã ép production.

## Kiểm tra .env

```bash
grep NODE_ENV .env
```

Nếu có dòng `NODE_ENV=...` → **xóa** (Next.js tự quản lý).

## Chạy qua domain (DirectAdmin) — không cần PM2

Trên **DirectAdmin Node.js**, panel tự:
- Gán `PORT` nội bộ (vd: 3001)
- Reverse proxy `https://thamvieng.ntpchurch.org` → `127.0.0.1:PORT`

**Không cần PM2** — panel quản lý process. PM2 chỉ dùng khi có VPS tự cấu hình Nginx.

### Bước 1: Tạo `.env` (SSH)

```bash
cd ~/domains/thamvieng.ntpchurch.org/nodejs   # đường dẫn thực tế của bạn
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/ntp_members"
NEXTAUTH_URL="https://thamvieng.ntpchurch.org"
NEXTAUTH_SECRET="paste-random-string-here"
```

Tạo secret: `openssl rand -base64 32`

**Không** thêm `NODE_ENV` hoặc `PORT` vào `.env` — panel tự set `PORT`.

### Bước 2: DirectAdmin → Setup Node.js App

| Trường | Giá trị |
|--------|---------|
| Node.js version | 20 hoặc 24 |
| Application mode | **Production** |
| Application root | Thư mục có `package.json`, `app.js`, `.next/` |
| Application URL | `thamvieng.ntpchurch.org` |
| Application startup file | **`app.js`** |

Nhấn **Create** / **Save**, sau đó **Run NPM Install** (nếu panel có).

### Bước 3: Build (SSH — đã làm)

```bash
npm run build
```

### Bước 4: SSL

DirectAdmin → **SSL Certificates** → Let's Encrypt cho `thamvieng.ntpchurch.org`.

### Bước 5: Start app

Trong màn Node.js app → **START APP** / **Restart**.

### Bước 6: Kiểm tra

Mở **https://thamvieng.ntpchurch.org** — không cần `:port`.

---

## Nếu không chạy

```bash
# Log trên panel hoặc SSH
cat ~/nodejs/logs/*.log

# Thử chạy tay để xem lỗi
cd /path/to/app
node app.js
```

| Lỗi | Xử lý |
|-----|--------|
| 502 Bad Gateway | App chưa start — Restart trên panel |
| Cannot find module | `npm install` |
| `.next` not found | `npm run build` |
| EADDRINUSE | Restart app trên panel (port bị chiếm) |

## Chạy app (sau build) — VPS / PM2

| Cách | Lệnh |
|------|------|
| Panel "Startup file" | `app.js` |
| npm | `npm start` hoặc `npm run start:app` |
| PM2 | `pm2 start ecosystem.config.cjs` |

## Panel DirectAdmin — Application mode

**Có — nên chuyển sang Production** sau khi build thành công:

1. DirectAdmin → **Node.js** (hoặc Setup Node.js App)
2. **Application mode:** **Production** (không để Development)
3. **Application startup file:** `app.js`
4. **Application root:** thư mục chứa `package.json`

Development mode trên panel thường set `NODE_ENV=nodejs` hoặc giá trị lạ → gây cảnh báo `non-standard NODE_ENV` và lỗi build `/404`, `/500`.

**Build** chạy qua SSH (không phụ thuộc mode panel):

```bash
npm run build
```

Script `scripts/next-build.mjs` ép `NODE_ENV=production` khi gọi `next build`.

## Script tiện ích

```bash
bash scripts/build-server.sh
```
