# Business Flow

Tài liệu này mô tả **hành vi đang chạy trong code hiện tại**, không mô tả feature roadmap.

## 1. Sales tạo đơn

`POST /api/sales-orders`

Kết quả:

- validate customer, product và warehouse thuộc tenant hiện tại;
- quantity phải dương;
- discount không được vượt line gross amount;
- order mới luôn bắt đầu với `paidAmount = 0`; payment được ghi riêng qua module Accountant để không bypass `PAYMENT_CREATE`;
- tạo order trạng thái `DRAFT`;
- chưa trừ kho;
- chưa phát sinh receivable;
- nếu `creditLimit > 0`, frontend cảnh báo khi `current receivable + projected order exposure` vượt hạn mức nhưng vẫn cho phép lưu `DRAFT`.

Order code dùng business document numbering `SO-YYYYMMDD-NNNN`, được cấp phát atomically theo tenant + business date thay vì `count + 1`. Current MVP dùng một warehouse chính; frontend lấy warehouse này từ backend thay vì hardcode ID.

## 2. Warehouse confirm / fulfill

`POST /api/sales-orders/{id}/confirm`

Current MVP gộp **confirm + fulfillment** vào một transaction và chuyển:

`DRAFT -> COMPLETED`

Không lưu trạng thái `CONFIRMED` riêng.

Trong transaction:

1. lock order row đúng tenant để chỉ một transition `DRAFT -> ...` được xử lý tại một thời điểm;
2. kiểm tra order phải là `DRAFT`;
3. lock customer row để serialize các lần fulfill có thể cùng làm tăng exposure của một customer;
4. nếu `creditLimit > 0`, tính `current receivable + projected order exposure` và reject trước khi xuất kho nếu kết quả vượt hạn mức;
5. lock stock row;
6. kiểm tra đủ stock;
7. trừ stock;
8. ghi inventory transaction `OUT`;
9. set order `COMPLETED` và `confirmed_at`;
10. nếu `debtAmount > 0`, tạo receivable `INCREASE`;
11. ghi audit;
12. publish notification.

Nếu vượt hạn mức, stock không đủ hoặc core operation fail, confirm không được hoàn thành một nửa. `creditLimit = 0` tiếp tục có nghĩa là khách hàng chưa cấu hình hạn mức và không bị hard-block.

## 3. Receivable

Order còn nợ tạo:

- `direction = INCREASE`
- `amount = số nợ ban đầu`
- `remainingAmount = số nợ ban đầu`
- `dueDate = business date của ngày confirm + paymentTermDays`

Balance hiện tại của customer được tính duy nhất bằng:

`SUM(INCREASE.remainingAmount WHERE remainingAmount > 0)`

Report, customer list/detail và payment validation phải dùng cùng semantics này.

## 4. Customer lifecycle

Customer là master data có lịch sử nghiệp vụ, nên hệ thống không hard-delete customer chỉ vì ngừng giao dịch.

- `POST /api/customers/{id}/deactivate` yêu cầu `CUSTOMER_DEACTIVATE`;
- chỉ cho ngừng hoạt động khi current receivable bằng `0` và không còn sales order `DRAFT`;
- deactivate chỉ set `active = false`, không set `deleted_at`;
- customer inactive vẫn còn trong danh sách, detail, order history, invoice/report/audit history;
- customer inactive không được dùng để tạo hoặc fulfill sales order mới;
- `POST /api/customers/{id}/reactivate` cho phép kích hoạt lại khi doanh nghiệp giao dịch trở lại;
- create order và deactivate cùng lock customer row để tránh race giữa việc mở Draft mới và ngừng hoạt động customer.

Migration V6 chuyển các customer từng bị legacy soft-delete thành lifecycle mới. Nếu customer legacy còn `DRAFT`, migration kích hoạt lại để workflow đang mở không bị kẹt; các customer legacy còn lại trở thành inactive và vẫn xem được lịch sử.

## 5. Customer payment

Payment workspace dùng:

- `GET /api/payments/outstanding-orders` -> từng sales order `COMPLETED` còn `remaining_amount > 0`;
- `POST /api/payments` -> ghi nhận tiền cho đúng một sales order;
- `GET /api/payments/history` -> lịch sử từng `PAY`, hỗ trợ search PAY/SO/customer/note và `from` / `to` theo business date;
- `GET /api/payments/{id}/receipt.pdf` -> biên nhận immutable của lần thu.

