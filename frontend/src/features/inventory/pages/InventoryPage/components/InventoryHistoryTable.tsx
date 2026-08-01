import { Card, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { InventoryTransaction } from '../../../types/inventory.types';
import styles from './InventoryHistoryTable.module.css';

interface InventoryHistoryTableProps {
  history: InventoryTransaction[];
  products: ProductRow[];
}

const historyColumns = (
  products: ProductRow[],
  t: TFunction,
): TableColumnsType<InventoryTransaction> => [
  {
    title: t('common.time'),
    dataIndex: 'createdAt',
    render: (value) => formatDateTime(value),
  },
  {
    title: t('inventory.column.product'),
    dataIndex: 'productId',
    render: (productId) =>
      products.find((product) => product.id === productId)?.name || `#${productId}`,
  },
  { title: t('inventory.history.source'), dataIndex: 'sourceType' },
  {
    title: t('inventory.history.direction'),
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
  { title: t('inventory.history.qty'), dataIndex: 'quantity' },
  { title: t('inventory.history.before'), dataIndex: 'beforeQuantity' },
  { title: t('inventory.history.after'), dataIndex: 'afterQuantity' },
  { title: t('inventory.history.note'), dataIndex: 'note' },
];

export function InventoryHistoryTable({
  history,
  products,
}: InventoryHistoryTableProps) {
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.historyCard}`} title={t('inventory.history.title')}>
      <Table
        rowKey="id"
        sticky
        scroll={{ x: 1000 }}
        locale={{ emptyText: t('inventory.history.empty') }}
        dataSource={history}
        columns={historyColumns(products, t)}
      />
    </Card>
  );
}