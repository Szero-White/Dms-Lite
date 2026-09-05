# Architecture

DMS Lite sử dụng **Modular Monolith**. Backend chia theo domain rõ ràng: `auth`, `product`, `customer`, `inventory`, `sales`, `debt`, `payment`, `report`, `audit`, `notification`, `help`, `team`.

## Vì sao dùng Modular Monolith

Dự án hướng tới doanh nghiệp phân phối SME nên ưu tiên:

- deploy đơn giản;
- transaction xuyên các module nghiệp vụ vẫn rõ ràng;
- ít operational overhead hơn microservices;
- dễ test và maintain ở giai đoạn sản phẩm nhỏ;
- vẫn giữ boundary theo domain để có thể tách module khi hệ thống lớn hơn.

Không tách microservice chỉ để tăng số lượng công nghệ trong portfolio.

## Layering chính

Luồng HTTP thông thường:

`Controller -> Application/Domain Service -> Repository -> PostgreSQL`

Quy ước:

- Controller chỉ nhận request, permission và trả response; không chứa SQL/report calculation.
- Business rule quan trọng phải có một source of truth ở backend.
- Query reporting phức tạp nằm trong read repository (`ReportReadRepository`), không nằm trong controller.
- Receivable balance và allocation query nằm trong `CustomerDebtRepository`; report/customer/payment không tự viết lại công thức công nợ.
- DTO summary và detail được tách khi payload khác nhau, ví dụ Sales Order.

## Sales Order lifecycle hiện tại

Current MVP lưu ba trạng thái:

- `DRAFT`: đơn vừa tạo, chưa tác động tồn kho/công nợ.
- `COMPLETED`: thao tác confirm đã thành công; trong MVP hiện tại confirm đồng thời là bước warehouse fulfillment.
- `CANCELLED`: chỉ áp dụng cho `DRAFT`.

**Không có trạng thái persisted `CONFIRMED` trong current MVP.** Nếu sau này cần quy trình Sales confirm riêng và Warehouse dispatch riêng, lifecycle có thể mở rộng thành `DRAFT -> CONFIRMED -> COMPLETED`, nhưng đó là roadmap chứ không phải hành vi hiện tại.

## Confirm Sales Order transaction

1. Load order của đúng tenant.
2. Chỉ cho phép order `DRAFT`.
3. Lock từng stock row bằng `PESSIMISTIC_WRITE`.
4. Kiểm tra tồn kho và trừ kho.
5. Ghi `inventory_transactions` direction `OUT`.
6. Chuyển order sang `COMPLETED`, ghi `confirmed_at`.
7. Nếu còn khoản chưa thanh toán, tạo receivable transaction `INCREASE` với `remaining_amount` ban đầu bằng số tiền phải thu.
8. Ghi audit log.
9. Publish notification theo runtime profile.
10. Nếu core database operation thất bại, transaction rollback.

## Receivable model

DMS Lite hiện dùng **open-item receivable model có ledger history**:

- Order phát sinh nợ tạo transaction `INCREASE`.
- `INCREASE.amount` là giá trị phát sinh ban đầu.
- `INCREASE.remaining_amount` là số tiền còn mở của khoản phải thu đó.
- Payment được phân bổ FIFO vào các `INCREASE` còn mở và giảm `remaining_amount`.
- Đồng thời payment tạo transaction `DECREASE` để giữ lịch sử thanh toán/audit statement.
- **Current receivable balance = SUM(remaining_amount) của các `INCREASE` còn mở.**
- Transaction `DECREASE` không được trừ thêm lần nữa khi tính balance, tránh double-count.

Khi record payment, các open receivable rows được lock bằng `PESSIMISTIC_WRITE` trước khi kiểm tra balance và phân bổ, nhằm tránh hai payment đồng thời làm sai công nợ. Sales-order `paidAmount`/`debtAmount` được đồng bộ trong cùng transaction để list/detail không hiển thị snapshot cũ; receivable `remainingAmount` vẫn là nguồn balance chuẩn.

## Reporting

`ReportController` chỉ gọi `ReportService`.

`ReportService` phối hợp:

- `CustomerDebtRepository` cho receivable metrics;
- `ReportReadRepository` cho revenue/product/stock read models.

Revenue hiện chỉ ghi nhận order `COMPLETED` và dùng `confirmed_at` cho mốc thời gian báo cáo.

## Security

Security được tách theo responsibility:

- `SecurityConfig.java`: security chain/provider/password encoder.
- `JwtAuthenticationFilter.java`: parse token và thiết lập authentication + tenant context.
- `DmsUserDetailsService.java`: load user/role/permission.

