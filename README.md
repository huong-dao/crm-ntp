# NTP — Hệ thống Quản lý Thành viên HTTL Nguyễn Tri Phương

Next.js app quản lý nội bộ thành viên, hộ gia đình, tổ thăm viếng và đơn thăm viếng.

## Quick Start — Workflow "Tiếp tục"

Trong Cursor chat, gõ **"tiếp tục"** để agent thực hiện bước tiếp theo chưa làm.

| Lệnh | Ý nghĩa |
|------|---------|
| `tiếp tục` | Làm 1 bước tiếp theo |
| `trạng thái` | Xem tiến độ |
| `bước 3.1` | Làm bước cụ thể |
| `đã xong 0.1` | Đánh dấu bước manual xong |

Workflow đầy đủ: **[docs/00-WORKFLOW-MASTER.md](docs/00-WORKFLOW-MASTER.md)** · Executor: **[docs/WORKFLOW-EXECUTOR.md](docs/WORKFLOW-EXECUTOR.md)**

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- PostgreSQL 15 + Prisma
- NextAuth.js (authentication)
- Tailwind CSS + shadcn/ui

## Documentation

| Tài liệu | Mô tả |
|----------|-------|
| [Workflow Master](docs/00-WORKFLOW-MASTER.md) | Bước làm theo vai trò (BA, Dev, Tester, Deploy) |
| [Requirements](docs/01-ba/01-requirements-analysis.md) | Phân tích yêu cầu |
| [User Stories](docs/01-ba/02-user-stories.md) | User stories & acceptance criteria |
| [Functional Spec](docs/01-ba/03-functional-spec.md) | Đặc tả chức năng chi tiết |
| [Tech Stack](docs/02-architecture/01-tech-stack.md) | Giải pháp công nghệ |
| [Database Schema](docs/02-architecture/02-database-schema.md) | Cấu trúc database |
| [Sitemap](docs/02-architecture/03-sitemap.md) | Sitemap & navigation |
| [Server Setup](docs/04-server/01-server-setup.md) | Cài đặt VPS từ đầu |
| [Deployment](docs/04-server/03-deployment.md) | Deploy production |
| [Test Plan](docs/05-testing/01-test-plan.md) | Kế hoạch kiểm thử |

## Development (local hoặc server)

```bash
cd d:\Next\ntp   # hoặc /var/www/ntp trên server
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # production server
```

## Environment Variables

```env
DATABASE_URL="postgresql://ntp_user:password@localhost:5432/ntp_members"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-here"
```
