alter table sales_orders
    add column if not exists cancellation_reason varchar(500),
    add column if not exists cancelled_at timestamp;
