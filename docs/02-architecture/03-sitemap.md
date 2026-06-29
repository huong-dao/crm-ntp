# Sitemap & Navigation

## 1. Sitemap

```
/                           → Redirect to /dashboard (nếu logged in) hoặc /login
/login                      → Trang đăng nhập [PUBLIC]

/dashboard                  → Dashboard tổng quan [AUTH]
│
├── /members                → Danh sách thành viên [AUTH]
│   ├── /members/new        → Thêm thành viên mới [AUTH]
│   └── /members/[id]       → Chi tiết thành viên [AUTH]
│       └── /members/[id]/edit → Sửa thành viên [AUTH]
│
├── /households             → Danh sách hộ gia đình [AUTH]
│   └── /households/[id]    → Chi tiết hộ (thành viên trong hộ) [AUTH]
│
├── /departments            → Danh sách ban ngành [AUTH]
│   ├── /departments/new    → Thêm ban ngành [AUTH]
│   └── /departments/[id]   → Chi tiết / sửa ban ngành [AUTH]
│
├── /visit-teams            → Danh sách tổ thăm viếng [AUTH]
│
├── /visit-requests         → Danh sách đơn thăm viếng [AUTH]
│   └── /visit-requests/new → Tạo đơn thăm viếng [AUTH]
│
└── /users                  → Quản lý tài khoản [ADMIN ONLY]
```

---

## 2. Navigation (Sidebar)

```
┌─────────────────────────┐
│  🏛 HTTL Nguyễn Tri     │
│     Phương              │
├─────────────────────────┤
│                         │
│  📊 Dashboard           │  → /dashboard
│                         │
│  👥 Thành viên          │  → /members
│                         │
│  🏠 Hộ gia đình         │  → /households
│                         │
│  📚 Ban ngành           │  → /departments
│                         │
│  📋 Tổ thăm viếng       │  → /visit-teams
│                         │
│  📝 Đơn thăm viếng      │  → /visit-requests
│                         │
│  ─── (admin only) ───   │
│  🔑 Tài khoản           │  → /users
│                         │
├─────────────────────────┤
│  👤 username (role)     │
│  🚪 Đăng xuất           │
└─────────────────────────┘
```

---

## 3. Page Details

### `/login`
- **Layout:** Centered card, không sidebar
- **Content:** Logo, form login
- **Redirect:** Nếu đã login → `/dashboard`

### `/dashboard`
- **Layout:** Dashboard layout (sidebar + header)
- **Content:**
  - 4 stat cards: Tổng TV, Tổng Hộ, Đơn pending, Số Tổ
  - Table: 5 đơn thăm viếng gần nhất (pending)
  - Quick actions: [+ Thêm TV] [+ Tạo đơn TV]

### `/members`
- **Layout:** Dashboard layout
- **Content:**
  - Header: "Danh sách Thành viên" + [+ Thêm] [Export]
  - Search bar + Filters
  - Data table (pagination)
  - Row click → `/members/[id]`

### `/members/new` & `/members/[id]/edit`
- **Layout:** Dashboard layout
- **Content:** Form đầy đủ (sections: cơ bản, địa chỉ, liên lạc, hộ, tin lành, thăm viếng)
- **Actions:** [Lưu] [Hủy]

### `/members/[id]`
- **Layout:** Dashboard layout
- **Content:** Read-only view tất cả thông tin + [Sửa] [Xóa]

### `/households`
- **Layout:** Dashboard layout
- **Content:** Table hộ + [+ Thêm hộ]
- **Row click →** `/households/[id]`

### `/households/[id]`
- **Content:** Info hộ + table members trong hộ

### `/departments`
- **Layout:** Dashboard layout
- **Content:** Table ban ngành + tìm kiếm + [+ Thêm ban ngành]

### `/departments/new` & `/departments/[id]/edit`
- **Content:** Form tên ban ngành, độ tuổi min/max

### `/departments/[id]`
- **Content:** Chi tiết ban ngành + [Sửa]

### `/visit-teams`
- **Layout:** Dashboard layout
- **Content:** Table tổ + [+ Thêm tổ] + inline edit

### `/visit-requests`
- **Layout:** Dashboard layout
- **Content:** Table đơn + filters + [+ Tạo đơn]
- **Status badges:** màu theo tình trạng

### `/visit-requests/new`
- **Content:** Form tạo đơn thăm viếng

### `/users` (Admin only)
- **Content:** Table users + [+ Tạo user]
- **Actions:** Kích hoạt / Vô hiệu hóa

---

## 4. URL Patterns

| Pattern | Mô tả |
|---------|-------|
| `/login` | Static |
| `/dashboard` | Static |
| `/members` | Static list |
| `/members/new` | Static create |
| `/members/[id]` | Dynamic detail |
| `/members/[id]/edit` | Dynamic edit |
| `/households` | Static list |
| `/households/[id]` | Dynamic detail |
| `/departments` | Static list |
| `/departments/new` | Static create |
| `/departments/[id]` | Dynamic detail |
| `/departments/[id]/edit` | Dynamic edit |
| `/visit-teams` | Static list |
| `/visit-requests` | Static list |
| `/visit-requests/new` | Static create |
| `/users` | Static (admin) |

---

## 5. Breadcrumb

```
Dashboard > Thành viên > TH0001 > Sửa
Dashboard > Hộ gia đình > HO0001
Dashboard > Đơn thăm viếng > Tạo mới
```

---

## 6. Responsive Breakpoints

| Breakpoint | Sidebar | Table |
|------------|---------|-------|
| Desktop (≥1024px) | Full sidebar | Full columns |
| Tablet (768–1023px) | Collapsed icons | Key columns |
| Mobile (<768px) | Hamburger menu | Card view |
