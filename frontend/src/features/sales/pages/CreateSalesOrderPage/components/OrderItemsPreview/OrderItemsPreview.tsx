import { Card, Table } from 'antd';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, toNumber } from '../../../../../../lib/format';
import {
  compareNumber,
  compareText,
  TABLE_SORT_DIRECTIONS,
  TABLE_SORTER_TOOLTIP,
} from '../../../../../../lib/tableSorting';
import type { ProductRow } from '../../../../../products';
import type { OrderItemDraft } from '../OrderItemsEditor';

interface OrderItemsPreviewProps {
  getAvailableStockForLine: (productId: number | undefined, lineIndex: number) => number;
  items: OrderItemDraft[];
  products: ProductRow[];
}

type OrderItemPreviewRow = OrderItemDraft & {
  lineIndex: number;
};

export function OrderItemsPreview({
  getAvailableStockForLine,
  items,
  products,
}: OrderItemsPreviewProps) {
  const { t } = useTranslation();
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const previewRows = useMemo<OrderItemPreviewRow[]>(
    () => items.map((item, lineIndex) => ({ ...item, lineIndex })),
    [items],
  );

  return (
    <Card className="panel-card" title={t('sales.create.title')}>
      <Table
        size="small"
        pagination={false}
        rowKey={(row) => `${row.productId || 'row'}-${row.lineIndex}`}
        dataSource={previewRows}
        sortDirections={TABLE_SORT_DIRECTIONS}
        showSorterTooltip={TABLE_SORTER_TOOLTIP}
        columns={[
          {
            title: t('inventory.column.product'),
            sorter: (first, second) => compareText(
              productMap.get(first.productId ?? -1)?.name,
              productMap.get(second.productId ?? -1)?.name,
            ),
            render: (_, record) => productMap.get(record.productId ?? -1)?.name || '--',
          },
          {
            title: t('inventory.history.qty'),
            dataIndex: 'quantity',
            sorter: (first, second) => compareNumber(first.quantity, second.quantity),
          },
          {
            title: t('sales.create.availableStock'),
            sorter: (first, second) => compareNumber(
              getAvailableStockForLine(first.productId, first.lineIndex),
              getAvailableStockForLine(second.productId, second.lineIndex),
            ),
            render: (_, record) => (
              record.productId
                ? getAvailableStockForLine(record.productId, record.lineIndex)
                : '--'
            ),
          },
          {
            title: t('sales.drawer.lineTotal'),
            sorter: (first, second) => {
              const firstProduct = productMap.get(first.productId ?? -1);
              const secondProduct = productMap.get(second.productId ?? -1);
              const firstTotal = toNumber(firstProduct?.sellingPrice) * Number(first.quantity || 0)
                - Number(first.discountAmount || 0);
              const secondTotal = toNumber(secondProduct?.sellingPrice) * Number(second.quantity || 0)
                - Number(second.discountAmount || 0);
              return compareNumber(firstTotal, secondTotal);
            },
            render: (_, record) => {
              const product = productMap.get(record.productId ?? -1);
              const total =
                toNumber(product?.sellingPrice) * Number(record.quantity || 0)
                - Number(record.discountAmount || 0);

              return formatCurrency(total);
            },
          },
        ]}
      />
    </Card>
  );
}
