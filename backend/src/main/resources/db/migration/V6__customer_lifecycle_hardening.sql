-- Legacy customer deletion used active=false + deleted_at, which hid records from the
-- customer directory even though historical orders and documents still referenced them.
-- Open drafts must remain actionable, so legacy-deleted customers with DRAFT orders are
-- reactivated. Other legacy-deleted customers become normal inactive master data.
update customers customer
set active = true, deleted_at = null
where customer.deleted_at is not null
  and exists (
      select 1
      from sales_orders sales_order
      where sales_order.tenant_id = customer.tenant_id
        and sales_order.customer_id = customer.id
        and sales_order.status = 'DRAFT'
  );

update customers
set active = false, deleted_at = null
where deleted_at is not null;
