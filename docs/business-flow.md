# Business Flow

## Tạo đơn bán ghi nợ

POST /api/sales-orders tạo đơn DRAFT.  
POST /api/sales-orders/{id}/confirm để confirm.

Khi confirm:
- validate customer/product
- check stock
- deduct stock
- create inventory transaction OUT
- create customer debt transaction INCREASE nếu debt > 0
- audit log
- RabbitMQ notification

## Thanh toán

POST /api/payments/customer. Hệ thống tự phân bổ tiền vào khoản nợ cũ nhất trước.
