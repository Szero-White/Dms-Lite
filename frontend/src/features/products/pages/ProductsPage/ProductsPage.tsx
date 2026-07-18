import {
  AppstoreOutlined,
  DollarOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Dropdown,
  Input,
  Progress,
  Select,
  Table,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { ProductStatusTag } from '../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../lib/format';
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from '../../hooks/useProductQueries';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import { ProductFormValues, ProductRow } from '../../types/product.types';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const productsQuery = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC'>('DEFAULT');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const products = (productsQuery.data ?? []).filter((product) => {
      const matchesKeyword =
        !keyword ||
        [product.name, product.sku, product.barcode].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && product.active) ||
        (statusFilter === 'INACTIVE' && !product.active);
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'HEALTHY' && !product.isLowStock) ||
        (stockFilter === 'LOW_STOCK' && product.isLowStock);

      return matchesKeyword && matchesStatus && matchesStock;
    });

    return [...products].sort((first, second) => {
      if (sortBy === 'NAME') return first.name.localeCompare(second.name);
      if (sortBy === 'STOCK_ASC') return first.stock - second.stock;
      if (sortBy === 'STOCK_DESC') return second.stock - first.stock;
      if (sortBy === 'PRICE_DESC') return toNumber(second.sellingPrice) - toNumber(first.sellingPrice);
      return first.id - second.id;
    });
  }, [keyword, productsQuery.data, sortBy, statusFilter, stockFilter]);

  const products = productsQuery.data ?? [];
  const inventoryValue = products.reduce(
    (total, product) => total + toNumber(product.costPrice) * product.stock,
    0,
  );
  const activeCount   = products.filter((p) => p.active).length;
  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const avgMargin = products.length
    ? products.reduce((s, p) => {
        const sp = toNumber(p.sellingPrice);
        return s + (sp > 0 ? ((sp - toNumber(p.costPrice)) / sp) * 100 : 0);
      }, 0) / products.length
    : 0;

  const hasFilters = Boolean(
    keyword || statusFilter !== 'ALL' || stockFilter !== 'ALL' || sortBy !== 'DEFAULT',
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setStockFilter('ALL');
    setSortBy('DEFAULT');
  }

  async function handleSubmit(values: ProductFormValues) {
    if (selectedProduct) {
      await updateProduct.mutateAsync({
        productId: selectedProduct.id,
        payload: values,
      });
    } else {
      await createProduct.mutateAsync(values);
    }

    setDrawerOpen(false);
    setSelectedProduct(null);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Products"
        subtitle="Manage catalog, pricing and product availability."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedProduct(null);
              setDrawerOpen(true);
            }}
          >
            New Product
          </Button>
        }
      />

      <div className={styles.scoreboard}>
        {/* Left: big SKU count */}
        <div className={styles.scoreHero}>
          <div className={styles.scoreHeroIcon}>
            <AppstoreOutlined />
          </div>
          <div>
            <div className={styles.scoreHeroBig}>{products.length}</div>
            <div className={styles.scoreHeroLbl}>Total SKUs</div>
          </div>
        </div>

        <div className={styles.scoreDivider} />

        {/* Active vs Inactive donut */}
        <div className={styles.scoreDonut}>
          {(() => {
            const total = products.length || 1;
            const activePct = activeCount / total;
            const c = 2 * Math.PI * 28;
            return (
              <>
                <svg viewBox="0 0 72 72" className={styles.donutSvg}>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
                  <circle cx="36" cy="36" r="28" fill="none"
                    stroke="url(#pg)" strokeWidth="8"
                    strokeDasharray={`${activePct * c} ${c}`}
                    strokeDashoffset={c * 0.25}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10b981"/>
                      <stop offset="100%" stopColor="#34d399"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.donutCenter}>
                  <span className={styles.donutPct}>{Math.round(activePct * 100)}%</span>
                </div>
              </>
            );
          })()}
          <div className={styles.donutLegend}>
            <span><span className={styles.dot} style={{background:'#10b981'}}/>{activeCount} active</span>
            <span><span className={styles.dot} style={{background:'#e2e8f0'}}/>{products.length - activeCount} inactive</span>
          </div>
        </div>

        <div className={styles.scoreDivider} />

        {/* Stock alert */}
        <div className={styles.scoreAlert}>
          <div className={styles.scoreAlertTop}>
            <WarningOutlined style={{ color: lowStockCount > 0 ? '#f59e0b' : '#10b981', fontSize: 20 }} />
            <span className={styles.scoreAlertNum}
              style={{ color: lowStockCount > 0 ? '#f59e0b' : '#10b981' }}
            >
              {lowStockCount}
            </span>
          </div>
          <div className={styles.scoreAlertLbl}>Low-stock SKUs</div>
          <Progress
            percent={products.length ? Math.round(((products.length - lowStockCount) / products.length) * 100) : 100}
            showInfo={false}
            size="small"
            strokeColor={lowStockCount > 0 ? '#f59e0b' : '#10b981'}
          />
        </div>

        <div className={styles.scoreDivider} />

        {/* Value + margin */}
        <div className={styles.scoreFinancials}>
          <div className={styles.scoreFinRow}>
            <DollarOutlined style={{ color: '#8b5cf6', fontSize: 16 }} />
            <div>
              <div className={styles.scoreFinVal}>{formatCurrency(inventoryValue)}</div>
              <div className={styles.scoreFinLbl}>Inventory value</div>
            </div>
          </div>
          <div className={styles.scoreFinRow}>
            <EditOutlined style={{ color: '#6366f1', fontSize: 16 }} />
            <div>
              <div className={styles.scoreFinVal}>{avgMargin.toFixed(1)}%</div>
              <div className={styles.scoreFinLbl}>Avg. margin</div>
            </div>
          </div>
        </div>
      </div>

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <div className={styles.filterControls}>
            <Input
              allowClear
              className={styles.search}
              prefix={<SearchOutlined />}
              placeholder="Search SKU, name, barcode"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              className={styles.filter}
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
            <Select
              className={styles.filter}
              value={stockFilter}
              onChange={setStockFilter}
              options={[
                { value: 'ALL', label: 'All stock health' },
                { value: 'HEALTHY', label: 'Healthy stock' },
                { value: 'LOW_STOCK', label: 'Low stock' },
              ]}
            />
            <Select
              className={styles.sort}
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: 'DEFAULT', label: 'Default order' },
                { value: 'NAME', label: 'Name A-Z' },
                { value: 'STOCK_ASC', label: 'Stock low-high' },
                { value: 'STOCK_DESC', label: 'Stock high-low' },
                { value: 'PRICE_DESC', label: 'Selling price high-low' },
              ]}
            />
          </div>
          <Button disabled={!hasFilters} onClick={clearFilters}>Clear filters</Button>
        </div>

        <QueryState
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          error={productsQuery.error}
          hasData={filteredProducts.length > 0}
          emptyTitle={hasFilters ? 'No products match these filters' : 'No products yet'}
          emptyDescription={hasFilters
            ? 'Adjust or clear the active filters to see more products.'
            : 'Create the first product to begin catalog and stock management.'}
          emptyAction={hasFilters ? (
            <Button onClick={clearFilters}>Clear filters</Button>
          ) : (
            <Button type="primary" onClick={() => setDrawerOpen(true)}>New Product</Button>
          )}
          onRetry={() => productsQuery.refetch()}
        >
          <Table
            rowKey="id"
            sticky
            scroll={{ x: 1180 }}
            dataSource={filteredProducts}
            rowClassName={(record) => record.isLowStock ? styles.lowStockRow : ''}
            onRow={(record) => ({
              onDoubleClick: () => {
                setSelectedProduct(record);
                setDrawerOpen(true);
              },
            })}
            columns={[
              {
                title: 'Product',
                fixed: 'left',
                width: 320,
                ellipsis: true,
                render: (_, record) => (
                  <div className={styles.productCell}>
                    <Avatar shape="square">{record.name.slice(0, 2).toUpperCase()}</Avatar>
                    <div>
                      <Typography.Text strong>{record.name}</Typography.Text>
                      <Typography.Text type="secondary">{record.barcode || 'No barcode'}</Typography.Text>
                    </div>
                  </div>
                ),
              },
              {
                title: 'SKU',
                dataIndex: 'sku',
                width: 170,
                render: (value) => <span className={styles.sku}>{value}</span>,
              },
              {
                title: 'Cost Price',
                dataIndex: 'costPrice',
                align: 'right',
                width: 160,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Selling Price',
                dataIndex: 'sellingPrice',
                align: 'right',
                width: 170,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Margin',
                width: 110,
                align: 'right',
                render: (_, record) => {
                  const sellingPrice = toNumber(record.sellingPrice);
                  const margin = sellingPrice > 0
                    ? ((sellingPrice - toNumber(record.costPrice)) / sellingPrice) * 100
                    : 0;

                  return <span className={styles.money}>{margin.toFixed(1)}%</span>;
                },
              },
              {
                title: 'Stock Health',
                width: 210,
                render: (_, record) => {
                  const stockPercent = record.minStock > 0
                    ? Math.min(Math.round((record.stock / record.minStock) * 100), 100)
                    : 100;

                  return (
                    <div className={styles.stockCell}>
                      <div><strong>{record.stock}</strong><span> / min {record.minStock}</span></div>
                      <Progress
                        percent={stockPercent}
                        showInfo={false}
                        size="small"
                        status={record.isLowStock ? 'exception' : 'success'}
                      />
                    </div>
                  );
                },
              },
              {
                title: 'Status',
                width: 150,
                render: (_, record) => (
                  <ProductStatusTag
                    isLowStock={record.isLowStock}
                    active={record.active}
                  />
                ),
              },
              {
                title: '',
                fixed: 'right',
                width: 64,
                render: (_, record) => (
                  <Dropdown
                    trigger={['click']}
                    menu={{
                      items: [{ key: 'edit', label: 'Edit product' }],
                      onClick: () => {
                        setSelectedProduct(record);
                        setDrawerOpen(true);
                      },
                    }}
                  >
                    <Button type="text" icon={<MoreOutlined />} aria-label={`Actions for ${record.name}`} />
                  </Dropdown>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <ProductFormDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleSubmit}
        submitting={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  );
}
