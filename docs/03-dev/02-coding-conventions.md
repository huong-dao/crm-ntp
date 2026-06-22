# Coding Conventions

## 1. TypeScript

- Strict mode enabled
- Không dùng `any` — dùng proper types hoặc `unknown`
- Interface cho props, type cho data models
- Export types từ `src/types/index.ts`

```typescript
// ✅ Good
interface MemberFormProps {
  member?: Member;
  mode: 'create' | 'edit';
}

// ❌ Bad
function MemberForm(props: any) { ... }
```

## 2. File Naming

| Loại | Convention | Ví dụ |
|------|-----------|-------|
| Page | `page.tsx` | `src/app/members/page.tsx` |
| Component | `kebab-case.tsx` | `member-form.tsx` |
| Server Action | `kebab-case-actions.ts` | `member-actions.ts` |
| Validation | `kebab-case.ts` | `member.ts` |
| Utility | `kebab-case.ts` | `utils.ts` |
| Type | `index.ts` | `src/types/index.ts` |

## 3. Component Structure

```typescript
// Server Component (default)
export default async function MembersPage() {
  const members = await getMembers();
  return <MemberTable data={members} />;
}

// Client Component (khi cần interactivity)
'use client';
export function MemberForm({ member }: MemberFormProps) {
  // hooks, event handlers
}
```

**Quy tắc:**
- Server Component mặc định
- `'use client'` chỉ khi cần: hooks, onClick, onChange, useState, useEffect
- Data fetching trong Server Component hoặc Server Action

## 4. Server Actions

```typescript
'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMember(data: MemberFormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const validated = memberSchema.parse(data);
  // ... business logic
  revalidatePath('/members');
  return { success: true, data: member };
}
```

## 5. Prisma Client Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

## 6. Tailwind Classes

- Dùng utility classes, không custom CSS khi có thể
- Responsive: mobile-first (`sm:`, `md:`, `lg:`)
- Dùng shadcn/ui components, không tự viết từ đầu
- Spacing consistent: `gap-4`, `p-6`, `mb-4`

```tsx
// ✅ Good
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-sm">

// ❌ Bad
<div style={{ display: 'flex', padding: '24px' }}>
```

## 7. Vietnamese Labels

Tất cả UI text bằng tiếng Việt:

```typescript
const STATUS_LABELS: Record<MemberStatus, string> = {
  active: 'Đang hoạt động',
  inactive: 'Ngưng hoạt động',
  transferred: 'Đã chuyển đi',
  deceased: 'Đã mất',
};

const GENDER_LABELS: Record<Gender, string> = {
  male: 'Nam',
  female: 'Nữ',
};
```

## 8. Error Handling

```typescript
// Server Action return pattern
type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Client side
const result = await createMember(formData);
if (!result.success) {
  if (result.errors) {
    setFieldErrors(result.errors);
  } else {
    toast.error(result.error || 'Có lỗi xảy ra');
  }
  return;
}
toast.success('Thêm thành viên thành công');
```

## 9. Không commit

- `.env` (secrets)
- `node_modules/`
- `.next/`
- `*.log`

## 10. Import Order

```typescript
// 1. React/Next
import { useState } from 'react';
import { redirect } from 'next/navigation';

// 2. Third-party
import { z } from 'zod';

// 3. Internal lib
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// 4. Components
import { Button } from '@/components/ui/button';
import { MemberForm } from '@/components/members/member-form';

// 5. Types
import type { Member } from '@/types';
```
