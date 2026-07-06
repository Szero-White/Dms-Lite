# Architecture

DMS Lite dùng Modular Monolith. Backend chia theo domain: auth, product, customer, inventory, sales, debt, payment, report, audit, notification.

Lý do không dùng microservice ngay: sản phẩm bán cho SME cần dễ deploy, ít server, dễ maintain. Khi lớn có thể tách inventory/sales/payment ra service riêng.

Flow kỹ thuật quan trọng:

1. Confirm sales order.
2. Lock stock row bằng `@Lock(PESSIMISTIC_WRITE)`.
3. Trừ kho và ghi inventory transaction.
4. Nếu chưa trả đủ thì tạo debt ledger transaction.
5. Ghi audit log.
6. Publish RabbitMQ notification.
