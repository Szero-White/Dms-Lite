import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { SummaryCard } from '../../../../components/common/SummaryCard';
import { useProducts } from '../../../../features/products';
import { formatCurrency, formatDateTime, toNumber } from '../../../../lib/format';
import {
  useInventoryHistory,
  useReceiveStock,
} from '../../hooks/useInventoryQueries';
import { ReceiveStockPayload } from '../../types/inventory.types';
import styles from './InventoryPage.module.css';

export function InventoryPage() {
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW'>('ALL');
  const [form] = Form.useForm<ReceiveStockPayload>();
  const selectedProductId = Form.useWatch('productId', form);
  const receivedQuantity = Form.useWatch('quantity', form);

  const productsQuery = useProducts();
  const historyQuery = useInventoryHistory();
  const receiveStockMutation = useReceiveStock();

  const lowStockItems = useMemo(
    () => (productsQuery.data ?? []).filter((product) => product.isLowStock),
    [productsQuery.data],
  );
  const products = productsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const normalizedKeyword = keyword.trim().toLowerCase();
      const matchesKeyword = !normalizedKeyword || [product.name, product.sku, product.barcode]
        .some((value) => value?.toLowerCase().includes(normalizedKeyword));
      const matchesStock = stockFilter === 'ALL' ||
        (stockFilter === 'LOW' && product.isLowStock) ||
        (stockFilter === 'HEALTHY' && !product.isLowStock);

      return matchesKeyword && matchesStock;
    }),
    [keyword, products, stockFilter],
  );
  const latestMovementByProduct = useMemo(() => {
    const result = new Map<number, string>();

    history.forEach((transaction) => {
      if (!result.has(transaction.productId)) {
        result.set(transaction.productId, transaction.createdAt);
      }
    });

    return result;
  }, [history]);
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const projectedStock = selectedProduct
    ? selectedProduct.stock + toNumber(receivedQuantity)
    : 0;
  const totalUnits = products.reduce((total, product) => total + toNumber(product.stock), 0);
  const inventoryValue = products.reduce(
    (total, product) => total + toNumber(product.costPrice) * toNumber(product.stock),
    0,
  );
  const hasFilters = Boolean(keyword || stockFilter !== 'ALL');

  function clearFilters() {
    setKeyword('');
    setStockFilter('ALL');
  }

  const handleOpenReceiveModal = () => {
    form.setFieldsValue({
      warehouseId: 1,
      quantity: 1,
      note: '',
    });

    setIsReceiveModalOpen(true);
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    form.resetFields();
  };

  const handleReceiveStock = async () => {
    const values = await form.validateFields();

    receiveStockMutation.mutate(values, {
      onSuccess: () => {
        handleCloseReceiveModal();
      },
    });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inventory"
        subtitle="Monitor on-hand stock, low-stock warnings, and movement history."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenReceiveModal}
          >
            Receive Stock
          </Button>
        }
      />

      <QueryState
        isLoading={productsQuery.isLoading || historyQuery.isLoading}
        isError={productsQuery.isError || historyQuery.isError}
        error={productsQuery.error || historyQuery.error}
        hasData={Boolean(productsQuery.data?.length)}
        emptyTitle="No inventory products yet"
        emptyDescription="Create products before receiving and monitoring inventory."
        onRetry={() => {
          void Promise.all([productsQuery.refetch(), historyQuery.refetch()]);
        }}
      >
        <div className={styles.contentStack}>
        <div className={styles.metricsGrid}>
          <SummaryCard
            title="Total Units"
            value={totalUnits}
            note="Units currently available across products"
            icon={<AppstoreOutlined />}
            variant="blue"
            visual="dashboard"
          />
          <SummaryCard
            title="Healthy SKUs"
            value={products.length - lowStockItems.length}
            note="Products above minimum stock level"
            icon={<CheckCircleOutlined />}
            variant="green"
            visual="dashboard"
          />
          <SummaryCard
            title="Low-stock SKUs"
            value={lowStockItems.length}
            note="Products requiring replenishment"
            icon={<WarningOutlined />}
            variant="orange"
            visual="dashboard"
          />
          <SummaryCard
            title="Inventory Value"
            value={formatCurrency(inventoryValue)}
            note="Estimated value at product cost"
            icon={<DollarOutlined />}
            variant="purple"
            visual="dashboard"
          />
        </div>

        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={16}>
            <Card className={`panel-card ${styles.stockCard}`} title="Stock by Product">
              <div className={styles.toolbar}>
                <Input
                  allowClear
                  className={styles.search}
                  prefix={<SearchOutlined />}
                  placeholder="Search product, SKU, barcode"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
                <Select
                  className={styles.filter}
                  value={stockFilter}
                  onChange={setStockFilter}
                  options={[
                    { value: 'ALL', label: 'All stock states' },
                    { value: 'HEALTHY', label: 'Healthy stock' },
                    { value: 'LOW', label: 'Low stock' },
                  ]}
                />
                <Button disabled={!hasFilters} onClick={clearFilters}>Clear</Button>
              </div>
              <Table
                rowKey="id"
                sticky
                scroll={{ x: 820 }}
                locale={{ emptyText: hasFilters ? 'No inventory matches these filters' : 'No stock data' }}
                dataSource={filteredProducts}
                pagination={false}
                rowClassName={(record) => record.isLowStock ? styles.lowStockRow : ''}
                columns={[
                  { title: 'SKU', dataIndex: 'sku', width: 120 },
                  { title: 'Product', dataIndex: 'name', width: 220 },
                  {
                    title: 'On Hand',
                    dataIndex: 'stock',
                    width: 120,
                    render: (value, record) => {
                      const minimum = Math.max(toNumber(record.minStock), 1);
                      const percent = Math.min(Math.round((toNumber(value) / minimum) * 100), 100);

                      return (
                        <div className={styles.stockLevel}>
                          <Typography.Text strong>{value}</Typography.Text>
                          <Progress
                            percent={percent}
                            showInfo={false}
                            size="small"
                            status={record.isLowStock ? 'exception' : 'success'}
                          />
                        </div>
                      );
                    },
                  },
                  { title: 'Minimum', dataIndex: 'minStock', width: 100 },
                  {
                    title: 'Last Movement',
                    width: 170,
                    render: (_, record) => {
                      const lastMovement = latestMovementByProduct.get(record.id);

                      return lastMovement ? formatDateTime(lastMovement) : '--';
                    },
                  },
                  {
                    title: 'Status',
                    width: 120,
                    render: (_, record) => (
                      <Tag
                        className={`${styles.stockTag} ${
                          record.isLowStock ? styles.lowStock : styles.healthy
                        }`}
                      >
                        {record.isLowStock ? 'LOW STOCK' : 'HEALTHY'}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} xl={8}>
            <Card className={`panel-card ${styles.watchlistCard}`} title="Low Stock Watchlist">
              {lowStockItems.length ? (
                <Space direction="vertical" className={styles.watchlist}>
                  {lowStockItems.map((product) => (
                    <div className="alert-row" key={product.id}>
                      <div>
                        <Typography.Text strong>{product.name}</Typography.Text>

                        <Typography.Paragraph
                          type="secondary"
                          className={styles.watchlistMeta}
                        >
                          {product.sku} - On hand {product.stock} / Min{' '}
                          {product.minStock}
                        </Typography.Paragraph>
                      </div>

                      <Tag className={`${styles.stockTag} ${styles.lowStock}`}>
                        Action needed
                      </Tag>
                    </div>
                  ))}
                </Space>
              ) : (
                <div className="panel-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No low stock items"
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Card className={`panel-card ${styles.historyCard}`} title="Inventory History">
          <Table
            rowKey="id"
            sticky
            scroll={{ x: 1000 }}
            locale={{ emptyText: 'No inventory movements recorded yet' }}
            dataSource={history}
            columns={[
              {
                title: 'Time',
                dataIndex: 'createdAt',
                render: (value) => formatDateTime(value),
              },
              {
                title: 'Product',
                dataIndex: 'productId',
                render: (productId) => products.find((product) => product.id === productId)?.name || `#${productId}`,
              },
              { title: 'Source', dataIndex: 'sourceType' },
              {
                title: 'Direction',
                dataIndex: 'direction',
                render: (value) => (
                  <Tag className={`${styles.movementTag} ${value === 'IN' ? styles.movementIn : styles.movementOut}`}>
                    {value}
                  </Tag>
                ),
              },
              { title: 'Qty', dataIndex: 'quantity' },
              { title: 'Before', dataIndex: 'beforeQuantity' },
              { title: 'After', dataIndex: 'afterQuantity' },
              { title: 'Note', dataIndex: 'note' },
            ]}
          />
        </Card>
        </div>
      </QueryState>

      <Modal
        rootClassName={styles.modal}
        title="Receive Stock"
        open={isReceiveModalOpen}
        onCancel={handleCloseReceiveModal}
        onOk={handleReceiveStock}
        okText="Receive"
        cancelText="Cancel"
        confirmLoading={receiveStockMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Warehouse"
            name="warehouseId"
            rules={[
              {
                required: true,
                message: 'Please select a warehouse',
              },
            ]}
          >
            <Select
              disabled
              options={[
                {
                  value: 1,
                  label: 'Main Warehouse',
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Product"
            name="productId"
            rules={[
              {
                required: true,
                message: 'Please select a product',
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="label"
              options={(productsQuery.data ?? []).map((product) => ({
                value: product.id,
                label: `${product.sku} - ${product.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              {
                required: true,
                message: 'Please enter quantity',
              },
            ]}
          >
            <InputNumber className={styles.fullWidth} min={1} precision={0} />
          </Form.Item>

          {selectedProduct ? (
            <div className={styles.stockProjection}>
              <div>
                <Typography.Text type="secondary">Current stock</Typography.Text>
                <Typography.Text strong>{selectedProduct.stock}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Quantity received</Typography.Text>
                <Typography.Text strong>{toNumber(receivedQuantity)}</Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">Projected stock</Typography.Text>
                <Typography.Text strong>{projectedStock}</Typography.Text>
              </div>
            </div>
          ) : null}

          <Form.Item label="Note" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Example: Initial stock receipt"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
