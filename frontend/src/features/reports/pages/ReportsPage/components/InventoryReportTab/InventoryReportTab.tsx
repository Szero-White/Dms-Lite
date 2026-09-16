import { BarChartOutlined, DollarOutlined, InboxOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Table } from 'antd';
import { useTranslation } from 'react-i18next';
import { uiPalette } from '../../../../../../styles/palette';
import { ProductStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, formatNumber, toNumber } from '../../../../../../lib/format';
import {
  compareBoolean,
  compareNumber,
  compareText,
  TABLE_SORT_DIRECTIONS,
  TABLE_SORTER_TOOLTIP,
} from '../../../../../../lib/tableSorting';
import type { ProductRow } from '../../../../../products';
import { InventoryStockChart } from '../../../../components';
import { ReportStatStrip } from '../ReportStatStrip';
import styles from '../../ReportsPage.module.css';

interface InventoryReportTabProps {
  inventoryValue: number;
  lowStockCount: number;
  products: ProductRow[];
  totalUnits: number;
}

export function InventoryReportTab({
  inventoryValue,
  lowStockCount,
  products,
  totalUnits,
}: InventoryReportTabProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.tabContent}>
      <ReportStatStrip items={[
        { icon: <InboxOutlined />, label: t('reports.metric.trackedSkus'), value: products.length, color: uiPalette.brand.primary },
        { icon: <BarChartOutlined />, label: t('reports.metric.totalUnits'), value: formatNumber(totalUnits), color: uiPalette.brand.primary },
        { icon: <DollarOutlined />, label: t('reports.metric.inventoryValue'), value: formatCurrency(inventoryValue), color: uiPalette.brand.primary },
        { icon: <WarningOutlined />, label: t('reports.metric.lowStock'), value: lowStockCount, color: lowStockCount > 0 ? uiPalette.semantic.warning : uiPalette.semantic.success },
      ]} />

      <InventoryStockChart products={products} />

      <Card title={t('reports.title')} className="panel-card analysis-surface">
        <Table
          rowKey="id"
          size="small"
          scroll={{ x: 820 }}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={TABLE_SORTER_TOOLTIP}
          dataSource={products}
          locale={{ emptyText: t('reports.empty.noInventory') }}
          columns={[
            { title: t('reports.table.sku'), dataIndex: 'sku', sorter: (first, second) => compareText(first.sku, second.sku) },
            { title: t('reports.table.product'), dataIndex: 'name', sorter: (first, second) => compareText(first.name, second.name) },
            { title: t('reports.table.onHand'), dataIndex: 'stock', align: 'right', sorter: (first, second) => compareNumber(first.stock, second.stock) },
            { title: t('reports.table.minimum'), dataIndex: 'minStock', align: 'right', sorter: (first, second) => compareNumber(first.minStock, second.minStock) },
            { title: t('reports.table.costValue'), align: 'right', sorter: (first, second) => compareNumber(toNumber(first.costPrice) * toNumber(first.stock), toNumber(second.costPrice) * toNumber(second.stock)), render: (_, record) => formatCurrency(toNumber(record.costPrice) * toNumber(record.stock)) },
            { title: t('reports.table.status'), sorter: (first, second) => compareBoolean(first.isLowStock, second.isLowStock) || compareBoolean(first.active, second.active), render: (_, record) => <ProductStatusTag active={record.active} isLowStock={record.isLowStock} /> },
          ]}
        />
      </Card>
    </div>
  );
}
