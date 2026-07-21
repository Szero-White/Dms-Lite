import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { toNumber } from '../../../../lib/format';
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '../../hooks/useCustomerQueries';
import type { Customer, CustomerFormValues } from '../../types/customer.types';
import { CustomersPulseBar } from './components/CustomersPulseBar/CustomersPulseBar';
import { CustomersTableCard } from './components/CustomersTableCard/CustomersTableCard';
import styles from './CustomersPage.module.css';

export function CustomersPage() {
  const customersQuery = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const [keyword, setKeyword] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [debtFilter, setDebtFilter] = useState<'ALL' | 'WITH_DEBT' | 'CLEAR'>('ALL');
  const [creditFilter, setCreditFilter] = useState<'ALL' | 'NEAR_LIMIT' | 'OVER_LIMIT'>('ALL');
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm<CustomerFormValues>();

  const filteredCustomers = useMemo(
    () =>
      (customersQuery.data ?? []).filter((customer) => {
        const matchesKeyword = [customer.name, customer.phone, customer.address].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
        const debt = toNumber(customer.debtBalance);
        const creditLimit = toNumber(customer.creditLimit);
        const creditUsage = creditLimit > 0 ? debt / creditLimit : 0;
        const matchesActive =
          activeFilter === 'ALL' ||
          (activeFilter === 'ACTIVE' && customer.active) ||
          (activeFilter === 'INACTIVE' && !customer.active);
        const matchesDebt =
          debtFilter === 'ALL' ||
          (debtFilter === 'WITH_DEBT' && debt > 0) ||
          (debtFilter === 'CLEAR' && debt <= 0);
        const matchesCredit =
          creditFilter === 'ALL' ||
          (creditFilter === 'NEAR_LIMIT' && creditLimit > 0 && creditUsage >= 0.8) ||
          (creditFilter === 'OVER_LIMIT' && creditLimit > 0 && creditUsage > 1);

        return matchesKeyword && matchesActive && matchesDebt && matchesCredit;
      }),
    [activeFilter, creditFilter, customersQuery.data, debtFilter, keyword],
  );

  const customers = customersQuery.data ?? [];
  const totalReceivables = customers.reduce(
    (total, customer) => total + toNumber(customer.debtBalance),
    0,
  );
  const thresholdCustomers = customers.filter((customer) => {
    const limit = toNumber(customer.creditLimit);

    return limit > 0 && toNumber(customer.debtBalance) / limit >= 0.8;
  }).length;
  const activeCount = customers.filter((customer) => customer.active).length;
  const debtorCount = customers.filter((customer) => toNumber(customer.debtBalance) > 0).length;
  const clearCount = customers.filter(
    (customer) => customer.active && toNumber(customer.debtBalance) === 0,
  ).length;
  const overLimitCount = customers.filter((customer) => {
    const limit = toNumber(customer.creditLimit);

    return limit > 0 && toNumber(customer.debtBalance) / limit >= 1;
  }).length;

  const hasFilters = Boolean(
    keyword || activeFilter !== 'ALL' || debtFilter !== 'ALL' || creditFilter !== 'ALL',
  );

  function clearFilters() {
    setKeyword('');
    setActiveFilter('ALL');
    setDebtFilter('ALL');
    setCreditFilter('ALL');
  }

  function openCreateCustomer() {
    setSelectedCustomer(null);
    form.resetFields();
    form.setFieldsValue({ paymentTermDays: 14, creditLimit: 0 });
    setOpen(true);
  }

  function openEditCustomer(customer: Customer) {
    setSelectedCustomer(customer);
    form.setFieldsValue({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      creditLimit: toNumber(customer.creditLimit),
      paymentTermDays: customer.paymentTermDays,
    });
    setOpen(true);
  }

  function closeCustomerForm() {
    setOpen(false);
    setSelectedCustomer(null);
    form.resetFields();
  }

  async function handleSubmit(values: CustomerFormValues) {
    if (selectedCustomer) {
      await updateCustomer.mutateAsync({
        customerId: selectedCustomer.id,
        payload: values,
      });
    } else {
      await createCustomer.mutateAsync(values);
    }

    closeCustomerForm();
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer profiles, credit limits and receivables."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCustomer}>
            New Customer
          </Button>
        }
      />

      <CustomersPulseBar
        activeCount={activeCount}
        clearCount={clearCount}
        customers={customers}
        debtorCount={debtorCount}
        overLimitCount={overLimitCount}
        thresholdCustomers={thresholdCustomers}
        totalReceivables={totalReceivables}
      />

      <CustomersTableCard
        activeFilter={activeFilter}
        creditFilter={creditFilter}
        debtFilter={debtFilter}
        deletingCustomerId={deleteCustomer.isPending ? deleteCustomer.variables : undefined}
        filteredCustomers={filteredCustomers}
        hasFilters={hasFilters}
        isError={customersQuery.isError}
        isLoading={customersQuery.isLoading}
        keyword={keyword}
        onActiveFilterChange={setActiveFilter}
        onClearFilters={clearFilters}
        onCreditFilterChange={setCreditFilter}
        onDeleteCustomer={(customerId) => deleteCustomer.mutate(customerId)}
        onDebtFilterChange={setDebtFilter}
        onEditCustomer={openEditCustomer}
        onKeywordChange={setKeyword}
        onRetry={() => {
          void customersQuery.refetch();
        }}
        queryError={customersQuery.error}
      />

      <Modal
        rootClassName={styles.modal}
        open={open}
        title={selectedCustomer ? 'Edit Customer' : 'Create Customer'}
        confirmLoading={createCustomer.isPending || updateCustomer.isPending}
        onCancel={closeCustomerForm}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ paymentTermDays: 14, creditLimit: 0 }}
          onFinish={handleSubmit}
        >
          <Form.Item name="name" label="Customer Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="creditLimit" label="Credit Limit">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="paymentTermDays" label="Payment Term Days">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
