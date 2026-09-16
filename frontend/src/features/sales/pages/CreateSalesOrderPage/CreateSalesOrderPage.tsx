import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { PERMISSIONS, firstAuthorizedPath, hasPermission, useAuth } from '../../../auth';
import { useCustomers } from '../../../customers';
import { useProducts } from '../../../products';
import { useDefaultWarehouse } from '../../../inventory';
import {
  formatCurrency,
  toNumber,
} from '../../../../lib/format';
import {
  useConfirmSalesOrder,
  useCreateSalesOrder,
} from '../../hooks/useSalesQueries';
import { OrderItemsEditor } from './components/OrderItemsEditor';
import { OrderItemsPreview } from './components/OrderItemsPreview';
import styles from './CreateSalesOrderPage.module.css';

interface CreatedOrderReference {
  id: number;
  code: string;
}

interface OrderFormValues {
  customerId: number;
  warehouseId: number;
  items: Array<{
    productId: number;
    quantity: number;
    discountAmount?: number;
  }>;
}

export function CreateSalesOrderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canConfirmSalesOrder = hasPermission(user, PERMISSIONS.SALES_ORDER_CONFIRM);
  const canViewSalesOrders = hasPermission(user, PERMISSIONS.SALES_ORDER_VIEW);
  const fallbackPath = firstAuthorizedPath(user);
  const navigate = useNavigate();
  const customersQuery = useCustomers();
  const productsQuery = useProducts();
  const warehouseQuery = useDefaultWarehouse();
  const createOrder = useCreateSalesOrder();
  const confirmOrder = useConfirmSalesOrder();
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderReference | null>(null);
  const submissionLockedRef = useRef(false);
  const [form] = Form.useForm<OrderFormValues>();

  const watchedItems = Form.useWatch('items', form) || [];
  const selectedCustomerId = Form.useWatch('customerId', form);

  useEffect(() => {
    if (warehouseQuery.data?.id && !form.getFieldValue('warehouseId')) {
      form.setFieldValue('warehouseId', warehouseQuery.data.id);
    }
  }, [form, warehouseQuery.data?.id]);

  const subtotal = useMemo(
    () => watchedItems.reduce((sum, item) => {
      const product = productsQuery.data?.find((candidate) => candidate.id === item?.productId);

      if (!product) {
        return sum;
      }

      return sum + toNumber(product.sellingPrice) * Number(item.quantity || 0);
    }, 0),
    [productsQuery.data, t, watchedItems],
  );

  const discountTotal = useMemo(
    () => watchedItems.reduce((sum, item) => sum + Number(item?.discountAmount || 0), 0),
    [watchedItems],
  );

  const orderTotal = subtotal - discountTotal;
  const orderExposure = Math.max(orderTotal, 0);
  const selectedCustomer = customersQuery.data?.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const currentCustomerDebt = toNumber(selectedCustomer?.debtBalance);
  const customerCreditLimit = toNumber(selectedCustomer?.creditLimit);
  const projectedCustomerDebt = currentCustomerDebt + orderExposure;
  const exceedsCreditLimit = customerCreditLimit > 0 && projectedCustomerDebt > customerCreditLimit;
  const stockWarnings = watchedItems.flatMap((item) => {
    const product = productsQuery.data?.find(
      (candidate) => candidate.id === item?.productId,
    );
    const quantity = Number(item?.quantity || 0);

    return product && quantity > product.stock
      ? [t('sales.create.stockWarningItem', { name: product.name, quantity, stock: product.stock })]
      : [];
  });

  function getAvailableStockForLine(productId: number | undefined, lineIndex: number) {
    if (!productId) {
      return 0;
    }

    const product = productsQuery.data?.find((candidate) => candidate.id === productId);
    if (!product) {
      return 0;
    }

    const reservedByOtherLines = watchedItems.reduce((sum, item, index) => {
      if (index === lineIndex || item?.productId !== productId) {
        return sum;
      }

      return sum + Number(item.quantity || 0);
    }, 0);

    return Math.max(product.stock - reservedByOtherLines, 0);
  }
  return (
    <div className={styles.page}>
      <PageHeader
        variant="operations"
        title={t('sales.create.title')}
        subtitle={t('sales.create.subtitle')}
        breadcrumb={[t('sales.create.breadcrumbSalesOrders'), t('sales.create.breadcrumbCreate')]}
      />

      <QueryState
        isLoading={customersQuery.isLoading || productsQuery.isLoading || warehouseQuery.isLoading}
        isError={customersQuery.isError || productsQuery.isError || warehouseQuery.isError}
        error={customersQuery.error || productsQuery.error || warehouseQuery.error}
        hasData={Boolean(
          customersQuery.data?.some((customer) => customer.active)
            && productsQuery.data?.some((product) => product.active)
            && warehouseQuery.data,
        )}
        emptyTitle={t('sales.create.title')}
        emptyDescription={t('sales.create.emptyDescription')}
        onRetry={() => {
          customersQuery.refetch();
          productsQuery.refetch();
          warehouseQuery.refetch();
        }}
      >
        <Row gutter={[16, 16]} className={styles.orderGrid}>
          <Col xs={24} xl={16}>
            <Card className={`panel-card ${styles.formCard}`} title={t('sales.create.title')}>
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  items: [{ quantity: 1, discountAmount: 0 }],
                }}
                onFinish={async (values) => {
                  if (submissionLockedRef.current || createdOrder) {
                    return;
                  }

                  submissionLockedRef.current = true;

                  try {
                    const order = await createOrder.mutateAsync({
                      customerId: values.customerId,
                      warehouseId: values.warehouseId,
                      items: (values.items || []).map((item) => ({
                        productId: item.productId,
                        quantity: Number(item.quantity),
                        discountAmount: Number(item.discountAmount || 0),
                      })),
                    });

                    setCreatedOrder({ id: order.id, code: order.code });
                  } catch {
                    submissionLockedRef.current = false;
                  }
                }}
              >
                <div className={styles.formSectionHeading}>
                  <Typography.Text strong>{t('sales.create.customerWarehouse')}</Typography.Text>
                  <Typography.Text type="secondary">
                    {t('sales.create.customerWarehouseHint')}
                  </Typography.Text>
                </div>

                <Form.Item
                  name="customerId"
                  label={t('customers.column.customer')}
                  rules={[{ required: true }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={t('payments.customerPlaceholder')}
                    options={(customersQuery.data ?? [])
                      .filter((customer) => customer.active)
                      .map((customer) => ({
                        value: customer.id,
                        label: t('sales.create.customerDebtLabel', { name: customer.name, debt: formatCurrency(customer.debtBalance) }),
                      }))}
                  />
                </Form.Item>

                <Form.Item
                  name="warehouseId"
                  label={t('sales.drawer.warehouse')}
                  rules={[{ required: true }]}
                >
                  <Select
                    disabled
                    options={warehouseQuery.data
                      ? [{ value: warehouseQuery.data.id, label: warehouseQuery.data.name }]
                      : []}
                  />
                </Form.Item>

                <OrderItemsEditor
                  getAvailableStockForLine={getAvailableStockForLine}
                  products={productsQuery.data ?? []}
                  watchedItems={watchedItems}
                />

                {stockWarnings.length ? (
                  <Alert
                    className={styles.stockAlert}
                    type="warning"
                    showIcon
                    message={t('sales.create.stockWarningTitle')}
                    description={stockWarnings.join('; ')}
                  />
                ) : null}

                {exceedsCreditLimit ? (
                  <Alert
                    className={styles.stockAlert}
                    type="warning"
                    showIcon
                    message={t('sales.create.creditLimitWarningTitle')}
                    description={t('sales.create.creditLimitWarningDescription', {
                      limit: formatCurrency(customerCreditLimit),
                      currentDebt: formatCurrency(currentCustomerDebt),
                      orderExposure: formatCurrency(orderExposure),
                      projectedDebt: formatCurrency(projectedCustomerDebt),
                    })}
                  />
                ) : null}

                <Space className={styles.formActions}>
                  <Button onClick={() => navigate(canViewSalesOrders ? '/sales-orders' : fallbackPath)}>{t('sales.create.back')}</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={createOrder.isPending}
                    disabled={Boolean(createdOrder)}
                  >
                    {createdOrder
                      ? t('sales.create.createdButton')
                      : t('sales.action.createOrder')}
                  </Button>
                </Space>
              </Form>
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <div className={styles.summaryColumn}>
            <Card className={`panel-card ${styles.summaryCard}`} title={t('sales.create.title')}>
              <Space direction="vertical" size={10} className={styles.summaryList}>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.subtotal')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(subtotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.discount')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(discountTotal)}</Typography.Text>
                </div>
                <div className={`${styles.summaryTotal} flex-between`}>
                  <Typography.Text>{t('sales.create.orderTotal')}</Typography.Text>
                  <Typography.Text strong>{formatCurrency(orderTotal)}</Typography.Text>
                </div>
                <div className="flex-between">
                  <Typography.Text>{t('sales.create.orderExposure')}</Typography.Text>
                  <Typography.Text
                    strong
                    className={orderExposure > 0 ? styles.exposureAmount : undefined}
                  >
                    {formatCurrency(orderExposure)}
                  </Typography.Text>
                </div>
              </Space>
            </Card>

            {createdOrder ? (
              <Alert
                className={styles.successAlert}
                type="success"
                showIcon
                message={t('sales.create.createdSuccess', { code: createdOrder.code })}
                description={(
                  <Space direction="vertical">
                    {canConfirmSalesOrder ? (
                      <Button
                        type="primary"
                        loading={confirmOrder.isPending}
                        onClick={() => confirmOrder.mutate(createdOrder.id)}
                      >
                        {t('sales.create.confirmNow')}
                      </Button>
                    ) : null}
                    <Button
                      onClick={() => {
                        submissionLockedRef.current = false;
                        setCreatedOrder(null);
                        createOrder.reset();
                      }}
                    >
                      {t('sales.create.createAnother')}
                    </Button>
                    {canViewSalesOrders ? (
                      <Button onClick={() => navigate('/sales-orders')}>{t('sales.create.backToOrders')}</Button>
                    ) : null}
                  </Space>
                )}
              />
            ) : null}

            <OrderItemsPreview
              getAvailableStockForLine={getAvailableStockForLine}
              items={watchedItems}
              products={productsQuery.data ?? []}
            />
            </div>
          </Col>
        </Row>
      </QueryState>
    </div>
  );
}
