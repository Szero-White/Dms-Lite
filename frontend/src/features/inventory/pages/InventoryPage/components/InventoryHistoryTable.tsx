import { Card, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { inventoryDirectionLabel, inventoryNoteLabel, inventorySourceLabel } from '../../../../../lib/businessDisplay';
import { formatDateTime } from '../../../../../lib/format';
import { compareDate, compareNumber, compareText, TABLE_SORT_DIRECTIONS } from '../../../../../lib/tableSorting';
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
    defaultSortOrder: 'descend',
    sorter: (first, second) => compareDate(first.createdAt, second.createdAt),
    render: (value) => formatDateTime(value),
  },
  {
    title: t('inventory.column.product'),
    dataIndex: 'productId',
    sorter: (first, second) => compareText(
      products.find((product) => product.id === first.productId)?.name,
      products.find((product) => product.id === second.productId)?.name,
    ),
    render: (productId) =>
      products.find((product) => product.id === productId)?.name || '--',
  },
  {
    title: t('inventory.history.source'),
    dataIndex: 'sourceType',
    sorter: (first, second) => compareText(first.sourceType, second.sourceType),
    render: (value: string) => inventorySourceLabel(value, t),
  },
  {
    title: t('inventory.history.direction'),
    dataIndex: 'direction',
    sorter: (first, second) => compareText(first.direction, second.direction),
    render: (value) => (
      <Tag
        className={`${styles.movementTag} ${
          value === 'IN' ? styles.movementIn : styles.movementOut
        }`}
      >
        {inventoryDirectionLabel(value, t)}
      </Tag>
    ),
  },
  { title: t('inventory.history.qty'), dataIndex: 'quantity', sorter: (first, second) => compareNumber(first.quantity, second.quantity) },
  { title: t('inventory.history.before'), dataIndex: 'beforeQuantity', sorter: (first, second) => compareNumber(first.beforeQuantity, second.beforeQuantity) },
  { title: t('inventory.history.after'), dataIndex: 'afterQuantity', sorter: (first, second) => compareNumber(first.afterQuantity, second.afterQuantity) },
  {
    title: t('inventory.history.note'),
    dataIndex: 'note',
    sorter: (first, second) => compareText(inventoryNoteLabel(first, t), inventoryNoteLabel(second, t)),
    render: (_, record) => inventoryNoteLabel(record, t),
  },
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
        scroll={{ x: 1000 }}
        sortDirections={TABLE_SORT_DIRECTIONS}
        showSorterTooltip={false}
        locale={{ emptyText: t('inventory.history.empty') }}
        dataSource={history}
        columns={historyColumns(products, t)}
      />
    </Card>
  );
}