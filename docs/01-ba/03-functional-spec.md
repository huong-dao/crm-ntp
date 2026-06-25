# Đặc tả Chức năng Chi tiết (Functional Specification)

## F-01: Trang Login

**URL:** `/login`  
**Access:** Public (không cần auth)

### UI Elements
- Logo / tên hội thánh
- Input: Username
- Input: Password (type password)
- Button: Đăng nhập
- Error message area

### Logic
1. User nhập username + password
2. Server verify credentials (bcrypt compare)
3. Nếu đúng → tạo session (NextAuth JWT)
4. Redirect → `/dashboard`
5. Nếu sai → hiển thị "Sai username hoặc password"

### Error Cases
- Username/password trống → "Vui lòng nhập đầy đủ"
- Account bị vô hiệu hóa → "Tài khoản đã bị khóa"
- Sai credentials → "Sai username hoặc password"

---

## F-02: Dashboard

**URL:** `/dashboard`  
**Access:** Authenticated users

### UI Layout
```
┌─────────────────────────────────────────────┐
│ Header: Logo | Tên user | Role | [Logout]   │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Main Content                    │
│          │  ┌──────┐ ┌──────┐ ┌──────┐      │
│ Dashboard│  │ Tổng │ │ Tổng │ │ Đơn  │      │
│ Thành    │  │ TV   │ │ Hộ   │ │ pending│    │
│ viên     │  └──────┘ └──────┘ └──────┘      │
│ Hộ       │                                  │
│ Tổ TV    │  [Đơn thăm viếng gần đây]        │
│ Đơn TV   │  [Table 5 đơn pending]           │
│ Tài khoản│                                  │
│ (admin)  │                                  │
└──────────┴──────────────────────────────────┘
```

### Data
- `totalMembers`: count members where status = active
- `totalHouseholds`: count households
- `pendingVisits`: count visit_requests where status = pending AND scheduled_date within 7 days
- `totalTeams`: count visit_teams
- Recent pending visits (top 5)

---

## F-03: Danh sách Thành viên

**URL:** `/members`  
**Access:** Authenticated users

### UI Elements
- Search bar (họ tên, mã tín hữu, mã hộ)
- Filter dropdowns: Tình trạng, Tổ thăm viếng, Ban ngành
- Button: [+ Thêm thành viên]
- Button: [Export CSV]
- Data table với pagination
- Row actions: [Sửa] [Xóa] (xóa chỉ admin)

### Table Columns
| # | Mã tín hữu | Họ tên | Mã hộ | Tình trạng | Di động | Ban ngành | Actions |

### Sort
- Default: Họ tên ASC
- Clickable column headers

---

## F-04: Form Thành viên (Thêm / Sửa)

**URL:** `/members/new` | `/members/[id]/edit`  
**Access:** Authenticated users

### Form Sections

**Thông tin cơ bản:**
- Mã tín hữu (readonly, auto)
- Tình trạng (select)
- Họ và lót * | Tên *
- Giới tính | Năm sinh
- Nghề nghiệp

**Địa chỉ cũ:**
- Số nhà | Tên đường
- Phường cũ | Quận cũ | Tỉnh cũ
- Địa chỉ cũ đầy đủ (readonly, auto)

**Địa chỉ mới:**
- Phường mới | Tỉnh mới
- Địa chỉ mới đầy đủ (readonly, auto)

**Liên lạc:**
- Di động 1 | Di động 2 | ĐT bàn

**Hộ gia đình:**
- Mã hộ (select hộ có sẵn, hoặc **+ Tạo hộ mới**)
- Khi chưa có hộ nào: form hiển thị thông báo tự tạo hộ; thành viên mặc định là chủ hộ
- Chủ hộ (checkbox)
- Quan hệ (text, luôn hiển thị — không phụ thuộc checkbox Chủ hộ)

**Tin lành:**
- Báp têm (checkbox) | Năm báp têm
- Ban ngành theo tuổi | Ban ngành thực tế
- Ban chấp sự (date) | Ban thăm viếng

**Thăm viếng:**
- Mã tổ thăm viếng (select)

**Ghi chú:**
- Ghi chú (textarea)

### Validation
- Họ và lót: required, max 100 chars
- Tên: required, max 50 chars
- Mã hộ: required trừ khi chọn **Tạo hộ mới** (khi đó bắt buộc là chủ hộ)
- Năm sinh: 1900–current year
- Phone: optional, pattern validation

---

## F-03b: Import Excel & Log import

**URL:** `/members` (Import) · `/members/imports` · `/members/imports/[id]`  
**Access:** Authenticated users

### Import (`Import Excel` trên `/members`)
- Upload file `.xlsx` — mỗi lần import tạo một **MemberImportLog**
- Lưu từng dòng vào **MemberImportLogRow**: `success` | `failed`, mã tín hữu (nếu có), lỗi, dữ liệu gốc (`rowData` JSON)
- Sau import: link **Xem chi tiết log import**

