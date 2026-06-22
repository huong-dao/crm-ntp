# Test Plan

## 1. Test Environment

| Mục | Chi tiết |
|-----|----------|
| URL | `https://your-domain.com` (server production) |
| Browser | Chrome, Firefox, Edge (latest) |
| Mobile | Chrome Android, Safari iOS |
| Test accounts | admin / admin123, user1 / user123 |

---

## 2. Test Cases — Authentication

### TC-AUTH-01: Login thành công
| Step | Action | Expected |
|------|--------|----------|
| 1 | Truy cập `/login` | Hiển thị form login |
| 2 | Nhập username: `admin`, password: `admin123` | |
| 3 | Click "Đăng nhập" | Redirect `/dashboard` |
| 4 | | Header hiển thị username + role |

### TC-AUTH-02: Login thất bại
| Step | Action | Expected |
|------|--------|----------|
| 1 | Nhập sai password | |
| 2 | Click "Đăng nhập" | Error: "Sai username hoặc password" |
| 3 | | Vẫn ở trang login |

### TC-AUTH-03: Logout
| Step | Action | Expected |
|------|--------|----------|
| 1 | Đã login, click "Đăng xuất" | Redirect `/login` |
| 2 | Truy cập `/dashboard` | Redirect `/login` |

### TC-AUTH-04: Admin tạo user
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin → `/users` | Hiển thị danh sách user |
| 2 | Click "Tạo tài khoản" | Dialog form |
| 3 | Nhập username: `testuser`, password: `test123` | |
| 4 | Submit | User mới trong danh sách |
| 5 | Logout, login `testuser` / `test123` | Login thành công, role = user |

### TC-AUTH-05: User không truy cập /users
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login user (không phải admin) | |
| 2 | Truy cập `/users` | Redirect `/dashboard` |
| 3 | | Sidebar không hiện "Tài khoản" |

---

## 3. Test Cases — Thành viên

### TC-MEM-01: Xem danh sách
| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/members` | Table hiển thị members |
| 2 | | Columns: Mã, Họ tên, Mã hộ, Tình trạng, Di động |
| 3 | | Pagination hoạt động |

### TC-MEM-02: Search
| Step | Action | Expected |
|------|--------|----------|
| 1 | Search "Nguyễn" | Kết quả chứa "Nguyễn" |
| 2 | Search "TH0001" | Kết quả mã TH0001 |
| 3 | Search "xyz không tồn tại" | Empty state |

### TC-MEM-03: Filter
| Step | Action | Expected |
|------|--------|----------|
| 1 | Filter tình trạng = "active" | Chỉ hiện active |
| 2 | Filter tổ thăm viếng = "TV01" | Chỉ hiện TV01 |

### TC-MEM-04: Thêm thành viên
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "+ Thêm thành viên" | Form hiển thị |
| 2 | Nhập Họ: "Trần", Tên: "Văn A" | |
| 3 | Chọn Mã hộ | |
| 4 | Submit | Toast success, redirect list |
| 5 | | Member mới trong danh sách |
| 6 | | Mã tự sinh (THxxxx) |
| 7 | | Họ tên đầy đủ = "Trần Văn A" |

### TC-MEM-05: Validation
| Step | Action | Expected |
|------|--------|----------|
| 1 | Submit form trống | Error: Họ, Tên, Mã hộ required |
| 2 | Năm sinh = 1800 | Error validation |

### TC-MEM-06: Sửa thành viên
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click Sửa trên 1 member | Form pre-fill |
| 2 | Sửa Tên | |
| 3 | Submit | Toast success, data updated |

### TC-MEM-07: Xóa thành viên (admin)
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login admin, click Xóa | Confirm dialog |
| 2 | Confirm | Member bị xóa khỏi list |

### TC-MEM-08: User không xóa được
| Step | Action | Expected |
|------|--------|----------|
| 1 | Login user | Không thấy nút Xóa |

### TC-MEM-09: Export CSV
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click Export | Download file CSV |
| 2 | Mở file | Tiếng Việt hiển thị đúng |
| 3 | | Đủ tất cả columns |

---

## 4. Test Cases — Hộ gia đình

### TC-HH-01: Xem danh sách hộ
| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/households` | Table: Mã hộ, Chủ hộ, Số TV |

