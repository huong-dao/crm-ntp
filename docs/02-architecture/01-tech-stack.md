# Tech Stack & Giải pháp Công nghệ

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│         React Components + Tailwind CSS                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP
┌─────────────────────▼───────────────────────────────────┐
│                  Next.js 15 (App Router)                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   Pages     │  │ Server       │  │   API Routes    │  │
│  │  (RSC/SSR)  │  │ Actions      │  │  (nếu cần)      │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌──────────────┐                        │
│  │  NextAuth   │  │   Prisma     │                        │
│  │  (Auth)     │  │   Client     │                        │
│  └─────────────┘  └──────┬───────┘                        │
└──────────────────────────┼───────────────────────────────┘
                           │ TCP
┌──────────────────────────▼───────────────────────────────┐
│              PostgreSQL 15 (Database)                    │
└──────────────────────────────────────────────────────────┘
```

**Mô hình:** Next.js Full-Stack — không có backend riêng. Server Components + Server Actions xử lý logic và DB.

---

## 2. Công nghệ chọn

### Frontend

| Công nghệ | Version | Lý do chọn |
|-----------|---------|------------|
| **Next.js** | 15.x | App Router, RSC, Server Actions, SSR |
| **React** | 19.x | Đi kèm Next.js 15 |
| **TypeScript** | 5.x | Type safety, ít bug |
| **Tailwind CSS** | 4.x | Utility-first, nhanh, responsive |
| **shadcn/ui** | latest | Component library đẹp, customizable |
| **Lucide Icons** | latest | Icon set nhẹ, đẹp |

### Backend (trong Next.js)

| Công nghệ | Version | Lý do chọn |
|-----------|---------|------------|
| **Server Actions** | — | Mutations trực tiếp, không cần API layer |
| **Prisma** | 6.x | ORM mạnh, migration, type-safe |
| **NextAuth.js** | 5.x (Auth.js) | Auth chuẩn cho Next.js |
| **bcryptjs** | latest | Hash password |
| **Zod** | latest | Validation schema |

### Database

| Công nghệ | Version | Lý do chọn |
|-----------|---------|------------|
| **PostgreSQL** | 15+ | Relational, ACID, free, mạnh |

### Dev Tools

| Công nghệ | Lý do |
|-----------|-------|
| **pnpm** | Nhanh hơn npm, tiết kiệm disk |
| **ESLint + Prettier** | Code quality |
| **Prisma Studio** | GUI xem DB |

### Server / Deploy

| Công nghệ | Lý do |
|-----------|-------|
| **Ubuntu 22.04 VPS** | Phổ biến, ổn định |
| **Nginx** | Reverse proxy, SSL termination |
| **PM2** | Process manager, auto-restart |
| **Certbot** | Free SSL (Let's Encrypt) |
| **Git** | Version control, deploy via pull |

---

## 3. Tại sao không chọn các phương án khác?

| Phương án | Không chọn vì |
|-----------|---------------|
| Backend riêng (Express/NestJS) | Yêu cầu Next.js tương tác DB trực tiếp, đơn giản hơn |
| MongoDB | Dữ liệu quan hệ (hộ ↔ member ↔ tổ), cần JOIN |
| MySQL | PostgreSQL mạnh hơn với JSON, enum, full-text search |
| Firebase | Không phù hợp relational data, vendor lock-in |
| Docker (giai đoạn 1) | Đơn giản hơn với PM2 trực tiếp, có thể thêm sau |
| SQLite | Không phù hợp multi-user production |

---

## 4. Cấu trúc thư mục dự án

```
ntp/
├── docs/                          # Workflow & documentation
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── migrations/                # Migration files
│   └── seed.ts                    # Seed data
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Dashboard layout (sidebar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── members/
│   │   │   │   ├── page.tsx       # List
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx   # Create
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx   # Detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── households/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── visit-teams/
│   │   │   │   └── page.tsx
│   │   │   ├── visit-requests/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   └── users/             # Admin only
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   ├── layout.tsx             # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── dashboard-layout.tsx
│   │   ├── members/
│   │   │   ├── member-table.tsx
│   │   │   ├── member-form.tsx
│   │   │   └── member-filters.tsx
│   │   ├── households/
│   │   ├── visit-teams/
│   │   ├── visit-requests/
│   │   └── users/
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client singleton
│   │   ├── auth.ts                # NextAuth config
│   │   ├── utils.ts               # Helper functions
│   │   └── validations/           # Zod schemas
│   │       ├── member.ts
│   │       ├── household.ts
│   │       ├── visit-team.ts
│   │       ├── visit-request.ts
│   │       └── user.ts
│   ├── actions/                   # Server Actions
│   │   ├── member-actions.ts
│   │   ├── household-actions.ts
│   │   ├── visit-team-actions.ts
│   │   ├── visit-request-actions.ts
│   │   └── user-actions.ts
│   └── types/
│       └── index.ts
├── public/
│   └── logo.png
├── .env                           # Environment variables (KHÔNG commit)
├── .env.example                   # Template env
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Environment Variables

```env
# .env.example
DATABASE_URL="postgresql://ntp_user:password@localhost:5432/ntp_members"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-random-secret-here"
```

---

## 6. Luồng xử lý dữ liệu

### Read (Server Component)
```
Page (RSC) → prisma.member.findMany() → Render HTML → Client
```

### Write (Server Action)
```
Client Form → Server Action → Zod validate → prisma.member.create() → revalidatePath() → Redirect
```

### Auth
```
Login Form → NextAuth credentials → bcrypt compare → JWT session → Middleware guard
```

---

## 7. Bảo mật

| Mục | Giải pháp |
|-----|-----------|
| Password | bcrypt hash (salt rounds: 12) |
| Session | JWT via NextAuth, httpOnly cookie |
| CSRF | NextAuth built-in protection |
| SQL Injection | Prisma parameterized queries |
| XSS | React auto-escape + CSP headers |
| Route protection | Next.js Middleware |
| HTTPS | Nginx + Let's Encrypt SSL |
| Env secrets | `.env` file, không commit |

---

## 8. Performance

| Mục | Giải pháp |
|-----|-----------|
| DB queries | Prisma select only needed fields |
| Pagination | Server-side với `skip/take` |
| Search | PostgreSQL `ILIKE` hoặc full-text search |
| Caching | Next.js `revalidatePath` sau mutations |
| Images | Next.js Image optimization (nếu có) |
