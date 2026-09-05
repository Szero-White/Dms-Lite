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
import { useTranslation } from 'react-i18next';
import { QueryState } from '../../../../../../components/common/QueryState';
import { ProductStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import type { ProductRow } from '../../../../types/product.types';
import styles from './ProductsTableCard.module.css';

interface ProductsTableCardProps {
  canManageProducts: boolean;
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
  showFinancials: boolean;
  showInventory: boolean;
  sortBy: 'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC';
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE';
  stockFilter: 'ALL' | 'HEALTHY' | 'LOW_STOCK';
}

export function ProductsTableCard({
  canManageProducts,
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
  showFinancials,
  showInventory,
  sortBy,
  statusFilter,
  stockFilter,
}: ProductsTableCardProps) {
  const { t } = useTranslation();

  function openEditor(product: ProductRow) {
    if (!canManageProducts) {
      return;
    }

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
            placeholder={t('products.filters.searchPlaceholder')}
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
          <Select
            className={styles.filter}
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: 'ALL', label: t('products.filters.allStatuses') },
              { value: 'ACTIVE', label: t('common.active') },
              { value: 'INACTIVE', label: t('common.inactive') },
            ]}
          />
          {showInventory ? (
            <Select
              className={styles.filter}
              value={stockFilter}
              onChange={onStockFilterChange}
              options={[
                { value: 'ALL', label: t('products.filters.allStockHealth') },
                { value: 'HEALTHY', label: t('products.filters.healthyStock') },
                { value: 'LOW_STOCK', label: t('status.product.lowStock') },
              ]}
            />
          ) : null}
          <Select
            className={styles.sort}
            value={sortBy}
            onChange={onSortByChange}
            options={[
              { value: 'DEFAULT', label: t('products.filters.defaultOrder') },
              { value: 'NAME', label: t('products.filters.nameAsc') },
              ...(showInventory ? [
                { value: 'STOCK_ASC', label: t('products.filters.stockAsc') },
                { value: 'STOCK_DESC', label: t('products.filters.stockDesc') },
              ] : []),
              { value: 'PRICE_DESC', label: t('products.filters.priceDesc') },
            ]}
          />
        </div>
        <Button disabled={!hasFilters} onClick={onClearFilters}>
          {t('common.clearFilters')}
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={productsError}
        hasData={filteredProducts.length > 0}
        emptyTitle={
          hasFilters
            ? t('products.empty.filteredTitle')
            : t('products.empty.title')
        }
        emptyDescription={
          hasFilters
            ? t('products.empty.filteredDescription')
            : t('products.empty.description')
        }
        emptyAction={
          hasFilters ? (
            <Button onClick={onClearFilters}>{t('common.clearFilters')}</Button>
          ) : canManageProducts ? (
            <Button
              type="primary"
              onClick={() => {
                onSelectProduct(null);
                onSetDrawerOpen(true);
              }}
            >
              {t('products.action.new')}
            </Button>
          ) : null
        }
        onRetry={onRetry}
      >
        <Table
          rowKey="id"
          scroll={{ x: 1260 }}
          dataSource={filteredProducts}
          rowClassName={(record) => (showInventory && record.isLowStock ? styles.lowStockRow : '')}
          onRow={(record) => ({
            onDoubleClick: canManageProducts ? () => openEditor(record) : undefined,
          })}
          columns={[
            {
              title: t('products.column.product'),
              fixed: 'left',
              width: 320,
              ellipsis: true,
              render: (_, record) => (
                <div className={styles.productCell}>
                  <Avatar shape="square">{record.name.slice(0, 2).toUpperCase()}</Avatar>
                  <div>
                    <Typography.Text strong>{record.name}</Typography.Text>
                    <Typography.Text type="secondary">
                      {record.barcode || t('products.noBarcode')}
                    </Typography.Text>
                  </div>
                </div>
              ),
            },
            {
              title: t('products.column.sku'),
              dataIndex: 'sku',
              width: 170,
              render: (value) => <span className={styles.sku}>{value}</span>,
            },
            ...(showFinancials ? [{
              title: t('products.column.costPrice'),
              dataIndex: 'costPrice',
              align: 'right' as const,
              width: 160,
              render: (value: string | number | null) => (
                <span className={styles.money}>{formatCurrency(value)}</span>
              ),
            }] : []),
            {
              title: t('products.column.sellingPrice'),
              dataIndex: 'sellingPrice',
              align: 'right',
              width: 170,
              render: (value) => (
                <span className={styles.money}>{formatCurrency(value)}</span>
              ),
            },
            ...(showFinancials ? [{
              title: t('products.column.margin'),
              width: 110,
              align: 'right' as const,
              render: (_: unknown, record: ProductRow) => {
                const sellingPrice = toNumber(record.sellingPrice);
                const margin =
                  sellingPrice > 0
                    ? ((sellingPrice - toNumber(record.costPrice)) / sellingPrice) * 100
                    : 0;

                return <span className={styles.money}>{margin.toFixed(1)}%</span>;
              },
            }] : []),
            ...(showInventory ? [{
              title: t('products.column.stockHealth'),
              width: 210,
              render: (_: unknown, record: ProductRow) => {
                const stockPercent =
                  record.minStock > 0
                    ? Math.min(Math.round((record.stock / record.minStock) * 100), 100)
                    : 100;

                return (
                  <div className={styles.stockCell}>
                    <div>
                      <strong>{record.stock}</strong>
                      <span> / {t('products.minStockShort', { count: record.minStock })}</span>
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
            }] : []),
            {
              title: t('common.status'),
              width: 150,
              render: (_, record) => (
                <ProductStatusTag isLowStock={showInventory && record.isLowStock} active={record.active} />
              ),
            },
            {
              title: t('common.actions'),
              fixed: 'right',
              width: 96,
              render: (_, record) => (canManageProducts ? (
                <Space size={4} className={styles.rowActions}>
                  <Tooltip title={t('products.action.edit')}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      aria-label={t('products.action.editAria', { name: record.name })}
                      onClick={() => openEditor(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title={t('products.delete.title')}
                    description={t('products.delete.description')}
                    okText={t('common.delete')}
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDeleteProduct(record.id)}
                  >
                    <Tooltip title={t('products.action.delete')}>
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        loading={deletingProductId === record.id}
                        aria-label={t('products.action.deleteAria', { name: record.name })}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              ) : null),
            },
          ]}
        />
      </QueryState>
    </Card>
  );
}