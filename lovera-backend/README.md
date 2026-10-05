# LOVERA backend OC1 — F00–F06

For public HTTPS deployment and frontend CORS configuration, see [DEPLOYMENT.md](DEPLOYMENT.md). Set `CORS_ALLOWED_ORIGINS` to exact comma-separated frontend origins in local Docker Compose; the deployment environment uses `Cors__AllowedOrigins`.

Backend .NET 8 riêng cho LOVERA. Phiên bản này triển khai **F00–F06** theo `LOVERA_FRD_OC1_MVP_v1.1.docx` (Draft, 23/09/2026), đã đối chiếu với bản Project Overview do chủ dự án cung cấp. Backend PIEDTEAM chỉ được dùng để tham khảo cách chia API, Service, Repository; không sao chép nghiệp vụ. Xem [bản đồ nguồn yêu cầu](docs/requirements-map.md) và [API F01–F06](docs/features-f01-f06.md).

## Kiến trúc và dữ liệu

- **API** nhận HTTP, validation, xác thực phiên, Swagger và trả lỗi JSON.
- **Service** thực hiện quy tắc F00–F06: xác thực, ghép đôi, ngày yêu, kế hoạch, điểm, trạng thái và kỷ niệm.
- **Repository** dùng EF Core/Npgsql để đọc và ghi PostgreSQL; migration nằm tại `src/Lovera.Repository/Migrations`.
- Luồng: client → API → Service → Repository → PostgreSQL → response. SMTP được Service gọi qua `IVerificationMail`.

`users` có email duy nhất, password hash PBKDF2, trạng thái xác thực, tên và đường dẫn/URL avatar. Mỗi user có nhiều `verification_codes` và `sessions` qua `UserId`; code và token chỉ lưu hash. F01–F06 thêm `couples`, `couple_members`, `pairing_invitations`, `gardens`, `point_events`, `date_plans`, `memories`, `connection_statuses`. Migration `FeaturesF01F06` thêm các bảng và chỉ mục. PostgreSQL lưu trong volume `lovera_pgdata`; ảnh avatar tải lên lưu trong volume `lovera_avatars`; ảnh kỷ niệm được lưu trong PostgreSQL.

## Chạy từ máy mới bằng Docker

Cần Docker Engine/Compose, cổng 5434 (hoặc `POSTGRES_HOST_PORT`), 8025, 1025 và 8080 còn trống, kết nối Internet để tải image và NuGet khi build. Từ thư mục này:

```sh
cp .env.example .env
# Sửa .env: POSTGRES_PASSWORD, OTP_PEPPER thành giá trị ngẫu nhiên riêng.
# Để dùng F03 AI, cấu hình thêm AI_CHAT_COMPLETIONS_URL, AI_MODEL, AI_API_KEY.
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

## F01–F06

Chi tiết endpoint, request/response, quy tắc điểm, cấu hình AI và các lựa chọn nghiệp vụ cần chốt nằm trong [docs/features-f01-f06.md](docs/features-f01-f06.md). F03 gọi endpoint Chat Completions tương thích qua HTTPS nếu được cấu hình; nếu thiếu cấu hình, timeout hoặc kết quả không hợp lệ, API trả `status: "fallback"` thay vì lỗi máy chủ. Đây là gợi ý, không đặt chỗ hay thanh toán. Tài liệu FRD cho phép dùng dữ liệu địa điểm từ LLM; địa chỉ và chi phí do AI trả về là ước tính, cần đối chiếu nếu sản phẩm yêu cầu địa điểm đã xác thực.

### Kết quả xác minh tại thời điểm bàn giao

- Build API và test project: thành công, không có warning/error.
- xUnit: **15/15 pass**, gồm luồng F00, quy tắc ngày yêu, giới hạn điểm, trạng thái, kỷ niệm và kế hoạch.
- Migration `InitialF00` và `FeaturesF01F06`: áp dụng thành công lên PostgreSQL 16 tạm.
- HTTP thử nghiệm với SMTP giả: register 202, duplicate 409, login trước xác thực 403, password sai 401, verify 200, login 200, profile GET/PUT 200, logout 204, token cũ dùng lại 401; Swagger 200 và input sai 400. Upload avatar 200, GET ảnh có Bearer 200, GET không Bearer 401, xóa ảnh 200 và GET lại 404.
- HTTP thử nghiệm trên PostgreSQL 16 tạm: health và Swagger 200; tạo mã và ghép đôi 200; ngày yêu đồng bộ hai tài khoản; check-in +5; trạng thái bận hiển thị cho đối tác; lưu/xem kỷ niệm; F03 fallback ngân sách thấp; hủy ghép đôi 204 và quyền truy cập dữ liệu cũ bị chặn. F03 tạo/lưu/hoàn thành kế hoạch và cộng tổng 25 điểm đã được thử với AI giả cục bộ.
- Docker Compose chưa chạy container thật trong phiên này vì Docker daemon trên máy kiểm thử không hoạt động. Trước khi chạy trên máy mới, cần điền `.env` riêng.
