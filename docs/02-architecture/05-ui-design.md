# UI Design Guidelines

## 1. Design Philosophy

- **CRM Dashboard style** — chuyên nghiệp, dễ đọc, dễ thao tác
- **Tiếng Việt** — tất cả label, button, message
- **Accessibility** — contrast ratio ≥ 4.5:1, font size ≥ 14px
- **Mobile-friendly** — ban thăm viếng thường dùng điện thoại

---

## 2. Color Palette

### Primary (Xanh navy — trang trọng, tin cậy)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `primary-50` | `#eff6ff` | Background nhẹ |
| `primary-100` | `#dbeafe` | Hover background |
| `primary-500` | `#3b82f6` | Buttons, links |
| `primary-600` | `#2563eb` | Button hover |
| `primary-700` | `#1d4ed8` | Active state |
| `primary-900` | `#1e3a5f` | Sidebar background |

### Neutral (Xám — text, borders)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `gray-50` | `#f9fafb` | Page background |
| `gray-100` | `#f3f4f6` | Card background |
| `gray-200` | `#e5e7eb` | Borders |
| `gray-500` | `#6b7280` | Secondary text |
| `gray-700` | `#374151` | Body text |
| `gray-900` | `#111827` | Headings |

### Status Colors

| Status | Color | Hex | Badge |
|--------|-------|-----|-------|
| Active / Completed | Green | `#22c55e` | `bg-green-100 text-green-800` |
| Pending | Yellow | `#eab308` | `bg-yellow-100 text-yellow-800` |
| Inactive | Gray | `#9ca3af` | `bg-gray-100 text-gray-800` |
| Cancelled / Deceased | Red | `#ef4444` | `bg-red-100 text-red-800` |
| Postponed | Orange | `#f97316` | `bg-orange-100 text-orange-800` |
| Transferred | Blue | `#3b82f6` | `bg-blue-100 text-blue-800` |

---

## 3. Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Font family | **Inter** (Google Fonts) | — | — |
| H1 (Page title) | Inter | 24px (1.5rem) | 700 |
| H2 (Section) | Inter | 20px (1.25rem) | 600 |
| H3 (Card title) | Inter | 16px (1rem) | 600 |
| Body | Inter | 14px (0.875rem) | 400 |
| Small / Label | Inter | 12px (0.75rem) | 500 |
| Table header | Inter | 13px | 600 |
| Table cell | Inter | 14px | 400 |
| Button | Inter | 14px | 500 |

