# LOVERA backend OC1 — F00

For public HTTPS deployment and frontend CORS configuration, see [DEPLOYMENT.md](DEPLOYMENT.md). Set `CORS_ALLOWED_ORIGINS` to exact comma-separated frontend origins in local Docker Compose; the deployment environment uses `Cors__AllowedOrigins`.

Backend .NET 8 riêng cho LOVERA. Phiên bản này triển khai **F00 Authentication & User Profile** của `LOVERA_FRD_OC1_MVP_v1.1.docx` (Draft, 23/09/2026), đã đối chiếu với bản Project Overview do chủ dự án cung cấp. F01–F06 chưa có endpoint hay bảng dữ liệu. Backend PIEDTEAM chỉ được dùng để tham khảo cách chia API, Service, Repository; không sao chép nghiệp vụ. Xem [bản đồ nguồn yêu cầu](docs/requirements-map.md) để phân biệt yêu cầu chi tiết, bối cảnh sản phẩm và quyết định kỹ thuật.

## Kiến trúc và dữ liệu

- **API** nhận HTTP, validation, xác thực phiên, Swagger và trả lỗi JSON.
- **Service** thực hiện quy tắc F00: đăng ký, OTP, đăng nhập, đăng xuất, hồ sơ.
- **Repository** dùng EF Core/Npgsql để đọc và ghi PostgreSQL; migration nằm tại `src/Lovera.Repository/Migrations`.
- Luồng: client → API → Service → Repository → PostgreSQL → response. SMTP được Service gọi qua `IVerificationMail`.

`users` có email duy nhất, password hash PBKDF2, trạng thái xác thực, tên và đường dẫn/URL avatar. Mỗi user có nhiều `verification_codes` và `sessions` qua `UserId`; code và token chỉ lưu hash. Migration đầu tiên `InitialF00` tạo bảng và chỉ mục. PostgreSQL lưu trong volume `lovera_pgdata`; ảnh avatar tải lên lưu trong volume `lovera_avatars`.

## Chạy từ máy mới bằng Docker

Cần Docker Engine/Compose, cổng 5432, 8025 và 8080 còn trống, kết nối Internet để tải image và NuGet khi build. Từ thư mục này:

```sh
cp .env.example .env
# Sửa .env: POSTGRES_PASSWORD, OTP_PEPPER thành giá trị ngẫu nhiên riêng.
# Ví dụ tạo giá trị: openssl rand -hex 32

docker compose up -d db mailpit
docker compose --profile tools run --rm migrate
docker compose up -d --build api
docker compose ps
```

