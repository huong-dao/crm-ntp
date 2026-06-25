# Database Schema

## 1. ERD (Entity Relationship Diagram)

```
┌──────────────────┐       ┌──────────────────┐
│     users        │       │   visit_teams    │
│──────────────────│       │──────────────────│
│ id (PK)          │       │ id (PK)          │
│ username         │       │ code (UNIQUE)    │
│ password         │       │ leader_member_id │
│ role             │       │ area             │
│ is_active        │       │ created_at       │
│ created_at       │       │ updated_at       │
│ created_by       │       └────────┬─────────┘
└──────────────────┘                │
                                      │ 1
                                      │
┌──────────────────┐       ┌────────┴─────────┐
│   households     │       │     members      │
│──────────────────│       │──────────────────│
│ id (PK)          │◄──┐    │ id (PK)          │
│ code (UNIQUE)    │   │    │ code (UNIQUE)    │
│ head_member_id   │   │    │ household_id(FK) │──┐
│ created_at       │   │    │ visit_team_id(FK)│  │
│ updated_at       │   │    │ status           │  │
└────────┬─────────┘   │    │ first_name       │  │
         │ 1           │    │ last_name        │  │
         │             │    │ full_name        │  │
         │             └────│ is_head          │  │
         │ N                │ ... (see below)  │  │
         └──────────────────┤                  │  │
                            └──────────────────┘  │
                                                  │
┌──────────────────┐                              │
│ visit_requests   │                              │
│──────────────────│                              │
│ id (PK)          │                              │
│ code (UNIQUE)    │                              │
│ household_id(FK) │──────────────────────────────┘
│ visit_team_id(FK)│──────────► visit_teams
│ scheduled_date   │
│ actual_date      │
│ status           │
│ content          │
│ staff_codes      │  (string: "TV001,TV002,TV003")
│ created_at       │
│ updated_at       │
└──────────────────┘
```

**Lưu ý:** `users` và `members` KHÔNG có quan hệ — hoàn toàn tách biệt.

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ───────────────────────────────────────────

enum UserRole {
  admin
  user
}

enum MemberStatus {
  active
  inactive
  transferred
  deceased
}

enum Gender {
  male
  female
}

enum VisitRequestStatus {
  pending
  completed
  cancelled
  postponed
}

// ─── USERS (Auth - tách biệt với members) ───────────

model User {
  id         String   @id @default(cuid())
  username   String   @unique
  password   String
  role       UserRole @default(user)
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  createdBy  String?  @map("created_by")

  @@map("users")
}

// ─── VISIT TEAMS (Tổ thăm viếng) ─────────────────────

model VisitTeam {
  id              String   @id @default(cuid())
  code            String   @unique
  leaderMemberId  String?  @map("leader_member_id")
  area            String
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  members         Member[]
  visitRequests   VisitRequest[]

  @@map("visit_teams")
}

// ─── HOUSEHOLDS (Hộ gia đình) ────────────────────────

