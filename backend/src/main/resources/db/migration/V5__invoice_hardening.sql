-- Harden the invoice module while preserving the original V4 checksum.
-- Invoice payment remains part of the canonical customer payment/receivable workflow.
delete from role_permissions rp
using permissions p
where rp.permission_id = p.id
  and p.name in ('INVOICE_RECORD_PAYMENT', 'INVOICE_DELETE');

delete from permissions
where name in ('INVOICE_RECORD_PAYMENT', 'INVOICE_DELETE');

create unique index if not exists ux_invoices_tenant_sales_order
    on invoices(tenant_id, sales_order_id)
    where sales_order_id is not null;
