# Local Development

This guide covers the standard local workflow for DMS Lite.

## Requirements

- Java 17+
- Maven 3.9+
- Node.js 20+
- npm
- PostgreSQL 16 recommended

The default local ports are:

```text
Frontend  http://localhost:3000
Backend   http://localhost:8080
Swagger   http://localhost:8080/swagger-ui/index.html
Postgres  localhost:5432
```

## 1. Configure PostgreSQL

Create the database:

```sql
CREATE DATABASE dms_lite;
```

Copy the environment template:

```powershell
Copy-Item run-local.env.example.bat run-local.env.bat
```

Edit `run-local.env.bat`:

```bat
@echo off
set "SPRING_PROFILES_ACTIVE=local"
set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/dms_lite"
set "SPRING_DATASOURCE_USERNAME=postgres"
set "SPRING_DATASOURCE_PASSWORD=your-local-password"
set "APP_DEMO_PASSWORD=Demo@2026"
set "VITE_DEMO_PASSWORD=Demo@2026"
```

`run-local.env.bat` is local-only and must not contain production secrets.

## 2. Start the application

From the repository root:

```powershell
.\run-local.bat
```

The launcher validates Java, Maven, Node.js, and npm. If `frontend/node_modules` is missing it runs `npm ci`, then opens separate backend and frontend terminals.

Flyway migrations run automatically when the backend starts.

## 3. Manual startup

Backend:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE = "local"
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

If the frontend needs an explicit API base URL, set:

```powershell
$env:VITE_API_BASE_URL = "http://localhost:8080/api"
```

## 4. Verify the build

Frontend:

```powershell
cd frontend
npm run quality:ui
npm run build
```

Backend:

```powershell
cd backend
mvn verify
```

Expected result:

```text
Frontend: UI consistency audit PASS and Vite build succeeds
Backend:  BUILD SUCCESS
```

## 5. Demo accounts

When demo mode is enabled:

| Role | Username | Password |
| --- | --- | --- |
| Owner | `owner` | `Demo@2026` |
| Sales | `sale` | `Demo@2026` |
| Accountant | `accountant` | `Demo@2026` |

## Common issues

### Port already in use

```powershell
Get-NetTCPConnection -LocalPort 3000,8080 -ErrorAction SilentlyContinue
```

Stop the previous process before starting another local instance.

### `npm ci` cannot replace `esbuild.exe`

A running Node/Vite process can lock the file on Windows:

```powershell
Get-Process node,esbuild -ErrorAction SilentlyContinue | Stop-Process -Force
cmd /c "rmdir /s /q frontend\node_modules"
cd frontend
npm ci
```

### Flyway validation error

Do not repair or edit migration history blindly. Check the migration file and the database version first. Applied migrations are immutable; create a new migration for new changes.

### Local profile

`application-local.yml` intentionally keeps local development simple:

- PostgreSQL required
- simple in-process cache
- RabbitMQ disabled
- Redis health disabled
- demo seeding enabled
