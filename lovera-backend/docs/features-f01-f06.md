# API F01–F06

Tất cả endpoint dưới đây dùng `Authorization: Bearer <accessToken>` từ F00. Chỉ tài khoản xác thực email mới có thể ghép đôi. API trả lỗi dạng `{ "code": "...", "message": "..." }`. Mọi thời điểm API nhận hoặc trả là ISO 8601 có múi giờ; các trường `*Utc` ở UTC.

## F01 — Couple Pairing

| Method | Path | Nội dung |
|---|---|---|
| GET | `/api/couples/me` | `state`: `single`, `pending` hoặc `paired`; trả `coupleId` khi đã ghép |
| POST | `/api/couples/pairing-codes` | Tạo mã 12 ký tự hex; trả `code`, `expiresAtUtc`; mã cũ còn chờ sẽ bị hủy |
| POST | `/api/couples/join` | `{ "code": "..." }`; tạo một `coupleId` chung |
| POST | `/api/couples/unpair` | `{ "confirmed": true }`; trả 204 |

Mã được lưu bằng SHA-256 và mặc định hết hạn sau 24 giờ (`PAIRING_CODE_HOURS`, từ 1 đến 168). Mã không hợp lệ, hết hạn, tự ghép với mình, hoặc đã ghép đôi có `code` lỗi riêng. Cơ sở dữ liệu có chỉ mục duy nhất cho thành viên đang hoạt động; thao tác ghép đôi dùng giao dịch và khóa user để chống tạo hai cặp trùng. Khi hủy, cả hai tài khoản rời cặp và trạng thái bận được xóa. Dữ liệu cặp trước được giữ trong DB nhưng các endpoint không cho truy cập sau khi hủy. Điều hướng về Home sau khi nhận `coupleId` là hành vi của frontend.

## F02 — Love Day Counter

| Method | Path | Nội dung |
|---|---|---|
| GET | `/api/couples/love-days` | `startDate`, `today`, `totalDays`, `timeZone` |
| PUT | `/api/couples/love-days` | `{ "startDate": "2024-02-29" }` |

Ngày bắt đầu dùng chung trong `couples`, không được ở tương lai. Ngày hiện tại được tính theo `TIME_ZONE_ID` (mặc định `Asia/Ho_Chi_Minh`). `totalDays` hiện tính gồm cả ngày bắt đầu: ngày bắt đầu có giá trị 1.

## F03 — AI Dating Planner

| Method | Path | Nội dung |
|---|---|---|
| POST | `/api/date-plans/generate` | `{ "budget": 100000, "scheduledAt": "2028-01-01T10:00:00+07:00", "location": "Hà Nội", "foodPreference": "cà phê", "activityPreference": "đi dạo" }` |
| GET | `/api/date-plans` | Các kế hoạch đã lưu, mới nhất trước |
| GET | `/api/date-plans/{id}` | Một kế hoạch thuộc cặp hiện tại |
| POST | `/api/date-plans/{id}/save` | Lưu kế hoạch |
| POST | `/api/date-plans/{id}/complete` | Đánh dấu hoàn thành sau khi lưu |

Kết quả generate có `status: "created"`, `plan`, `pointsEarned` hoặc `status: "fallback"`, `message`, `plan: null`. Mỗi kế hoạch gồm 1–10 mục `placeName`, `address`, `activity`, `startsAt`, `durationMinutes`, `estimatedCost`; tổng ước tính được tính lại ở backend và phải không vượt ngân sách. Kết quả thiếu trường, chi phí âm, thời gian không hợp lệ, timeout, HTTP lỗi, không có kế hoạch hoặc ngân sách dưới 20.000 VNĐ sẽ fallback. Chi phí tính bằng VNĐ. Tạo kế hoạch hợp lệ có thể được +5 điểm; 3 lần tạo đầu trong một giờ được xét điểm, các lần sau vẫn có kế hoạch nhưng không cộng điểm. Hoàn thành sau khi lưu được +20 tối đa một lần. Daily cap chung của F04 vẫn áp dụng.

Adapter AI dùng endpoint **Chat Completions tương thích** qua HTTPS, nhận JSON object. Cấu hình trong `.env` riêng:

```dotenv
AI_CHAT_COMPLETIONS_URL=https://your-provider.example/v1/chat/completions
AI_MODEL=your-model
AI_API_KEY=your-private-key
AI_TIMEOUT_SECONDS=15
```

Không commit `.env` hoặc khóa thật. Nếu chưa cấu hình AI, endpoint vẫn chạy và trả fallback rõ ràng; để có kế hoạch thật phải cấu hình nhà cung cấp. Backend không gọi Google Places ở phiên này. Nguồn địa điểm là dữ liệu LLM theo phương án cho phép trong BR03.2; địa điểm, giờ mở cửa và giá chưa được xác thực thời gian thực. Nếu cần địa điểm đã xác thực, bổ sung Places API sau khi chốt nhà cung cấp và phạm vi chi phí. Không có booking hoặc thanh toán.

