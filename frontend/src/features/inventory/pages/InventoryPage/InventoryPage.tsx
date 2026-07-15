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
        <div className={styles.stockDashboard}>
          {/* Zone 1: Totals */}
          <div className={styles.stockZoneUnits}>
            <div className={styles.stockZoneLabel}>Stock Overview</div>
            <div className={styles.stockBigNum}>{totalUnits.toLocaleString('vi-VN')}</div>
            <div className={styles.stockBigLabel}>total units on hand</div>
            <div className={styles.stockDivider} />
            <div className={styles.stockValueRow}>
              <span className={styles.stockValueLabel}>Inventory value</span>
              <span className={styles.stockValueNum}>{formatCurrency(inventoryValue)}</span>
            </div>
            <div className={styles.stockValueRow}>
              <span className={styles.stockValueLabel}>Total SKUs</span>
              <span className={styles.stockValueNum}>{products.length}</span>
            </div>
          </div>

          {/* Zone 2: Health donut */}
          <div className={styles.stockZoneHealth}>
            {(() => {
              const healthy = products.length - lowStockItems.length;
              const total = products.length || 1;
              const healthyPct = healthy / total;
              const circumference = 2 * Math.PI * 44;
              return (
                <>
                  <div className={styles.healthRingWrap}>
                    <svg viewBox="0 0 100 100" className={styles.healthRing}>
                      <circle cx="50" cy="50" r="44" fill="none" stroke="#fef2f2" strokeWidth="10"/>
                      <circle cx="50" cy="50" r="44" fill="none"
                        stroke="#f97316" strokeWidth="10"
                        strokeDasharray={`${(1 - healthyPct) * circumference} ${circumference}`}
                        strokeDashoffset={circumference * 0.25}
                        strokeLinecap="round"
                      />
                      <circle cx="50" cy="50" r="44" fill="none"
                        stroke="url(#healthGrad)" strokeWidth="10"
                        strokeDasharray={`${healthyPct * circumference} ${circumference}`}
                        strokeDashoffset={circumference * 0.25 - (1 - healthyPct) * circumference}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981"/>
                          <stop offset="100%" stopColor="#34d399"/>
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className={styles.healthRingCenter}>
                      <span className={styles.healthPct}>{Math.round(healthyPct * 100)}%</span>
                      <span className={styles.healthPctLabel}>healthy</span>
                    </div>
                  </div>
                  <div className={styles.healthLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{background:'#10b981'}}/>
                      <span>{healthy} healthy</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendDot} style={{background:'#f97316'}}/>
                      <span>{lowStockItems.length} low stock</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Zone 3: Alert list */}
          <div className={styles.stockZoneAlerts}>
            <div className={styles.alertZoneTitle}>
              ⚠️ Needs Restock
              {lowStockItems.length > 0 && (
                <span className={styles.alertBadge}>{lowStockItems.length}</span>
              )}
            </div>
            {lowStockItems.length === 0 ? (
              <div className={styles.alertEmpty}>
                <span>✅</span>
                <span>All products healthy</span>
              </div>
            ) : (
              <div className={styles.alertList}>
                {lowStockItems.slice(0, 4).map((product) => {
                  const pct = product.minStock > 0
                    ? Math.min(Math.round((product.stock / product.minStock) * 100), 100)
                    : 0;
                  return (
                    <div key={product.id} className={styles.alertItem}>
                      <div className={styles.alertItemTop}>
                        <span className={styles.alertItemName}>{product.name}</span>
                        <span className={styles.alertItemStock}>{product.stock}/{product.minStock}</span>
                      </div>
                      <div className={styles.alertBar}>
                        <div
                          className={styles.alertBarFill}
                          style={{
                            width: `${pct}%`,
                            background: pct < 30
                              ? 'linear-gradient(90deg,#ef4444,#f87171)'
                              : 'linear-gradient(90deg,#f97316,#fbbf24)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
