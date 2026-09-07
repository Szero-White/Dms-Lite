-- Simplify invoices: final payment creates one invoice draft automatically.
-- Remove the obsolete manual-create permission and backfill already-fully-paid orders.

delete from role_permissions rp
using permissions p
where rp.permission_id = p.id
  and p.name in ('INVOICE_CREATE', 'INVOICE_CANCEL');

delete from permissions
where name in ('INVOICE_CREATE', 'INVOICE_CANCEL');

create temporary table tmp_paid_order_invoice_backfill (
    tenant_id bigint not null,
    sales_order_id bigint not null,
    business_date date not null,
    sequence_value integer not null,
    primary key (tenant_id, sales_order_id)
) on commit drop;

with business_day as (
    select (current_timestamp at time zone 'Asia/Ho_Chi_Minh')::date as business_date
),
missing as (
    select
        so.tenant_id,
        so.id as sales_order_id,
        day.business_date,
        row_number() over (
            partition by so.tenant_id
            order by coalesce(so.confirmed_at, so.created_at), so.id
        )::integer as row_number
    from sales_orders so
    cross join business_day day
    where so.status = 'COMPLETED'
      and coalesce(so.total_amount, 0) > 0
      and coalesce(so.debt_amount, 0) <= 0
      and coalesce(so.paid_amount, 0) >= coalesce(so.total_amount, 0)
      and not exists (
          select 1
          from invoices invoice
          where invoice.tenant_id = so.tenant_id
            and invoice.sales_order_id = so.id
      )
),
bases as (
    select
        candidate.tenant_id,
        candidate.business_date,
        greatest(
            coalesce(sequence.last_value, 0),
            coalesce((
                select max(substring(invoice.invoice_number from '([0-9]+)$')::integer)
                from invoices invoice
                where invoice.tenant_id = candidate.tenant_id
                  and invoice.invoice_number like 'INV-' || to_char(candidate.business_date, 'YYYYMMDD') || '-%'
            ), 0)
        ) as base_value
    from (
        select distinct tenant_id, business_date
        from missing
    ) candidate
    left join document_number_sequences sequence
      on sequence.tenant_id = candidate.tenant_id
     and sequence.document_type = 'INVOICE'
     and sequence.business_date = candidate.business_date
)
insert into tmp_paid_order_invoice_backfill(tenant_id, sales_order_id, business_date, sequence_value)
select
    missing.tenant_id,
    missing.sales_order_id,
    missing.business_date,
    bases.base_value + missing.row_number
from missing
join bases
  on bases.tenant_id = missing.tenant_id
 and bases.business_date = missing.business_date;

insert into invoices(
    tenant_id, customer_id, sales_order_id, invoice_number, status, issue_date, due_date,
    subtotal, tax_amount, discount_amount, total_amount, paid_amount, remaining_amount,
    tax_rate, notes, company_name, customer_name, customer_address, created_by, created_at, updated_at
)
select
    so.tenant_id,
    so.customer_id,
    so.id,
    'INV-' || to_char(backfill.business_date, 'YYYYMMDD') || '-' ||
        lpad(backfill.sequence_value::text, greatest(4, length(backfill.sequence_value::text)), '0'),
    'DRAFT',
    null,
    case
        when receivable.due_date is null then null
        else (receivable.due_date::timestamp at time zone 'Asia/Ho_Chi_Minh') at time zone 'UTC'
    end,
    coalesce(items.gross_subtotal, so.total_amount, 0),
    0,
    coalesce(items.discount_amount, 0),
    coalesce(so.total_amount, 0),
    coalesce(so.paid_amount, so.total_amount, 0),
    greatest(coalesce(so.debt_amount, 0), 0),
    '0',
    'Auto-created after full payment',
    coalesce(tenant.name, 'DMS Lite'),
    customer.name,
    customer.address,
    0,
    current_timestamp at time zone 'UTC',
    current_timestamp at time zone 'UTC'
from tmp_paid_order_invoice_backfill backfill
join sales_orders so
  on so.tenant_id = backfill.tenant_id
 and so.id = backfill.sales_order_id
join customers customer
  on customer.tenant_id = so.tenant_id
 and customer.id = so.customer_id
left join tenants tenant on tenant.id = so.tenant_id
left join lateral (
    select
        sum(item.unit_price * item.quantity) as gross_subtotal,
        sum(coalesce(item.discount_amount, 0)) as discount_amount
    from sales_order_items item
    where item.sales_order_id = so.id
) items on true
left join lateral (
    select debt.due_date
    from customer_debt_transactions debt
    where debt.tenant_id = so.tenant_id
      and debt.source_type = 'SALES_ORDER'
      and debt.source_id = so.id
      and debt.direction = 'INCREASE'
    order by debt.created_at desc, debt.id desc
    limit 1
) receivable on true;

insert into invoice_items(
    tenant_id, invoice_id, product_id, product_name, product_code, description, quantity,
    unit_price, discount_amount, tax_rate, tax_amount, line_total
)
select
    invoice.tenant_id,
    invoice.id,
    item.product_id,
    product.name,
    product.sku,
    null,
    item.quantity,
    item.unit_price,
    coalesce(item.discount_amount, 0),
    '0',
    0,
    item.line_total
from tmp_paid_order_invoice_backfill backfill
join invoices invoice
  on invoice.tenant_id = backfill.tenant_id
 and invoice.sales_order_id = backfill.sales_order_id
join sales_order_items item on item.sales_order_id = backfill.sales_order_id
left join products product
  on product.tenant_id = invoice.tenant_id
 and product.id = item.product_id
where not exists (
    select 1 from invoice_items existing where existing.invoice_id = invoice.id
);

insert into document_number_sequences(tenant_id, document_type, business_date, last_value)
select tenant_id, 'INVOICE', business_date, max(sequence_value)
from tmp_paid_order_invoice_backfill
group by tenant_id, business_date
on conflict (tenant_id, document_type, business_date)
do update set last_value = greatest(
    document_number_sequences.last_value,
    excluded.last_value
);
