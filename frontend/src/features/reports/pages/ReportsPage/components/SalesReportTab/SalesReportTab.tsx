import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EyeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, Progress, Table, Tag, Tooltip } from 'antd';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { uiPalette } from '../../../../../../styles/palette';
import { TableMultiSelectFilter } from '../../../../../../components/common/TableMultiSelectFilter';
import { SalesOrderStatusTag } from '../../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime } from '../../../../../../lib/format';
import {
  compareDate,
  compareNumber,
  compareText,
  TABLE_SORT_DIRECTIONS,
  TABLE_SORTER_TOOLTIP,
} from '../../../../../../lib/tableSorting';
import { OrderStatusChart, RevenueByOrderChart } from '../../../../components';
import type { SalesReportOrder } from '../../../../types/salesReport.types';
import type { SalesOrderStatus } from '../../../../../sales';
import { ReportStatStrip } from '../ReportStatStrip';
import styles from '../../ReportsPage.module.css';

export type CollectionFilter = 'UNPAID' | 'PARTIAL' | 'PAID';

interface ReportCustomerOption {
  id: number;
  name: string;
}

interface SalesReportTabProps {
  averageOrderValue: number;
  collectionFilters: CollectionFilter[];
  completedCount: number;
  filteredOrders: SalesReportOrder[];
  hasFilters: boolean;
  onSelectOrder: (order: SalesReportOrder) => void;
  reportCustomers: ReportCustomerOption[];
  reportOrders: SalesReportOrder[];
  salesCustomers: number[];
  salesKeyword: string;
  salesOrderCount: number;
  salesRevenue: number;
  salesStatuses: SalesOrderStatus[];
  setCollectionFilters: Dispatch<SetStateAction<CollectionFilter[]>>;
  setSalesCustomers: Dispatch<SetStateAction<number[]>>;
  setSalesKeyword: Dispatch<SetStateAction<string>>;
  setSalesStatuses: Dispatch<SetStateAction<SalesOrderStatus[]>>;
}