Disabled account không được tiếp tục authenticate bằng access token còn hạn.

Public endpoint được giới hạn ở auth, Swagger và actuator health/info. CORS lấy từ `APP_CORS_ALLOWED_ORIGINS` thay vì wildcard production.

## Warehouse scope hiện tại

Current MVP vận hành theo **một warehouse chính cho mỗi tenant**. Database vẫn giữ `warehouse_id` để có đường mở rộng, nhưng UI hiện chưa tuyên bố hỗ trợ multi-warehouse đầy đủ.

- Frontend lấy warehouse hiện tại qua `GET /api/inventory/default-warehouse`; không hardcode database ID `1`.
- Receive Stock và Create Sales Order dùng ID do backend trả về.
- Backend validate warehouse thuộc tenant trước khi tạo order hoặc nhận tồn kho.
- Seed data lấy warehouse ID thật sau khi ensure warehouse, không giả định sequence bắt đầu từ `1`.

## Scalability rules đang áp dụng

- Customer list aggregate receivable theo cả page, tránh N+1 balance query.
- List API trả summary; Sales Order detail fetch riêng khi cần items.
- Các query lớn phải có pagination/read model thay vì load toàn bộ dữ liệu chỉ để aggregate trong JVM/browser.
- Redis cache là optimization sau query correctness; cache dashboard được key theo tenant.
- Business calculations không được copy giữa controller/service/frontend.

## Role workflow

### Owner

- business overview/report;
- team, role và permission;
- audit;
- các chức năng vận hành khác theo permission system.

### Sales Staff

- quản lý/xem customer phù hợp;
- xem product/stock cần thiết để bán hàng;
- tạo sales order `DRAFT`;
- cancel draft nếu có permission.

### Warehouse Staff

- xem sales orders cần xử lý;
- nhận hàng vào kho;
- confirm/fulfill draft order, làm phát sinh stock OUT và chuyển order sang `COMPLETED`.

### Accountant

- xem customer/order financial data theo permission;
- xem receivable statement;
- ghi nhận customer payment;
- xem báo cáo tài chính/vận hành được cấp quyền.

Các màn hình composite chỉ gọi API mà role hiện tại có permission; thiếu một permission phụ không được làm cả page bị 403 nếu section đó có thể ẩn độc lập.

Các custom role cũng được validate dependency cho các workflow UI bắt buộc (ví dụ `PAYMENT_CREATE` cần `CUSTOMER_VIEW`, `INVENTORY_MANAGE` cần quyền xem inventory/product, `SALES_ORDER_CREATE` cần dữ liệu customer/product/inventory). Mục tiêu là không tạo ra role "có nút thao tác nhưng mở màn hình lại 403".

### AI và Notification theo permission

`AI_HELP_VIEW` và `NOTIFICATION_VIEW` chỉ là **gateway permission** để mở trợ lý hoặc feed thông báo; chúng không tự cấp quyền đọc dữ liệu nghiệp vụ.

- AI workflow guidance có thể dựa trên action permission (ví dụ `PAYMENT_CREATE` để hướng dẫn ghi nhận thanh toán), nhưng dữ liệu thật phải có view permission tương ứng (`DEBT_VIEW`, `SALES_ORDER_VIEW`, `INVENTORY_VIEW`, `PRODUCT_VIEW`, `CUSTOMER_VIEW`).
- Notification được lọc tiếp theo loại sự kiện và permission nghiệp vụ. Ví dụ payment event cần `PAYMENT_CREATE` + `CUSTOMER_VIEW`, overdue debt cần `DEBT_VIEW` + `CUSTOMER_VIEW`, sales-order event cần `SALES_ORDER_VIEW`.
- Notification type chưa được khai báo policy bị **deny by default** để event mới không vô tình vượt RBAC.
- Endpoint mark-read áp dụng cùng policy; notification ngoài scope được xử lý như không tồn tại để không làm lộ sự hiện diện của event bị giới hạn.

### Notification signal-to-noise

Notification feed ưu tiên **actionable signal**, không biến mọi row nghiệp vụ thành một thông báo riêng:

- Sales-order confirm/cancel dùng persisted business event; không tạo thêm một notification cho từng inventory movement của cùng đơn.
- Overdue receivables được gộp theo customer để một khách có nhiều hóa đơn quá hạn chỉ tạo một cảnh báo tổng hợp trong feed.
- Derived alert được giới hạn theo nhóm và toàn feed vẫn có hard limit.
- Persisted event có cửa sổ chống duplicate 5 phút theo `tenant + type + message` để retry/double-delivery không tạo notification trùng. Đây là retry suppression, không phải throttle nghiệp vụ dài hạn.
