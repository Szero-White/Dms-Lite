# Architecture

DMS Lite is a **modular monolith**. The design keeps domain boundaries clear while preserving simple deployment and reliable database transactions.

## Request Flow

```text
HTTP Request
  -> Controller
  -> Application/Domain Service
  -> Repository / Read Repository
  -> PostgreSQL
```

Responsibilities are intentionally separated:

- **Controller**: request/response mapping and authorization boundary.
- **Service**: business rules, transaction orchestration, locking, audit/notification coordination.
- **Repository**: persistence access and database-specific queries.
- **Read repository**: report/dashboard queries that do not belong in write-domain services.

Controllers do not own persistence logic, and business calculations should not be duplicated across controllers, repositories, and the frontend.

Paginated HTTP endpoints expose the DMS-owned `PageResponse` contract (`content`, `totalElements`, `totalPages`, `size`, `number`) instead of serializing Spring Data `Page` implementations directly. This keeps the public JSON shape stable when framework internals change.

## Domain Modules

The backend is grouped by domain:

```text
auth        authentication and session state
audit       audit trail
customer    customer lifecycle and credit configuration
debt        receivable ledger and statements
document    business document numbering
help        workflow assistant and optional Gemini integration
inventory   stock, warehouse, inventory transactions
invoice     invoice lifecycle and PDF
notification notification feed and read state
payment     order-specific payment workflow and receipt PDF
product     product catalog and lifecycle
report      dashboard/report read models
sales       sales-order lifecycle and fulfillment
team        roles, permissions, member administration
tenant      tenant context
user        user persistence
```

## Transaction Boundaries

### Sales order fulfillment

Fulfillment is a single transaction:

1. Load and lock the Draft sales order.
2. Lock the customer when credit exposure may change.
3. Validate credit limit before stock mutation.
4. Lock required stock rows.
5. Validate available stock.
6. Deduct stock and write inventory transactions.
7. Mark the order `COMPLETED` and store `confirmed_at`.
8. Create an open receivable when the order still has an unpaid amount.
9. Write audit/notification data as part of the business operation.

Any core database failure rolls the transaction back.

### Payment

The payment workspace keeps the outstanding-order list lightweight and lazily loads the selected order's line-item breakdown before enabling payment submission. The review response is tenant-scoped and protected by the same complete payment-workspace permission policy as the mutation.

A new payment applies to one completed sales order:

1. Lock the sales order.
2. Lock its open receivable.
3. Reject amounts greater than the remaining order balance.
4. Apply partial or final settlement.
5. Persist the payment and receivable decrease history.
6. Store immutable receipt snapshot fields.
7. On final settlement, create the order's Draft invoice if it does not already exist.

A client request key protects retry/idempotency behavior.

## Receivable Model

DMS Lite uses an open-item receivable model:

- Sales-order debt creates an `INCREASE` transaction.
- `INCREASE.amount` is the original amount.
- `INCREASE.remaining_amount` is the current open amount.
- Payments create `DECREASE` history entries and reduce the matching open increase.
- Current receivable balance is the sum of remaining amounts on open receivable increases.

This avoids subtracting payment history twice.

## Invoice Model

Invoice is a sales document, not a second receivable source.

- One sales order has at most one invoice.
- Final payment creates the Draft invoice automatically.
- Issuing an invoice does not create debt.
- Paid/remaining financial values are derived from the sales/payment flow.
- PDF generation supports Unicode and VI/EN content.

## Product Lifecycle and Codes

Products use a soft lifecycle:

```text
ACTIVE <-> INACTIVE
```

Inactive products remain queryable for historical sales, invoice, inventory, and audit references but cannot be used for new operational mutations.

New products receive system-managed tenant-scoped codes:

```text
PRD-000001
PRD-000002
...
```

The backend allocates these codes atomically; the frontend treats product code as read-only.

## Business Document Numbering

User-facing document references are separate from database IDs:

```text
SO-YYYYMMDD-NNNN
INV-YYYYMMDD-NNNN
PAY-YYYYMMDD-NNNN
```

Sequences are allocated atomically by tenant, document type, and business date. Business time uses `APP_BUSINESS_ZONE` (default `Asia/Ho_Chi_Minh`).

## Authorization

Permission checks are the source of truth. Frontend visibility improves UX but never replaces backend enforcement.

Security responsibilities include:

- JWT authentication
- tenant context
- method-level authorization
- route/action guards on the frontend
- role/permission dependency validation for composite workflows
- permission-aware notifications and workflow assistance

Disabled accounts must not continue operating with a previously issued access token.

## Inventory Scope

The current product operates with one primary warehouse per tenant. The schema retains `warehouse_id` so the model can grow later, but the current UI does not claim full multi-warehouse support.

The frontend resolves the current warehouse through the backend instead of assuming a database ID.

## Reporting and Notifications

Reporting queries live in dedicated read repositories where needed. Revenue is based on completed orders and the confirmed business timestamp.

Notification orchestration is split between persisted events and derived operational alerts. Permission policy is applied before returning notification data.

## Database Migration Policy

Flyway is the only schema migration mechanism. Migrations V1 through V14 are currently present.

Rules:

- never edit an already-applied migration;
- never reset or repair production history simply to make validation pass;
- create a new migration for new schema/data behavior;
- create a database checkpoint before production migrations.
