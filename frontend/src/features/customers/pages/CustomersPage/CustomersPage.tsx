import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { toNumber } from '../../../../lib/format';
import { newestFirst } from '../../../../lib/tableSorting';
import {
  PERMISSIONS,
  canViewCustomerBalance,
  hasPermission,
  useAuth,
} from '../../../auth';
import {
  useCreateCustomer,
  useCustomers,
  useDeactivateCustomer,
  useReactivateCustomer,
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
  const canChangeCustomerStatus = hasPermission(user, PERMISSIONS.CUSTOMER_DEACTIVATE);
  const showCustomerFinancials = canViewCustomerBalance(user);
  const customersQuery = useCustomers();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deactivateCustomer = useDeactivateCustomer();
  const reactivateCustomer = useReactivateCustomer();
  const [keyword, setKeyword] = useState('');
  const [activeFilters, setActiveFilters] = useState<Array<'ACTIVE' | 'INACTIVE'>>([]);
  const [debtFilters, setDebtFilters] = useState<Array<'WITH_DEBT' | 'CLEAR'>>([]);
  const [creditFilters, setCreditFilters] = useState<Array<'NEAR_LIMIT' | 'OVER_LIMIT'>>([]);
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm<CustomerFormValues>();

  const filteredCustomers = useMemo(() => {
    const filtered = (customersQuery.data ?? []).filter((customer) => {
      const matchesKeyword = [customer.name, customer.phone, customer.address].some((value) =>
        value?.toLowerCase().includes(keyword.toLowerCase()),
      );
      const debt = showCustomerFinancials ? toNumber(customer.debtBalance) : 0;
      const creditLimit = toNumber(customer.creditLimit);
      const creditUsage = showCustomerFinancials && creditLimit > 0 ? debt / creditLimit : 0;
      const customerStatus = customer.active ? 'ACTIVE' : 'INACTIVE';
      const debtState = debt > 0 ? 'WITH_DEBT' : 'CLEAR';
      const matchesActive = activeFilters.length === 0 || activeFilters.includes(customerStatus);
      const matchesDebt =
        !showCustomerFinancials ||
        debtFilters.length === 0 ||
        debtFilters.includes(debtState);
      const matchesCredit =
        !showCustomerFinancials ||
        creditFilters.length === 0 ||
        (creditFilters.includes('NEAR_LIMIT') && creditLimit > 0 && creditUsage >= 0.8 && creditUsage < 1) ||
        (creditFilters.includes('OVER_LIMIT') && creditLimit > 0 && creditUsage >= 1);

      return matchesKeyword && matchesActive && matchesDebt && matchesCredit;
    });

    return newestFirst(filtered);
  }, [activeFilters, creditFilters, customersQuery.data, debtFilters, keyword, showCustomerFinancials]);

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
    activeFilters.length > 0 ||
    (showCustomerFinancials && debtFilters.length > 0) ||
    (showCustomerFinancials && creditFilters.length > 0),
  );

  function clearFilters() {
    setKeyword('');
    setActiveFilters([]);
    setDebtFilters([]);
    setCreditFilters([]);
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
        variant="people"
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
        activeFilters={activeFilters}
        canManageCustomers={canManageCustomers}
        canChangeCustomerStatus={canChangeCustomerStatus}
        creditFilters={creditFilters}
        debtFilters={debtFilters}
        changingStatusCustomerId={deactivateCustomer.isPending
          ? deactivateCustomer.variables
          : reactivateCustomer.isPending
            ? reactivateCustomer.variables
            : undefined}
        filteredCustomers={filteredCustomers}
        hasFilters={hasFilters}
        isError={customersQuery.isError}
        isLoading={customersQuery.isLoading}
        keyword={keyword}
        onActiveFiltersChange={setActiveFilters}
        onClearFilters={clearFilters}
        onCreditFiltersChange={setCreditFilters}
        onDeactivateCustomer={(customerId) => deactivateCustomer.mutate(customerId)}
        onDebtFiltersChange={setDebtFilters}
        onReactivateCustomer={(customerId) => reactivateCustomer.mutate(customerId)}
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