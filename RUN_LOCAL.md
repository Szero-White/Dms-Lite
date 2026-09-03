# Chạy DMS Lite local

Local profile chỉ cần PostgreSQL. Redis/RabbitMQ không bắt buộc cho vòng code/test hằng ngày.

## 1. Yêu cầu

- Java 17+
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+

## 2. Database

```sql
CREATE USER dms WITH PASSWORD 'dms';
CREATE DATABASE dms_lite OWNER dms;
GRANT ALL PRIVILEGES ON DATABASE dms_lite TO dms;
```

Nếu dùng tài khoản PostgreSQL khác, cấu hình environment hoặc `backend/src/main/resources/application-local.yml`.

## 3. Cách nhanh trên Windows: một file mở hai terminal

Tại project root chạy:

```powershell
.\run-local.bat
```

Script sẽ mở:

- terminal Backend: Spring Boot local profile;
- terminal Frontend: Vite port `3000`.

Nếu frontend chưa có `node_modules`, script chạy `npm ci` trước.

**PostgreSQL phải đang chạy trước khi chạy script.**

## 4. Chạy thủ công

Backend:

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

Nếu dùng Gemini thật:

```powershell
$env:GEMINI_API_KEY="your_key"
```

Frontend, terminal khác:

```powershell
cd frontend
npm ci
npm run dev
```

## 5. URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- Health: `http://localhost:8080/actuator/health`

## 6. Demo accounts

- `owner / 123456`
- `sale / 123456`
- `warehouse / 123456`
- `accountant / 123456`

Các credential này chỉ dành cho local/demo data, không dùng cho dữ liệu production thực. Local profile bật demo mode mặc định; public recruiter demo dùng `APP_DEMO_ENABLED=true`, còn production thật nên đặt `APP_DEMO_ENABLED=false`.

## 7. Local profile

- cache: Spring simple cache;
- RabbitMQ messaging: không bắt buộc;
- CORS mặc định: `http://localhost:3000`;
- JWT local có default development secret, nhưng deployment public phải set secret riêng.

## 8. Docker Compose

Trước khi chạy Docker Compose, tạo `.env` và **bắt buộc** thay JWT secret:

```env
APP_JWT_SECRET=replace-with-a-strong-random-secret-at-least-32-characters
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Sau đó:

```powershell
docker compose up -d --build
```

Docker Compose cố tình không fallback về JWT secret công khai trong repository.

## 9. Check trước khi deploy

```powershell
cd backend
mvn verify

cd ..\frontend
npm ci
npm run build
```

CI cũng chạy backend tests + frontend build theo cùng nguyên tắc.
