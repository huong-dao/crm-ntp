# Workflow Master — Hệ thống Quản lý Thành viên HTTL Nguyễn Tri Phương

> **Mục đích:** File trung tâm ghi lại toàn bộ các bước cần làm theo vai trò, từ phân tích yêu cầu đến deploy production.
>
> **Cách dùng nhanh:** Trong Cursor chat, gõ **"tiếp tục"** — agent sẽ đọc `progress.json` và thực hiện bước tiếp theo chưa làm.
>
> | Lệnh | Ý nghĩa |
> |------|---------|
> | `tiếp tục` | Làm 1 bước tiếp theo |
> | `tiếp tục 3 bước` | Làm 3 bước (bỏ qua manual nếu chưa confirm) |
> | `trạng thái` | Xem % tiến độ |
> | `bước 3.1` | Làm bước cụ thể |
> | `đã xong 0.1` | Đánh dấu bước manual hoàn thành |
>
> Chi tiết: [`WORKFLOW-EXECUTOR.md`](./WORKFLOW-EXECUTOR.md) · Trạng thái: [`progress.json`](./progress.json) · Hành động: [`workflow-steps.json`](./workflow-steps.json)

---

## Tổng quan dự án

| Hạng mục | Chi tiết |
|----------|----------|
| Tên dự án | NTP Member Management |
| Mô tả | Quản lý nội bộ thành viên Hội Thánh Tin Lành Nguyễn Tri Phương |
| Stack | Next.js (App Router) + PostgreSQL + Prisma + Tailwind + NextAuth |
| Mô hình | Next.js tương tác DB trực tiếp (Server Actions / API Routes) |
| Môi trường dev | Không có DB local → dev trên server |

---

## Phase 0 — Chuẩn bị & Server Setup

