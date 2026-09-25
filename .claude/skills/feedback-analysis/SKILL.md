---
name: feedback-analysis
description: Phân tích feedback/báo lỗi từ khách hàng (người dùng nội bộ HTTL Nguyễn Tri Phương) về hệ thống NTP, quy về danh sách việc cần sửa có độ ưu tiên, ánh xạ tới đúng module/file trong src/, và tạo kế hoạch fix. Dùng khi user dán feedback thô (chat, email, ghi âm gỡ băng, danh sách gạch đầu dòng) và muốn biến nó thành task triển khai được.
---

# Phân tích feedback khách hàng — dự án NTP

Dự án là hệ thống quản lý thành viên hội thánh (members, households, visit-requests,
visit-teams, departments, administrative-units, users, activity-logs). Khách hàng là
người dùng nội bộ, feedback thường bằng tiếng Việt, không có cấu trúc, hay lẫn nhiều ý
trong một câu.

## Quy trình

1. **Chẻ nhỏ feedback thành các mục rời rạc.** Mỗi câu/ý phàn nàn hoặc yêu cầu → 1 item.
   Giữ nguyên văn gốc của khách trong ngoặc kép để đối chiếu sau này, không diễn giải sai ý.

2. **Phân loại mỗi item** theo:
   - **Loại**: Bug (sai hành vi) / UX (khó dùng nhưng đúng logic) / Missing feature (chưa có) /
     Data issue (sai dữ liệu, không phải sai code) / Câu hỏi (không cần code).
   - **Module ảnh hưởng**: đối chiếu với cấu trúc `src/app/(dashboard)/*`,
     `src/components/*`, `src/actions/*-actions.ts` — xem [nextjs-dev](../nextjs-dev/SKILL.md)
     để biết cấu trúc thư mục. Nếu feedback nhắc tên màn hình tiếng Việt (vd "trang thành viên",
     "đơn thăm viếng"), map sang tên module tiếng Anh tương ứng (members, visit-requests...).
   - **Mức độ ảnh hưởng**: Blocker (không dùng được) / Major (sai dữ liệu, mất thao tác) /
     Minor (khó chịu, có workaround) / Cosmetic (giao diện).

3. **Xác định phạm vi thực tế trước khi kết luận là bug.** Trước khi ghi vào danh sách sửa,
   grep nhanh trong repo để xác nhận:
   - Hành vi khách mô tả có khớp với code hiện tại không (đọc server action / component liên quan).
   - Có phải do thiếu validation Zod, thiếu revalidatePath, thiếu check quyền (`auth()`),
     hay thực sự là bug logic.
   - Nếu feedback mơ hồ (vd "trang thành viên bị lỗi") — đừng đoán, liệt kê là "cần hỏi lại khách"
     kèm câu hỏi cụ thể cần hỏi, thay vì tự suy diễn.

4. **Gộp trùng lặp.** Nhiều feedback có thể cùng root cause (vd nhiều người báo "lưu xong
   không thấy cập nhật" ở nhiều màn hình khác nhau → có thể là thiếu `revalidatePath` chung
   một pattern). Gộp lại thành 1 task kỹ thuật nếu root cause giống nhau.

5. **Sắp xếp ưu tiên**: Blocker/Major ảnh hưởng nhiều người dùng > Major ảnh hưởng ít người >
   Minor > Missing feature > Cosmetic. Trong cùng mức, ưu tiên item nào chỉnh sửa nhanh
   (low effort, high impact) lên trước.

6. **Output** — trình bày bảng hoặc danh sách gồm:
   `# | Feedback gốc (rút gọn) | Loại | Module/file nghi vấn | Mức độ | Việc cần làm | Cần hỏi lại?`

   Sau bảng, liệt kê riêng các câu hỏi cần hỏi lại khách hàng (nếu có) — đừng lẫn vào bảng.

7. **Không tự sửa code ngay khi mới phân tích xong** trừ khi user yêu cầu rõ "sửa luôn" —
   phân tích trước, xác nhận danh sách/ưu tiên với user, rồi mới chuyển sang implement bằng
   skill [nextjs-dev](../nextjs-dev/SKILL.md).

## Lưu ý

- Giữ toàn bộ output bằng tiếng Việt vì đây là ngữ cảnh nội bộ của khách hàng Việt Nam.
- Không bịa ra nguyên nhân kỹ thuật khi chưa đọc code — luôn xác minh bằng Grep/Read trước khi
  kết luận "lỗi do X".
- Nếu feedback đề cập tới dữ liệu sai (vd "thành viên A bị sai tổ") mà không phải lỗi phần mềm,
  ghi rõ đây là data issue cần sửa qua UI hoặc script, không phải code fix.
