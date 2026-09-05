import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { toNumber } from '../../../../lib/format';
import {
  PERMISSIONS,
  canViewCustomerBalance,
  hasPermission,
  useAuth,
} from '../../../auth';
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageCustomers = hasPermission(user, PERMISSIONS.CUSTOMER_MANAGE);
  const showCustomerFinancials = canViewCustomerBalance(user);
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
        const debt = showCustomerFinancials ? toNumber(customer.debtBalance) : 0;
        const creditLimit = toNumber(customer.creditLimit);
        const creditUsage = showCustomerFinancials && creditLimit > 0 ? debt / creditLimit : 0;
        const matchesActive =
          activeFilter === 'ALL' ||
          (activeFilter === 'ACTIVE' && customer.active) ||
          (activeFilter === 'INACTIVE' && !customer.active);
        const matchesDebt =
          !showCustomerFinancials ||
          debtFilter === 'ALL' ||
          (debtFilter === 'WITH_DEBT' && debt > 0) ||
          (debtFilter === 'CLEAR' && debt <= 0);
        const matchesCredit =
          !showCustomerFinancials ||
          creditFilter === 'ALL' ||
          (creditFilter === 'NEAR_LIMIT' && creditLimit > 0 && creditUsage >= 0.8) ||
          (creditFilter === 'OVER_LIMIT' && creditLimit > 0 && creditUsage > 1);

        return matchesKeyword && matchesActive && matchesDebt && matchesCredit;
      }),
    [activeFilter, creditFilter, customersQuery.data, debtFilter, keyword, showCustomerFinancials],
  );

  const customers = customersQuery.data ?? [];
  const totalReceivables = showCustomerFinancials
    ? customers.reduce(
        (total, customer) => total + toNumber(customer.debtBalance),
        0,
      )
    : 0;
  const thresholdCustomers = showCustomerFinancials
    ? customers.filter((customer) => {
        const limit = toNumber(customer.creditLimit);

        return limit > 0 && toNumber(customer.debtBalance) / limit >= 0.8;
      }).length
    : 0;
  const activeCount = customers.filter((customer) => customer.active).length;
  const debtorCount = showCustomerFinancials
    ? customers.filter((customer) => toNumber(customer.debtBalance) > 0).length
    : 0;
  const clearCount = showCustomerFinancials
    ? customers.filter(
        (customer) => customer.active && toNumber(customer.debtBalance) === 0,
      ).length
    : 0;
  const overLimitCount = showCustomerFinancials
    ? customers.filter((customer) => {
        const limit = toNumber(customer.creditLimit);

        return limit > 0 && toNumber(customer.debtBalance) / limit >= 1;
      }).length
    : 0;

  const hasFilters = Boolean(
    keyword ||
    activeFilter !== 'ALL' ||
    (showCustomerFinancials && debtFilter !== 'ALL') ||
    (showCustomerFinancials && creditFilter !== 'ALL'),
  );

  function clearFilters() {
    setKeyword('');
    setActiveFilter('ALL');
    setDebtFilter('ALL');
    setCreditFilter('ALL');
  }

  function openCreateCustomer() {
    if (!canManageCustomers) {
      return;
    }

    setSelectedCustomer(null);
    form.resetFields();
    form.setFieldsValue({ paymentTermDays: 14, creditLimit: 0 });
    setOpen(true);
  }

  function openEditCustomer(customer: Customer) {
    if (!canManageCustomers) {
      return;
    }

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
    if (!canManageCustomers) {
      return;
    }

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
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        extra={canManageCustomers ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCustomer}>
            {t('customers.new')}
          </Button>
        ) : null}
      />

      <CustomersPulseBar
        activeCount={activeCount}
        clearCount={clearCount}
        customers={customers}
        debtorCount={debtorCount}
        overLimitCount={overLimitCount}
        thresholdCustomers={thresholdCustomers}
        totalReceivables={totalReceivables}
        showFinancials={showCustomerFinancials}
      />

      <CustomersTableCard
        activeFilter={activeFilter}
        canManageCustomers={canManageCustomers}
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
        showFinancials={showCustomerFinancials}
      />

      {canManageCustomers ? (
        <Modal
          rootClassName={styles.modal}
          open={open}
          title={selectedCustomer ? t('customers.form.editTitle') : t('customers.form.createTitle')}
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
            <Form.Item
              name="name"
              label={t('customers.form.name')}
              rules={[{ required: true, message: t('customers.form.nameRequired') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="phone" label={t('customers.form.phone')}>
              <Input />
            </Form.Item>
            <Form.Item name="address" label={t('customers.form.address')}>
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="creditLimit" label={t('customers.form.creditLimit')}>
              <Input type="number" />
            </Form.Item>
            <Form.Item name="paymentTermDays" label={t('customers.form.paymentTermDays')}>
              <Input type="number" />
            </Form.Item>
          </Form>
        </Modal>
      ) : null}
    </div>
  );
}