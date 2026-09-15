create table business_code_sequences (
    tenant_id bigint not null,
    code_type varchar(50) not null,
    last_value bigint not null,
    primary key (tenant_id, code_type)
);

-- Product codes are internal identifiers managed by the system. Existing
-- catalog records are normalized per tenant in creation order. Historical
-- invoice line snapshots intentionally keep the code captured at issue time.
with numbered_products as (
    select
        id,
        tenant_id,
        row_number() over (partition by tenant_id order by id) as sequence_value
    from products
)
update products product
set sku = 'PRD-' || lpad(numbered.sequence_value::text, 6, '0')
from numbered_products numbered
where product.id = numbered.id;

insert into business_code_sequences(tenant_id, code_type, last_value)
select tenant_id, 'PRODUCT', count(*)
from products
group by tenant_id;

alter table products alter column sku set not null;

create unique index uq_products_tenant_sku
    on products(tenant_id, lower(sku));
