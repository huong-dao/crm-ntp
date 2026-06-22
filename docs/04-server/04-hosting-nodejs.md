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

## Chạy app (sau build)

| Cách | Lệnh |
|------|------|
| Panel "Startup file" | `app.js` |
| npm | `npm start` hoặc `npm run start:app` |
| PM2 | `pm2 start ecosystem.config.cjs` |

**Application mode** trên panel: chọn **Production** (không phải Development).

## Script tiện ích

```bash
bash scripts/build-server.sh
```