model Household {
  id            String   @id @default(cuid())
  code          String   @unique
  headMemberId  String?  @map("head_member_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  members       Member[]
  visitRequests VisitRequest[]

  @@map("households")
}

// ─── MEMBERS (Thành viên / Tín hữu) ──────────────────

model Member {
  id                String        @id @default(cuid())
  code              String        @unique
  status            MemberStatus  @default(active)
  firstName         String        @map("first_name")
  lastName          String        @map("last_name")
  fullName          String        @map("full_name")

  // Địa chỉ cũ
  houseNumber       String?       @map("house_number")
  street            String?
  oldWard           String?       @map("old_ward")
  oldDistrict       String?       @map("old_district")
  oldProvince       String?       @map("old_province")
  oldFullAddress    String?       @map("old_full_address")

  // Địa chỉ mới
  newWard           String?       @map("new_ward")
  newProvince       String?       @map("new_province")
  newFullAddress    String?       @map("new_full_address")

  // Liên lạc
  mobile1           String?       @map("mobile_1")
  mobile2           String?       @map("mobile_2")
  landline          String?

  // Cá nhân
  birthYear         Int?          @map("birth_year")
  gender            Gender?
  occupation        String?

  // Hộ gia đình
  householdId       String?       @map("household_id")
  isHead            Boolean       @default(false) @map("is_head")
  relationship      String?

  // Tin lành
  isBaptized        Boolean       @default(false) @map("is_baptized")
  baptismYear       Int?          @map("baptism_year")
  ageDepartment     String?       @map("age_department")
  actualDepartment  String?       @map("actual_department")
  boardServiceDate  DateTime?     @map("board_service_date")
  visitDepartment   String?       @map("visit_department")

  // Thăm viếng
  visitTeamId       String?       @map("visit_team_id")

  notes             String?

  createdAt         DateTime      @default(now()) @map("created_at")
  updatedAt         DateTime      @updatedAt @map("updated_at")

  household         Household?    @relation(fields: [householdId], references: [id])
  visitTeam         VisitTeam?    @relation(fields: [visitTeamId], references: [id])

  @@index([householdId])
  @@index([visitTeamId])
  @@index([status])
  @@index([fullName])
  @@map("members")
}

// ─── VISIT REQUESTS (Đơn thăm viếng) ─────────────────

model VisitRequest {
  id            String              @id @default(cuid())
  code          String              @unique
  scheduledDate DateTime            @map("scheduled_date")
  actualDate    DateTime?           @map("actual_date")
  status        VisitRequestStatus  @default(pending)
  content       String?
  staffCodes    String?             @map("staff_codes")
  householdId   String              @map("household_id")
  visitTeamId   String              @map("visit_team_id")
  createdAt     DateTime            @default(now()) @map("created_at")
  updatedAt     DateTime            @updatedAt @map("updated_at")

  household     Household           @relation(fields: [householdId], references: [id])
  visitTeam     VisitTeam           @relation(fields: [visitTeamId], references: [id])

  @@index([householdId])
  @@index([visitTeamId])
  @@index([status])
  @@index([scheduledDate])
  @@map("visit_requests")
}

// ─── MEMBER IMPORT LOGS ───────────────────────────────

enum MemberImportRowStatus {
  success
  failed
}

model MemberImportLog {
  id             String   @id @default(cuid())
  fileName       String   @map("file_name")
  uploadedById   String   @map("uploaded_by_id")
  uploadedByName String   @map("uploaded_by_name")
  columnHeaders  Json     @map("column_headers")
  totalRows      Int      @map("total_rows")
  successCount   Int      @map("success_count")
  errorCount     Int      @map("error_count")
  createdAt      DateTime @default(now()) @map("created_at")

  rows MemberImportLogRow[]

  @@index([createdAt])
  @@map("member_import_logs")
}

model MemberImportLogRow {
  id         String                @id @default(cuid())
  logId      String                @map("log_id")
  rowNumber  Int                   @map("row_number")
  status     MemberImportRowStatus
  memberCode String?               @map("member_code")
  memberId   String?               @map("member_id")
  error      String?
  rowData    Json                  @map("row_data")
  retriedAt  DateTime?             @map("retried_at")

  log MemberImportLog @relation(fields: [logId], references: [id], onDelete: Cascade)

  @@index([logId])
  @@index([logId, status])
  @@map("member_import_log_rows")
}
```

---

## 3. Mã tự sinh (Auto-generate Codes)

| Entity | Format | Ví dụ |
|--------|--------|-------|
| Member (Tín hữu) | `TH` + số 4 chữ số | TH0001, TH0002 |
| Household (Hộ) | `HO` + số 4 chữ số | HO0001, HO0002 |
| Visit Team (Tổ) | `TV` + số 2 chữ số | TV01, TV02 |
| Visit Request (Đơn) | `DV` + YYYY + số 4 chữ số | DV20260001 |

**Logic sinh mã:**
```typescript
async function generateCode(prefix: string, table: string, padLength: number) {
  const last = await prisma[table].findFirst({
    orderBy: { code: 'desc' },
    select: { code: true }
  });
  const lastNum = last ? parseInt(last.code.replace(prefix, '')) : 0;
  return prefix + String(lastNum + 1).padStart(padLength, '0');
}
```

---

## 4. Computed Fields

| Trường | Công thức |
|--------|-----------|
| `full_name` | `firstName + " " + lastName` |
| `old_full_address` | Ghép: số nhà + đường + phường + quận + tỉnh |
| `new_full_address` | Ghép: số nhà + đường + phường mới + tỉnh mới |
| `household.member_count` | Count members where householdId = id |
| `household.head_name` | Member where isHead = true → fullName |

---

## 5. Indexes

| Table | Index | Lý do |
|-------|-------|-------|
| members | full_name | Search theo tên |
| members | household_id | Join hộ ↔ member |
| members | visit_team_id | Filter theo tổ |
| members | status | Filter tình trạng |
| visit_requests | scheduled_date | Filter theo lịch |
| visit_requests | status | Filter tình trạng |
| All | code (UNIQUE) | Tra cứu theo mã |

---

## 6. Migration Commands

```bash
# Tạo migration từ schema
npx prisma migrate dev --name init

# Deploy migration trên production
npx prisma migrate deploy

# Xem DB qua GUI
npx prisma studio

# Seed data
npx prisma db seed
```

---

## 7. Seed Data (mẫu)

```typescript
// prisma/seed.ts
const admin = await prisma.user.create({
  data: {
    username: 'admin',
    password: await bcrypt.hash('admin123', 12),
    role: 'admin',
  }
});

// Tạo 2 tổ thăm viếng, 3 hộ, 10 member mẫu...
```
