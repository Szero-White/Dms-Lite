# DMS Lite

**B2B Sales, Inventory & Receivable Management SaaS**

[![CI](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml/badge.svg)](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-informational)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-informational)
![React](https://img.shields.io/badge/React-18.3-informational)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20Docker-informational)
![Release](https://img.shields.io/badge/release-v1.1.0-informational)

> **Live Demo:** **Coming soon**
> This line is intentionally kept near the top of the README. Replace `Coming soon` with the public deployment URL when the recruiter/demo environment is online.

**Repository:** https://github.com/Szero-White/Dms-Lite
**Local Swagger UI:** http://localhost:8080/swagger-ui/index.html
**Local Frontend:** http://localhost:3000

---

## Table of Contents

- [Overview](#overview)
- [What the System Solves](#what-the-system-solves)
- [Main Features](#main-features)
- [Demo Accounts and Roles](#demo-accounts-and-roles)
- [Core Business Flow](#core-business-flow)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting the Source Code](#getting-the-source-code)
- [Quick Start - Windows](#quick-start---windows)
- [Manual Local Setup](#manual-local-setup)
- [Local URLs](#local-urls)
- [Reset Local Demo Data](#reset-local-demo-data)
- [Docker Compose](#docker-compose)
- [Environment Configuration](#environment-configuration)
- [Build and Test](#build-and-test)
- [Database and Flyway](#database-and-flyway)
- [Security and RBAC](#security-and-rbac)
- [Current Business Invariants](#current-business-invariants)
- [Deployment Notes](#deployment-notes)
- [CI](#ci)
- [Documentation](#documentation)
- [Roadmap](#roadmap)

---

## Overview

DMS Lite is a full-stack distribution management system for small B2B wholesalers and distributors. It combines customer management, product catalog, inventory, sales orders, receivables, payments, invoices, notifications, audit logs, reporting, and permission-aware workflow assistance in one modular application.

The project is designed as a **deployable portfolio system**, not only a CRUD sample. Its main purpose is to demonstrate how related business operations remain consistent across sales, inventory, receivables, payments, reporting, and authorization boundaries.

Current application version: **1.1.0**.

### Current source status

The current source contains:

- Spring Boot backend with PostgreSQL and Flyway migrations
- React + TypeScript + Vite frontend
- JWT authentication and permission-based authorization
- Tenant-aware data access
- Server-paged receivable/payment worklists
- Due-date classification for receivables
- Order-specific partial/full payments
- Immutable payment receipt snapshots
- Automatic Draft invoice creation after final payment
- Dashboard KPIs and receivable-attention reporting
- Audit and notification modules
- Permission-aware workflow AI/help module with optional Gemini wording assistance
- Windows local launcher and local demo-data reset utility
- Docker Compose integration stack
- GitHub Actions CI

The repository currently includes Flyway migrations **V1 through V12**. Sales-order expiry/timeout is **not** part of the current persisted lifecycle; current statuses are `DRAFT`, `COMPLETED`, and `CANCELLED`.

---

## What the System Solves

Small distributors often run day-to-day operations through spreadsheets, chat messages, phone calls, and paper notes. That makes several questions unnecessarily difficult:

- Which customers still owe money?
- Which exact sales order is a payment settling?
- Which stock movement changed the current quantity?
- Can an order be fulfilled without making stock negative?
- Which employee confirmed, cancelled, paid, or changed important business data?
- Which receivables are current, due soon, due today, or overdue?
- Does a user have permission to see or mutate a specific business area?

DMS Lite brings these flows into one system and keeps the financial and operational relationships explicit.

---

## Main Features

### Authentication and authorization

- JWT-based authentication
- Stateless Spring Security configuration
- Role and permission model
- Backend method-level authorization with `@PreAuthorize`
- Frontend route/action guards
- `/api/auth/me` refresh flow for reconciling persisted frontend authorization with current backend roles and permissions
- Tenant-aware request scope

### Product management

- Product catalog
- SKU and barcode data
- Cost and selling prices with permission-aware exposure
- Minimum-stock configuration
- Soft-delete lifecycle

### Customer management

- Customer profiles
- Credit limits and payment terms
- Customer lifecycle controls
- Customer-specific sales-order history
- Customer receivable statement

### Inventory management

- Warehouse-backed stock items
- Receive and adjust stock flows
- Inventory transaction history
- Low-stock detection
- Stock mutation inside transactional business flows
- Tenant and warehouse validation instead of assuming a hard-coded warehouse ID

### Sales orders

- Create sales orders as `DRAFT`
- Confirm/fulfill `DRAFT -> COMPLETED`
- Cancel `DRAFT -> CANCELLED`
- Stock is deducted only during confirmation/fulfillment
- Credit-limit validation before stock/debt mutation
- List and detail APIs are separated so list responses do not carry line items unnecessarily

### Receivables

Open receivables are represented by debt transactions instead of a single mutable customer balance field.

Current due-date semantics are:

| Status | Meaning |
| --- | --- |
| `CURRENT` | More than 3 days remain |
| `DUE_SOON` | 1-3 days remain |
| `DUE_TODAY` | Due on the current business date |
| `OVERDUE` | Due date is before the current business date |

`DUE_TODAY` is intentionally **not** treated as overdue.

### Payments

- One new payment is attached to exactly one `COMPLETED` sales order
- Partial payment supported
- Exact final settlement supported
- Overpayment rejected
- Outstanding worklist is server-paged and server-filtered
- Pessimistic locking protects financial mutation
- Client request key supports idempotent retry behavior
- Payment history preserves `PAY -> SO` traceability
- PDF receipt uses immutable payment-time snapshots

The Payment workspace requires the combined permission scope:

```text
PAYMENT_CREATE
+ CUSTOMER_VIEW
+ SALES_ORDER_VIEW
+ DEBT_VIEW
```

### Invoices

- No manual invoice creation in the current workflow
- Partial payment does not create an invoice
- Final payment automatically creates exactly one Draft invoice in the same transaction
- Existing fully paid orders are backfilled by Flyway V12
- Draft invoice can be issued with permission control
- Invoice PDF export supports Vietnamese/English content
- Invoice financial state remains derived from the canonical sales-order/payment flow

### Dashboard and reports

- Monthly revenue
- Revenue today
- Total receivables
- Active products
- Low-stock count
- Active customers
- Orders needing attention
- Receivable-attention KPI
- Detailed overdue / due-today / due-soon receivable card
- Reporting read repositories keep report SQL separate from write-domain services

### Notifications

- Persisted business notifications
- Permission-filtered derived alerts
- Per-user read/unread state
- Low-stock and overdue-debt visibility rules
- Payment/invoice notifications respect business permissions
- Local profile does not require RabbitMQ
- Docker profile can use RabbitMQ with a persistence fallback path

### Audit log

- Important business actions are written to an audit trail
- Supports operational traceability and review

### Workflow AI / Help

- Permission-aware workflow guidance
- Server-side live-data guards before data access
- External AI is not the authorization authority
- Live backend data is not blindly replayed into later external-model context
- Gemini assistance is optional and used only when enabled **and** an API key is present
- Deterministic/system fallback remains available when Gemini is unavailable

---

## Demo Accounts and Roles

When backend demo mode is enabled, the application seeds these accounts:

| Role | Username | Password | Typical workflow |
| --- | --- | --- | --- |
| Owner | `owner` | `Demo@2026` | Full business/admin workflow |
| Sales | `sale` | `Demo@2026` | Customers and Draft sales orders |
| Warehouse | `warehouse` | `Demo@2026` | Inventory and order confirmation |
| Accountant | `accountant` | `Demo@2026` | Receivables, payments, invoices, reports |

The backend local profile enables demo seeding by default.

The frontend demo-account cards are controlled separately by `VITE_DEMO_MODE=true`. The accounts can still be entered manually even when those convenience cards are hidden.

For a real production deployment, use real identities and set demo mode appropriately instead of relying on the demo credentials above.

---

## Core Business Flow

```text
Login
  -> create customer / product
  -> receive or verify stock
  -> create DRAFT sales order
  -> warehouse confirms / fulfills
  -> order becomes COMPLETED
  -> stock is deducted inside the confirmation transaction
  -> open receivable is created when money is still owed
  -> accountant selects the exact outstanding order
  -> record partial or final payment
  -> final payment automatically creates one Draft invoice
  -> optionally issue/download invoice
  -> dashboard / report / audit / notifications reflect the business state
```

### Why this is more than CRUD

- Sales confirmation changes stock and receivable state transactionally.
- Inventory is checked before mutation and cannot silently go negative through the normal confirmation flow.
- Receivable state uses open-item ledger data instead of repeatedly overwriting a single debt number.
- Payments are order-specific and guarded by locking/idempotency behavior.
- Final payment and invoice creation share one transaction boundary.
- Authorization is enforced at backend endpoints/services, not only hidden in the UI.
- Tenant IDs scope business data across repositories and services.
- Business dates are calculated using an application business timezone instead of relying on the browser timezone.

---

## Architecture

DMS Lite uses a **modular monolith / package-by-feature** architecture.

```text
Browser
  -> React + TypeScript + Vite
  -> Axios / React Query
  -> HTTPS/REST API
  -> Spring Boot
  -> Spring Security / JWT / permission checks
  -> Feature services and repositories
  -> PostgreSQL
  -> Flyway migrations
```

Optional integration services are available through Docker Compose:

```text
Redis
RabbitMQ
Prometheus
Grafana
```

The default local development profile intentionally requires only PostgreSQL.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | Java 17, Spring Boot 3.3.5 |
| Security | Spring Security, JWT (JJWT 0.12.6) |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL |
| Migration | Flyway |
| API docs | springdoc OpenAPI / Swagger UI |
| PDF | Apache PDFBox |
| Frontend | React 18, TypeScript 5.6, Vite 5 |
| UI | Ant Design 5, Ant Design Charts |
| Server state | TanStack React Query 5 |
| HTTP | Axios |
| i18n | i18next / react-i18next |
| Testing | JUnit 5, Spring Boot Test, Mockito, Spring Security Test |
| Optional infra | Redis, RabbitMQ, Prometheus, Grafana |
| CI | GitHub Actions |

---

## Project Structure

```text
Dms-Lite/
├─ backend/
│  ├─ pom.xml
│  └─ src/
│     ├─ main/java/com/example/dms/
│     │  ├─ audit/
│     │  ├─ auth/
│     │  ├─ common/
│     │  ├─ customer/
│     │  ├─ debt/
│     │  ├─ document/
│     │  ├─ help/
│     │  ├─ inventory/
│     │  ├─ invoice/
│     │  ├─ notification/
│     │  ├─ payment/
│     │  ├─ product/
│     │  ├─ report/
│     │  ├─ sales/
│     │  ├─ seed/
│     │  ├─ team/
│     │  ├─ tenant/
│     │  └─ user/
│     └─ main/resources/
│        ├─ application.yml
│        ├─ application-local.yml
│        ├─ application-docker.yml
│        └─ db/migration/
├─ frontend/
│  ├─ package.json
│  ├─ deploy/
│  └─ src/
│     ├─ components/
│     ├─ features/
│     │  ├─ audit/
│     │  ├─ auth/
│     │  ├─ customers/
│     │  ├─ dashboard/
│     │  ├─ help/
│     │  ├─ inventory/
│     │  ├─ invoice/
│     │  ├─ notifications/
│     │  ├─ payments/
│     │  ├─ products/
│     │  ├─ reports/
│     │  ├─ sales/
│     │  └─ team/
│     └─ services/
├─ scripts/local/
│  └─ reset-dms-local-jdbc.ps1
├─ docs/
├─ .github/workflows/ci.yml
├─ docker-compose.yml
├─ .env.example
├─ run-local.bat
├─ run-local.env.example.bat
├─ RUN_LOCAL.md
└─ README.md
```

---

## Getting the Source Code

### Option A - Git clone

```powershell
git clone https://github.com/Szero-White/Dms-Lite.git
cd Dms-Lite
```

### Option B - GitHub ZIP

1. Open the repository on GitHub.
2. Choose **Code -> Download ZIP**.
3. Extract the ZIP.
4. Open PowerShell/Terminal in the extracted project root.
5. Continue with the setup steps below.

Git is recommended because it makes updates, diff review, and branch management much easier.

---

## Quick Start - Windows

This is the shortest repeatable local workflow supported by the current repository.

### Prerequisites

Install:

- Java 17+
- Maven 3.9+
- Node.js 18+ (CI currently uses Node 20)
- npm
- PostgreSQL 14+ **or** Docker Desktop

Verify the command-line tools:

```powershell
java -version
mvn -version
node -v
npm -v
```

### Fastest option: Docker only for PostgreSQL

From the project root:

```powershell
docker compose up -d postgres
```

The repository's PostgreSQL container uses:

```text
Database: dms_lite
User:     dms
Password: dms
Port:     5432
```

Create the machine-local launcher environment file:

```powershell
Copy-Item ".\run-local.env.example.bat" ".\run-local.env.bat"
notepad ".\run-local.env.bat"
```

For the Docker PostgreSQL service, make sure these values are present:

```bat
@echo off
set "SPRING_PROFILES_ACTIVE=local"
set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/dms_lite"
set "SPRING_DATASOURCE_USERNAME=dms"
set "SPRING_DATASOURCE_PASSWORD=dms"
set "APP_DEMO_PASSWORD=Demo@2026"
set "VITE_DEMO_MODE=true"
set "VITE_DEMO_PASSWORD=Demo@2026"
```

`run-local.env.bat` is ignored by Git and is the correct place for machine-specific local credentials.

Install frontend dependencies once after clone/download:

```powershell
cd frontend
npm ci
cd ..
```

> **First run:** if `frontend/node_modules` is missing, `run-local.bat` automatically runs `npm ci` before starting Vite. You can still run `npm ci` manually when you want an explicit clean dependency install.

Start backend and frontend:

```powershell
.\run-local.bat
```

The launcher opens two terminals:

- backend: Spring Boot on port `8080`
- frontend: Vite on port `3000`

Then open:

```text
http://localhost:3000
```

---

## Manual Local Setup

Use this section if you do not want the Windows launcher or if you want to understand every step.

### 1. Create PostgreSQL database manually

Connect using a PostgreSQL administrator account and run:

```sql
CREATE USER dms WITH PASSWORD 'dms';
CREATE DATABASE dms_lite OWNER dms;
GRANT ALL PRIVILEGES ON DATABASE dms_lite TO dms;
```

If the `dms` role already exists, do not recreate it; update the password/ownership as appropriate for your local machine.

### 2. Create local environment file

```powershell
Copy-Item ".\run-local.env.example.bat" ".\run-local.env.bat"
```

Edit it so the datasource values match the PostgreSQL account you actually created.

Recommended local example:

```bat
@echo off
set "SPRING_PROFILES_ACTIVE=local"
set "SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/dms_lite"
set "SPRING_DATASOURCE_USERNAME=dms"
set "SPRING_DATASOURCE_PASSWORD=dms"
set "APP_DEMO_PASSWORD=Demo@2026"
set "VITE_DEMO_MODE=true"
set "VITE_DEMO_PASSWORD=Demo@2026"
```

### 3. Install frontend dependencies

```powershell
cd frontend
npm ci
cd ..
```

### 4. Run backend manually

PowerShell terminal 1:

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE="local"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/dms_lite"
$env:SPRING_DATASOURCE_USERNAME="dms"
$env:SPRING_DATASOURCE_PASSWORD="dms"
mvn spring-boot:run
```

Or, when the required environment is already available:

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

Flyway validates/applies the schema during backend startup.

### 5. Run frontend manually

PowerShell terminal 2:

```powershell
cd frontend
$env:VITE_DEMO_MODE="true"
$env:VITE_DEMO_PASSWORD="Demo@2026"
npm run dev
```

The frontend API client defaults to:

```text
http://localhost:8080/api
```

Set `VITE_API_BASE_URL` before `npm run dev` when using another backend URL.

### Optional Gemini configuration

Gemini is not required to run the application.

To enable provider-assisted wording locally:

```powershell
$env:GEMINI_ENABLED="true"
$env:GEMINI_API_KEY="your_key"
```

If the key is missing or the provider fails, the help module falls back to backend-owned deterministic/system responses.

---

## Local URLs

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |
| Health | http://localhost:8080/actuator/health |
| Info | http://localhost:8080/actuator/info |

Swagger, health, and info are intentionally permitted without authentication by the current Spring Security configuration. Other application API routes require authentication unless explicitly permitted.

---

## Reset Local Demo Data

The repository includes a dedicated **local-only factory reset utility**:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\local\reset-dms-local-jdbc.ps1"
```

### What the reset script does

The script:

1. Resolves the repository root.
2. Reads PostgreSQL configuration from `run-local.env.bat`.
3. Refuses to run unless the JDBC target is a local host (`localhost`, `127.0.0.1`, or `[::1]`).
4. Refuses to run unless the database name is exactly `dms_lite`.
5. Refuses to run while backend port `8080` or frontend port `3000` is listening.
6. Requires explicit confirmation by typing exactly:

```text
RESET
```

7. Finds the PostgreSQL JDBC driver from the local Maven cache (`~/.m2/repository`).
8. Writes a row-count CSV snapshot to the user's `Downloads` directory.
9. Truncates application tables with `RESTART IDENTITY CASCADE`.
10. Preserves `flyway_schema_history` and therefore preserves the current schema/migration history.
11. Starts `run-local.bat` again so demo seed data can be recreated.

### Before running reset

- PostgreSQL must be running.
- Stop the backend on port `8080`.
- Stop the frontend on port `3000`.
- `run-local.env.bat` must exist and point to the intended local database.
- Java must be available.
- The PostgreSQL JDBC driver must already exist in the Maven cache. Running the backend or Maven build once normally satisfies this requirement.

### Important safety note

The generated CSV is **only a row-count inventory**. It is not a restorable database backup.

If the local data matters, create a real PostgreSQL backup with `pg_dump` before resetting.

### Full local schema rebuild

The reset script above is the recommended day-to-day option because it preserves Flyway history.

If you intentionally need a completely empty local database, stop the application, drop/recreate **only your local `dms_lite` database**, and restart the backend so Flyway can replay the repository migrations. Do not use this procedure against a shared, staging, or production database, and do not edit/repair historical migrations merely to fix local data.

---

## Docker Compose

`docker-compose.yml` provides an integration/demo stack containing:

- PostgreSQL 16
- Redis 7
- RabbitMQ 3 with management UI
- Spring Boot backend
- React/Nginx frontend
- Prometheus
- Grafana

### 1. Create Docker environment file

```powershell
Copy-Item ".\.env.example" ".\.env"
notepad ".\.env"
```

At minimum, replace the JWT secret with a strong private value of at least 32 characters:

```env
APP_JWT_SECRET=replace-this-with-a-private-random-secret-at-least-32-characters
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000
```

The backend actively rejects known unsafe/default JWT secrets when the active profile is `docker` or `prod`.

### 2. Start the stack

```powershell
docker compose up -d --build
```

### 3. Check container state

```powershell
docker compose ps
```

### 4. View logs

```powershell
docker compose logs -f backend
docker compose logs -f frontend
```

### Docker URLs

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui/index.html |
| RabbitMQ Management | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

### Stop Docker services

```powershell
docker compose down
```

To also delete the Docker PostgreSQL volume, use the destructive local command below only when you intentionally want to remove Docker data:

```powershell
docker compose down -v
```

### Monitoring note

The Compose file includes Prometheus/Grafana as an integration scaffold. The backend security configuration does not expose `/actuator/prometheus` anonymously, so a real deployment should configure a secure scrape/authentication strategy instead of making metrics public.

---

## Environment Configuration

### Backend variables

| Variable | Purpose | Current default / note |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Runtime profile | local launcher uses `local`; Docker uses `docker` |
| `SPRING_DATASOURCE_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/dms_lite` |
| `SPRING_DATASOURCE_USERNAME` | DB username | `dms` in app config |
| `SPRING_DATASOURCE_PASSWORD` | DB password | `dms` in app config; override outside local demo |
| `APP_JWT_SECRET` | JWT signing secret | must be >= 32 chars; must be changed for docker/prod |
| `APP_JWT_MINUTES` | Token lifetime | `180` |
| `APP_CORS_ALLOWED_ORIGINS` | Allowed frontend origins | `http://localhost:3000` |
| `APP_BUSINESS_ZONE` | Business timezone | `Asia/Ho_Chi_Minh` |
| `APP_DEMO_ENABLED` | Backend demo seeding | local profile enables demo; Docker defaults to false and must opt in explicitly |
| `APP_DEMO_PASSWORD` | Demo user password | `Demo@2026` |
| `GEMINI_ENABLED` | Enable optional Gemini wording provider | `true` |
| `GEMINI_API_KEY` | Gemini API key | blank by default |
| `GEMINI_MODEL` | Gemini model name | configured in `application.yml` |
| `GEMINI_MAX_OUTPUT_TOKENS` | Gemini output limit | `900` |
| `SPRING_REDIS_HOST` | Redis host | profile-dependent |
| `SPRING_RABBITMQ_HOST` | RabbitMQ host | profile-dependent |

### Frontend variables

| Variable | Purpose | Current default / note |
| --- | --- | --- |
| `VITE_API_BASE_URL` | REST API base URL | `http://localhost:8080/api` |
| `VITE_DEMO_MODE` | Show demo-account login cards | false unless set to string `true` |
| `VITE_DEMO_PASSWORD` | Password displayed/used by demo convenience UI | falls back to `Demo@2026` |

### Secret handling

Do not commit:

- `.env`
- `run-local.env.bat`
- private JWT secrets
- real database passwords
- Gemini/API provider keys
- private certificates/keys

The repository `.gitignore` already excludes the main machine-specific secret files.

---

## Build and Test

### Backend

From the project root:

```powershell
cd backend
mvn verify
```

The CI job also uses `mvn -B verify` with PostgreSQL 16 available.

If your local test set requires the default database connection, make sure PostgreSQL is running or override the datasource variables for the test environment.

### Frontend clean build

```powershell
cd frontend
npm ci
npm run build
```

Current frontend build script:

```text
tsc -b && vite build
```

Therefore a successful frontend build validates TypeScript compilation before producing the Vite bundle.

### Recommended pre-commit checks

```powershell
git diff --check
git status --short
git diff --stat
```

Then run the affected backend tests and/or frontend build before committing.

---

## Database and Flyway

- Database: PostgreSQL
- Hibernate schema mode: `validate`
- Flyway: enabled
- Current repository migrations: `V1` through `V12`
- Application business timezone default: `Asia/Ho_Chi_Minh`
- Hibernate JDBC timezone: UTC

Migration files live in:

```text
backend/src/main/resources/db/migration/
```

### Migration rules

- Never edit an already-applied migration for a normal feature change.
- Add a new migration for schema changes.
- Do not use `flyway repair` as a shortcut for ordinary local-data problems.
- Use the local reset utility for demo-data cleanup when schema history should remain intact.

---

## Security and RBAC

### Authentication

The backend uses JWT bearer authentication and stateless Spring Security sessions.

Publicly permitted backend routes in the current security configuration include:

```text
/api/auth/login
/swagger-ui/**
/v3/api-docs/**
/actuator/health
/actuator/info
```

Other routes require authentication.

### Role overview

| Role | Main capabilities |
| --- | --- |
| Owner | Full operational/admin permission set |
| Sales | Customer/product visibility, customer management, Draft order creation/cancel, supporting views |
| Warehouse | Product/inventory operations and sales-order confirmation |
| Accountant | Customer/order finance visibility, payments, debt, invoices, reports |

Custom roles are also supported through Team/Role Management.

### Tenant isolation

Business entities and repository queries are tenant-scoped. Backend authorization remains authoritative even when the frontend hides routes or actions.

### JWT deployment guard

`APP_JWT_SECRET` must be at least 32 characters. In `docker` or `prod` profiles, the backend rejects known repository/default placeholder secrets during startup.

---

## Current Business Invariants

These are important rules represented by the current source and should remain true unless a future change deliberately updates the business model.

### Sales order

```text
DRAFT -> COMPLETED
DRAFT -> CANCELLED
```

- Draft orders do not deduct stock.
- Draft orders do not create revenue.
- Draft orders do not create receivables.
- Confirmation/fulfillment is allowed only from Draft.
- Confirmation deducts stock, changes the order to Completed, stores `confirmedAt`, and creates receivable state when money remains owed.
- Cancellation is allowed only from Draft and does not mutate stock/revenue/debt.

### Payment

- One payment targets one Completed sales order.
- Partial settlement keeps an outstanding balance.
- Final settlement removes the order from the outstanding worklist.
- Overpayment is rejected.
- Financial mutation uses locking and idempotency safeguards.
- Receipt snapshots remain immutable after later payments.

### Invoice

- Invoice creation is automatic after final payment.
- Partial payment does not create an invoice.
- Final payment and invoice creation share the same transaction boundary.
- Invoice issuance does not create a second receivable.

### Receivable due date

```text
CURRENT   = more than 3 days remaining
DUE_SOON  = 1-3 days remaining
DUE_TODAY = today
OVERDUE   = before today
```

The backend business date is authoritative for these classifications.

---

## Deployment Notes

There is **no public demo URL committed in this README yet**. When a deployment is ready, replace the `Live Demo: Coming soon` line near the top with the actual HTTPS frontend URL.

A typical public topology is:

```text
Browser
  -> HTTPS frontend
  -> HTTPS backend /api
  -> PostgreSQL
```

### Backend deployment checklist

Configure at least:

```text
SPRING_PROFILES_ACTIVE=prod   (or your provider's production profile strategy)
SPRING_DATASOURCE_URL=...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...
APP_JWT_SECRET=<private 32+ character secret>
APP_CORS_ALLOWED_ORIGINS=https://your-frontend-domain
APP_BUSINESS_ZONE=Asia/Ho_Chi_Minh
APP_DEMO_ENABLED=true|false
```

If the recruiter environment intentionally uses seeded demo identities, enable demo mode only against demo data.

### Frontend deployment checklist

Build-time variables include:

```text
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_DEMO_MODE=true|false
VITE_DEMO_PASSWORD=<demo password when applicable>
```

The frontend uses Vite, so `VITE_*` values are build-time public configuration. Never place private backend secrets in frontend environment variables.

### SPA routing

A public static host must rewrite application routes to `index.html` so direct refreshes of routes such as `/dashboard`, `/sales-orders`, or `/payments` do not return a static-host 404.

### Production hardening

- Use HTTPS.
- Use a private JWT secret.
- Restrict CORS to the actual frontend origin.
- Use a dedicated managed PostgreSQL account/password.
- Keep metrics protected.
- Do not expose real customer/company data in a recruiter demo.
- Disable or isolate demo accounts for real production use.
- Keep provider-specific secrets outside Git.

---

## CI

GitHub Actions runs on every push and pull request.

Current workflow:

```text
PostgreSQL 16 service
  -> Java 17 / Maven cache
  -> backend: mvn -B verify
  -> Node 20 / npm cache
  -> frontend: npm ci && npm run build
```

Workflow file:

```text
.github/workflows/ci.yml
```

---

## Documentation

Additional project documentation:

- [`RUN_LOCAL.md`](RUN_LOCAL.md) - focused local run/reset guide
- [`docs/architecture.md`](docs/architecture.md) - backend/system architecture notes
- [`docs/business-flow.md`](docs/business-flow.md) - business workflow notes
- [`docs/frontend/ARCHITECTURE.md`](docs/frontend/ARCHITECTURE.md) - frontend architecture notes
- [`docs/release-checklist.md`](docs/release-checklist.md) - pre-release and UAT checklist

Swagger/OpenAPI is available at runtime from the backend.

---

## Roadmap

Possible next iterations should preserve the current business invariants and permission model while extending the product deliberately.

Current roadmap themes:

- Complete end-to-end server-side pagination/search for remaining high-volume views
- Continue UI/UX consistency improvements
- Expand dashboard/report visualization
- Add Excel import/export workflows
- Add delivery-note PDF support
- Expand integration/concurrency coverage
- Harden provider-specific deployment runbooks
- Expand Redis/RabbitMQ integration where it provides real operational value

Large architectural changes should be driven by actual requirements rather than added only for complexity.

---

## Portfolio Summary

DMS Lite demonstrates:

- Full-stack B2B workflow design with Spring Boot and React
- Modular monolith / package-by-feature organization
- JWT authentication, RBAC, and tenant-aware access
- Transactional sales/inventory/receivable flows
- Order-specific partial payments with idempotency and locking
- Automatic invoice creation after final settlement
- PostgreSQL + Flyway schema versioning
- Permission-aware dashboard, notification, audit, and AI/help behavior
- Local-first developer workflow plus Docker/CI foundations