### TC-HH-02: Chi tiết hộ
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click vào 1 hộ | Hiện members trong hộ |
| 2 | | Số thành viên đúng |

### TC-HH-03: Tạo hộ mới
| Step | Action | Expected |
|------|--------|----------|
| 1 | Click "+ Thêm hộ" | Form/dialog |
| 2 | Submit | Hộ mới, mã tự sinh |

---

## 5. Test Cases — Tổ thăm viếng

### TC-VT-01: CRUD tổ thăm viếng
| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/visit-teams` | Danh sách tổ |
| 2 | Tạo tổ mới | Mã TV tự sinh |
| 3 | Sửa khu vực | Updated |
| 4 | Xóa tổ (không có member) | Deleted |

---

## 6. Test Cases — Đơn thăm viếng

### TC-VR-01: Tạo đơn thăm viếng
| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/visit-requests/new` | Form |
| 2 | Chọn hộ, tổ, lịch, nhân sự | |
| 3 | Submit | Đơn mới, status = pending |

### TC-VR-02: Cập nhật tình trạng
| Step | Action | Expected |
|------|--------|----------|
| 1 | Chuyển pending → completed | Badge xanh |
| 2 | | Bắt buộc nhập ngày thực tế |
| 3 | Chuyển → cancelled | Badge đỏ |

### TC-VR-03: Filter đơn
| Step | Action | Expected |
|------|--------|----------|
| 1 | Filter status = pending | Chỉ pending |
| 2 | Filter tổ = TV01 | Chỉ TV01 |

---

## 7. Test Cases — Dashboard

### TC-DASH-01: Stats
| Step | Action | Expected |
|------|--------|----------|
| 1 | Vào `/dashboard` | 4 stat cards |
| 2 | | Số liệu khớp với DB |
| 3 | | Recent pending visits table |

---

## 8. Test Cases — UI/Responsive

### TC-UI-01: Desktop (1920px)
- Sidebar full, table full columns

### TC-UI-02: Tablet (768px)
- Sidebar collapsed, table key columns

### TC-UI-03: Mobile (375px)
- Hamburger menu, card view thay table

---

## 9. Test Cases — Bảo mật

### TC-SEC-01: Unauthorized access
| Step | Action | Expected |
|------|--------|----------|
| 1 | Không login, truy cập `/members` | Redirect `/login` |

### TC-SEC-02: SQL Injection
| Step | Action | Expected |
|------|--------|----------|
| 1 | Search: `' OR 1=1 --` | Không crash, no data leak |

### TC-SEC-03: XSS
| Step | Action | Expected |
|------|--------|----------|
| 1 | Nhập `<script>alert(1)</script>` trong Ghi chú | Render as text, no script execution |

### TC-SEC-04: HTTPS
| Step | Action | Expected |
|------|--------|----------|
| 1 | Truy cập `http://` | Redirect `https://` |

---

## 10. Bug Report Template

```markdown
## Bug: [Mô tả ngắn]

**Severity:** Critical / High / Medium / Low
**Module:** Auth / Members / Households / Visit Teams / Visit Requests / Dashboard
**Browser:** Chrome 120 / Firefox 121 / ...
**Steps to reproduce:**
1. ...
2. ...
3. ...

**Expected:** ...
**Actual:** ...
**Screenshot:** (nếu có)
```

---

## 11. Test Sign-off

| Module | Tester | Date | Pass/Fail | Notes |
|--------|--------|------|-----------|-------|
| Authentication | | | | |
| Members | | | | |
| Households | | | | |
| Visit Teams | | | | |
| Visit Requests | | | | |
| Dashboard | | | | |
| UI/Responsive | | | | |
| Security | | | | |

**UAT Sign-off:**
- Stakeholder: _______________
- Date: _______________
- Approved: `[ ]` Yes  `[ ]` No
