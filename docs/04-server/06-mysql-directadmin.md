# MySQL trên DirectAdmin — thamvieng.ntpchurch.org

## 1. Tạo file `.env` trên server (SSH)

```bash
cd ~/nodejs   # thư mục app
nano .env
```

**Mẫu** (thay USER, PASSWORD, DATABASE — không commit file này):

```env
DATABASE_URL="mysql://thamvien6a38_user:YOUR_PASSWORD@localhost:3306/thamvien6a38_data?charset=utf8mb4"

AUTH_SECRET="paste-openssl-rand-base64-32"
AUTH_URL="https://thamvieng.ntpchurch.org"
NEXTAUTH_URL="https://thamvieng.ntpchurch.org"
```

Tạo `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

**Host MySQL:** thường là `localhost`. Nếu panel hiện hostname khác (vd `mysql.gaziantep...`), dùng hostname đó thay `localhost`.

---

## 2. Pull code + cài + tạo bảng

```bash
git pull origin main
npm install

npm run db:migrate    # prisma migrate deploy — tạo 5 bảng
npm run db:seed       # tạo admin / admin123

npm run build
# Restart app trên DirectAdmin
```

---

## 3. Kiểm tra trong DirectAdmin

**MySQL Management** → database `thamvien6a38_data` → phải có bảng:

- `users`
- `members`
- `households`
- `visit_teams`
- `visit_requests`

---

## 4. Đăng nhập

https://thamvieng.ntpchurch.org/login

- Username: `admin`
- Password: `admin123` (đổi ngay sau khi test)

---

## DirectAdmin: thư mục `nodejs` vs `nodevenv/.../lib`

Panel thường có **2 chỗ**:

| Vị trí | Nội dung |
|--------|----------|
| `~/nodejs` (bạn SSH vào) | Có thể chỉ là shortcut / thư mục làm việc |
| `~/nodevenv/nodejs/24/lib` | **Application root thật** — `npm install` chạy ở đây |

`npm` chạy script từ **lib** — nếu `prisma/` chỉ có trong `~/nodejs` mà không có trong **lib** → lỗi.

### Kiểm tra

```bash
# Thư mục npm thực sự dùng (theo log lỗi)
ls -la /home/thamvien6a38/nodevenv/nodejs/24/lib/prisma/schema.prisma

# Nếu KHÔNG có → code phải ở trong lib
```

### Cách xử lý (chọn 1)

**A — Deploy vào Application root (khuyên dùng)**

1. DirectAdmin → Node.js → xem **Application root** (thường là `.../nodevenv/nodejs/24/lib`)
2. SSH vào **đúng thư mục đó**:

```bash
cd /home/thamvien6a38/nodevenv/nodejs/24/lib
git clone https://github.com/huong-dao/crm-ntp.git .
# hoặc nếu đã clone ở chỗ khác: git pull trong lib
ls prisma/schema.prisma   # phải có
```

**B — Setup một lệnh (trong application root)**

```bash
cd /home/thamvien6a38/nodevenv/nodejs/24/lib
bash scripts/setup-server.sh
```

Script tự: `npm install` → `prisma generate` → migrate → seed → build.

**C — Thủ công**

```bash
cd /path/to/application/root   # có package.json + prisma/
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
```

**Không dùng** `postinstall` tự động — DirectAdmin nodevenv gây lỗi path.

---

## Lỗi: `Cannot find module '@tailwindcss/postcss'` khi build

**Nguyên nhân:** Panel set `NODE_ENV=production` → `npm install` bỏ qua `devDependencies`. Trước đây Tailwind nằm trong devDependencies; **code mới đã chuyển sang `dependencies`**.

```bash
cd /home/thamvien6a38/nodevenv/nodejs/24/lib

# 1. Pull code mới (package.json phải có @tailwindcss/postcss trong dependencies)
git pull origin main
grep tailwindcss package.json

# 2. Cài thiếu package (nếu vẫn lỗi)
npm install @tailwindcss/postcss tailwindcss --save

# 3. Hoặc cài lại sạch
rm -rf node_modules
npm install

# 4. Build
npm run build
```

Hoặc chạy script setup: `bash scripts/setup-server.sh`

---

## Lỗi: `Could not find Prisma Schema` khi npm install

**Nguyên nhân:** Chạy `npm install` trước `git pull`, hoặc sai thư mục (panel nodevenv).

```bash
# 1. Vào thư mục app — nơi có package.json VÀ folder prisma/
cd ~/domains/thamvieng.ntpchurch.org/nodejs
# hoặc: cd ~/nodejs  (đường dẫn thực tế trên server)

# 2. Pull code mới (có prisma/schema.prisma)
git pull origin main

# 3. Kiểm tra file tồn tại
ls -la prisma/schema.prisma

# 4. Cài lại
npm install
```

Nếu `ls` báo file không có → chưa pull đúng repo hoặc sai thư mục.

**DirectAdmin:** Nút "Run NPM Install" trên panel có thể chạy từ `nodevenv/.../lib` — nên dùng **SSH** trong application root.

| Lỗi | Xử lý |
|-----|--------|
| `Can't connect to MySQL` | Sai host — xem hostname trong panel MySQL |
| `Access denied` | Sai user/password hoặc user chưa gán DB |
| `P1001` / timeout | Thử host `127.0.0.1` thay `localhost` |
| Migration failed | DB trống, chạy lại `npm run db:migrate` |

---

## Bảo mật

- **Không** commit `.env` lên Git
- **Đổi password DB** nếu đã chia sẻ công khai (chat, email)
- Đổi password admin sau go-live
