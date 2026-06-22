# Workflow Executor — Hướng dẫn "Tiếp tục"

## Cách dùng

Trong chat Cursor, chỉ cần nói:

- **"tiếp tục"** — thực hiện bước tiếp theo chưa hoàn thành
- **"tiếp tục 3 bước"** — thực hiện 3 bước liên tiếp
- **"trạng thái"** — xem tiến độ hiện tại
- **"bước X.Y"** — nhảy và thực hiện bước cụ thể (vd: `bước 3.1`)
- **"đã xong 0.1"** — đánh dấu bước manual đã hoàn thành

---

## Quy trình Agent phải làm khi nhận "tiếp tục"

```
1. Đọc docs/progress.json
2. Đọc docs/workflow-steps.json → tìm step theo id
3. Tìm bước đầu tiên có status = "pending" (theo thứ tự id)
4. Kiểm tra depends_on — tất cả phải completed
5. Thực hiện theo type:
   - auto   → code / chạy lệnh / tạo file
   - manual → hướng dẫn user, chờ confirm
   - hybrid → agent làm phần code, user làm phần server
6. Verify theo verify checklist
7. Cập nhật progress.json: status=completed, completed_at, notes
8. Cập nhật docs/00-WORKFLOW-MASTER.md checkbox [x]
9. Báo cáo: bước đã làm + bước tiếp theo
```

---

## File quan trọng

| File | Mục đích |
|------|----------|
| `docs/progress.json` | Trạng thái mỗi bước (pending/completed/skipped) |
| `docs/workflow-steps.json` | Chi tiết hành động cho mỗi bước |
| `docs/00-WORKFLOW-MASTER.md` | Checklist tổng quan (sync với progress) |

---

## Trạng thái bước

| Status | Ý nghĩa |
|--------|---------|
| `pending` | Chưa làm — sẽ được pick khi "tiếp tục" |
| `completed` | Đã hoàn thành |
| `skipped` | Bỏ qua (ghi lý do trong notes) |
| `blocked` | Chờ input từ user (server IP, domain...) |

---

## Thông tin cần thu thập (lưu vào docs/project-config.json)

Khi user cung cấp, agent lưu vào `docs/project-config.json`:

```json
{
  "server_ip": "",
  "server_user": "ntpadmin",
  "domain": "",
  "git_repo": "",
  "app_dir": "/var/www/ntp",
  "db_name": "ntp_members",
  "db_user": "ntp_user"
}
```

---

## Bước manual — cách xử lý

Các bước `type: manual` agent **không tự đánh dấu completed**. Agent:
1. In hướng dẫn chi tiết
2. Hỏi user confirm: "Đã hoàn thành? (gõ 'đã xong X.Y')"
3. Khi user confirm → cập nhật progress

---

## Tiến độ hiện tại

Chạy lệnh hoặc đọc `progress.json` để xem. Tóm tắt nhanh:

- **Đã hoàn thành:** 1.1–1.3 (BA docs), 2.1–2.5 (Architecture), 4.1 (Test plan)
- **Bước tiếp theo:** `0.1` — Mua/đăng ký VPS

---

## Lưu ý môi trường

- Không có DB local → bước DB (0.7, 3.3–3.5) cần server hoặc user SSH
- Code có thể scaffold local (3.1–3.2) rồi push lên server
- Luôn commit sau mỗi bước auto hoàn thành (nếu user yêu cầu commit)
