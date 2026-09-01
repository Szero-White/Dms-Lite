# Business Flow

Tài liệu này mô tả **hành vi đang chạy trong code hiện tại**, không mô tả feature roadmap.

## 1. Sales tạo đơn

`POST /api/sales-orders`

Kết quả:

- validate customer, product và warehouse thuộc tenant hiện tại;
- quantity phải dương;
- discount không được vượt line gross amount;
- paid amount không được vượt order total;
- tạo order trạng thái `DRAFT`;
- chưa trừ kho;
- chưa phát sinh receivable.

Order code dùng random suffix thay vì `count + 1` để tránh race condition khi nhiều request tạo đơn đồng thời. Current MVP dùng một warehouse chính; frontend lấy warehouse này từ backend thay vì hardcode ID.

## 2. Warehouse confirm / fulfill

`POST /api/sales-orders/{id}/confirm`

Current MVP gộp **confirm + fulfillment** vào một transaction và chuyển:

`DRAFT -> COMPLETED`

Không lưu trạng thái `CONFIRMED` riêng.

Trong transaction:

1. load order đúng tenant;
2. kiểm tra order phải là `DRAFT`;
3. lock stock row;
4. kiểm tra đủ stock;
5. trừ stock;
6. ghi inventory transaction `OUT`;
7. set order `COMPLETED` và `confirmed_at`;
8. nếu `debtAmount > 0`, tạo receivable `INCREASE`;
9. ghi audit;
10. publish notification.

Nếu stock không đủ hoặc core operation fail, confirm không được hoàn thành một nửa.

## 3. Receivable

Order còn nợ tạo:

- `direction = INCREASE`
- `amount = số nợ ban đầu`
- `remainingAmount = số nợ ban đầu`
- `dueDate = ngày confirm + paymentTermDays`

Balance hiện tại của customer được tính duy nhất bằng:

`SUM(INCREASE.remainingAmount WHERE remainingAmount > 0)`

Report, customer list/detail và payment validation phải dùng cùng semantics này.

## 4. Customer payment

`POST /api/payments/customer`

Quy trình:

1. validate customer;
2. lock toàn bộ open receivable của customer theo FIFO;
3. tính current balance từ các row đã lock;
4. reject nếu payment lớn hơn current balance;
5. phân bổ payment vào khoản cũ nhất trước;
6. giảm `INCREASE.remainingAmount` tương ứng;
7. lưu `payments`;
8. tạo `DECREASE` transaction để giữ payment history;
9. audit action `PAYMENT_RECORDED`;
10. invalidate dashboard cache của đúng tenant.

`DECREASE.amount` dùng cho statement/history và **không bị trừ thêm lần nữa khỏi balance**.

### Ví dụ regression bắt buộc

- Order debt: `100`
- Payment: `40`
- Open receivable remaining: `60`
- Current customer balance: `60`
- Dashboard total receivable: `60`
- Top customer debt: `60`

Không màn hình nào được trả `20`.

## 5. Revenue

Revenue chỉ ghi nhận order `COMPLETED`.

Dashboard dùng `confirmed_at`, không dùng `created_at`, để đơn tạo hôm trước nhưng confirm hôm nay được ghi nhận vào ngày confirm.

## 6. Read APIs

- `GET /api/customers` -> customer page summary.
- `GET /api/customers/{id}` -> customer detail.
- `GET /api/customers/{id}/debt-statement` -> statement, yêu cầu `DEBT_VIEW`.
- `GET /api/sales-orders` -> paged order summary; hỗ trợ `customerId` filter.
- `GET /api/sales-orders/{id}` -> order detail + items.

Frontend không được giả định list summary chứa order items.
