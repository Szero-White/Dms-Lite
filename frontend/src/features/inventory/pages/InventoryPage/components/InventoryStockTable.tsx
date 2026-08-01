import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Progress, Select, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { formatDateTime, toNumber } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { StockFilter } from '../inventoryPage.types';
import styles from './InventoryStockTable.module.css';
import tagStyles from '../inventoryTags.module.css';

interface InventoryStockTableProps {
  clearFilters: () => void;
  filteredProducts: ProductRow[];
  hasFilters: boolean;
  keyword: string;
  latestMovementByProduct: Map<number, string>;
  onKeywordChange: (value: string) => void;
  onStockFilterChange: (value: StockFilter) => void;
  stockFilter: StockFilter;
}

const stockColumns = (
  latestMovementByProduct: Map<number, string>,
  t: TFunction,
): TableColumnsType<ProductRow> => [
  { title: t('inventory.column.sku'), dataIndex: 'sku', width: 120 },
  { title: t('inventory.column.product'), dataIndex: 'name', width: 220 },
  {
    title: t('inventory.column.onHand'),
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
  { title: t('inventory.column.minimum'), dataIndex: 'minStock', width: 100 },
  {
    title: t('inventory.column.lastMovement'),
    width: 170,
    render: (_, record) => {
      const lastMovement = latestMovementByProduct.get(record.id);

      return lastMovement ? formatDateTime(lastMovement) : '--';
    },
  },
  {
    title: t('common.status'),
    width: 120,
    render: (_, record) => (
      <Tag
        className={`${tagStyles.stockTag} ${
          record.isLowStock ? tagStyles.lowStock : tagStyles.healthy
        }`}
      >
        {record.isLowStock ? t('status.product.lowStock') : t('inventory.status.healthy')}
      </Tag>
    ),
  },
];

export function InventoryStockTable({
  clearFilters,
  filteredProducts,
  hasFilters,
  keyword,
  latestMovementByProduct,
  onKeywordChange,
  onStockFilterChange,
  stockFilter,
}: InventoryStockTableProps) {
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.stockCard}`} title={t('inventory.stock.title')}>
      <div className={styles.toolbar}>
        <Input
          allowClear
          className={styles.search}
          prefix={<SearchOutlined />}
          placeholder={t('inventory.stock.searchPlaceholder')}
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <Select
          className={styles.filter}
          value={stockFilter}
          onChange={onStockFilterChange}
          options={[
            { value: 'ALL', label: t('inventory.stock.allStates') },
            { value: 'HEALTHY', label: t('products.filters.healthyStock') },
            { value: 'LOW', label: t('status.product.lowStock') },
          ]}
        />
        <Button disabled={!hasFilters} onClick={clearFilters}>
          {t('common.clearFilters')}
        </Button>
      </div>
      <Table
        rowKey="id"
        className={styles.stockTable}
        sticky
        scroll={{ x: 820, y: 520 }}
        locale={{
          emptyText: hasFilters
            ? t('inventory.stock.noFiltered')
            : t('inventory.stock.noData'),
        }}
        dataSource={filteredProducts}
        pagination={false}
        rowClassName={(record) => (record.isLowStock ? styles.lowStockRow : '')}
        columns={stockColumns(latestMovementByProduct, t)}
      />
    </Card>
  );
}