> Chi tiết: [`04-server/01-server-setup.md`](./04-server/01-server-setup.md)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 0.1 | Mua/đăng ký VPS (Ubuntu 22.04+, RAM ≥ 2GB) | DevOps | `[ ]` |
| 0.2 | Cài Node.js 20 LTS, npm/pnpm | DevOps | `[ ]` |
| 0.3 | Cài PostgreSQL 15+ | DevOps | `[ ]` |
| 0.4 | Cài Nginx (reverse proxy) | DevOps | `[ ]` |
| 0.5 | Cài PM2 (process manager) | DevOps | `[ ]` |
| 0.6 | Cài Git, clone repo lên server | DevOps | `[ ]` |
| 0.7 | Tạo database `ntp_members` + user DB | DevOps | `[ ]` |
| 0.8 | Cấu hình firewall (22, 80, 443) | DevOps | `[ ]` |
| 0.9 | Cài SSL (Let's Encrypt / Certbot) | DevOps | `[ ]` |
| 0.10 | Tạo file `.env` trên server | DevOps | `[ ]` |

---

## Phase 1 — Business Analysis (BA)

> Chi tiết: [`01-ba/`](./01-ba/)

| # | Bước | Vai trò | File tham chiếu | Trạng thái |
|---|------|---------|----------------|------------|
| 1.1 | Phân tích yêu cầu nghiệp vụ | BA | [`01-requirements-analysis.md`](./01-ba/01-requirements-analysis.md) | `[x]` |
| 1.2 | Viết User Stories & Acceptance Criteria | BA | [`02-user-stories.md`](./01-ba/02-user-stories.md) | `[x]` |
| 1.3 | Đặc tả chức năng chi tiết (Functional Spec) | BA | [`03-functional-spec.md`](./01-ba/03-functional-spec.md) | `[x]` |
| 1.4 | Review yêu cầu với stakeholder (Ban chấp sự) | BA + Stakeholder | — | `[ ]` |
| 1.5 | Chốt scope MVP vs Phase 2 | BA | — | `[ ]` |

---

## Phase 2 — Kiến trúc & Thiết kế

> Chi tiết: [`02-architecture/`](./02-architecture/)

| # | Bước | Vai trò | File tham chiếu | Trạng thái |
|---|------|---------|----------------|------------|
| 2.1 | Chọn tech stack & giải pháp | Architect / Dev | [`01-tech-stack.md`](./02-architecture/01-tech-stack.md) | `[x]` |
| 2.2 | Thiết kế database schema | Architect / Dev | [`02-database-schema.md`](./02-architecture/02-database-schema.md) | `[x]` |
| 2.3 | Thiết kế sitemap & navigation | UX / Dev | [`03-sitemap.md`](./02-architecture/03-sitemap.md) | `[x]` |
| 2.4 | Thiết kế API Routes / Server Actions | Dev | [`04-api-design.md`](./02-architecture/04-api-design.md) | `[x]` |
| 2.5 | Thiết kế UI/UX (màu sắc, font, layout) | UX / Dev | [`05-ui-design.md`](./02-architecture/05-ui-design.md) | `[x]` |
| 2.6 | Review & chốt thiết kế | Team | — | `[ ]` |

---

## Phase 3 — Development

> Chi tiết: [`03-dev/`](./03-dev/)

### 3A — Khởi tạo dự án

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.1 | Init Next.js project trên server | Dev | `[x]` |
| 3.2 | Cài dependencies (Prisma, NextAuth, Tailwind, shadcn/ui) | Dev | `[ ]` |
| 3.3 | Cấu hình Prisma + kết nối DB | Dev | `[ ]` |
| 3.4 | Chạy migration tạo tables | Dev | `[ ]` |
| 3.5 | Seed data mẫu (nếu cần) | Dev | `[ ]` |
| 3.6 | Cấu hình NextAuth (login/logout) | Dev | `[ ]` |
| 3.7 | Push code lên Git (GitHub/GitLab) | Dev | `[ ]` |

### 3B — Module Authentication

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.8 | Trang Login | Dev | `[ ]` |
| 3.9 | Admin tạo tài khoản User | Dev | `[x]` |
| 3.10 | Middleware bảo vệ route (auth guard) | Dev | `[ ]` |
| 3.11 | Phân quyền Admin vs User | Dev | `[ ]` |
| 3.12 | Logout | Dev | `[ ]` |

### 3C — Module Thành viên (Members)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.13 | Danh sách thành viên (table + search + filter) | Dev | `[x]` |
| 3.14 | Thêm thành viên mới | Dev | `[x]` |
| 3.15 | Sửa thông tin thành viên | Dev | `[x]` |
| 3.16 | Xóa / vô hiệu hóa thành viên | Dev | `[x]` |
| 3.17 | Export danh sách (Excel/CSV) | Dev | `[x]` |
| 3.18 | Import danh sách từ Excel/CSV | Dev | `[x]` |

### 3D — Module Hộ gia đình (Households)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.19 | Danh sách hộ | Dev | `[x]` |
| 3.20 | Chi tiết hộ (thành viên trong hộ) | Dev | `[x]` |
| 3.21 | Thêm / sửa / xóa hộ | Dev | `[x]` |

### 3E — Module Tổ thăm viếng (Visit Teams)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.22 | Danh sách tổ thăm viếng | Dev | `[x]` |
| 3.23 | Thêm / sửa / xóa tổ | Dev | `[x]` |
| 3.24 | Gán khu vực phụ trách | Dev | `[x]` |

### 3F — Module Đơn thăm viếng (Visit Requests)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.25 | Danh sách đơn thăm viếng | Dev | `[x]` |
| 3.26 | Tạo đơn thăm viếng mới | Dev | `[x]` |
| 3.27 | Cập nhật tình trạng & ngày thăm thực tế | Dev | `[x]` |
| 3.28 | Gán nhân sự thăm viếng | Dev | `[x]` |
| 3.29 | Lọc theo tổ / tình trạng / lịch | Dev | `[x]` |

### 3G — Dashboard & UI

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 3.30 | Layout dashboard (sidebar, header) | Dev | `[ ]` |
| 3.31 | Dashboard overview (số liệu tổng quan) | Dev | `[x]` |
| 3.32 | Responsive mobile | Dev | `[x]` |
| 3.33 | Dark/Light mode (optional) | Dev | `skip` |

---

## Phase 4 — Testing

> Chi tiết: [`05-testing/01-test-plan.md`](./05-testing/01-test-plan.md)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 4.1 | Viết test plan | Tester | `[x]` |
| 4.2 | Test Authentication (login, logout, phân quyền) | Tester | `[ ]` |
| 4.3 | Test CRUD Thành viên | Tester | `[ ]` |
| 4.4 | Test CRUD Hộ gia đình | Tester | `[ ]` |
| 4.5 | Test CRUD Tổ thăm viếng | Tester | `[ ]` |
| 4.6 | Test CRUD Đơn thăm viếng | Tester | `[ ]` |
| 4.7 | Test Import/Export | Tester | `[ ]` |
| 4.8 | Test UI responsive | Tester | `[ ]` |
| 4.9 | Test bảo mật (SQL injection, XSS, auth bypass) | Tester | `[ ]` |
| 4.10 | Ghi bug report & Dev fix | Tester + Dev | `[ ]` |
| 4.11 | Regression test sau fix | Tester | `[ ]` |
| 4.12 | Sign-off UAT (User Acceptance Test) | Stakeholder | `[ ]` |

---

## Phase 5 — Deployment & Go-live

> Chi tiết: [`04-server/03-deployment.md`](./04-server/03-deployment.md)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 5.1 | Build production (`next build`) | DevOps | `[ ]` |
| 5.2 | Cấu hình Nginx reverse proxy | DevOps | `[ ]` |
| 5.3 | Cấu hình PM2 chạy Next.js | DevOps | `[ ]` |
| 5.4 | Cấu hình SSL/HTTPS | DevOps | `[ ]` |
| 5.5 | Backup database trước go-live | DevOps | `[ ]` |
| 5.6 | Deploy production | DevOps | `[ ]` |
| 5.7 | Smoke test trên production | Tester | `[ ]` |
| 5.8 | Import data thành viên thực tế | Dev + Stakeholder | `[ ]` |
| 5.9 | Tạo tài khoản admin & user | Dev | `[ ]` |
| 5.10 | Training người dùng | BA + Stakeholder | `[ ]` |
| 5.11 | Go-live & monitoring | DevOps | `[ ]` |

---

## Phase 6 — Bảo trì (sau go-live)

| # | Bước | Vai trò | Trạng thái |
|---|------|---------|------------|
| 6.1 | Thiết lập backup DB tự động (cron) | DevOps | `[ ]` |
| 6.2 | Monitoring uptime (UptimeRobot / PM2) | DevOps | `[ ]` |
| 6.3 | Log rotation | DevOps | `[ ]` |
| 6.4 | Cập nhật dependencies định kỳ | Dev | `[ ]` |

---

## Cấu trúc thư mục docs

```
docs/
├── 00-WORKFLOW-MASTER.md          ← File này
├── 01-ba/
│   ├── 01-requirements-analysis.md
│   ├── 02-user-stories.md
│   └── 03-functional-spec.md
├── 02-architecture/
│   ├── 01-tech-stack.md
│   ├── 02-database-schema.md
│   ├── 03-sitemap.md
│   ├── 04-api-design.md
│   └── 05-ui-design.md
├── 03-dev/
│   ├── 01-development-phases.md
│   └── 02-coding-conventions.md
├── 04-server/
│   ├── 01-server-setup.md
│   ├── 02-database-setup.md
│   └── 03-deployment.md
└── 05-testing/
    └── 01-test-plan.md
```

---

## Quy trình làm việc hàng ngày (không có DB local)

```
1. SSH vào server
2. git pull origin main
3. Làm feature trên server (hoặc code local, push lên Git)
4. git add . && git commit -m "..." && git push
5. Trên server: git pull && npm install && npx prisma migrate deploy
6. pm2 restart ntp-app
7. Test trên browser (https://your-domain.com)
```

---

## Liên kết nhanh

- [Phân tích yêu cầu BA](./01-ba/01-requirements-analysis.md)
- [Tech Stack](./02-architecture/01-tech-stack.md)
- [Database Schema](./02-architecture/02-database-schema.md)
- [Sitemap](./02-architecture/03-sitemap.md)
- [Server Setup](./04-server/01-server-setup.md)
- [Deployment](./04-server/03-deployment.md)
- [Test Plan](./05-testing/01-test-plan.md)
