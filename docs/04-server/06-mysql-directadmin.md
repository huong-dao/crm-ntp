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
