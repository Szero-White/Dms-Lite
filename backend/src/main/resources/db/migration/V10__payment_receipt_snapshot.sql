-- Immutable payment-receipt snapshot fields.
-- A partial payment is still a valid receipt: debt_before/after preserve the financial state
-- at the moment the payment was recorded so later collections do not rewrite old receipts.

alter table payments add column debt_before numeric(19,2);
alter table payments add column debt_after numeric(19,2);
alter table payments add column customer_name_snapshot varchar(255);
alter table payments add column customer_phone_snapshot varchar(100);
alter table payments add column customer_address_snapshot varchar(500);
alter table payments add column company_name_snapshot varchar(255);
alter table payments add column recorded_by_snapshot varchar(255);

update payments payment
set
    customer_name_snapshot = customer.name,
    customer_phone_snapshot = customer.phone,
    customer_address_snapshot = customer.address
from customers customer
where customer.id = payment.customer_id
  and customer.tenant_id = payment.tenant_id;

update payments payment
set company_name_snapshot = tenant.name
from tenants tenant
where tenant.id = payment.tenant_id;

update payments payment
set recorded_by_snapshot = coalesce(app_user.full_name, app_user.username)
from app_users app_user
where app_user.id = payment.created_by
  and app_user.tenant_id = payment.tenant_id;

-- Reconstruct historical balance immediately after each payment from the immutable ledger
-- ordering. PAYMENT decrease rows reference the payment through source_id.
update payments payment
set debt_after = history.balance_after
from customer_debt_transactions payment_entry
cross join lateral (
    select greatest(
        coalesce(sum(
            case
                when transaction.direction = 'INCREASE' then transaction.amount
                when transaction.direction = 'DECREASE' then -transaction.amount
                else 0
            end
        ), 0),
        0
    )::numeric(19,2) as balance_after
    from customer_debt_transactions transaction
    where transaction.tenant_id = payment_entry.tenant_id
      and transaction.customer_id = payment_entry.customer_id
      and (
          transaction.created_at < payment_entry.created_at
          or (
              transaction.created_at = payment_entry.created_at
              and transaction.id <= payment_entry.id
          )
      )
) history
where payment_entry.tenant_id = payment.tenant_id
  and payment_entry.source_type = 'PAYMENT'
  and payment_entry.source_id = payment.id
  and payment_entry.direction = 'DECREASE';

update payments
set debt_before = debt_after + amount
where debt_after is not null;

create index idx_payments_tenant_customer_created
    on payments(tenant_id, customer_id, created_at desc);
