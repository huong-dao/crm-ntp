# API Design & Server Actions

## 1. Kiến trúc xử lý

Dự án sử dụng **Server Actions** làm phương thức chính, không cần REST API layer.

```
Client Component (form) 
  → Server Action (validate + DB) 
  → revalidatePath() 
  → Redirect / toast
```

NextAuth API route duy nhất: `/api/auth/[...nextauth]`

---

## 2. Server Actions

### Member Actions (`src/actions/member-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getMembers` | filters, page, pageSize | Member[] + total | Danh sách có filter/pagination |
| `getMemberById` | id | Member | Chi tiết 1 member |
| `createMember` | MemberFormData | Member | Tạo mới + auto code |
| `updateMember` | id, MemberFormData | Member | Cập nhật |
| `deleteMember` | id | void | Xóa (admin only) |
| `exportMembers` | filters | CSV string | Export CSV |
| `searchMembers` | query | Member[] | Search nhanh (autocomplete) |

### Household Actions (`src/actions/household-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getHouseholds` | page, pageSize | Household[] + total | Danh sách |
| `getHouseholdById` | id | Household + members | Chi tiết + members |
| `createHousehold` | headMemberId? | Household | Tạo mới + auto code |
| `updateHousehold` | id, data | Household | Cập nhật |
| `deleteHousehold` | id | void | Xóa (nếu không có member) |

### Visit Team Actions (`src/actions/visit-team-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getVisitTeams` | — | VisitTeam[] | Danh sách |
| `createVisitTeam` | area, leaderMemberId? | VisitTeam | Tạo + auto code |
| `updateVisitTeam` | id, data | VisitTeam | Cập nhật |
| `deleteVisitTeam` | id | void | Xóa |

### Visit Request Actions (`src/actions/visit-request-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getVisitRequests` | filters, page | VisitRequest[] + total | Danh sách |
| `createVisitRequest` | formData | VisitRequest | Tạo + auto code |
| `updateVisitRequest` | id, data | VisitRequest | Cập nhật |
| `updateVisitStatus` | id, status, actualDate? | VisitRequest | Chuyển tình trạng |
| `deleteVisitRequest` | id | void | Xóa |

### User Actions (`src/actions/user-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getUsers` | — | User[] | Danh sách (admin) |
| `createUser` | username, password, role | User | Tạo user (admin) |
| `toggleUserActive` | id, isActive | User | Bật/tắt user |

### Dashboard Actions (`src/actions/dashboard-actions.ts`)

| Action | Input | Output | Mô tả |
|--------|-------|--------|-------|
| `getDashboardStats` | — | Stats object | Số liệu tổng quan |
| `getRecentVisitRequests` | limit | VisitRequest[] | Đơn gần đây |

---

## 3. Validation Schemas (Zod)

```typescript
// src/lib/validations/member.ts
import { z } from 'zod';

export const memberSchema = z.object({
  firstName: z.string().min(1, 'Họ và lót không được trống').max(100),
  lastName: z.string().min(1, 'Tên không được trống').max(50),
  status: z.enum(['active', 'inactive', 'transferred', 'deceased']),
  householdId: z.string().min(1, 'Mã hộ không được trống'),
  gender: z.enum(['male', 'female']).optional(),
  birthYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  mobile1: z.string().optional(),
  mobile2: z.string().optional(),
  landline: z.string().optional(),
  isHead: z.boolean().default(false),
  relationship: z.string().optional(),
  isBaptized: z.boolean().default(false),
  baptismYear: z.number().optional(),
  visitTeamId: z.string().optional(),
  notes: z.string().optional(),
  // ... address fields
});
```

---

## 4. Auth API (NextAuth)

**Route:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
// Credentials provider
providers: [
  Credentials({
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const user = await prisma.user.findUnique({
        where: { username: credentials.username }
      });
      if (!user || !user.isActive) return null;
      const valid = await bcrypt.compare(credentials.password, user.password);
      if (!valid) return null;
      return { id: user.id, username: user.username, role: user.role };
    }
  })
]
```

---

## 5. Middleware

```typescript
// src/middleware.ts
export const config = {
  matcher: ['/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)']
};

// Logic:
// 1. No token → redirect /login
// 2. /users path + role !== admin → redirect /dashboard
```

---

## 6. Error Handling Pattern

```typescript
// Mỗi Server Action
export async function createMember(data: MemberFormData) {
  try {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const validated = memberSchema.parse(data);
    const code = await generateCode('TH', 'member', 4);

    const member = await prisma.member.create({
      data: { ...validated, code, fullName: `${validated.firstName} ${validated.lastName}` }
    });

    revalidatePath('/members');
    return { success: true, data: member };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    return { success: false, error: 'Có lỗi xảy ra' };
  }
}
```
