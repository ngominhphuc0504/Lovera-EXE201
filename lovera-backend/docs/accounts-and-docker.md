# Tài khoản cấp sẵn và chạy backend cùng Docker

## Dữ liệu tài khoản

Tài khoản nằm trong bảng PostgreSQL `users`; cột `PasswordHash` giữ hash PBKDF2 có salt riêng. Không lưu hoặc nhập mật khẩu gốc vào DBeaver bằng câu lệnh SQL. Công cụ `Lovera.Accounts` nhận đúng 10 email/mật khẩu/tên qua JSON riêng, kiểm tra dữ liệu, băm mật khẩu rồi thêm cả nhóm trong một giao dịch. Email trùng trong file hoặc đã có trong database sẽ làm toàn bộ lần nhập thất bại; công cụ không tự ghi đè mật khẩu. Tài khoản do chủ dự án cấp sẵn được đánh dấu `EmailVerified=true`, nên đăng nhập và ghép đôi được ngay.

Tạo file `private-accounts.json` trong thư mục backend. File này đã được `.gitignore` và `.dockerignore` bỏ qua. Mẫu cấu trúc cho **mỗi** tài khoản:

```json
[
  { "email": "user01@example.com", "password": "your-private-password", "displayName": "User 01" }
]
```

Hãy thay dữ liệu mẫu và viết đủ **10** phần tử trước khi chạy. Dùng email và mật khẩu riêng của bạn, không gửi mật khẩu qua chat và không commit file này. Giới hạn mật khẩu 6–128 ký tự. Nếu có thể, lưu file bên ngoài repository rồi dẫn đường dẫn của file vào lệnh bên dưới.

Từ thư mục chứa `compose.yaml`, sau khi Docker Desktop đã chạy và `.env` đã được cấu hình:

```sh
docker compose up -d db mailpit
docker compose --profile tools run --rm migrate
docker compose --profile tools run --rm -T accounts < private-accounts.json
docker compose up -d --build api
```

Nếu file ở nơi khác, thay `private-accounts.json` bằng đường dẫn thật. Kiểm tra trên DBeaver (host `localhost`, port từ `POSTGRES_HOST_PORT`, mặc định `5434`):

```sql
SELECT "Email", "EmailVerified", "DisplayName" FROM users ORDER BY "CreatedAtUtc";
```

Không cần tạo 10 tài khoản lần nữa sau khi import thành công. Công cụ cố ý từ chối email đã tồn tại. Nếu muốn chỉ cho tài khoản cấp sẵn sử dụng app, đặt `ALLOW_PUBLIC_REGISTRATION=false` trong `.env`, sau đó chạy `docker compose up -d api` để tạo lại container API với cấu hình mới. Khi đó `/api/auth/register` trả `403 registration_disabled`; `/api/auth/login` vẫn hoạt động. Mặc định tính năng tự đăng ký vẫn bật để giữ luồng F00 cũ.

## Vì sao Docker tắt mà Swagger vẫn hiện?

Rider có thể chạy API .NET trên máy Mac ở cổng `5164`; tiến trình đó độc lập với Docker. Bản API hiện tại kiểm tra PostgreSQL ngay khi khởi động và từ chối mở cổng khi database không kết nối được. Trước khi thử, bấm **Stop** ở Rider để tắt tiến trình API cũ, rồi chạy lại bản mới. Cấu hình Development của Rider dùng `Host=localhost;Port=5434` cho PostgreSQL trong Docker. Mật khẩu phải trùng với mật khẩu hiện có trong database Docker; việc chỉ sửa `.env` không đổi mật khẩu của volume PostgreSQL đã được tạo.

Nếu bạn muốn Docker Desktop tắt là Swagger cũng biến mất ngay, hãy chạy **cả API trong Docker** và truy cập `http://localhost:8080/swagger/index.html`. Không chạy thêm cấu hình `Lovera.Api Local` trong Rider. Dừng toàn bộ bằng `docker compose down` (không thêm `-v`, để giữ dữ liệu). Khi dùng Rider để chạy API ngoài Docker, việc tắt Docker sau khi API đã mở không tự dừng tiến trình Rider; các endpoint dùng database sẽ lỗi cho đến khi database hoạt động lại.

## Triển khai cho frontend

`localhost` chỉ phục vụ trên máy của bạn. Để frontend ở máy khác dùng được, cần một host công khai, HTTPS, PostgreSQL bền vững, SMTP thật, volume ảnh bền vững và `Cors__AllowedOrigins` là origin HTTPS của frontend. Xem [DEPLOYMENT.md](../DEPLOYMENT.md). Không đưa `private-accounts.json`, `.env`, mật khẩu hoặc OTP pepper vào Git.
