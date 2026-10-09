# Nguồn yêu cầu và phạm vi backend LOVERA

## Nguồn đã kiểm tra

1. Yêu cầu trực tiếp của chủ dự án: .NET 8, kiến trúc API–Service–Repository, PostgreSQL/EF Core, Docker Compose và bàn giao F00 chạy được trước F01–F06.
2. `LOVERA_FRD_OC1_MVP_v1.1.docx`, trạng thái Draft, ngày 23/09/2026: nguồn chi tiết cho FR00.01–FR00.03, BR00.1–BR00.2, acceptance criteria và phụ thuộc F01–F06.
3. Bản văn bản `Project Overview` do chủ dự án cung cấp: bối cảnh sản phẩm, người dùng trẻ ở Việt Nam, mục tiêu OC1 và định hướng tính năng. Văn bản không chứa thêm quy tắc xác thực cụ thể cho F00.
4. Backend PIEDTEAM: chỉ tham khảo cách chia ba tầng, không dùng entity hoặc nghiệp vụ cũ.
5. URL wiki Lark: chưa đọc được qua công cụ web; trình duyệt bị chặn tại bước kiểm tra chính sách bảo mật trước khi đăng nhập. Vì thế chưa xác minh được trang con hoặc nội dung khác trên Lark.

Nếu tổng quan và FRD khác mức chi tiết, backend theo yêu cầu trực tiếp và FRD cho phạm vi OC1. Các ý tưởng trong tổng quan chưa được FRD đặc tả thành F00–F06 không được tự coi là đã triển khai.

## Đối chiếu F00

| Mục | Backend | Kiểm chứng |
|---|---|---|
| FR00.01 | Đăng ký email/password; OTP 6 chữ số qua SMTP; xác thực và gửi lại | xUnit + HTTP/SMTP thử nghiệm |
| FR00.02 | Token phiên ngẫu nhiên lưu hash; đăng nhập và thu hồi phiên khi logout | xUnit + HTTP thử nghiệm |
| FR00.03 | GET/PUT hồ sơ tên và avatar; upload PNG/JPEG/WebP, GET ảnh chỉ với phiên của chủ tài khoản | xUnit + HTTP thử nghiệm |
| BR00.1 | Chuẩn hóa email và unique index PostgreSQL | migration + thử email trùng 409 |
| BR00.2 | Chỉ phát phiên sau khi email được xác thực; policy `VerifiedEmail` dành cho F01 | thử login trước verify 403; F01 chưa triển khai |

Giới hạn 5MB và định dạng PNG/JPEG/WebP của avatar là quyết định kỹ thuật cho F00; FRD chỉ nêu cập nhật avatar, không quy định cách lưu ảnh. File avatar nằm trong volume `lovera_avatars` và chỉ chủ tài khoản đọc qua API có Bearer token. Người dùng vẫn có thể cung cấp URL HTTPS nếu ảnh nằm ở kho ngoài. Với `PUT /api/profile/me`, gửi `avatarUrl` hiện tại để giữ avatar; gửi `null` để xóa avatar. Upload mới dùng `PUT /api/profile/me/avatar`.

## Ý tưởng từ tổng quan chưa đưa vào F00

- Tổng quan nhắc **thông báo ngày kỷ niệm**; FRD F02 hiện chỉ yêu cầu ngày bắt đầu và bộ đếm ngày. Cần đặc tả thời điểm, kênh và múi giờ trước khi làm thông báo.
- Tổng quan nêu **chuỗi hoạt động, mở khóa cây và vật phẩm**; FRD F04 cho OC1 chỉ xác định điểm, giới hạn, cooldown và ba stage. Không tự thêm cửa hàng/vật phẩm vào MVP.
- Tổng quan đặt mục tiêu **deploy và thu thập phản hồi**. Docker Compose giúp chạy backend; triển khai Internet thật cần domain, TLS, SMTP thật, nơi lưu trữ/bảo vệ dữ liệu và kế hoạch vận hành do nhóm xác nhận.
- AI Dating Planner, Love Garden, Couple Pairing, Connection Status và Memories thuộc các phase F01–F06 trong FRD; bản F00 không nhận là đã xong các phần này.