```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

## 4. Layout

### Dashboard Layout

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (240px)  │  Main Content Area                 │
│ bg: primary-900  │  bg: gray-50                       │
│ text: white      │                                    │
│                  │  ┌─ Header (64px) ──────────────┐  │
│  Logo            │  │ Breadcrumb    User | Logout │  │
│  Nav items       │  └──────────────────────────────┘  │
│                  │                                    │
│                  │  ┌─ Content (padding: 24px) ───┐  │
│                  │  │ Page Title                   │  │
│                  │  │ Filters / Actions            │  │
│                  │  │ Data Table / Form / Cards    │  │
│                  │  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### Spacing
- Page padding: `24px` (p-6)
- Card padding: `16px` (p-4)
- Gap between sections: `24px` (gap-6)
- Form field gap: `16px` (gap-4)

---

## 5. Components (shadcn/ui)

| Component | Dùng cho |
|-----------|----------|
| `Button` | Actions, submit |
| `Input` | Text fields |
| `Select` | Dropdowns (status, gender, team) |
| `Checkbox` | isHead, isBaptized |
| `Textarea` | Notes, content |
| `Table` | Data lists |
| `Dialog` | Confirm delete, quick edit |
| `Badge` | Status indicators |
| `Card` | Dashboard stats, detail view |
| `Tabs` | Form sections (optional) |
| `DropdownMenu` | Row actions |
| `Pagination` | Table pagination |
| `Toast` | Success/error notifications |
| `Sheet` | Mobile sidebar |
| `Avatar` | User icon |
| `Separator` | Section dividers |
| `Calendar` | Date picker (visit dates) |
| `Popover` | Date picker container |

---

## 6. Form Layout

```
┌─ Thông tin cơ bản ──────────────────────────────┐
│  [Mã tín hữu (readonly)]  [Tình trạng ▼]      │
│  [Họ và lót *]            [Tên *]              │
│  [Giới tính ▼]            [Năm sinh]           │
│  [Nghề nghiệp]                                 │
├─ Địa chỉ ───────────────────────────────────────┤
│  [Số nhà]  [Tên đường]                         │
│  [Phường cũ] [Quận cũ] [Tỉnh cũ]              │
│  Địa chỉ cũ: (auto-generated, readonly)        │
│  [Phường mới] [Tỉnh mới]                       │
│  Địa chỉ mới: (auto-generated, readonly)       │
├─ Liên lạc ──────────────────────────────────────┤
│  [Di động 1]  [Di động 2]  [ĐT bàn]            │
├─ Hộ gia đình ───────────────────────────────────┤
│  [Mã hộ ▼ search]  [☑ Chủ hộ]  [Quan hệ]      │
├─ Tin lành ──────────────────────────────────────┤
│  [☑ Báp têm]  [Năm báp têm]                    │
│  [Ban ngành tuổi]  [Ban ngành thực tế]         │
│  [Ban chấp sự 📅]  [Ban thăm viếng]            │
├─ Thăm viếng ────────────────────────────────────┤
│  [Mã tổ thăm viếng ▼]                          │
├─ Ghi chú ───────────────────────────────────────┤
│  [Textarea]                                    │
├─────────────────────────────────────────────────┤
│  [💾 Lưu]  [Hủy]                               │
└─────────────────────────────────────────────────┘
```

Grid: 2 columns on desktop, 1 column on mobile.

---

## 7. Table Design

```
┌────┬──────────┬────────────┬──────┬──────────┬─────────┬─────────┐
│ #  │ Mã TH    │ Họ tên     │ Mã Hộ│ Tình trạng│ Di động │ Actions │
├────┼──────────┼────────────┼──────┼──────────┼─────────┼─────────┤
│ 1  │ TH0001   │ Nguyễn A   │ HO01 │ ● Active  │ 0901... │ ✏️ 🗑️  │
│ 2  │ TH0002   │ Trần B     │ HO01 │ ● Active  │ 0902... │ ✏️ 🗑️  │
└────┴──────────┴────────────┴──────┴──────────┴─────────┴─────────┘
                        ◄ 1 2 3 ... 10 ►
```

- Striped rows: `even:bg-gray-50`
- Hover: `hover:bg-primary-50`
- Sticky header
- Sortable columns (click header)

---

## 8. Dashboard Cards

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ 👥           │  │ 🏠           │  │ 📝           │  │ 📋           │
│ Thành viên   │  │ Hộ gia đình  │  │ Đơn pending  │  │ Tổ thăm viếng│
│    256       │  │    89        │  │    12        │  │    6         │
│ active       │  │              │  │ tuần này     │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

Card style: `bg-white rounded-lg shadow-sm border p-6`

---

## 9. Responsive

| Component | Desktop | Mobile |
|-----------|---------|--------|
| Sidebar | Fixed 240px | Sheet (hamburger) |
| Table | Full columns | Card list view |
| Form | 2-column grid | 1-column |
| Dashboard cards | 4 columns | 2 columns |
| Filters | Inline row | Collapsible panel |

---

## 10. Icons (Lucide)

| Icon | Dùng cho |
|------|----------|
| `LayoutDashboard` | Dashboard nav |
| `Users` | Thành viên |
| `Home` | Hộ gia đình |
| `ClipboardList` | Tổ thăm viếng |
| `FileText` | Đơn thăm viếng |
| `UserCog` | Tài khoản |
| `LogOut` | Đăng xuất |
| `Plus` | Thêm mới |
| `Pencil` | Sửa |
| `Trash2` | Xóa |
| `Search` | Tìm kiếm |
| `Download` | Export |
| `Upload` | Import |
| `Filter` | Bộ lọc |
| `ChevronLeft/Right` | Pagination |