## F04 — Love Garden & Love Points

| Method | Path | Nội dung |
|---|---|---|
| GET | `/api/garden` | Tổng điểm, stage hiện tại, stage đủ điều kiện, điểm trong ngày và `careAvailable` |
| POST | `/api/garden/check-in` | Check-in, +5 điểm nếu đủ điều kiện |
| POST | `/api/garden/care` | Nâng một stage nếu đủ điểm |
| GET | `/api/garden/points` | 100 sự kiện điểm gần nhất |

Các nguồn điểm: check-in +5, tạo kế hoạch +5, lưu kỷ niệm đầu tiên của cặp trong ngày +10, hoàn thành kế hoạch +20. Mỗi cặp tối đa **50 điểm/ngày**; khi gần trần, action chỉ được nhận phần điểm còn lại. Sự kiện điểm gồm `actionType`, `points`, `occurredAtUtc`, `actorUserId`, `sourceId` và lưu vào `point_events`. Mốc 100 và 300 chỉ mở quyền chăm sóc; sau action chăm sóc stage chuyển 1 → 2 → 3. Check-in hiện tính một lần **mỗi user mỗi ngày**.

## F05 — Connection Status

| Method | Path | Nội dung |
|---|---|---|
| GET | `/api/connection-status/me` | Trạng thái của mình |
| GET | `/api/connection-status/partner` | Trạng thái của người còn lại trong cặp |
| PUT | `/api/connection-status/me` | `{ "kind": "Working", "expectedAvailableAt": "2028-01-01T16:00:00+07:00" }` |
| DELETE | `/api/connection-status/me` | Về `Available` |

`kind` nhận `Studying`, `Working`, `Sleeping`, `OnTheRoad`, `PersonalTime`. Khi đọc sau `expectedAvailableAt`, backend tự xóa trạng thái bận và trả `Available`. Đây là cơ chế kiểm tra khi mở app theo BR05.3; frontend cần gọi GET khi Home được mở hoặc làm mới.

## F06 — Memories

| Method | Path | Nội dung |
|---|---|---|
| POST | `/api/memories` | `multipart/form-data`: `text` và/hoặc `image` |
| GET | `/api/memories` | 100 kỷ niệm gần nhất, mới nhất trước |
| GET | `/api/memories/{id}/image` | Ảnh kỷ niệm, yêu cầu Bearer |
| DELETE | `/api/memories/{id}` | Xóa kỷ niệm thuộc cặp hiện tại |

Nội dung phải có text hoặc ảnh. Text tối đa 5000 ký tự. Ảnh PNG/JPEG/WebP tối đa 5 MB, được lưu vào PostgreSQL. Timeline chỉ đọc metadata; ảnh được tải riêng để tránh đọc nhiều ảnh lớn cùng lúc. Chỉ thành viên cặp đang hoạt động có thể đọc/xóa. Lần tạo kỷ niệm đầu tiên mỗi cặp/ngày được xét +10 điểm, chịu giới hạn 50 điểm/ngày. Xóa kỷ niệm không thu hồi điểm đã cộng; tạo lại cùng ngày không cộng thêm.

## Chạy và cập nhật database

Từ thư mục chứa `compose.yaml`, điền `.env` riêng rồi chạy:

```sh
docker compose up -d db mailpit
docker compose --profile tools run --rm migrate
docker compose up -d --build api
docker compose ps
```

Kiểm tra `/health/ready` và `/swagger`. Migration F01–F06 nằm trong `src/Lovera.Repository/Migrations`. Khi chạy trực tiếp từ Rider, cần cung cấp `ConnectionStrings__Default` và `Otp__Pepper` qua environment hoặc User Secrets; `appsettings.json` chỉ chứa thiết lập không bí mật. `POSTGRES_PASSWORD` thay đổi trong `.env` không tự thay mật khẩu của volume PostgreSQL đã khởi tạo. DBeaver là client quản trị, kết nối `localhost:5434` theo tài khoản của database, không phải là database server.

## Quyết định sản phẩm cần xác nhận

FRD chưa cố định: dữ liệu có thể xem sau unpair hay xóa hẳn; nhà cung cấp AI/Places và khóa riêng; 24 giờ cho mã ghép đôi; timezone; check-in theo user hay theo cặp; ngày bắt đầu tính 1 hay 0. Các giá trị hiện tại ghi rõ ở trên để frontend có thể tích hợp; có thể điều chỉnh khi chủ dự án xác nhận. Bản clone này giữ nguyên cấu trúc `Lovera.Api`, `Lovera.Service`, `Lovera.Repository`.
