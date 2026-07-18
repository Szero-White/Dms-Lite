import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Progress, Select, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { formatDateTime, toNumber } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { StockFilter } from '../inventoryPage.types';
import styles from '../InventoryPage.module.css';

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
): TableColumnsType<ProductRow> => [
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
  return (
    <Card className={`panel-card ${styles.stockCard}`} title="Stock by Product">
      <div className={styles.toolbar}>
        <Input
          allowClear
          className={styles.search}
          prefix={<SearchOutlined />}
          placeholder="Search product, SKU, barcode"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
        />
        <Select
          className={styles.filter}
          value={stockFilter}
          onChange={onStockFilterChange}
          options={[
            { value: 'ALL', label: 'All stock states' },
            { value: 'HEALTHY', label: 'Healthy stock' },
            { value: 'LOW', label: 'Low stock' },
          ]}
        />
        <Button disabled={!hasFilters} onClick={clearFilters}>
          Clear
        </Button>
      </div>
      <Table
        rowKey="id"
        sticky
        scroll={{ x: 820 }}
        locale={{
          emptyText: hasFilters ? 'No inventory matches these filters' : 'No stock data',
        }}
        dataSource={filteredProducts}
        pagination={false}
        rowClassName={(record) => (record.isLowStock ? styles.lowStockRow : '')}
        columns={stockColumns(latestMovementByProduct)}
      />
    </Card>
  );
}
