# DMS Lite - B2B Sales, Inventory & Receivable Management SaaS

DMS Lite is a mini distribution management system for small wholesalers and distributors. It helps businesses manage customers, products, stock, sales orders, receivable debt, customer payments, audit logs, notifications, and business dashboards.

Du an nay khong phai chi la mot web CRUD ban hang co ban. Muc tieu cua no la mo phong mot bai toan van hanh thuc te trong mo hinh B2B phan phoi nho: ban hang, tru kho, cong no, thanh toan, truy vet thao tac, va bao cao tong quan.

## Overview

Small B2B distributors often need more than a product list and order form. They need to know:

- Who owes money and how much
- Which stock movements changed inventory
- Whether an order can be confirmed safely
- Who performed important actions in the system
- How the business is performing across sales, debt, and stock

DMS Lite is designed as a **local-first full-stack project** with a production-like extension path through Docker Compose, monitoring, and CI.

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
- Receivable debt tracking as ledger-style transactions
- Customer payment recording and debt reconciliation
- Audit log for important business actions
- Dashboard for revenue, receivable debt, and low-stock visibility

## Business Value

- Reduces manual tracking across chat apps, spreadsheets, and notebooks
- Improves stock accuracy and reduces fulfillment mistakes
- Makes receivable debt visible and easier to reconcile
- Helps business owners monitor staff actions and operational flow
- Creates a foundation for a small distributor SaaS product instead of a simple internal CRUD demo

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
- Inventory transaction history
- Low-stock visibility

### Sales Order Management

- Sales order creation
- Sales order confirmation flow
- Stock deduction during order confirmation

### Payment Management

- Customer payment recording
- Debt statement update through ledger logic

### Audit Log

- Tracks important user actions
- Supports traceability for operational changes

### Notification

- Notification persistence
- Docker profile extension path for RabbitMQ-based messaging

### Dashboard / Reports

- Revenue overview
- Receivable debt visibility
- Stock-related reporting signals

## Key Business Flow

`Login -> create customer/product -> check stock -> create sales order -> confirm sales order -> deduct stock inside transaction -> create receivable debt transaction if unpaid -> record customer payment -> update debt statement -> view dashboard/audit log`

This flow reflects a real B2B operational slice rather than isolated CRUD screens.

## Why This Is Not Just CRUD

- Inventory cannot go negative during the confirmation flow.
- Debt is tracked as ledger transactions, not by simply doing `customer.debt += amount`.
- Sales confirmation is handled inside a transaction.
- Important business actions are stored in audit logs.
- The data model is tenant-aware through `tenant_id`.
- Local and Docker profiles are separated for different runtime needs.
- Flyway is used for database schema versioning.

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
- `audit`
- `notification`
- `report`

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

Those optional services are primarily used in the Docker-oriented setup rather than the default local-first workflow.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Backend | Java 17, Spring Boot 3, Spring Security, JWT, Spring Data JPA, PostgreSQL, Flyway, Swagger/OpenAPI |
| Frontend | React, TypeScript, Vite, Ant Design, React Query, Axios |
| Testing | JUnit 5, Mockito, Spring Security Test, Testcontainers |
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
- `audit_logs`
  Stores important traceable actions.
- `notifications`
  Keeps application notifications as part of the business flow.
- `tenant_id`
  Supports tenant isolation for multi-tenant SaaS design.

## Local Development

Detailed step-by-step notes are also available in [RUN_LOCAL.md](/D:/Study/Java/B2B Sales, Inventory And Receivable Management SaaS/RUN_LOCAL.md).

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

PowerShell:

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Alternative form if needed in your environment:

```powershell
cd backend
mvn spring-boot:run "-Dspring-boot.run.arguments=--spring.profiles.active=local"
```

### 3. Run Frontend

Open another terminal:

```bash
cd frontend
npm install
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

- `owner / 123456`
- `sale / 123456`
- `warehouse / 123456`
- `accountant / 123456`

## API Documentation

Swagger UI:

- `http://localhost:8080/swagger-ui/index.html`

## Docker

When you want a more production-like local environment:

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

This project is under active development. The current version focuses on local-first development and the main vertical slice: authentication, product, customer, inventory, sales order, receivable debt, payment, dashboard, audit, and notification.

## Roadmap

- Improve frontend UX/UI
- Add advanced dashboard charts
- Add Excel import/export
- Add PDF delivery note
- Add more integration tests
- Add inventory concurrency test coverage
- Add fuller Redis/RabbitMQ Docker profile workflow
- Add deployment guide

## CV Highlights

- Built a full-stack B2B distribution management SaaS using Java Spring Boot and React.
- Designed a modular monolith backend with authentication, role-based permissions, product, customer, inventory, sales, debt, payment, audit, and reporting modules.
- Implemented a receivable debt ledger instead of direct balance mutation.
- Used PostgreSQL and Flyway for schema versioning.
- Designed inventory transaction history and stock deduction flow.
- Added Swagger API documentation and a local-first development profile.
- Prepared Docker Compose, GitHub Actions, and a monitoring stack for a production-like setup.
