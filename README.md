# DMS Lite - B2B Sales, Inventory & Receivable Management SaaS

[![CI](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml/badge.svg)](https://github.com/Szero-White/Dms-Lite/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-17-informational)
![Release](https://img.shields.io/badge/release-v1.0.1-informational)

DMS Lite is a mini distribution management system for small wholesalers and distributors. It helps businesses manage customers, products, stock, sales orders, receivable debt, customer payments, audit logs, notifications, and business dashboards.

## Overview

Small B2B distributors often need more than a product list and order form. They need to know:

- Who owes money and how much
- Which stock movements changed inventory
- Whether an order can be confirmed safely
- Who performed important actions in the system
- How the business is performing across sales, debt, and stock

DMS Lite is a **deployable full-stack portfolio system** built as a modular monolith. Local development stays lightweight, while public demo and production-style deployments are configured through environment-specific settings.

## Problem Statement

Many small distributors still operate through a mix of Zalo, Excel, phone calls, and paper notebooks. That creates recurring business problems:

- Customer orders are scattered across chats and spreadsheets.
- Owners do not know the exact receivable debt of each customer.
- Stock can become inaccurate when multiple staff sell the same product.
- It is hard to trace who changed prices, confirmed orders, or recorded payments.
- Monthly debt reconciliation is slow, manual, and error-prone.

## Solution

DMS Lite addresses those problems with:

- Centralized customer, product, and sales order management
- Inventory transaction history for stock movement traceability
- Sales order confirmation with stock deduction
- Receivable tracking with open-item allocation and ledger-style payment history
- Customer payment recording and debt reconciliation
- Audit log for important business actions
- Dashboard for revenue, receivable debt, and low-stock visibility

## Business Value

- Reduces manual tracking across chat apps, spreadsheets, and notebooks
- Improves stock accuracy and reduces fulfillment mistakes
- Makes receivable debt visible and easier to reconcile
- Helps business owners monitor staff actions and operational flow
- Creates a foundation for a small distributor SaaS product instead of a simple internal CRUD demo

## Portfolio Demo

Current stable release: **v1.0.1**.

The public recruiter deployment intentionally runs in demo mode so reviewers can test role-specific workflows without creating accounts first. **Live Demo:** https://dms-lite.vercel.app/

| Role | Demo account | Main workflow |
| --- | --- | --- |
| Owner | `owner / 123456` | Dashboard, reports, audit, team access |
| Sales | `sale / 123456` | Customers, products/stock visibility, draft sales orders |
| Warehouse | `warehouse / 123456` | Inventory operations and order fulfillment |
| Accountant | `accountant / 123456` | Receivables, payments, financial reports |

Demo identities are protected from Team Management changes while demo mode is enabled. A real production deployment should set `APP_DEMO_ENABLED=false`, and `VITE_DEMO_MODE=false` hides demo-account cards in a non-demo frontend build.

### Deployment Topology

```text
Browser
  -> React / Vite static frontend
  -> HTTPS REST API
  -> Spring Boot application
  -> PostgreSQL
```

Database credentials, JWT secrets, CORS origins, API base URL, and demo-mode switches are supplied through deployment environment variables rather than committed secrets.

## Technical Value

- Demonstrates backend design beyond basic CRUD
- Models sales, inventory, and debt as related business flows
- Uses transactional stock deduction and domain-specific ledger tracking
- Applies JWT authentication, role-based permissions, and tenant isolation
- Supports local-first development with a separate Docker-oriented profile
- Includes schema versioning, API documentation, monitoring, and CI foundations

## Target Users

- Water distributors
- Wholesale cosmetics shops
- Phone accessories wholesalers
- Food dry-goods distributors
- Office supply distributors
- Material and equipment dealers
- Small B2B shops that allow customers to buy on credit

## Main Features

### Authentication & Authorization

- JWT-based authentication
- Role and permission model
- Tenant-aware access design with `tenant_id`

### Product Management

- Product catalog
- SKU, pricing, and stock-related product data

### Customer & Receivable Management

- Customer profiles
- Credit-related business data
- Receivable debt tracking by transactions

### Inventory Management

- Stock items by product
- Single operational warehouse in the current MVP; the UI resolves its database ID/name from the backend instead of hardcoding `1`
- Inventory transaction history
- Low-stock visibility

### Sales Order Management

- Sales order creation
- Sales order confirmation/fulfillment flow (`DRAFT -> COMPLETED`)
- Stock deduction during confirmation inside one transaction

### Payment Management

- Customer payment recording
- FIFO customer payment allocation against open receivables

### Invoice Management

- Invoice documents generated only from completed sales orders
- Invoice issuance/cancellation is permission controlled and does not create a second receivable balance
- Paid/remaining invoice amounts stay synchronized with the canonical sales-order payment workflow
- PDF export for active issued invoices

### Audit Log

- Tracks important user actions
- Supports traceability for operational changes

### Notification

- Persisted business notifications plus permission-filtered derived alerts
- Low-stock and overdue-receivable visibility
- Notification content is filtered by business permissions, including custom roles
- Docker profile extension path for RabbitMQ-based messaging

### Workflow AI Help

- Permission-aware workflow guidance for system and custom roles
- Live stock, receivable, sales-order, product, and customer lookups are guarded server-side before data access
- Server-generated live-data answers are kept out of external AI conversation context
- Backend-owned answer provenance distinguishes live DMS data, deterministic workflow knowledge, Gemini-assisted wording, and system fallback without letting the external model claim its own authority
- AI interaction history is restricted to team administrators and preserves provenance for support/audit review

### Dashboard / Reports

- Revenue overview
- Receivable debt visibility
- Stock-related reporting signals

## Key Business Flow

`Login -> create customer/product -> check stock -> create DRAFT sales order -> warehouse confirms/fulfills -> order becomes COMPLETED -> deduct stock inside transaction -> create open receivable if unpaid -> optionally generate/issue invoice -> record customer payment FIFO -> update receivable statement -> view dashboard/audit log`

This flow reflects a real B2B operational slice rather than isolated CRUD screens.

## Why This Is Not Just CRUD

- Inventory cannot go negative during the confirmation flow.
- Receivable is tracked as open `INCREASE` items plus payment history; current balance is the sum of remaining open receivables, not a mutable `customer.debt` field.
- Sales confirmation is handled inside a transaction.
- Important business actions are stored in audit logs.
- The data model is tenant-aware through `tenant_id`.
- Local and Docker profiles are separated for different runtime needs.
- Flyway is used for database schema versioning.
- Customer list debt balances are aggregated per page instead of issuing one balance query per customer.
- Sales order list/detail APIs are separated so list responses stay small and details fetch items only when needed.
- Report SQL is isolated in a read repository; receivable formulas remain centralized in the debt repository.

## Architecture

### Style

- Modular Monolith

### Backend Modules

- `auth`
- `user`
- `tenant`
- `product`
- `customer`
- `inventory`
- `sales`
- `debt`
- `payment`
- `invoice`
- `document`
- `audit`
- `notification`
- `report`
- `help`
- `team`

### Frontend

- React
- TypeScript
- Vite
- Ant Design

### Database

- PostgreSQL
- Flyway migration

### Optional Infrastructure

- Redis
- RabbitMQ
- Prometheus
- Grafana

Those optional services are Docker-oriented extension points rather than dependencies of the default local-first or recruiter-demo workflow. Fuller Redis/RabbitMQ integration coverage remains on the roadmap.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 17, Spring Boot 3, Spring Security, JWT, Spring Data JPA, PostgreSQL, Flyway, Swagger/OpenAPI |
| Frontend | React, TypeScript, Vite, Ant Design, React Query, Axios |
| Testing | JUnit 5, Mockito, Spring Security Test |
| DevOps | Docker Compose, GitHub Actions, Prometheus, Grafana |

## Database Design Highlights

The project models business operations through dedicated tables and flows instead of flattening everything into simple counters:

- `sales_orders`, `sales_order_items`
  Used to represent order headers and order line items.
- `stock_items`, `inventory_transactions`
  Separate current stock state from stock movement history.
- `customer_debt_transactions`
  Tracks receivable debt as ledger entries.
- `payments`
  Records customer payments explicitly.
- `invoices`, `invoice_items`
  Store sales-document snapshots linked to completed sales orders; financial balances remain owned by the sales/receivable flow.
- `audit_logs`
  Stores important traceable actions.
- `notifications`
  Keeps application notifications as part of the business flow.
- `tenant_id`
  Supports tenant isolation for multi-tenant SaaS design.

## Local Development

Detailed step-by-step notes are also available in [RUN_LOCAL.md](RUN_LOCAL.md).

Before publishing a portfolio release, use [docs/release-checklist.md](docs/release-checklist.md) for the role, business-flow, build, and deployment smoke tests.

On Windows, `run-local.bat` in the project root opens backend and frontend terminals automatically. PostgreSQL must already be running.

### Reset local demo data

To clear local test data and return to a clean seeded demo baseline without dropping the schema or Flyway history:

```powershell
powershell -ExecutionPolicy Bypass -File ".\scripts\local\reset-dms-local-jdbc.ps1"
```

The reset utility is **local-only**. It preserves `flyway_schema_history`, truncates application tables with identity reset, writes a row-count snapshot to `Downloads`, and then starts `run-local.bat` so demo seed data is recreated.

The CSV snapshot is not a restorable database backup. Use `pg_dump` separately when a full restore point is required.

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- PostgreSQL 14+

### 1. Create PostgreSQL Database

```sql
CREATE USER dms WITH PASSWORD 'dms';
CREATE DATABASE dms_lite OWNER dms;
GRANT ALL PRIVILEGES ON DATABASE dms_lite TO dms;
```

If you use another PostgreSQL account, update environment variables or `backend/src/main/resources/application-local.yml`.

### 2. Run Backend with Local Profile

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

### 3. Run Frontend

Open another terminal:

```bash
cd frontend
npm ci
npm run dev
```

### 4. Local URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`

### Local Profile Notes

- Redis is not required; the app uses simple cache in local mode.
- RabbitMQ is not required; notifications can be persisted without the full messaging stack.
- Docker Compose is not required for day-to-day local development.

## Demo Accounts

Local and recruiter-demo deployments use the four seeded accounts listed in **Portfolio Demo** above. Demo seeding can be disabled for a real production deployment with `APP_DEMO_ENABLED=false`.

## API Documentation

Swagger UI:

- `http://localhost:8080/swagger-ui/index.html`

## Docker

`docker-compose.yml` is a **local integration/demo stack**, not the public production manifest. It brings up PostgreSQL, Redis, RabbitMQ, the backend, frontend, Prometheus, and Grafana together for integration testing.

Before starting it, set `APP_JWT_SECRET` (required) and `APP_CORS_ALLOWED_ORIGINS` in `.env`, then run:

```bash
docker compose up -d --build
```

Main service URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Swagger: `http://localhost:8080/swagger-ui/index.html`
- RabbitMQ Management: `http://localhost:15672`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`

## Project Status

The current portfolio version focuses on a stable local/deployable vertical slice: authentication, product, customer, inventory, sales order, receivable debt, payment, invoice, dashboard/reporting, audit, notification, AI help, and team/permission management.

## Current Business Invariants

- Persisted sales order statuses are `DRAFT`, `COMPLETED`, and `CANCELLED`; current MVP confirm also performs fulfillment.
- Revenue is recognized only for `COMPLETED` orders; report/dashboard analytics use the backend reporting read model and `confirmed_at` as the recognition time for completed orders.
- Current receivable balance is `SUM(remaining_amount)` of open `INCREASE` transactions. `DECREASE` entries preserve payment history and are not subtracted twice.
- Customer payments lock open receivables before validation/allocation.
- Sales-order `paidAmount`/`debtAmount` snapshots are synchronized in the same payment transaction; open receivable `remainingAmount` stays the canonical balance. Draft/cancelled orders are not exposed as actual receivables.
- Customer and sales-order detail screens use dedicated detail APIs instead of searching only the first list page.
- Warehouse-dependent actions resolve and validate the configured tenant warehouse instead of assuming warehouse ID `1`.
- New Sales Order, Invoice, and Payment references use tenant-scoped business-date numbering (`SO-`, `INV-`, `PAY-`) rather than database IDs.
- Business-date rules use `APP_BUSINESS_ZONE` (default `Asia/Ho_Chi_Minh`) so due dates, overdue state, document numbering, and date-based reporting do not depend on the server machine timezone.

## Roadmap

- Complete end-to-end server-side pagination/search for high-volume list, lookup, statement, and report views
- Improve frontend UX/UI
- Add advanced dashboard charts
- Add Excel import/export
- Add PDF delivery note
- Add more integration tests
- Add inventory concurrency test coverage
- Add fuller Redis/RabbitMQ Docker profile workflow
- Maintain provider-specific deployment/runbook documentation

## CV Highlights

- Built a full-stack B2B distribution management SaaS using Java Spring Boot and React.
- Designed a modular monolith backend with authentication, role-based permissions, product, customer, inventory, sales, debt, payment, audit, and reporting modules.
- Implemented open-item receivable tracking with FIFO payment allocation, payment history, and pessimistic locking for concurrent payment safety.
- Used PostgreSQL and Flyway for schema versioning.
- Designed inventory transaction history and stock deduction flow.
- Added Swagger API documentation and a local-first development profile.
- Prepared Docker Compose, GitHub Actions, and a monitoring stack for a production-like setup.
