# DMS Lite - B2B Sales, Inventory & Receivable Management SaaS

DMS Lite là dự án cá nhân Java thực tế cho nhà phân phối nhỏ/cửa hàng sỉ: quản lý đơn hàng, tồn kho, công nợ, thanh toán, audit log và notification.

Dự án được thiết kế theo hướng **local-first**: chạy local đơn giản trước, Docker để sau khi hoàn thiện.

## 1. Stack

Backend:

- Java 17
- Spring Boot 3
- Spring Security JWT
- Spring Data JPA
- PostgreSQL
- Flyway migration
- Redis cache, bật ở Docker profile
- RabbitMQ notification, bật ở Docker profile
- Swagger/OpenAPI
- Actuator Prometheus
- JUnit 5, Mockito, Testcontainers

Frontend:

- React
- TypeScript
- Vite
- Ant Design
- React Query
- Axios

DevOps:

- Docker Compose
- GitHub Actions
- Prometheus
- Grafana

## 2. Chạy local trước, chưa cần Docker

Xem chi tiết ở file [`RUN_LOCAL.md`](./RUN_LOCAL.md).

Tạo database PostgreSQL local:

```sql
CREATE USER dms WITH PASSWORD 'dms';
CREATE DATABASE dms_lite OWNER dms;
GRANT ALL PRIVILEGES ON DATABASE dms_lite TO dms;
```

Chạy backend:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Chạy frontend:

```bash
cd frontend
npm install
npm run dev
```

Mở:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

Ở profile `local`:

- Redis không bắt buộc, cache dùng simple cache.
- RabbitMQ không bắt buộc, notification ghi trực tiếp vào database.
- Docker chưa cần chạy.

## 3. Chạy Docker sau khi project ổn

```bash
docker compose up -d --build
```

Mở:

- Frontend: http://localhost:3000
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html
- RabbitMQ: http://localhost:15672 guest/guest
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 admin/admin

## 4. Tài khoản demo

- owner / 123456
- sale / 123456
- warehouse / 123456
- accountant / 123456

## 5. Flow demo chính

Login → xem sản phẩm seed → xem khách hàng seed → tạo đơn bán → confirm đơn → hệ thống trừ kho bằng transaction lock → tạo công nợ ledger → ghi nhận thanh toán → xem dashboard/audit/notification.

## 6. Module chính

- Auth + JWT
- User, role, permission
- Multi-tenant bằng tenant_id
- Product
- Customer
- Inventory
- Sales Order
- Debt Ledger
- Payment
- Audit Log
- Notification
- Dashboard Report

## 7. CV highlights

- Modular monolith bằng Spring Boot.
- JWT + role/permission.
- Multi-tenant SaaS design.
- Pessimistic locking chống âm kho.
- Debt ledger thay vì cộng trừ công nợ mù.
- Redis cache dashboard ở Docker profile.
- RabbitMQ async notification ở Docker profile.
- Flyway migration + indexes.
- Testcontainers integration test.
- Docker Compose + monitoring.

