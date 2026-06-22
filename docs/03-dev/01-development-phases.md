# Development Phases — Chi tiết từng giai đoạn

## Phase 1: Khởi tạo dự án (Ngày 1–2)

### Bước 1.1: Tạo Next.js project trên server

```bash
# SSH vào server
ssh user@your-server-ip

# Tạo project
cd /var/www
npx create-next-app@latest ntp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd ntp
```

### Bước 1.2: Cài dependencies

```bash
# Core
pnpm add @prisma/client next-auth@beta bcryptjs zod

# Dev
pnpm add -D prisma @types/bcryptjs

# UI (shadcn/ui)
pnpm dlx shadcn@latest init
# Chọn: New York style, Zinc color, CSS variables

# shadcn components cần dùng
pnpm dlx shadcn@latest add button input select table dialog badge card tabs dropdown-menu pagination toast sheet avatar separator calendar popover checkbox textarea label
```

### Bước 1.3: Cấu hình Prisma

```bash
npx prisma init
# Copy schema từ docs/02-architecture/02-database-schema.md vào prisma/schema.prisma
# Cấu hình DATABASE_URL trong .env
npx prisma migrate dev --name init
npx prisma db seed
```

### Bước 1.4: Cấu hình NextAuth

- Tạo `src/lib/auth.ts` — NextAuth config
- Tạo `src/app/api/auth/[...nextauth]/route.ts`
- Tạo `src/middleware.ts` — route protection

### Bước 1.5: Push lên Git

```bash
git init
git add .
git commit -m "init: Next.js project with Prisma, NextAuth, Tailwind"
git remote add origin https://github.com/your-repo/ntp.git
git push -u origin main
```

**Checkpoint:** Project chạy được, DB connected, login page hiển thị.

---

## Phase 2: Layout & Auth (Ngày 3–4)

### Bước 2.1: Dashboard Layout
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/dashboard-layout.tsx`
- `src/app/(dashboard)/layout.tsx`

### Bước 2.2: Login Page
- `src/app/(auth)/login/page.tsx`
- Form login + error handling
- Redirect logic

### Bước 2.3: User Management (Admin)
- `src/app/(dashboard)/users/page.tsx`
- Create user form (dialog)
- Toggle active/inactive

**Checkpoint:** Login/logout hoạt động, sidebar navigation, admin tạo user.

---

## Phase 3: Module Thành viên (Ngày 5–8)

### Bước 3.1: Member List
- Server Component fetch members
- Table component với pagination
- Search bar (server-side)
- Filter dropdowns

### Bước 3.2: Member Form
- `src/components/members/member-form.tsx`
- Zod validation schema
- Auto-generate: code, fullName, addresses
- Create + Edit modes

### Bước 3.3: Member Detail
- Read-only view
- Edit/Delete buttons

### Bước 3.4: Export CSV
- Server Action generate CSV
- UTF-8 BOM for Vietnamese

**Checkpoint:** Full CRUD members, search, filter, export.

---

## Phase 4: Module Hộ gia đình (Ngày 9–10)

### Bước 4.1: Household List
- Table với member count (computed)
- Head name (computed from member)

### Bước 4.2: Household Detail
- Members trong hộ
- Link đến member detail

### Bước 4.3: Create Household
- Auto code generation
- Chọn chủ hộ

**Checkpoint:** CRUD households, xem members trong hộ.

---

## Phase 5: Module Tổ thăm viếng (Ngày 11–12)

### Bước 5.1: Visit Team List + CRUD
- Table, create, edit, delete
- Chọn trưởng tổ từ members

**Checkpoint:** CRUD visit teams.

---

## Phase 6: Module Đơn thăm viếng (Ngày 13–15)

### Bước 6.1: Visit Request List
- Table với status badges
- Filters: status, team, date range

### Bước 6.2: Create Visit Request
- Chọn hộ (search/select)
- Chọn tổ, nhân sự, lịch

### Bước 6.3: Update Status
- Quick status change
- Actual date khi completed

**Checkpoint:** Full CRUD visit requests.

---

## Phase 7: Dashboard & Polish (Ngày 16–18)

### Bước 7.1: Dashboard Stats
- Stat cards
- Recent pending visits table

### Bước 7.2: UI Polish
- Responsive testing
- Loading states
- Empty states
- Toast notifications
- Confirm dialogs (delete)

### Bước 7.3: Final Testing
- Full regression test
- Bug fixes

**Checkpoint:** App hoàn chỉnh, ready for UAT.

---

## Quy trình làm việc hàng ngày

```bash
# 1. SSH vào server
ssh user@server-ip

# 2. Pull code mới (nếu code trên máy khác)
cd /var/www/ntp
git pull origin main

# 3. Install dependencies (nếu có thay đổi)
pnpm install

# 4. Run migration (nếu có)
npx prisma migrate deploy

# 5. Dev mode (test)
pnpm dev
# → http://server-ip:3000

# 6. Hoặc build + restart production
pnpm build
pm2 restart ntp-app

# 7. Test trên browser
# → https://your-domain.com
```

## Git Workflow

```
main (production)
  └── feature/xxx (nếu cần branch)
```

Vì dev trên server, workflow đơn giản:
1. Code trên server hoặc local
2. `git add . && git commit -m "feat: ..." && git push`
3. Nếu code local: push → SSH server → pull → build → restart

## Commit Message Convention

```
feat: thêm module thành viên
fix: sửa lỗi search không hoạt động
style: cập nhật UI dashboard
refactor: tách member form component
chore: cập nhật dependencies
docs: cập nhật workflow
```
