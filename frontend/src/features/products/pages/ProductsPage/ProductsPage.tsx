import {
  AppstoreOutlined,
  CheckCircleOutlined,
  DollarOutlined,
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
import { SummaryCard } from '../../../../components/common/SummaryCard';
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

      <div className={styles.metricsGrid}>
        <SummaryCard
          title="Total SKUs"
          value={products.length}
          note="Products tracked in the catalog"
          icon={<AppstoreOutlined />}
          variant="blue"
          visual="dashboard"
        />
        <SummaryCard
          title="Active Products"
          value={products.filter((product) => product.active).length}
          note="Products available for sales workflows"
          icon={<CheckCircleOutlined />}
          variant="green"
          visual="dashboard"
        />
        <SummaryCard
          title="Low-stock Products"
          value={products.filter((product) => product.isLowStock).length}
          note="SKUs at or below minimum stock"
          icon={<WarningOutlined />}
          variant="orange"
          visual="dashboard"
        />
        <SummaryCard
          title="Inventory Value"
          value={formatCurrency(inventoryValue)}
          note="Estimated from cost price and on-hand stock"
          icon={<DollarOutlined />}
          variant="purple"
          visual="dashboard"
        />
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
                width: 280,
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
                width: 150,
                render: (value) => <span className={styles.sku}>{value}</span>,
              },
              {
                title: 'Cost Price',
                dataIndex: 'costPrice',
                align: 'right',
                width: 150,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Selling Price',
                dataIndex: 'sellingPrice',
                align: 'right',
                width: 150,
                render: (value) => <span className={styles.money}>{formatCurrency(value)}</span>,
              },
              {
                title: 'Margin',
                width: 100,
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
                width: 180,
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
