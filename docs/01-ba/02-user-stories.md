# User Stories & Acceptance Criteria

## Epic 1: Authentication

### US-01: Đăng nhập
**As a** admin/user  
**I want to** đăng nhập bằng username và password  
**So that** tôi có thể truy cập hệ thống quản lý

**Acceptance Criteria:**
- [ ] Form login có username + password
- [ ] Hiển thị lỗi khi sai thông tin
- [ ] Redirect đến dashboard sau login thành công (hoặc `callbackUrl` nếu có — ví dụ quét QR đơn thăm viếng)
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

### US-06b: Xem chi tiết thành viên
**As a** user  
**I want to** xem đầy đủ thông tin một thành viên trên một trang  
**So that** tôi tra cứu nhanh mà không cần mở form sửa

**Acceptance Criteria:**
- [ ] URL `/members/[id]` hiển thị read-only tất cả nhóm thông tin (cơ bản, địa chỉ, liên lạc, hộ, tin lành, thăm viếng, ghi chú)
- [ ] Header: mã tín hữu, họ tên, badge tình trạng
- [ ] Link sang hộ gia đình, tổ thăm viếng, ban ngành (nếu có)
- [ ] Nút [Sửa] → `/members/[id]/edit`; [Xóa] chỉ admin
- [ ] Nút quay lại danh sách thành viên

### US-07: Export danh sách thành viên
**As a** user  
**I want to** xuất danh sách ra file Excel  
**So that** tôi có thể in hoặc chia sẻ

**Acceptance Criteria:**
- [ ] Nút Export Excel trên trang danh sách
- [ ] Export theo filter hiện tại
- [ ] Cột khớp file mẫu import (đầy đủ dữ liệu)

### US-07b: Import thành viên và xem log
**As a** user  
**I want to** import file Excel lớn và xem lại dòng thành công / thất bại  
**So that** tôi sửa lỗi và import lại phần còn thiếu

**Acceptance Criteria:**
- [ ] Mỗi lần import lưu `MemberImportLog` + từng dòng `MemberImportLogRow`
- [ ] Trang `/members/imports` liệt kê lịch sử import
- [ ] Trang chi tiết log: dòng OK, dòng lỗi + lý do
- [ ] Nút **Import lại dòng lỗi** trên chi tiết log
- [ ] Tải Excel chỉ các dòng lỗi để sửa ngoài hệ thống
- [ ] Cột **Quan hệ** và **Chủ hộ** lưu độc lập (không xóa quan hệ khi là chủ hộ)
- [ ] Nút **Tải file mẫu** trên header trang (không nằm trong popup import)
- [ ] Tự tạo hộ / tổ / ban ngành nếu chưa có khi import thành viên

### US-08b: Export hộ gia đình
**As a** user  
**I want to** xuất danh sách hộ ra Excel  
**So that** tôi có bản sao đầy đủ dữ liệu hộ

**Acceptance Criteria:**
- [ ] Nút Export Excel trên `/households`
- [ ] Cột: Mã hộ, Mã tín hữu chủ hộ, Tên chủ hộ, Số thành viên
- [ ] Export theo bộ lọc tìm kiếm hiện tại

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

### US-11b: Import tổ thăm viếng từ Excel
**As a** user  
**I want to** import danh sách tổ thăm viếng từ Excel  
**So that** tôi thiết lập tổ và khu vực nhanh hơn

**Acceptance Criteria:**
- [ ] Nút Import Excel trên `/visit-teams`
- [ ] File mẫu 3 cột: **Mã tổ thăm viếng** | **Mã tín hữu** | **Khu vực phụ trách**
- [ ] Tạo/cập nhật tổ theo từng dòng
- [ ] Hiển thị kết quả OK/lỗi theo dòng
- [ ] Nút **Tải file mẫu** trên header trang (không nằm trong popup import)
- [ ] Import sau khi đã import thành viên (trưởng tổ phải tồn tại nếu có mã tín hữu)

### US-11c: Export tổ thăm viếng
**As a** user  
**I want to** xuất danh sách tổ ra Excel  
**So that** tôi có bản sao đầy đủ

**Acceptance Criteria:**
- [ ] Nút Export Excel trên `/visit-teams`
- [ ] Cột khớp file mẫu import

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

### US-12b: Export đơn thăm viếng
**As a** user  
**I want to** xuất danh sách đơn thăm viếng ra Excel  
**So that** tôi có bản sao đầy đủ dữ liệu

**Acceptance Criteria:**
- [ ] Nút Export Excel trên `/visit-requests`
- [ ] Export theo filter hiện tại
- [ ] Đầy đủ: mã đơn, lịch, ngày thực tế, tình trạng, mã hộ, mã tổ, đại diện, nhân sự, nội dung

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
- [ ] Bảng **Tỷ lệ thăm viếng theo tổ**: đơn hoàn thành / tổng hộ, hộ đã thăm / tổng hộ (theo hộ phụ trách của tổ)
- [ ] Biểu đồ thành viên theo ban ngành (optional)