Quy trình payment mới:

1. user phải có `PAYMENT_CREATE + CUSTOMER_VIEW + SALES_ORDER_VIEW + DEBT_VIEW`;
2. chọn đúng sales order đang còn phải thu;
3. lock sales order bằng `PESSIMISTIC_WRITE`;
4. lock đúng receivable `SALES_ORDER/INCREASE` của order đó;
5. reject nếu order không `COMPLETED`, đã tất toán hoặc amount vượt `remaining_amount`;
6. giảm `INCREASE.remaining_amount` đúng bằng số tiền thực nhận;
7. đồng bộ `sales_orders.paid_amount` và `debt_amount` của **chính order được chọn**;
8. lưu `payments` với snapshot `SO`, customer, debt before/after và client `request_key`;
9. tạo `DECREASE` transaction để giữ payment history;
10. audit action `PAYMENT_RECORDED`;
11. evict backend dashboard cache; frontend invalidate/refetch các query liên quan (sales order, customer/debt, report, invoice, notification) sau khi payment thành công.

Một payment mới **không tự chạy sang order khác**. Nếu khách có nhiều order, kế toán ghi nhận từng order theo nội dung khách thanh toán. Partial payment và exact payment đều hợp lệ. Frontend có thể giới hạn giá trị nhập về số còn phải thu để thân thiện, nhưng backend vẫn reject overpayment nếu API bị gọi trực tiếp hoặc client lỗi.

`request_key` làm thao tác idempotent: retry cùng request hợp lệ trả lại payment đã tạo thay vì trừ công nợ lần hai.

`DECREASE.amount` dùng cho statement/history và **không bị trừ thêm lần nữa khỏi current balance**. Current customer balance vẫn là tổng `remaining_amount` của các receivable `INCREASE` còn mở.

Payment trước migration V11 có thể là legacy FIFO payment. Vì một payment cũ có thể từng được phân bổ qua nhiều receivable, migration không đoán một `sales_order_id`; UI/PDF ghi rõ đây là lịch sử cũ.

### Ví dụ regression bắt buộc

- `SO-A` total: `520.000`; remaining: `520.000`;
- `SO-B` remaining: `300.000`;
- chọn `SO-A`, payment: `500.000`;
- `SO-A` remaining phải thành `20.000`;
- `SO-B` vẫn `300.000`;
- payment history phải ghi `PAY -> SO-A -> 500.000 -> remaining 20.000`;
- payment `520.001` cho `SO-A` phải bị backend reject và không mutate dữ liệu;
- payment `20.000` tiếp theo cho `SO-A` tất toán order và order biến khỏi outstanding worklist nhưng vẫn còn trong history/report/audit.

## 6. Invoice document

Invoice trong DMS Lite là **chứng từ bán hàng gắn với một order `COMPLETED` đã thu đủ**, không phải một luồng kế toán thứ hai.

- payment vẫn được ghi tại Payment workspace và gắn với đúng một sales order còn phải thu;
- khi lần thanh toán cuối đưa remaining receivable của order về `0`, backend tạo đúng một invoice `DRAFT` **trong cùng transaction**; nếu tạo invoice lỗi thì final payment cũng rollback;
- không còn nút/API `Tạo hóa đơn` thủ công và permission `INVOICE_CREATE`; mỗi sales order vẫn có tối đa một invoice nhờ unique invariant;
- migration V12 backfill invoice cho các order `COMPLETED` đã thu đủ trước khi cơ chế tự động được bật, đồng thời loại permission manual-create cũ;
- invoice list chỉ hiển thị các order đã thu đủ, hỗ trợ search `INV/SO/customer` và `from/to` theo business date;
- phát hành invoice không tạo, tăng hoặc giảm receivable;
- `paidAmount` và `remainingAmount` khi đọc invoice lấy theo trạng thái tài chính hiện tại của sales order;
- PDF chỉ tải được khi invoice đã phát hành và còn hiệu lực; nội dung PDF theo ngôn ngữ `Accept-Language` của giao diện (`vi`/`en`), dùng font Unicode để giữ nguyên tiếng Việt và hiển thị số tiền theo locale.

