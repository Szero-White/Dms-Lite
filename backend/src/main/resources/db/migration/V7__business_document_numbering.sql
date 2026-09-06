-- Human-readable, tenant-scoped business document numbers.
-- Existing Sales Order and Invoice numbers are intentionally preserved because issued/history
-- identifiers should not be rewritten. Payments did not previously have a business code, so
-- they are backfilled using their historical business date in Asia/Ho_Chi_Minh.

create table document_number_sequences (
    tenant_id bigint not null,
    document_type varchar(30) not null,
    business_date date not null,
    last_value integer not null,
    primary key (tenant_id, document_type, business_date),
    check (last_value > 0),
    check (document_type in ('SALES_ORDER', 'INVOICE', 'PAYMENT'))
);

alter table sales_orders drop constraint if exists sales_orders_code_key;
alter table invoices drop constraint if exists invoices_invoice_number_key;

update sales_orders
set code = 'LEGACY-SO-' || tenant_id || '-' || id
where code is null or btrim(code) = '';

update invoices
set invoice_number = 'LEGACY-INV-' || tenant_id || '-' || id
where invoice_number is null or btrim(invoice_number) = '';

alter table sales_orders alter column code set not null;
alter table invoices alter column invoice_number set not null;

create unique index ux_sales_orders_tenant_code
    on sales_orders(tenant_id, code);

create unique index ux_invoices_tenant_number
    on invoices(tenant_id, invoice_number);

alter table payments add column code varchar(100);

with numbered_payments as (
    select
        id,
        tenant_id,
        (((created_at at time zone 'UTC') at time zone 'Asia/Ho_Chi_Minh')::date) as business_date,
        row_number() over (
            partition by tenant_id, (((created_at at time zone 'UTC') at time zone 'Asia/Ho_Chi_Minh')::date)
            order by created_at, id
        ) as sequence_value
    from payments
)
update payments payment
set code = 'PAY-'
    || to_char(numbered.business_date, 'YYYYMMDD')
    || '-'
    || lpad(
        numbered.sequence_value::text,
        greatest(4, length(numbered.sequence_value::text)),
        '0'
    )
from numbered_payments numbered
where payment.id = numbered.id;

alter table payments alter column code set not null;

create unique index ux_payments_tenant_code
    on payments(tenant_id, code);

insert into document_number_sequences(tenant_id, document_type, business_date, last_value)
select
    tenant_id,
    'PAYMENT',
    (((created_at at time zone 'UTC') at time zone 'Asia/Ho_Chi_Minh')::date),
    count(*)::integer
from payments
group by tenant_id, (((created_at at time zone 'UTC') at time zone 'Asia/Ho_Chi_Minh')::date)
on conflict (tenant_id, document_type, business_date)
do update set last_value = greatest(
    document_number_sequences.last_value,
    excluded.last_value
);
