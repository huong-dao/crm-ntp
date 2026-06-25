# User Stories & Acceptance Criteria

## Epic 1: Authentication

### US-01: Đăng nhập
**As a** admin/user  
**I want to** đăng nhập bằng username và password  
**So that** tôi có thể truy cập hệ thống quản lý

**Acceptance Criteria:**
- [ ] Form login có username + password
- [ ] Hiển thị lỗi khi sai thông tin
- [ ] Redirect đến dashboard sau login thành công
- [ ] Session lưu 24 giờ

### US-02: Đăng xuất
**As a** admin/user  
**I want to** đăng xuất khỏi hệ thống  
**So that** tài khoản được bảo vệ khi không sử dụng

**Acceptance Criteria:**
- [ ] Nút logout trên header
- [ ] Xóa session, redirect về trang login
- [ ] Không thể truy cập route protected sau logout

### US-03: Admin tạo tài khoản User
**As an** admin  
**I want to** tạo tài khoản cho user mới  
**So that** họ có thể truy cập hệ thống

**Acceptance Criteria:**
- [ ] Form tạo user: username, password, role (user)
- [ ] Chỉ admin mới thấy menu "Quản lý tài khoản"
- [ ] Username không trùng
- [ ] Password được hash trước khi lưu
- [ ] User mới có thể login ngay

---

## Epic 2: Quản lý Thành viên

### US-04: Xem danh sách thành viên
**As a** user  
**I want to** xem danh sách tất cả thành viên  
**So that** tôi có thể tra cứu thông tin

**Acceptance Criteria:**
- [ ] Table hiển thị: Mã tín hữu, Họ tên, Mã hộ, Tình trạng, Di động
- [ ] Pagination (20 records/page)
- [ ] Search theo họ tên, mã tín hữu, mã hộ
- [ ] Filter theo tình trạng, tổ thăm viếng, ban ngành

### US-05: Thêm thành viên mới
**As a** user  
**I want to** thêm thành viên mới vào danh sách  
**So that** hội thánh có dữ liệu đầy đủ

**Acceptance Criteria:**
- [ ] Form đầy đủ tất cả trường (theo spec)
- [ ] Mã tín hữu tự sinh
- [ ] Họ tên đầy đủ tự ghép
- [ ] Địa chỉ đầy đủ tự ghép
- [ ] Validate bắt buộc: Họ, Tên
- [ ] Chọn mã hộ có sẵn **hoặc** tạo hộ mới (chủ hộ) khi chưa có hộ nào

### US-06: Sửa thông tin thành viên
**As a** user  
**I want to** cập nhật thông tin thành viên  
**So that** dữ liệu luôn chính xác

**Acceptance Criteria:**
- [ ] Form edit pre-fill dữ liệu hiện tại
- [ ] Cập nhật thành công hiển thị thông báo
- [ ] Họ tên đầy đủ tự cập nhật khi sửa họ/tên

### US-07: Export danh sách thành viên
**As a** user  
**I want to** xuất danh sách ra file CSV  
**So that** tôi có thể in hoặc chia sẻ

**Acceptance Criteria:**
- [ ] Nút Export trên trang danh sách
- [ ] File CSV UTF-8 với BOM (hiển thị tiếng Việt đúng)
- [ ] Export theo filter hiện tại

---

## Epic 3: Quản lý Hộ gia đình

### US-08: Xem danh sách hộ
**As a** user  
**I want to** xem danh sách các hộ gia đình  
**So that** tôi biết cấu trúc gia đình

**Acceptance Criteria:**
- [ ] Table: Mã hộ, Chủ hộ, Số thành viên
- [ ] Click vào hộ → xem chi tiết thành viên trong hộ

### US-09: Tạo hộ gia đình mới
**As a** user  
**I want to** tạo hộ gia đình mới  
**So that** có thể gán thành viên vào hộ

**Acceptance Criteria:**
- [ ] Mã hộ tự sinh
- [ ] Chọn chủ hộ từ danh sách member (hoặc tạo member mới)
- [ ] Số thành viên = 0 khi tạo mới

---

## Epic 4: Quản lý Tổ thăm viếng

### US-10: Xem danh sách tổ thăm viếng
**As a** user  
**I want to** xem các tổ thăm viếng  
**So that** tôi biết ai phụ trách khu vực nào

**Acceptance Criteria:**
- [ ] Table: Mã tổ, Trưởng tổ, Khu vực phụ trách
- [ ] Số hộ / thành viên trong khu vực

### US-11: Tạo / Sửa tổ thăm viếng
**As a** user  
**I want to** tạo hoặc cập nhật tổ thăm viếng  
**So that** phân công thăm viếng đúng khu vực

**Acceptance Criteria:**
- [ ] Mã tổ tự sinh
- [ ] Chọn trưởng tổ từ danh sách member
- [ ] Nhập khu vực phụ trách (text)

---

## Epic 5: Quản lý Đơn thăm viếng

### US-12: Xem danh sách đơn thăm viếng
**As a** user  
**I want to** xem các đơn thăm viếng  
**So that** tôi theo dõi kế hoạch thăm viếng

**Acceptance Criteria:**
- [ ] Table: Mã đơn, Lịch, Tình trạng, Mã hộ, Tổ, Nhân sự
- [ ] Filter theo tình trạng, tổ, ngày
- [ ] Màu sắc theo tình trạng (pending= vàng, completed=xanh)

### US-13: Tạo đơn thăm viếng
**As a** user  
**I want to** tạo đơn thăm viếng mới  
**So that** lên kế hoạch thăm viếng hộ gia đình

**Acceptance Criteria:**
- [ ] Chọn mã hộ (dropdown/search)
- [ ] Chọn lịch thăm viếng (date picker)
- [ ] Chọn tổ thăm viếng
- [ ] Nhập nhân sự (multi-select member hoặc text)
- [ ] Nhập nội dung ghi chú

### US-14: Cập nhật tình trạng đơn thăm viếng
**As a** user  
**I want to** cập nhật khi đã thăm viếng  
**So that** theo dõi tiến độ thăm viếng

**Acceptance Criteria:**
- [ ] Chuyển tình trạng: pending → completed / cancelled / postponed
- [ ] Khi completed: bắt buộc nhập ngày thăm thực tế
- [ ] Lịch sử cập nhật hiển thị trên đơn

---

## Epic 6: Dashboard

### US-15: Dashboard tổng quan
**As a** user  
**I want to** xem tổng quan hệ thống  
**So that** nắm bắt nhanh tình hình hội thánh

**Acceptance Criteria:**
- [ ] Tổng số thành viên (active)
- [ ] Tổng số hộ gia đình
- [ ] Số đơn thăm viếng pending tuần này
- [ ] Số tổ thăm viếng
- [ ] Biểu đồ thành viên theo ban ngành (optional)