Luồng mới: `COMPLETED order -> partial payments -> final payment -> automatic DRAFT invoice -> ISSUED -> PAID`.

## 7. Revenue

Revenue chỉ ghi nhận order `COMPLETED`.

Dashboard dùng `confirmed_at`, không dùng `created_at`, để đơn tạo hôm trước nhưng confirm hôm nay được ghi nhận vào ngày confirm.

## 8. Sales report semantics

`GET /api/reports/sales`

Sales report là read model riêng, không lấy page đầu của `GET /api/sales-orders` để tự tổng hợp ở browser. Dashboard analytics/export cũng dùng read model này; `GET /api/sales-orders` chỉ còn phục vụ operational preview như đơn gần đây/cần xử lý.

- `DRAFT` và `CANCELLED` vẫn xuất hiện để theo dõi pipeline đơn hàng nhưng chưa được coi là receivable thực tế;
- với các trạng thái chưa ghi nhận receivable, `collectedAmount`, `remainingReceivable` và `collectionProgress` là `null`;
- `COMPLETED` mới được tính vào recognized revenue;
- `reportDate` dùng `confirmedAt` cho `COMPLETED`, còn `DRAFT`/`CANCELLED` dùng `createdAt`, nên filter theo kỳ phản ánh đúng thời điểm ghi nhận nghiệp vụ;
- `COMPLETED` lấy số còn phải thu từ `customer_debt_transactions.INCREASE.remainingAmount`, cùng source-of-truth với customer debt và payment;
- payment làm thay đổi report thông qua receivable ledger, không tạo phép tính công nợ riêng ở frontend;
- customer ngừng hoạt động sau khi tất toán vẫn không làm mất sales history khỏi report.

## 9. Read APIs

- `GET /api/auth/me` -> session snapshot hiện tại (user, tenant, roles, permissions) cho authenticated frontend; dùng để refresh authorization state sau reload, không thay thế backend authorization.
- `GET /api/customers` -> customer page summary.
- `GET /api/customers/{id}` -> customer detail.
- `GET /api/customers/{id}/debt-statement` -> statement, yêu cầu `DEBT_VIEW`.
- `GET /api/sales-orders` -> paged order summary; hỗ trợ `customerId` filter.
- `GET /api/sales-orders/{id}` -> order detail + items.
- `GET /api/reports/sales` -> sales reporting read model; hỗ trợ `from` / `to` ISO-8601 và yêu cầu cả `REPORT_VIEW` + `SALES_ORDER_VIEW`.
- `GET /api/inventory/stock` và `GET /api/inventory/transactions` -> response DTO tenant-safe; JPA entity/internal fields như `tenantId`, optimistic-lock `version` hoặc `createdBy` không phải public API contract.

Frontend không được giả định list summary chứa order items. Với order chưa `COMPLETED`, API vẫn có thể trả `totalAmount` cho giá trị đơn nhưng `paidAmount`/`debtAmount` không được trình bày như khoản phải thu thực tế.

- `GET /api/invoices` -> paged invoice summary của các order đã thu đủ; hỗ trợ search `INV/SO/customer` và `from` / `to`, yêu cầu `INVOICE_VIEW`.
- `GET /api/invoices/{id}` -> invoice detail + snapshot items.
- `GET /api/payments/outstanding-orders` -> paged outstanding orders cho Payment workspace.
- `GET /api/payments/history` -> paged payment history, tìm theo PAY/SO/customer/note và hỗ trợ `from` / `to` business date.


## Business document numbering

User-facing document references are separate from database primary keys. New documents use a tenant-scoped, business-date sequence:

- Sales Order: `SO-YYYYMMDD-NNNN`
- Invoice: `INV-YYYYMMDD-NNNN`
- Payment: `PAY-YYYYMMDD-NNNN`

The sequence is allocated atomically in PostgreSQL per tenant, document type, and business date. Existing Sales Order and Invoice numbers remain unchanged so historical/issued identifiers are never rewritten. Payments had no prior business code, so migration V7 backfills them. The default business timezone is `Asia/Ho_Chi_Minh` and can be overridden with `APP_BUSINESS_ZONE`.

The customer debt statement resolves `sourceCode` for Sales Order and Payment entries, so business document numbers remain visible after the creation toast and in later reconciliation. Database IDs remain internal references.
