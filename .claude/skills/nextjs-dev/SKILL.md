---
name: nextjs-dev
description: Quy ước triển khai code cho dự án NTP (Next.js 15 App Router, Prisma, NextAuth, Tailwind, shadcn/ui). Dùng khi cần viết/sửa page, component, server action, validation schema, hoặc fix bug trong repo này — đảm bảo đúng pattern hiện có thay vì bịa pattern mới.
---

# Development Next.js — dự án NTP

Tham chiếu đầy đủ: `docs/03-dev/02-coding-conventions.md` và `docs/02-architecture/01-tech-stack.md`.
Đọc lại 2 file đó nếu cần chi tiết; skill này chỉ tóm tắt để áp dụng nhanh khi fix feedback.

## Kiến trúc

Next.js full-stack, không có backend riêng: Server Components đọc dữ liệu trực tiếp qua
Prisma, Server Actions xử lý mutation. Không tạo API route mới trừ khi thực sự cần (webhook,
NextAuth callback...).

```
src/app/(dashboard)/<module>/page.tsx          # List (Server Component)
src/app/(dashboard)/<module>/new/page.tsx      # Create
src/app/(dashboard)/<module>/[id]/page.tsx     # Detail
src/app/(dashboard)/<module>/[id]/edit/page.tsx
src/components/<module>/<ten-kebab-case>.tsx
src/actions/<module>-actions.ts                # 'use server'
src/lib/validations/<module>.ts                # Zod schema
src/types/index.ts                             # types dùng chung
```

## Trước khi sửa

1. Đọc file liên quan thật kỹ trước khi đoán nguyên nhân — không đoán qua tên hàm/tên file.
2. Kiểm tra xem đã có component/action tương tự trong module khác chưa (vd households đã có
   pattern giống members) để tái dùng thay vì viết lại.
3. Với bug từ feedback khách hàng, tái hiện logic bằng cách đọc luồng: page → component → action
   → prisma query, để xác định đúng điểm lỗi trước khi patch.

## Quy ước bắt buộc khi viết code

- **TypeScript strict**, không dùng `any`; interface cho props, type cho data model, export
  type dùng chung từ `src/types/index.ts`.
- **Server Component mặc định.** Chỉ thêm `'use client'` khi cần hook, state, event handler.
- **Server Action** luôn bắt đầu bằng `'use server'`, luôn `auth()` check quyền trước khi
  đụng dữ liệu, luôn validate input bằng Zod trước khi query Prisma, luôn `revalidatePath`
  sau mutation thành công. Trả về theo pattern:
  ```typescript
  type ActionResult<T> = { success: boolean; data?: T; error?: string; errors?: Record<string, string[]> };
  ```
- **Prisma**: dùng client singleton ở `src/lib/prisma.ts`, không tạo `new PrismaClient()` ở
  nơi khác. Chỉ `select` field cần thiết, không fetch thừa.
- **UI text bằng tiếng Việt**, kể cả label enum (status, gender...) — định nghĩa qua
  `Record<Type, string>` map, không hardcode chuỗi rải rác nhiều nơi.
- **Tailwind + shadcn/ui**: dùng utility class, mobile-first (`sm:`/`md:`/`lg:`), ưu tiên
  component có sẵn trong `src/components/ui/` thay vì viết mới từ đầu.
- **Đặt tên file**: page → `page.tsx`; component → kebab-case; server action file →
  `kebab-case-actions.ts`; validation → kebab-case theo tên model.
- **Import order**: React/Next → third-party → internal lib (`@/lib/...`) → components → types.
- Không commit `.env`, `node_modules/`, `.next/`, `*.log`.

## Sau khi sửa

1. Chạy `npm run lint` để bắt lỗi convention/type trước khi báo hoàn thành.
2. Với thay đổi UI, khởi động dev server (`npm run dev`) và kiểm tra trực tiếp trên trình
   duyệt luồng chính + edge case liên quan đến đúng feedback đang fix — không chỉ dựa vào
   lint/type-check để kết luận đã xong.
3. Nếu fix bắt nguồn từ [feedback-analysis](../feedback-analysis/SKILL.md), đối chiếu lại đúng
   mô tả feedback gốc để xác nhận đã giải quyết đúng ý khách, không chỉ là "code chạy được".