export function SalesReportTab({
  averageOrderValue,
  collectionFilters,
  completedCount,
  filteredOrders,
  hasFilters,
  onSelectOrder,
  reportCustomers,
  reportOrders,
  salesCustomers,
  salesKeyword,
  salesOrderCount,
  salesRevenue,
  salesStatuses,
  setCollectionFilters,
  setSalesCustomers,
  setSalesKeyword,
  setSalesStatuses,
}: SalesReportTabProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.tabContent}>
      <ReportStatStrip items={[
        { icon: <DollarOutlined />, label: t('reports.metric.revenue'), value: formatCurrency(salesRevenue), color: uiPalette.brand.primary },
        { icon: <ShoppingCartOutlined />, label: t('reports.metric.orders'), value: salesOrderCount, color: uiPalette.brand.primary },
        { icon: <BarChartOutlined />, label: t('reports.metric.avgOrder'), value: formatCurrency(averageOrderValue), color: uiPalette.brand.primary },
        { icon: <CheckCircleOutlined />, label: t('reports.metric.completed'), value: completedCount, color: uiPalette.semantic.success },
      ]} />

      <div className={styles.chartGrid}>
        <RevenueByOrderChart orders={reportOrders} />
        <OrderStatusChart orders={reportOrders} />
      </div>

      <Card title={t('reports.title')} className="panel-card">
        <div className={styles.salesTableFilters}>
          <Input
            allowClear
            className={styles.salesSearch}
            prefix={<SearchOutlined />}
            placeholder={t('reports.filters.searchPlaceholder')}
            value={salesKeyword}
            onChange={(event) => setSalesKeyword(event.target.value)}
          />
          <TableMultiSelectFilter
            ariaLabel={t('reports.filters.allStatuses')}
            className={styles.salesFilter}
            value={salesStatuses}
            onChange={setSalesStatuses}
            placeholder={t('reports.filters.allStatuses')}
            options={[
              { value: 'DRAFT', label: t('status.sales.DRAFT') },
              { value: 'COMPLETED', label: t('status.sales.COMPLETED') },
              { value: 'CANCELLED', label: t('status.sales.CANCELLED') },
            ]}
          />
          <TableMultiSelectFilter
            ariaLabel={t('reports.filters.allCustomers')}
            className={styles.salesCustomerFilter}
            value={salesCustomers}
            onChange={setSalesCustomers}
            placeholder={t('reports.filters.allCustomers')}
            showSearch
            options={reportCustomers.map((customer) => ({
              value: customer.id,
              label: customer.name,
            }))}
          />
          <TableMultiSelectFilter
            ariaLabel={t('reports.filters.collectionStatus')}
            className={styles.salesFilter}
            value={collectionFilters}
            onChange={setCollectionFilters}
            placeholder={t('reports.filters.collectionStatus')}
            options={[
              { value: 'UNPAID', label: t('reports.filters.collectionUnpaid') },
              { value: 'PARTIAL', label: t('reports.filters.collectionPartial') },
              { value: 'PAID', label: t('reports.filters.collectionPaid') },
            ]}
          />
          <Button
            disabled={!hasFilters}
            onClick={() => {
              setSalesKeyword('');
              setSalesStatuses([]);
              setSalesCustomers([]);
              setCollectionFilters([]);
            }}
          >
            {t('common.clearFilters')}
          </Button>
        </div>

        {hasFilters ? (
          <div className={styles.salesFilterChips}>
            {salesKeyword ? (
              <Tag closable onClose={() => setSalesKeyword('')}>
                {t('reports.filters.searchChip', { keyword: salesKeyword })}
              </Tag>
            ) : null}
            {salesStatuses.map((status) => (
              <Tag
                key={status}
                closable
                onClose={() => setSalesStatuses((current) => current.filter((value) => value !== status))}
              >
                {t(`status.sales.${status}`)}
              </Tag>
            ))}
            {salesCustomers.map((customerId) => (
              <Tag
                key={customerId}
                closable
                onClose={() => setSalesCustomers((current) => current.filter((value) => value !== customerId))}
              >
                {reportCustomers.find((customer) => customer.id === customerId)?.name ?? customerId}
              </Tag>
            ))}
            {collectionFilters.map((filter) => (
              <Tag
                key={filter}
                closable
                onClose={() => setCollectionFilters((current) => current.filter((value) => value !== filter))}
              >
                {t(`reports.filters.collection.${filter}`)}
              </Tag>
            ))}
          </div>
        ) : null}

        <Table
          rowKey="id"
          size="small"
          scroll={{ x: 1180 }}
          sortDirections={TABLE_SORT_DIRECTIONS}
          showSorterTooltip={TABLE_SORTER_TOOLTIP}
          dataSource={filteredOrders}
          locale={{ emptyText: t('reports.empty.noSalesOrders') }}
          columns={[
            { title: t('reports.table.order'), dataIndex: 'code', width: 160, sorter: (first, second) => compareText(first.code, second.code) },
            {
              title: t('reports.table.customer'),
              width: 230,
              sorter: (first, second) => compareText(first.customerName, second.customerName),
              render: (_, order) => order.customerName ?? '--',
            },
            { title: t('reports.table.reportDate'), dataIndex: 'reportDate', width: 170, sorter: (first, second) => compareDate(first.reportDate, second.reportDate), render: (value) => formatDateTime(value) },
            { title: t('reports.table.status'), dataIndex: 'status', width: 130, sorter: (first, second) => compareText(first.status, second.status), render: (value) => <SalesOrderStatusTag status={value} /> },
            { title: t('reports.table.orderTotal'), dataIndex: 'totalAmount', width: 150, align: 'right', sorter: (first, second) => compareNumber(first.totalAmount, second.totalAmount), render: (value) => formatCurrency(value) },
            { title: t('reports.table.collected'), dataIndex: 'collectedAmount', width: 150, align: 'right', sorter: (first, second) => compareNumber(first.collectedAmount, second.collectedAmount), render: (value, order) => order.receivableRecognized ? formatCurrency(value) : t('reports.value.notApplicable') },
            { title: t('reports.table.remainingDebt'), dataIndex: 'remainingReceivable', width: 170, align: 'right', sorter: (first, second) => compareNumber(first.remainingReceivable, second.remainingReceivable), render: (value, order) => order.receivableRecognized ? formatCurrency(value) : t('reports.value.notRecognized') },
            {
              title: t('reports.table.collectionProgress'),
              width: 180,
              sorter: (first, second) => compareNumber(first.collectionProgress, second.collectionProgress),
              render: (_, order) => {
                if (!order.receivableRecognized || order.collectionProgress === null) {
                  return t('reports.value.notApplicable');
                }

                return (
                  <div className={styles.collectionProgress}>
                    <Progress percent={order.collectionProgress} size="small" showInfo={false} />
                    <span>{order.collectionProgress}%</span>
                  </div>
                );
              },
            },
            {
              title: '',
              width: 56,
              align: 'center',
              fixed: 'right',
              render: (_, order) => (
                <Tooltip title={t('reports.action.viewOrder')}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    aria-label={t('reports.action.viewOrder')}
                    onClick={() => onSelectOrder(order)}
                  />
                </Tooltip>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