#### Modal tiến độ import
Khi bấm **Import**, hệ thống mở modal phủ toàn màn hình (không thể đóng trong lúc đang chạy):
- Tiêu đề: **Đang import thành viên** + tên file
- Cảnh báo: *Vui lòng không đóng hoặc tải lại trang* cho đến khi hoàn tất
- **Thanh progress** (% và số dòng đã xử lý / tổng dòng)
- Thống kê realtime: tổng dòng, thành công, lỗi
- Trình duyệt cảnh báo nếu user cố rời trang (`beforeunload`) trong lúc import
- Import theo batch (server action từng lô) để cập nhật tiến độ liên tục; khi xong modal đóng và hiện kết quả trong dialog import
- Cột **Quan hệ** và **Chủ hộ** độc lập — lưu đúng giá trị từng cột

### Lịch sử import (`/members/imports`)
| Thời gian | File | Người import | Tổng | OK | Lỗi | Chi tiết |

### Chi tiết log (`/members/imports/[id]`)
- Tóm tắt: file, user, số dòng OK/lỗi
- Bảng từng dòng: số dòng Excel, trạng thái, mã tín hữu, lỗi
- **Import lại dòng lỗi** — chạy lại chỉ các dòng `failed`, cập nhật log
- **Tải Excel dòng lỗi** — file chỉ gồm header + các dòng thất bại (sửa rồi import file mới)

---

## F-05: Danh sách Hộ gia đình

**URL:** `/households`  
**Access:** Authenticated users

### Table Columns
| # | Mã hộ | Chủ hộ | Số thành viên | Actions |

### Chi tiết Hộ (`/households/[id]`)
- Thông tin hộ: Mã hộ, Chủ hộ
- Table thành viên trong hộ
- Button thêm thành viên vào hộ

---

## F-05b: Import Excel Hộ gia đình

**URL:** `/households` (Import Excel)  
**Access:** Authenticated users

### File mẫu / cột bắt buộc
| Mã hộ | Chủ hộ |
|-------|--------|
| Mã hộ (unique, bắt buộc) | Mã tín hữu chủ hộ (tùy chọn) |

### Logic
- Upload `.xlsx` (có thể dùng modal tiến độ tương tự import thành viên)
- **Mã hộ** bắt buộc; nếu chưa tồn tại → tạo hộ mới với mã đó
- **Chủ hộ** tùy chọn — để trống vẫn import được (hộ chưa có chủ hộ, gán sau)
- Nếu có **Chủ hộ**: mã tín hữu phải tồn tại; cập nhật `headMemberId` / `isHead` trên member
- Báo cáo từng dòng OK/lỗi sau import

---

## F-06: Danh sách Tổ thăm viếng

**URL:** `/visit-teams`  
**Access:** Authenticated users

### Table Columns
| # | Mã tổ | Trưởng tổ | Khu vực | Số hộ | Actions |

---

## F-06b: Import Excel Tổ thăm viếng

**URL:** `/visit-teams` (Import Excel)  
**Access:** Authenticated users

### File mẫu / cột bắt buộc
| Mã tổ thăm viếng | Mã tín hữu | Khu vực phụ trách |
|------------------|------------|-------------------|
| Mã tổ (unique) | Mã tín hữu trưởng tổ (optional) | Mô tả khu vực (bắt buộc) |

### Logic
- Upload `.xlsx`
- **Mã tổ thăm viếng** bắt buộc; chưa có → tạo tổ mới; đã có → cập nhật
- **Mã tín hữu**: trưởng tổ (member phải tồn tại nếu có giá trị)
- **Khu vực phụ trách** bắt buộc
- Báo cáo từng dòng OK/lỗi sau import

---

## F-07: Danh sách Đơn thăm viếng

**URL:** `/visit-requests`  
**Access:** Authenticated users

### Table Columns
| # | Mã đơn | Lịch | Ngày thực tế | Tình trạng | Mã hộ | Tổ | Nhân sự | Actions |

### Status Colors
- `pending` → badge vàng
- `completed` → badge xanh
- `cancelled` → badge đỏ
- `postponed` → badge xám

### Filter
- Tình trạng (multi-select)
- Tổ thăm viếng
- Khoảng ngày (from – to)

---

## F-08: Quản lý Tài khoản (Admin only)

**URL:** `/users`  
**Access:** Admin only

### Table Columns
| # | Username | Role | Trạng thái | Ngày tạo | Actions |

### Actions
- Tạo user mới
- Vô hiệu hóa / Kích hoạt user
- Admin không thể xóa chính mình

---

## F-09: Middleware Auth Guard

**Protected routes:** Tất cả trừ `/login`

### Logic
```
Request → Middleware
  ├── Path = /login → allow
  ├── No session → redirect /login
  ├── Path = /users && role != admin → redirect /dashboard
  └── Allow
```
