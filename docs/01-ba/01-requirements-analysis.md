# Phân tích Yêu cầu (BA) — HTTL Nguyễn Tri Phương

## 1. Bối cảnh

Hội Thánh Tin Lành Nguyễn Tri Phương cần một hệ thống quản lý nội bộ để:
- Lưu trữ và tra cứu thông tin thành viên (tín hữu)
- Quản lý hộ gia đình
- Quản lý tổ thăm viếng và kế hoạch thăm viếng
- Phân quyền truy cập (admin / user)

**Đối tượng sử dụng:** Ban chấp sự, ban thăm viếng, thư ký hội thánh.

---

## 2. Phân tích các module

### 2.1 Module Thành viên (Members)

**Mục đích:** Danh sách tổng tất cả tín hữu trong hội thánh.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| Mã tổ thăm viếng | string | Không | FK → visit_teams |
| Mã hộ | string | Có | FK → households |
| Mã tín hữu | string | Có | Unique, auto-generate |
| Tình trạng | enum | Có | active / inactive / transferred / deceased |
| Họ và lót | string | Có | |
| Tên | string | Có | |
| Họ tên đầy đủ | string | Auto | = Họ và lót + Tên |
| Số nhà | string | Không | |
| Tên đường | string | Không | |
| Phường cũ | string | Không | Địa chỉ trước sáp nhập |
| Quận cũ | string | Không | |
| Tỉnh cũ | string | Không | |
| Địa chỉ cũ đầy đủ | string | Auto | Ghép từ các trường cũ |
| Phường mới | string | Không | Địa chỉ sau sáp nhập |
| Tỉnh mới | string | Không | |
| Địa chỉ mới đầy đủ | string | Auto | Ghép từ các trường mới |
| Di động 1 | string | Không | |
| Di động 2 | string | Không | |
| ĐT bàn | string | Không | |
| Năm sinh | integer | Không | |
| Giới tính | enum | Không | male / female |
| Nghề nghiệp | string | Không | |
| Chủ hộ | boolean | Có | yes/no |
| Quan hệ | string | Không | Với chủ hộ: vợ, con, cha, mẹ... |
| Báp têm | boolean | Không | yes/no |
| Năm báp têm | integer | Không | |
| Ban ngành theo tuổi | string | Không | Trẻ em, Thanh niên, Người lớn... |
| Ban ngành thực tế | string | Không | Ban thực tế đang phục vụ |
| Ban chấp sự | date | Không | Ngày tham gia làm chấp sự |
| Ban thăm viếng | string | Không | Tên ban thăm viếng |
| Ghi chú | text | Không | |

**Quy tắc nghiệp vụ:**
- Mỗi tín hữu có mã duy nhất, không trùng
- Một hộ có nhiều thành viên, chỉ 1 chủ hộ
- Mã tổ thăm viếng liên kết với tổ phụ trách khu vực
- Khi thêm thành viên mà chưa có hộ nào (hoặc chọn **Tạo hộ mới**): hệ thống tự sinh mã hộ và gán thành viên đó làm chủ hộ
- Thành viên thuộc hộ có sẵn: chọn mã hộ trong danh sách
- **Import Excel:** mỗi lần import ghi log (`MemberImportLog`); từng dòng OK/lỗi lưu trong `MemberImportLogRow`; cho phép import lại dòng lỗi; hiển thị modal tiến độ với thanh progress và cảnh báo không đóng trang khi đang import

---

### 2.2 Module Hộ gia đình (Households)

**Mục đích:** Nhóm thành viên theo hộ gia đình.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| Mã hộ | string | Có | Unique, auto-generate |
| Mã tín hữu (chủ hộ) | string | Có | FK → members (chủ hộ) |
| Chủ hộ | string | Auto | Tên đầy đủ chủ hộ |
| Số thành viên | integer | Auto | Đếm từ members theo mã hộ |

**Quy tắc nghiệp vụ:**
- Mã hộ tự sinh khi tạo hộ mới (từ màn hình Hộ gia đình hoặc khi thêm thành viên với tùy chọn **Tạo hộ mới**)
- Số thành viên tự cập nhật khi thêm/xóa member trong hộ
- Chủ hộ phải là member có `is_head_of_household = true`

---

### 2.3 Module Tổ thăm viếng (Visit Teams)

**Mục đích:** Quản lý các tổ thăm viếng và khu vực phụ trách.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| Mã tổ thăm viếng | string | Có | Unique, auto-generate |
| Mã tín hữu (trưởng tổ) | string | Không | FK → members |
| Khu vực phụ trách | string | Có | Mô tả khu vực |

