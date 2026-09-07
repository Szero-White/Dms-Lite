-- Notification read state belongs to the authenticated user, not to the tenant-wide
-- notification row. Persist a read receipt per user so one employee reading an alert
-- never changes another employee's unread state. Existing shared notifications.read_flag
-- remains for migration compatibility but is no longer used by the application.
create table notification_reads (
    id bigserial primary key,
    tenant_id bigint not null references tenants(id) on delete cascade,
    user_id bigint not null references app_users(id) on delete cascade,
    notification_key varchar(255) not null,
    read_at timestamp not null,
    constraint uq_notification_reads_user_key unique (tenant_id, user_id, notification_key)
);

create index idx_notification_reads_user
    on notification_reads(tenant_id, user_id, read_at desc);
