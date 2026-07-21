import {
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Input,
  Popconfirm,
  Progress,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import { QueryState } from '../../../../../../components/common/QueryState';
import { ProductStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import type { ProductRow } from '../../../../types/product.types';
import styles from './ProductsTableCard.module.css';

interface ProductsTableCardProps {
  deletingProductId?: number;
  filteredProducts: ProductRow[];
  hasFilters: boolean;
  isError: boolean;
  isLoading: boolean;
  keyword: string;
  onClearFilters: () => void;
  onDeleteProduct: (productId: number) => void;
  onKeywordChange: (value: string) => void;
  onRetry: () => void;
  onSelectProduct: (product: ProductRow | null) => void;
  onSetDrawerOpen: (open: boolean) => void;
  onSortByChange: (
    value: 'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC',
  ) => void;
  onStatusFilterChange: (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
  onStockFilterChange: (value: 'ALL' | 'HEALTHY' | 'LOW_STOCK') => void;
  productsError: unknown;
  sortBy: 'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  stockFilter: 'ALL' | 'HEALTHY' | 'LOW_STOCK';
}

export function ProductsTableCard({
  deletingProductId,
  filteredProducts,
  hasFilters,
  isError,
  isLoading,
  keyword,
  onClearFilters,
  onDeleteProduct,
  onKeywordChange,
  onRetry,
  onSelectProduct,
  onSetDrawerOpen,
  onSortByChange,
  onStatusFilterChange,
  onStockFilterChange,
  productsError,
  sortBy,
  statusFilter,
  stockFilter,
}: ProductsTableCardProps) {
  function openEditor(product: ProductRow) {
    onSelectProduct(product);
    onSetDrawerOpen(true);
  }

  return (
    <Card className={`panel-card ${styles.tableCard}`}>
      <div className={styles.toolbar}>
        <div className={styles.filterControls}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder="Search SKU, name, barcode"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <Select
            className={styles.filter}
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: 'ALL', label: 'All statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
          <Select
            className={styles.filter}
            value={stockFilter}
            onChange={onStockFilterChange}
            options={[
              { value: 'ALL', label: 'All stock health' },
              { value: 'HEALTHY', label: 'Healthy stock' },
              { value: 'LOW_STOCK', label: 'Low stock' },
            ]}
          />
          <Select
            className={styles.sort}
            value={sortBy}
            onChange={onSortByChange}
            options={[
              { value: 'DEFAULT', label: 'Default order' },
              { value: 'NAME', label: 'Name A-Z' },
              { value: 'STOCK_ASC', label: 'Stock low-high' },
              { value: 'STOCK_DESC', label: 'Stock high-low' },
              { value: 'PRICE_DESC', label: 'Selling price high-low' },
            ]}
          />
        </div>
        <Button disabled={!hasFilters} onClick={onClearFilters}>
          Clear filters
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={productsError}
        hasData={filteredProducts.length > 0}
        emptyTitle={hasFilters ? 'No products match these filters' : 'No products yet'}
        emptyDescription={
          hasFilters
            ? 'Adjust or clear the active filters to see more products.'
            : 'Create the first product to begin catalog and stock management.'
        }
        emptyAction={
          hasFilters ? (
            <Button onClick={onClearFilters}>Clear filters</Button>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                onSelectProduct(null);
                onSetDrawerOpen(true);
              }}
            >
              New Product
            </Button>
          )
        }
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          sticky
          scroll={{ x: 1260 }}
          dataSource={filteredProducts}
          rowClassName={(record) => (record.isLowStock ? styles.lowStockRow : '')}
          onRow={(record) => ({
            onDoubleClick: () => openEditor(record),
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
                    <Typography.Text type="secondary">
                      {record.barcode || 'No barcode'}
                    </Typography.Text>
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
              render: (value) => (
                <span className={styles.money}>{formatCurrency(value)}</span>
              ),
            },
            {
              title: 'Selling Price',
              dataIndex: 'sellingPrice',
              align: 'right',
              width: 170,
              render: (value) => (
                <span className={styles.money}>{formatCurrency(value)}</span>
              ),
            },
            {
              title: 'Margin',
              width: 110,
              align: 'right',
              render: (_, record) => {
                const sellingPrice = toNumber(record.sellingPrice);
                const margin =
                  sellingPrice > 0
                    ? ((sellingPrice - toNumber(record.costPrice)) / sellingPrice) * 100
                    : 0;

                return <span className={styles.money}>{margin.toFixed(1)}%</span>;
              },
            },
            {
              title: 'Stock Health',
              width: 210,
              render: (_, record) => {
                const stockPercent =
                  record.minStock > 0
                    ? Math.min(Math.round((record.stock / record.minStock) * 100), 100)
                    : 100;

                return (
                  <div className={styles.stockCell}>
                    <div>
                      <strong>{record.stock}</strong>
                      <span> / min {record.minStock}</span>
                    </div>
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
                <ProductStatusTag isLowStock={record.isLowStock} active={record.active} />
              ),
            },
            {
              title: 'Actions',
              fixed: 'right',
              width: 96,
              render: (_, record) => (
                <Space size={4} className={styles.rowActions}>
                  <Tooltip title="Edit product">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={`Edit ${record.name}`}
                      onClick={() => openEditor(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete product?"
                    description="This hides the product from active lists."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDeleteProduct(record.id)}
                  >
                    <Tooltip title="Delete product">
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={deletingProductId === record.id}
                        aria-label={`Delete ${record.name}`}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}



