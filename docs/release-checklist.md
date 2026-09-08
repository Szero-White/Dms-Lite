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

1. Sales tạo order `DRAFT` tổng `100`, paid `0`; mã mới phải theo `SO-YYYYMMDD-NNNN`.
2. Warehouse confirm/fulfill order.
3. Order phải thành `COMPLETED`.
4. Stock phải giảm đúng quantity và có inventory transaction `OUT`.
5. Customer receivable phải là `100`.
6. Accountant chọn đúng order vừa hoàn tất và record payment `40`; payment mới phải theo `PAY-YYYYMMDD-NNNN` và chỉ giảm receivable của order đó.
7. Customer receivable phải còn `60`.
8. Debt statement phải giữ cả receivable phát sinh và payment history.
9. Dashboard total receivable và top customer debt phải cùng là `60` cho scenario này.
10. Nếu đổi `due_date` của khoản còn nợ sang trước business date, Dashboard `Công nợ cần chú ý` phải tăng `Quá hạn`, hiển thị đúng amount/count và preview khoản quá hạn; `Đến hạn hôm nay` / `Sắp đến hạn` phải cùng semantics với Payment worklist.
11. Không nơi nào được tính thành `20`.
12. Với customer có `creditLimit > 0`, tạo `DRAFT` vượt hạn mức phải chỉ cảnh báo; confirm/fulfill phải bị reject trước khi trừ stock hoặc tạo receivable.
13. Confirm đúng bằng hạn mức phải được phép; `creditLimit = 0` phải tiếp tục được hiểu là chưa cấu hình hard limit.

## 4. Payment / receipt smoke

- `/payments` chỉ mở khi user có đủ `PAYMENT_CREATE + CUSTOMER_VIEW + SALES_ORDER_VIEW + DEBT_VIEW`; thiếu một quyền phải bị chặn cả route/API/AI/payment notification.
- Tab `Thanh toán` phải hiển thị từng sales order `COMPLETED` còn nợ; `DRAFT`, `CANCELLED`, order đã tất toán không xuất hiện. Mỗi dòng phải hiện rõ hạn + badge `Còn hạn` / `Sắp đến hạn` / `Đến hạn hôm nay` / `Quá hạn X ngày`; checkbox trạng thái, khoảng hạn và khoảng còn phải thu phải lọc đúng trên backend-paged worklist.
- Một khách có nhiều order phải thấy từng order độc lập, không gộp thành một dòng customer khó truy vết.
- Chọn order còn `520.000`, ghi `500.000` phải còn `20.000`; payment không được chạm vào receivable của order khác.
- Ghi tiếp `20.000` phải tất toán; order biến khỏi outstanding list nhưng PAY vẫn ở `Lịch sử` và report/order/audit vẫn giữ.
- Backend phải reject overpayment cho selected order và rollback toàn bộ mutation. Frontend có thể cap số nhập về remaining để UX dễ dùng.
- Double-click/retry cùng `request_key` không được tạo PAY thứ hai hoặc trừ debt lần hai.
- Mỗi payment mới trong `Lịch sử` phải hiện PAY, SO, customer, amount, remaining-after, note, detail và nút tải biên nhận; search PAY/SO/customer/note và bộ lọc `Từ ngày` / `Đến ngày` phải hoạt động trên toàn bộ paged history.
- Partial payment vẫn tải được biên nhận; receipt cũ phải giữ debt-before/debt-after snapshot dù khách trả thêm sau đó.
- Legacy payment trước V11 không được đoán sales order nếu lịch sử cũ có thể đã phân bổ qua nhiều receivable.
- Customer debt statement phải dùng cùng due-status semantics với Payment worklist cho receivable `INCREASE` còn mở; payment row hoặc receivable đã tất toán không được gắn badge quá hạn.
- `PAYMENT_RECORDED` chỉ hiển thị cho role đủ Payment workspace scope và notification mới nên nêu SO với payment order-specific.
- `INVOICE_ISSUED` chỉ hiển thị cho role có `INVOICE_VIEW + CUSTOMER_VIEW + SALES_ORDER_VIEW + DEBT_VIEW`; role chỉ có finance scope nhưng không có quyền Hóa đơn không được thấy event này.

## 5. Invoice / document smoke

