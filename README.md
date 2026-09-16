# DMS Lite

**B2B Sales, Inventory & Receivable Management SaaS**

A full-stack distribution management system covering sales, inventory, receivables, payments, invoices, reporting, notifications, audit logs, and role-based operations.

> Focus: business correctness, transactional consistency, authorization, auditability, automated tests, and production deployment.

[![CI](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml/badge.svg)](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-informational)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.5-informational)
![React](https://img.shields.io/badge/React-18.3-informational)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-informational)
![Release](https://img.shields.io/badge/release-v1.1.0-informational)

## 🚀 Live Demo — Start Here

**Live demo:** https://dms-lite.vercel.app

**Shared demo password:** `Demo@2026`

| Role | Username | Password | Main workflow |
| --- | --- | --- | --- |
| Owner | `owner` | `Demo@2026` | Dashboard, access control, reports, full business flow |
| Sales | `sale` | `Demo@2026` | Customers, products, sales orders, order completion |
| Accountant | `accountant` | `Demo@2026` | Inventory receiving, receivables, payments, invoices, reports |

> Demo accounts are also shown on the login page. The demo intentionally uses three personas for a small distributor; custom roles remain available when a business needs finer separation of duties.

### Suggested demo flow

1. Sign in as **Accountant** to review inventory and, if needed, receive stock.
2. Sign in as **Sales** to create a customer and Draft sales order, then confirm and complete the order.
3. Sign in as **Accountant** to reconcile the receivable and record a partial or final payment.
4. Issue/download the invoice after the order is fully paid.
5. Sign in as **Owner** to review reports, notifications, audit logs, and access control.

---

## Overview

DMS Lite is a modular monolith built for a small B2B distributor. It is intentionally focused on a coherent business workflow rather than a large number of unrelated features.

The application keeps sales, stock, receivables, payments, invoices, authorization, and audit history consistent across one end-to-end flow.

### Core capabilities

- JWT authentication and permission-based authorization
- Tenant-aware data access
- Product catalog with system-managed product codes such as `PRD-000001`
- Product deactivate/reactivate lifecycle that preserves historical references
- Customer profiles, payment terms, credit limits, and receivable statements
- Inventory stock, stock receiving, and transaction history
- Draft sales orders with transactional fulfillment
- Credit-limit validation before stock/debt mutation
- Order-specific partial and final payments with line-item review before posting
- Immutable payment receipt snapshots
- Automatic Draft invoice creation after final settlement
- PDF invoice and payment receipt generation
- Dashboard and operational reports
- Persisted and derived notifications with permission-aware visibility
- Audit log
- Permission-aware workflow assistant with optional Gemini wording support
- Vietnamese and English application UI
- CI, Flyway migrations, Docker Compose, and production deployment support

---

## Business Flow

```text
Customer + Product
       ↓
Draft Sales Order
       ↓
Order Completion
       ├─ validates credit exposure
       ├─ validates and deducts stock
       └─ creates receivable when money is still owed
       ↓
Order-specific Payment
       ├─ partial payment keeps receivable open
       └─ final payment settles receivable and creates Draft invoice
       ↓
Invoice Issue / PDF
       ↓
Reports + Notifications + Audit
```

### Sales order lifecycle

```text
DRAFT -> COMPLETED
DRAFT -> CANCELLED
```

`DRAFT` does not reduce stock and does not create revenue or receivables. `COMPLETED` is the current fulfillment state and is the point at which stock/revenue/receivable effects become real.

### Receivable source of truth

Open receivables are tracked through debt transactions. The canonical remaining balance is `remaining_amount` on open receivable increases. Payments are attached to one completed sales order and reduce only that order's receivable.

### Invoice rule

Invoices do not create receivables. A Draft invoice is created automatically when a completed sales order becomes fully paid; issuing the invoice is a document lifecycle step only.

See [docs/business-flow.md](docs/business-flow.md) for the business invariants used by the implementation.

---

## Architecture

DMS Lite uses a **modular monolith**.

```text
React / TypeScript / Ant Design
             ↓ REST
Spring Boot Controllers
             ↓
Application / Domain Services
             ↓
Repositories / Read Models
             ↓
PostgreSQL + Flyway
```

Backend packages are grouped by business domain (`sales`, `inventory`, `payment`, `invoice`, `customer`, `product`, and so on). The frontend uses the same feature-first ownership model.

Important boundaries:

- Controllers handle HTTP concerns and authorization, not persistence orchestration.
- Business mutations are implemented in transactional services.
- Repositories own persistence queries.
- Reporting/read-model SQL is separated from write-domain services.
- Shared table sorting/filter behavior is implemented centrally on the frontend.
- Permission checks are enforced by the backend even when the frontend hides unavailable actions.

See [docs/architecture.md](docs/architecture.md) and [docs/frontend/ARCHITECTURE.md](docs/frontend/ARCHITECTURE.md).

---

## Tech Stack

### Backend

- Java 17
- Spring Boot 3.3.5
- Spring Security
- Spring Data JPA / Hibernate
- PostgreSQL
- Flyway
- JWT
- JUnit 5 / Mockito
- Maven

### Frontend

- React 18
- TypeScript
- Vite
- Ant Design 5
- TanStack React Query
- Axios
- i18next / react-i18next
- Ant Design Charts

### Infrastructure

- Docker / Docker Compose
- GitHub Actions
- Vercel frontend deployment
- Containerized Spring Boot backend
- PostgreSQL production database
- Optional Redis / RabbitMQ in the Docker profile
- Prometheus / Grafana definitions for local observability

---

## Project Structure

```text
Dms-Lite/
├── backend/
│   ├── src/main/java/com/example/dms/
│   │   ├── auth/
│   │   ├── product/
│   │   ├── customer/
│   │   ├── inventory/
│   │   ├── sales/
│   │   ├── debt/
│   │   ├── payment/
│   │   ├── invoice/
│   │   ├── report/
│   │   ├── notification/
│   │   ├── audit/
│   │   ├── help/
│   │   └── team/
│   └── src/main/resources/db/migration/
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/common/
│       ├── features/
│       ├── i18n/
│       ├── lib/
│       ├── services/
│       └── styles/
├── docs/
├── docker-compose.yml
├── run-local.bat
└── RUN_LOCAL.md
```

---

## Local Development

### Requirements

- Java 17+
- Maven 3.9+
- Node.js 20+
- npm
- PostgreSQL 16 recommended

### Windows quick start

1. Copy the local environment template:

```powershell
Copy-Item run-local.env.example.bat run-local.env.bat
```

2. Edit `run-local.env.bat` with your local PostgreSQL credentials.

3. Create the database if it does not already exist:

```sql
CREATE DATABASE dms_lite;
```

4. Start both applications:

```powershell
.\run-local.bat
```

The launcher installs frontend dependencies with `npm ci` when `node_modules` is missing.

### Local URLs

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:3000` |
| Backend | `http://localhost:8080` |
| Swagger UI | `http://localhost:8080/swagger-ui/index.html` |
| Actuator health | `http://localhost:8080/actuator/health` |

For manual startup and troubleshooting, see [RUN_LOCAL.md](RUN_LOCAL.md).

---

## Build and Quality Checks

### Frontend

```powershell
cd frontend
npm ci
npm run quality:ui
npm run build
```

`quality:ui` checks shared UI conventions including:

- neutral initial table sort state
- three-state sorting behavior
- shared sorter tooltip behavior
- checkbox multi-select usage
- Vietnamese/English translation-key parity

### Backend

```powershell
cd backend
mvn verify
```

CI runs backend verification, frontend consistency checks, and the production frontend build on every push and pull request.

---

## Database and Flyway

The repository currently contains Flyway migrations **V1 through V14**.

Recent migrations cover:

- business document numbering
- help answer provenance
- per-user notification read receipts
- payment receipt snapshots
- order-specific payments
- automatic invoices after final payment
- system-managed product codes
- sales-order cancellation reason and lifecycle audit data

Do not edit an already-applied migration. Add a new migration for schema or data changes.

---

## Security and Authorization

- Backend authorization is the source of truth.
- Role names do not replace permission checks.
- Tenant context scopes business data.
- JWT authentication is stateless.
- CORS origins are configurable through `APP_CORS_ALLOWED_ORIGINS`.
- Production JWT secrets and database credentials must be supplied through environment variables.
- Gemini has no direct database credentials; backend services decide what data and workflow context can be exposed.

---

## Environment Configuration

Common variables are documented in `.env.example`.

Important values include:

```text
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
APP_JWT_SECRET
APP_CORS_ALLOWED_ORIGINS
APP_BUSINESS_ZONE
APP_DEMO_ENABLED
APP_DEMO_PASSWORD
VITE_API_BASE_URL
VITE_DEMO_MODE
VITE_DEMO_PASSWORD
GEMINI_ENABLED
GEMINI_API_KEY
```

Never commit real credentials or API keys.

---

## Docker Compose

Copy `.env.example` to `.env`, configure secure local values, then run:

```bash
docker compose up --build
```

The Docker profile starts PostgreSQL, Redis, RabbitMQ, backend, frontend, Prometheus, and Grafana. Normal local development does not require Redis or RabbitMQ; the `local` Spring profile uses PostgreSQL plus in-process cache and notification fallback behavior.

---

## Documentation

- [Local development](RUN_LOCAL.md)
- [Backend/system architecture](docs/architecture.md)
- [Business flow](docs/business-flow.md)
- [Frontend architecture](docs/frontend/ARCHITECTURE.md)
- [Release checklist](docs/release-checklist.md)

The documentation is intentionally concise and code-oriented so it stays aligned with the implementation.