**Quy tắc nghiệp vụ:**
- Mỗi tổ có mã riêng
- Một khu vực chỉ do một tổ phụ trách
- Trưởng tổ là tín hữu (member), không phải user đăng nhập

---

### 2.4 Module Đơn thăm viếng (Visit Requests)

**Mục đích:** Danh sách các lượt thăm viếng cần thực hiện.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| Mã đơn thăm viếng | string | Có | Unique, auto-generate |
| Lịch thăm viếng | date | Có | Ngày dự kiến |
| Ngày thăm thực tế | date | Không | Ngày thực tế đã thăm |
| Tình trạng | enum | Có | pending / completed / cancelled / postponed |
| Mã hộ | string | Có | FK → households |
| Nội dung | text | Không | Ghi chú nội dung thăm viếng |
| Mã tổ thăm viếng | string | Có | FK → visit_teams |
| Nhân sự thăm viếng | string | Không | Danh sách mã tín hữu, phân cách bằng dấu phẩy |

**Quy tắc nghiệp vụ:**
- Đơn thăm viếng gắn với một hộ
- Tổ thăm viếng được gán tự động theo khu vực hoặc chọn thủ công
- Nhân sự thăm viếng là string chứa nhiều mã tín hữu (không FK cứng)
- Khi hoàn thành: cập nhật tình trạng + ngày thăm thực tế

---

### 2.5 Module Authentication (Users)

**Mục đích:** Đăng nhập hệ thống, phân quyền.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|----------|---------|
| id | uuid | Có | Auto |
| username | string | Có | Unique |
| password | string | Có | Hashed (bcrypt) |
| role | enum | Có | admin / user |
| is_active | boolean | Có | Default true |
| created_at | datetime | Auto | |
| created_by | uuid | Không | Admin tạo user |

**Quy tắc nghiệp vụ:**
- **Admin:** Tạo tài khoản user, toàn quyền CRUD
- **User:** Xem và chỉnh sửa dữ liệu, không tạo tài khoản
- **Users KHÔNG liên kết với Members** — hai bảng hoàn toàn tách biệt
- Chỉ admin tạo tài khoản, không có self-registration

---

## 3. Phân quyền (RBAC)

| Chức năng | Admin | User |
|-----------|-------|------|
| Đăng nhập / Đăng xuất | ✅ | ✅ |
| Tạo tài khoản user | ✅ | ❌ |
| Xem danh sách thành viên | ✅ | ✅ |
| Thêm / Sửa thành viên | ✅ | ✅ |
| Xóa thành viên | ✅ | ❌ |
| Import / Export | ✅ | ✅ |
| Quản lý hộ gia đình | ✅ | ✅ |
| Quản lý tổ thăm viếng | ✅ | ✅ |
| Quản lý đơn thăm viếng | ✅ | ✅ |
| Dashboard | ✅ | ✅ |

---

## 4. Yêu cầu phi chức năng

| Yêu cầu | Chi tiết |
|---------|----------|
| Hiệu năng | Trang load < 3 giây với 1000+ records |
| Bảo mật | HTTPS, password hash, session timeout 24h |
| UI | Dashboard CRM style, Tailwind, dễ đọc |
| Responsive | Hoạt động trên mobile (ban thăm viếng dùng điện thoại) |
| Backup | Backup DB hàng ngày |
| Ngôn ngữ | Tiếng Việt |

---

## 5. Ràng buộc & Giả định

**Ràng buộc:**
- Không có DB local → dev trực tiếp trên server
- Next.js tương tác DB trực tiếp (không backend riêng)
- Dữ liệu nội bộ, không public internet (hoặc VPN)

**Giả định:**
- Số lượng thành viên < 5000
- Số user đăng nhập < 20
- Một admin chính quản lý tài khoản

---

## 6. MVP Scope

### Trong MVP (Phase 1)
- ✅ CRUD Thành viên (full fields)
- ✅ CRUD Hộ gia đình
- ✅ CRUD Tổ thăm viếng
- ✅ CRUD Đơn thăm viếng
- ✅ Login / Logout
- ✅ Admin tạo user
- ✅ Dashboard cơ bản
- ✅ Search & Filter
- ✅ Export CSV

### Phase 2 (sau go-live)
- Import Excel
- Thông báo / nhắc lịch thăm viếng
- Lịch sử thay đổi (audit log)
- Báo cáo thống kê nâng cao
- In danh sách PDF