- Partial payment **không** tạo invoice; khi final payment đưa order `COMPLETED` về remaining `0`, invoice `DRAFT` phải tự sinh `INV-YYYYMMDD-NNNN` trong cùng transaction.
- Trang Hóa đơn không còn nút/drawer **Tạo hóa đơn**; search `INV/SO/customer` và `Từ ngày` / `Đến ngày` phải lọc đúng trên paged data.
- Order đã thu đủ trước V12 phải có invoice backfill sau migrate; cùng một sales order không bao giờ có invoice thứ hai.
- Issue invoice không được làm tăng receivable lần hai.
- PDF VI/EN phải giữ đúng customer/product, SO/INV code, amount, paid/remaining và Unicode tiếng Việt.
- Menu `...` Sales Order vẫn giữ các action vận hành theo permission và không có action tạo invoice.
- Debt statement phải hiển thị `sourceCode` cho Sales Order/Payment thay vì dùng database ID làm business reference.

## 6. Role smoke test

### Owner

- Login được.
- Dashboard/report mở được.
- Bảng Báo cáo bán hàng giữ layout hiện tại; filter mã SO/customer, trạng thái đơn và multi-select trạng thái thu chỉ lọc dữ liệu, không tạo thêm bảng payment/receipt.
- Team Access, role/permission và audit mở được.
- Các module vận hành chính mở được theo permission.

### Sales Staff

- Xem product/stock phục vụ bán hàng.
- Xem/quản lý customer theo permission.
- Tạo order `DRAFT`; bộ lọc trạng thái đơn hỗ trợ multi-select để theo dõi nhiều trạng thái cùng lúc.
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

### Custom role permission coherence

- Role mới không tự được tick AI/Notification hoặc quyền nghiệp vụ nào.
- Chọn quyền có dependency phải tự bổ sung quyền bắt buộc trong UI và backend vẫn validate lại khi lưu.
- `PRODUCT_VIEW`-only: mở được Sản phẩm, thấy catalog/giá bán; không thấy tồn kho, giá vốn hoặc margin.
- `INVENTORY_VIEW`: dependency tự có `PRODUCT_VIEW`; thấy quantity/stock health nhưng không thấy inventory value từ giá vốn nếu thiếu quyền financial product.
- `CUSTOMER_VIEW`-only: thấy hồ sơ/hạn mức nhưng không thấy balance công nợ hoặc debt statement.
- `PAYMENT_CREATE` phải kéo dependency `CUSTOMER_VIEW + SALES_ORDER_VIEW + DEBT_VIEW`; thiếu bất kỳ dependency nào thì Payment workspace/API/AI/payment notification đều fail closed.
- `SALES_ORDER_VIEW`-only: xem workflow order/status nhưng financial columns phải ẩn nếu thiếu finance/sales-create permission.
- `REPORT_VIEW`-only: aggregate dashboard/report vẫn hoạt động; không render tab chi tiết cần permission module mà user không có.
- Sidebar, search, route và quick action phải thống nhất; gõ URL của module không có quyền phải redirect về màn được phép.
- Role không có business page nào phải vào màn `No workspace access`, không rơi vào redirect loop.
- Route protected mới nhưng quên khai báo permission phải fail closed.
- Sau khi Owner đổi role/quyền của một user, reload browser của user đó phải gọi `/api/auth/me`, cập nhật menu/action theo permission mới và không tái sử dụng server-state cache thuộc authorization snapshot cũ.
- AI và Notification tiếp tục áp policy nghiệp vụ riêng; notification không được spam duplicate/retry.
- Trạng thái đã đọc/chưa đọc của notification phải độc lập theo từng user: Owner đọc không được làm Warehouse/Sales/Accountant tự thành đã đọc.
- Notification đã đọc phải có thể **Đánh dấu chưa đọc**; sau F5 trạng thái phải giữ nguyên và badge/tab Chưa đọc cập nhật đúng. Kiểm cả persisted sales-order event và derived LOW_STOCK.
- Khi **Đánh dấu chưa đọc** ở tab `Tất cả`, notification giữ nguyên vị trí theo `createdAt`, đổi style sang chưa đọc ngay, `Chưa đọc (N)` và badge chuông tăng `N + 1`, đồng thời notification xuất hiện trong tab `Chưa đọc`; F5 không được làm mất trạng thái.
- Khi **Đánh dấu đã đọc** ngay trong tab `Chưa đọc`, dòng đó phải biến khỏi filter nhưng vẫn còn trong tab `Tất cả`; count/badge giảm đúng 1 và không reorder lịch sử.
- Một user đã đọc phải có thể dùng action **Đánh dấu chưa đọc**; badge chuông và tab `Chưa đọc` phải cập nhật ngay và vẫn đúng sau refresh/login lại.
- Low-stock alert phải xuất hiện khi `quantityOnHand <= minStock` cho role có `NOTIFICATION_VIEW + PRODUCT_VIEW + INVENTORY_VIEW`, và không được leak sang role thiếu inventory permission.
- AI role hạn chế không được trả dữ liệu debt/order/inventory nếu thiếu view permission tương ứng.

