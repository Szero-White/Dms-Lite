import { Card, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { formatDateTime } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { InventoryTransaction } from '../../../types/inventory.types';
import styles from '../InventoryPage.module.css';

interface InventoryHistoryTableProps {
  history: InventoryTransaction[];
  products: ProductRow[];
}

const historyColumns = (products: ProductRow[]): TableColumnsType<InventoryTransaction> => [
  {
    title: 'Time',
    dataIndex: 'createdAt',
    render: (value) => formatDateTime(value),
  },
  {
    title: 'Product',
    dataIndex: 'productId',
    render: (productId) =>
      products.find((product) => product.id === productId)?.name || `#${productId}`,
  },
  { title: 'Source', dataIndex: 'sourceType' },
  {
    title: 'Direction',
    dataIndex: 'direction',
    render: (value) => (
      <Tag
        className={`${styles.movementTag} ${
          value === 'IN' ? styles.movementIn : styles.movementOut
        }`}
      >
        {value}
      </Tag>
    ),
  },
  { title: 'Qty', dataIndex: 'quantity' },
  { title: 'Before', dataIndex: 'beforeQuantity' },
  { title: 'After', dataIndex: 'afterQuantity' },
  { title: 'Note', dataIndex: 'note' },
];

export function InventoryHistoryTable({
  history,
  products,
}: InventoryHistoryTableProps) {
  return (
    <Card className={`panel-card ${styles.historyCard}`} title="Inventory History">
      <Table
        rowKey="id"
        sticky
        scroll={{ x: 1000 }}
        locale={{ emptyText: 'No inventory movements recorded yet' }}
        dataSource={history}
        columns={historyColumns(products)}
      />
    </Card>
  );
}
