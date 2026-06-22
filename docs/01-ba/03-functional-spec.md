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
- Mã hộ (search/select)
- Chủ hộ (checkbox)
- Quan hệ (text, hiện khi không phải chủ hộ)

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
- Mã hộ: required
- Năm sinh: 1900–current year
- Phone: optional, pattern validation

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

## F-06: Danh sách Tổ thăm viếng

**URL:** `/visit-teams`  
**Access:** Authenticated users

### Table Columns
| # | Mã tổ | Trưởng tổ | Khu vực | Số hộ | Actions |

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
