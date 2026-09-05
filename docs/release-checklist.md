# Portfolio Release Checklist

Checklist này dùng cho bản DMS Lite đưa lên server demo và gắn vào CV. Mục tiêu là xác nhận **business correctness, role workflow, build và deployment**, không phải thêm feature mới.

## 1. Build gate

Backend:

```powershell
cd backend
mvn verify
```

Frontend:

```powershell
cd frontend
npm ci
npm run build
```

Không deploy nếu một trong hai bước fail.

## 2. Optional clean local baseline

Nếu local database đã chứa nhiều dữ liệu test cũ và cần một baseline lặp lại được trước golden-flow QA, có thể chạy:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\local\reset-dms-local-jdbc.ps1"
```

Chỉ dùng utility này cho **local development/demo database**. Không chạy script reset này trên production. Script giữ `flyway_schema_history` và để demo seeder tạo lại baseline sau khi local app khởi động.

## 3. Golden business flow

Dùng một customer và một product có stock đủ:

1. Sales tạo order `DRAFT` tổng `100`, paid `0`.
2. Warehouse confirm/fulfill order.
3. Order phải thành `COMPLETED`.
4. Stock phải giảm đúng quantity và có inventory transaction `OUT`.
5. Customer receivable phải là `100`.
6. Accountant record payment `40`.
7. Customer receivable phải còn `60`.
8. Debt statement phải giữ cả receivable phát sinh và payment history.
9. Dashboard total receivable và top customer debt phải cùng là `60` cho scenario này.
10. Không nơi nào được tính thành `20`.

## 4. Role smoke test

### Owner

- Login được.
- Dashboard/report mở được.
- Team Access, role/permission và audit mở được.
- Các module vận hành chính mở được theo permission.

### Sales Staff

- Xem product/stock phục vụ bán hàng.
- Xem/quản lý customer theo permission.
- Tạo order `DRAFT`.
- Không có `REPORT_VIEW`/`PAYMENT_CREATE` trong system Sales role.
- Không được thao tác warehouse-only nếu không có permission.
- Customer detail không lỗi chỉ vì thiếu `DEBT_VIEW`; finance section phải ẩn nếu không có quyền.

### Warehouse Staff

- Xem sales order cần xử lý.
- Xem product/inventory.
- Receive stock.
- Confirm/fulfill `DRAFT` order.
- Không xem financial fields nếu role không có finance permission.

### Accountant

- Xem customer/order financial information theo permission.
- Xem receivable statement.
- Record payment hợp lệ.
- Overpayment phải bị reject.
- Xem dashboard/report được cấp quyền.

- Custom role có dependency permission hợp lệ; không tạo role thao tác mà thiếu quyền đọc dữ liệu bắt buộc của màn hình.

## 5. API / data consistency

- `GET /api/customers/{id}` trả đúng customer detail.
- `GET /api/sales-orders/{id}` trả order detail + items.
- Sales order list chỉ là summary; frontend không giả định list có items.
- Create Order và Receive Stock lấy default warehouse từ API; không hardcode warehouse ID `1`.
- Revenue chỉ dùng order `COMPLETED`.
- Persisted sales status chỉ có `DRAFT`, `COMPLETED`, `CANCELLED` trong current MVP.
- Receivable balance dùng duy nhất tổng `remaining_amount` của open `INCREASE` rows.
- Customer list không phát sinh một balance query cho từng customer.

## 6. Deployment security

- Backend public chạy với `SPRING_PROFILES_ACTIVE=prod` để production JWT guard được bật.
- `APP_JWT_SECRET` là secret riêng, tối thiểu 32 ký tự, không dùng default trong repository.
- `APP_CORS_ALLOWED_ORIGINS` đúng frontend domain public.
- `/actuator/health` hoạt động; metrics không public anonymous.
- Swagger chỉ chứa API contract hiện tại.
- Demo account chỉ chứa demo data, không dùng dữ liệu thật.
- Vercel có `VITE_API_BASE_URL` trỏ đúng public backend `/api`.
- Refresh trực tiếp `/login`, `/dashboard` hoặc route con không được 404; SPA rewrite phải fallback về `index.html`.

## 7. Server smoke test

Sau deploy:

- Frontend load không lỗi console nghiêm trọng.
- Login 4 demo roles thành công.
- Không có request 401/403/500 bất thường trong Network tab.
- Create customer/product/order hoạt động.
- Confirm order và payment hoạt động theo golden flow.
- Reload browser rồi mở order detail vẫn thấy items.
- Mở customer có id ngoài page đầu vẫn lấy được detail bằng API detail.
- Dashboard refresh đúng sau product/customer/order/payment mutation.

## 8. Documentation gate

Trước khi tag release, rà đồng thời:

- `README.md`
- `docs/architecture.md`
- `docs/business-flow.md`
- `docs/frontend/ARCHITECTURE.md`
- `RUN_LOCAL.md`
- Swagger/OpenAPI runtime

Nếu code đổi business rule/API/status/permission thì tài liệu liên quan phải đổi trong cùng release.
