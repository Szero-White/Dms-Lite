# Chạy local trước, chưa cần Docker

Cách này dùng trong giai đoạn code/sửa lỗi. Chỉ cần PostgreSQL local, chưa cần Redis/RabbitMQ.

## 1. Yêu cầu máy

- Java 17+
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+

## 2. Tạo database local

Đăng nhập PostgreSQL rồi chạy:

```sql
CREATE USER dms WITH PASSWORD 'dms';
CREATE DATABASE dms_lite OWNER dms;
GRANT ALL PRIVILEGES ON DATABASE dms_lite TO dms;
```

Nếu bạn dùng user `postgres/123456`, sửa biến môi trường hoặc file `backend/src/main/resources/application-local.yml`.

## 3. Chạy backend local

```bash
cd backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

Backend sẽ chạy ở:

- http://localhost:8080
- Swagger: http://localhost:8080/swagger-ui/index.html

## 4. Chạy frontend local

Mở terminal khác:

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy ở:

- http://localhost:3000

## 5. Tài khoản demo

- owner / 123456
- sale / 123456
- warehouse / 123456
- accountant / 123456

## 6. Ghi chú quan trọng

Ở profile `local`:

- Redis tạm dùng `simple cache`, không cần cài Redis.
- RabbitMQ tắt, notification ghi thẳng vào database.
- Docker Compose chưa cần chạy.

Khi backend + frontend đã ổn mới chuyển sang:

```bash
docker compose up -d --build
```