## 7. API / data consistency

- `GET /api/customers/{id}` trả đúng customer detail.
- `GET /api/sales-orders/{id}` trả order detail + items.
- Sales order list chỉ là summary; frontend không giả định list có items.
- Create Order và Receive Stock lấy default warehouse từ API; không hardcode warehouse ID `1`.
- Inventory stock/history API trả DTO public, không serialize trực tiếp JPA entity/internal fields (`tenantId`, `version`, `createdBy`).
- Revenue chỉ dùng order `COMPLETED`.
- Persisted sales status chỉ có `DRAFT`, `COMPLETED`, `CANCELLED` trong current MVP.
- Receivable balance dùng duy nhất tổng `remaining_amount` của open `INCREASE` rows.
- Customer list không phát sinh một balance query cho từng customer.

## 8. Localization / i18n

- `en.json` và `vi.json` có cùng key; không có static `t(...)` key bị thiếu.
- Enum/status/source do hệ thống sinh phải render theo locale, không in raw code như `SALES_ORDER`, `ADJUSTMENT`, `IN`, `OUT`.
- Ghi chú hệ thống legacy như `Seed stock` / `Confirm SO-...` được localize ở tầng hiển thị.
- Ghi chú do nhân viên tự nhập phải giữ nguyên nội dung khi đổi VI/EN; không tự dịch dữ liệu người dùng.
- Trợ lý AI ở locale VI không trả module/status/permission code tiếng Anh trong phần hướng dẫn hoặc `relatedModules`.
- Chuyển VI ↔ EN rồi kiểm tra Kho hàng, Công nợ, Thông báo, Nhật ký hoạt động và Trợ lý AI không bị trộn ngôn ngữ.

## 9. Deployment security

- Backend public chạy với `SPRING_PROFILES_ACTIVE=prod` để production JWT guard được bật.
- `APP_JWT_SECRET` là secret riêng, tối thiểu 32 ký tự, không dùng default trong repository.
- `APP_CORS_ALLOWED_ORIGINS` đúng frontend domain public.
- `APP_BUSINESS_ZONE=Asia/Ho_Chi_Minh` (hoặc timezone nghiệp vụ đã chọn) được cấu hình nhất quán ở production.
- `/actuator/health` hoạt động; metrics không public anonymous.
- Swagger chỉ chứa API contract hiện tại.
- Demo account chỉ chứa demo data, không dùng dữ liệu thật.
- Vercel có `VITE_API_BASE_URL` trỏ đúng public backend `/api`.
- Refresh trực tiếp `/login`, `/dashboard` hoặc route con không được 404; SPA rewrite phải fallback về `index.html`.

## 10. Server smoke test

Sau deploy:

- Frontend load không lỗi console nghiêm trọng.
- Login 4 demo roles thành công bằng credential demo hiện hành `Demo@2026`.
- Không có request 401/403/500 bất thường trong Network tab.
- Create customer/product/order hoạt động.
- Confirm order và payment hoạt động theo golden flow.
- Reload browser rồi mở order detail vẫn thấy items.
- Mở customer có id ngoài page đầu vẫn lấy được detail bằng API detail.
- Dashboard refresh đúng sau product/customer/order/payment mutation.

## 11. Documentation gate

Trước khi tag release, rà đồng thời:

- `README.md`
- `docs/architecture.md`
- `docs/business-flow.md`
- `docs/frontend/ARCHITECTURE.md`
- `RUN_LOCAL.md`
- Swagger/OpenAPI runtime
- Release badge/version trong README chỉ bump khi bản mới thực sự được merge/tag/deploy

Nếu code đổi business rule/API/status/permission thì tài liệu liên quan phải đổi trong cùng release.
