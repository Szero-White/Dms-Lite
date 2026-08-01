alter table roles add column tenant_id bigint;
alter table roles add column system_role boolean not null default false;

update roles
set system_role = true
where name in ('OWNER', 'SALE_STAFF', 'WAREHOUSE_STAFF', 'ACCOUNTANT');

alter table roles drop constraint if exists roles_name_key;
create unique index ux_roles_tenant_name on roles(coalesce(tenant_id, 0), lower(name));
create index idx_roles_tenant on roles(tenant_id, system_role, name);