Kiểm tra `http://localhost:8080/health/ready` và tài liệu API `http://localhost:8080/swagger`. Mailpit phát triển: `http://localhost:8025`. OTP được gửi vào Mailpit, **không gửi ra email thật** với cấu hình Compose mặc định. Muốn gửi email thật, điền `SMTP_HOST`, `SMTP_PORT`, `SMTP_ENABLE_SSL`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM` trong `.env` riêng hoặc cung cấp qua secret manager khi triển khai; Compose chuyển chúng vào `Smtp__*` của API. SMTP port 587/STARTTLS được hỗ trợ. Không commit `.env` hay mật khẩu. Chạy migration trước mỗi lần khởi động phiên bản schema mới. Dữ liệu vẫn còn sau `docker compose down`; chỉ xóa khi chủ động xóa volume.

Có thể chạy API bằng `dotnet run --project src/Lovera.Api --no-launch-profile` với .NET 8 và PostgreSQL sẵn có. Trước đó đặt `ConnectionStrings__Default`, `Otp__Pepper` (ít nhất 32 ký tự), và các biến `Smtp__*`; chạy `dotnet ef database update --project src/Lovera.Repository --startup-project src/Lovera.Repository` sau khi cài `dotnet-ef` 8.x.

## DBeaver

DBeaver là **công cụ kết nối và quản trị** PostgreSQL, không phải hệ quản trị database. Tạo kết nối kiểu PostgreSQL với Host `localhost`, Port `5434` (hoặc `POSTGRES_HOST_PORT` nếu đã đổi), Database từ `POSTGRES_DB` (mặc định `lovera`), Username từ `POSTGRES_USER` (mặc định `lovera`), Password từ `.env`. PostgreSQL thực sự chạy trong container `db`; cổng chỉ bind `127.0.0.1` trên máy cài Docker. Trong container khác, host là `db`, port `5432`.

## API F00

| Method | Path | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | công khai | `{ "email", "password", "displayName" }`; gửi OTP |
| POST | `/api/auth/resend-verification` | công khai | `{ "email" }`; giới hạn mỗi 60 giây, phản hồi trung tính |
| POST | `/api/auth/verify-email` | công khai | `{ "email", "code" }`; code 6 số |
| POST | `/api/auth/login` | công khai | `{ "email", "password" }`; trả `accessToken`, `expiresAtUtc`, `profile` |
| POST | `/api/auth/logout` | Bearer | thu hồi phiên hiện tại |
| GET | `/api/profile/me` | Bearer | hồ sơ của chính mình |
| PUT | `/api/profile/me` | Bearer | `{ "displayName", "avatarUrl" }`; URL HTTPS, đường dẫn avatar hiện tại hoặc null để xóa |
| PUT | `/api/profile/me/avatar` | Bearer | `multipart/form-data`, trường `file`; PNG/JPEG/WebP, tối đa 5MB |
| GET | `/api/profile/me/avatar` | Bearer | Trả ảnh đã tải lên cho chính chủ tài khoản |

Thêm `Authorization: Bearer <accessToken>` cho endpoint cần phiên. Khi đăng ký, mã OTP 6 số có hạn 10 phút, tối đa 5 lần thử. Nếu thư không đến, dùng endpoint gửi lại; việc gửi lại hết hạn mã cũ. Chỉ email đã xác thực mới đăng nhập và được phát phiên. Phiên dạng token ngẫu nhiên tồn tại 7 ngày, lưu SHA-256 trong database và bị thu hồi ngay khi đăng xuất. Mật khẩu băm PBKDF2-SHA256 với salt riêng, 210.000 vòng. 5 lần sai mật khẩu khóa tài khoản 15 phút; endpoint auth giới hạn 20 request/phút/IP. API trả `code`/`message` rõ ràng: `email_exists` (409), `invalid_credentials` (401), `email_unverified` (403), `invalid_input` (400), `invalid_code` (400), `login_locked` (429). Không ghi OTP, password hoặc token vào log ứng dụng.

FRD chỉ yêu cầu cập nhật Avatar mà chưa quy định cách lưu. Backend hỗ trợ tải ảnh trực tiếp vào volume Docker hoặc nhận URL HTTPS từ kho ngoài. `avatarUrl` của ảnh đã tải lên là `/api/profile/me/avatar`; frontend lấy ảnh bằng Bearer token và tạo object URL để hiển thị. `PUT /api/profile/me` là cập nhật đầy đủ: gửi lại `avatarUrl` hiện tại để giữ ảnh, hoặc `null` để xóa. Không có dịch vụ quét nội dung ảnh ở MVP. Khi bổ sung F01, endpoint ghép đôi phải áp dụng policy `VerifiedEmail` (claim lấy từ bản ghi user đã xác thực), đồng thời kiểm tra lại quy tắc cặp đôi trong Service.

## Kiểm thử

Chạy `dotnet test Lovera.sln`. Các test kiểm tra đăng ký → OTP → đăng nhập → sửa/xem hồ sơ → đăng xuất, email trùng, mật khẩu sai, URL avatar sai, tải và xóa avatar, OTP hết hạn/hết lượt, khóa tạm sau 5 lần sai. Unit test dùng Repository, kho ảnh và SMTP giả nên không cần PostgreSQL. Migration và HTTP đã được xác minh trên PostgreSQL tạm trong phiên bàn giao.

## Phụ thuộc F01–F06 và quyết định còn mở

Đề xuất: **F01** trước (cung cấp `Couple_ID` cho F02, F04, F05, F06); tiếp theo **F02**, **F05**, **F04** (sổ điểm và giới hạn); sau đó **F06** (cộng điểm qua F04) và **F03** (tạo/hoàn thành kế hoạch cộng điểm qua F04). Có thể đổi F06 và F03 theo ưu tiên sản phẩm. FRD còn để mở thời hạn pairing code, múi giờ, nguồn địa điểm cho AI, dữ liệu sau unpair và kiểm duyệt ảnh. Cần chốt trước khi triển khai tương ứng. Đã nhận bản xuất Project Overview; các trang con của wiki Lark vẫn chưa truy cập được.

### Kết quả xác minh tại thời điểm bàn giao

- Build API và test project: thành công, không có warning/error.
- xUnit: **7/7 pass**, gồm kiểm thử tạo tài liệu Swagger cho endpoint tải avatar.
- Migration `InitialF00`: áp dụng thành công lên PostgreSQL 16 tạm; xác nhận ba bảng nghiệp vụ và các chỉ mục.
- HTTP thử nghiệm với SMTP giả: register 202, duplicate 409, login trước xác thực 403, password sai 401, verify 200, login 200, profile GET/PUT 200, logout 204, token cũ dùng lại 401; Swagger 200 và input sai 400. Upload avatar 200, GET ảnh có Bearer 200, GET không Bearer 401, xóa ảnh 200 và GET lại 404.
- `docker compose config --quiet`: thành công. Chưa chạy container thật vì Docker daemon trên máy kiểm thử không hoạt động.
