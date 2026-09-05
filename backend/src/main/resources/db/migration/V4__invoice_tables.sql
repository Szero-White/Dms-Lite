-- Invoice tables
create table invoices(
    id bigserial primary key,
    tenant_id bigint,
    customer_id bigint,
    sales_order_id bigint,
    invoice_number varchar(100) unique,
    status varchar(30),
    issue_date timestamp,
    due_date timestamp,
    subtotal numeric(19,2),
    tax_amount numeric(19,2),
    discount_amount numeric(19,2),
    total_amount numeric(19,2),
    paid_amount numeric(19,2),
    remaining_amount numeric(19,2),
    tax_rate varchar(20),
    notes text,
    company_name varchar(255),
    company_address varchar(500),
    company_tax_code varchar(50),
    customer_name varchar(255),
    customer_address varchar(500),
    customer_tax_code varchar(50),
    created_by bigint,
    created_at timestamp,
    updated_at timestamp
);

create table invoice_items(
    id bigserial primary key,
    tenant_id bigint,
    invoice_id bigint references invoices(id),
    product_id bigint,
    product_name varchar(255),
    product_code varchar(100),
    description text,
    quantity numeric(19,2),
    unit_price numeric(19,2),
    discount_amount numeric(19,2),
    tax_rate varchar(20),
    tax_amount numeric(19,2),
    line_total numeric(19,2)
);

-- Indexes for invoices
create index idx_invoices_tenant on invoices(tenant_id, status);
create index idx_invoices_customer on invoices(tenant_id, customer_id);
create index idx_invoices_sales_order on invoices(tenant_id, sales_order_id);
create index idx_invoice_items_invoice on invoice_items(invoice_id);
create index idx_invoice_items_tenant on invoice_items(tenant_id);

-- Insert invoice permissions
insert into permissions(name) values 
('INVOICE_VIEW'),
('INVOICE_CREATE'),
('INVOICE_ISSUE'),
('INVOICE_CANCEL'),
('INVOICE_RECORD_PAYMENT'),
('INVOICE_DELETE');