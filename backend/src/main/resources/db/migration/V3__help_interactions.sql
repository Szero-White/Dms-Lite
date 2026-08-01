create table if not exists help_interactions (
    id bigserial primary key,
    tenant_id bigint not null,
    actor_id bigint not null,
    actor_username varchar(255) not null,
    actor_full_name varchar(255),
    actor_roles varchar(500),
    question text not null,
    answer text not null,
    steps text,
    related_modules text,
    guardrails text,
    scope_notice varchar(500),
    blocked boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists idx_help_interactions_tenant_created
    on help_interactions (tenant_id, created_at desc);

create index if not exists idx_help_interactions_actor_created
    on help_interactions (tenant_id, actor_id, created_at desc);