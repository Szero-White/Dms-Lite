import type { TFunction } from 'i18next';
import { buildExcelFriendlyCsv, type CsvRow } from '../../../../lib/csvExport';
import { formatDateTime, toNumber } from '../../../../lib/format';
import type { ExcelSheetData } from '../../../../lib/xlsxExport';
import type { SalesOrder } from '../../../sales';
import type { DashboardRange } from './dashboardPage.types';

interface DashboardExportContext {
  customersMap: Map<number, string>;
  filteredOrders: SalesOrder[];
  range: DashboardRange;
  t: TFunction;
}

export function buildDashboardExportFilename(range: DashboardRange, extension: 'csv' | 'xlsx') {
  return `dms-dashboard-${range.toLowerCase()}.${extension}`;
}

function buildDashboardExportRows({ customersMap, filteredOrders, t }: DashboardExportContext): CsvRow[] {
  return [
    [
      t('dashboard.export.orderCode'),
      t('reports.table.status'),
      t('reports.table.customer'),
      t('reports.table.total'),
      t('reports.table.paid'),
      t('reports.table.debt'),
      t('reports.table.createdAt'),
    ],
    ...filteredOrders.map((order) => [
      order.code,
      t(`status.sales.${order.status}`, order.status),
      customersMap.get(order.customerId) || t('dashboard.attention.customerFallback', { id: order.customerId }),
      toNumber(order.totalAmount),
      toNumber(order.paidAmount),
      toNumber(order.debtAmount),
      formatDateTime(order.createdAt),
    ]),
  ];
}

export function buildDashboardExportCsv(context: DashboardExportContext) {
  return buildExcelFriendlyCsv(buildDashboardExportRows(context));
}

export function buildDashboardExportSheet(context: DashboardExportContext): ExcelSheetData {
  const { filteredOrders, t } = context;

  return {
    name: t('dashboard.title'),
    title: t('dashboard.title'),
    subtitle: t('reports.export.generatedAt', { time: formatDateTime(new Date().toISOString()) }),
    columns: [
      { header: t('dashboard.export.orderCode'), width: 18 },
      { header: t('reports.table.status'), width: 18, type: 'status' },
      { header: t('reports.table.customer'), width: 28 },
      { header: t('reports.table.total'), width: 16, type: 'currency' },
      { header: t('reports.table.paid'), width: 16, type: 'currency' },
      { header: t('reports.table.debt'), width: 16, type: 'currency' },
      { header: t('reports.table.createdAt'), width: 22, type: 'date' },
    ],
    rows: filteredOrders.map((order) => [
      order.code,
      t(`status.sales.${order.status}`, order.status),
      context.customersMap.get(order.customerId) || t('dashboard.attention.customerFallback', { id: order.customerId }),
      toNumber(order.totalAmount),
      toNumber(order.paidAmount),
      toNumber(order.debtAmount),
      new Date(order.createdAt),
    ]),
  };
}
