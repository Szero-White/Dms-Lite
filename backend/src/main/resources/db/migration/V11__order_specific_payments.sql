-- New payments are intentionally linked to exactly one completed sales order.
-- Historical FIFO payments remain valid with sales_order_id/request_key NULL.

alter table payments add column sales_order_id bigint;
alter table payments add column sales_order_code_snapshot varchar(100);
alter table payments add column sales_order_total_snapshot numeric(19,2);
alter table payments add column request_key varchar(64);

create index idx_payments_tenant_sales_order_created
    on payments(tenant_id, sales_order_id, created_at desc);

create unique index uq_payments_tenant_request_key
    on payments(tenant_id, request_key)
    where request_key is not null;

-- A legacy payment may have been distributed across multiple receivables. Do not guess
-- a sales order for those rows; the UI/PDF labels them as legacy payment history instead.
