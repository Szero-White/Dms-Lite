# Business Flow

This document describes the business behavior implemented by the current source.

## 1. Product

A product contains business attributes such as name, barcode, prices, minimum stock, and lifecycle state.

Product code is system-managed:

```text
PRD-000001
```

Users do not edit product codes manually.

Products are **deactivated**, not physically deleted. Historical orders, invoices, stock transactions, reports, and audit references must remain valid.

Inactive products cannot be selected for new sales or stock-receiving operations.

## 2. Customer

A customer can have:

- payment terms;
- credit limit;
- sales-order history;
- open receivables;
- debt statement history.

`creditLimit = 0` means no configured hard limit.

Creating a Draft order may warn about projected exposure. The hard credit check occurs during fulfillment before stock or receivable mutation.

## 3. Sales Order

Current lifecycle:

```text
DRAFT -> COMPLETED
DRAFT -> CANCELLED
```

### DRAFT

- editable operational order state;
- no stock deduction;
- no recognized revenue;
- no receivable creation.

### COMPLETED

Warehouse fulfillment performs the real business mutation:

- validates customer credit exposure;
- validates stock;
- deducts stock;
- records inventory movement;
- recognizes the completed sale;
- creates an open receivable when money remains unpaid.

### CANCELLED

Only a Draft order can be cancelled. Cancellation does not create revenue, debt, or stock movement.

## 4. Inventory

Inventory is warehouse-backed. Stock mutations are handled by backend business services and validated against tenant/warehouse ownership.

Main operations:

- receive stock;
- adjust stock;
- sales-order stock-out;
- transaction history;
- low-stock monitoring.

Stock must never become negative because of sales-order fulfillment.

## 5. Receivables

An unpaid completed order creates an open receivable increase.

Due-date states are:

| State | Meaning |
| --- | --- |
| `CURRENT` | More than 3 days remain |
| `DUE_SOON` | 1-3 days remain |
| `DUE_TODAY` | Due on the current business date |
| `OVERDUE` | Due date is before the current business date |

`DUE_TODAY` is not overdue.

The canonical open balance is `remaining_amount` on open receivable increases.

## 6. Payments

Each new payment targets exactly one `COMPLETED` sales order with an outstanding balance.

Supported behavior:

- partial payment;
- exact final payment;
- overpayment rejection;
- pessimistic locking for financial mutation;
- idempotent retry through a request key;
- payment history with PAY/SO/customer traceability;
- immutable receipt snapshot fields.

A payment must not reduce another order's receivable.

## 7. Invoice

There is no manual invoice creation in the current flow.

```text
Final payment -> Draft invoice -> Issue -> PDF
```

Rules:

- partial payment does not create an invoice;
- final payment creates exactly one Draft invoice;
- issue does not create a second receivable;
- historical fully paid orders are handled by migration/backfill logic;
- invoice PDF supports Vietnamese and English.

## 8. Roles and Permissions

System roles represent common workflows but permissions remain authoritative.

### Owner

Full business and administration workflow.

### Sales

Customer/product visibility required for selling, Draft order creation, and allowed Draft cancellation.

### Warehouse

Inventory workflow and order fulfillment.

### Accountant

Receivables, payments, invoices, and reporting according to assigned permissions.

Custom roles are supported. Composite workflows validate required dependent permissions so the UI does not expose an action whose supporting data cannot be read.

## 9. Notifications and Audit

Important business mutations write audit information. Notifications combine persisted events and derived operational alerts such as overdue receivables and low stock.

Notification visibility follows the same permission boundaries as the underlying business data.

## 10. Reporting

Revenue uses completed sales orders. Financial dashboards and customer debt views must read the same canonical receivable state used by payments and statements.

A reporting screen must not recompute a different debt formula in the browser.
