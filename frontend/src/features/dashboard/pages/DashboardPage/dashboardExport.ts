import type { TFunction } from 'i18next';
import { buildExcelFriendlyCsv, type CsvRow } from '../../../../lib/csvExport';
import { formatDateTime, toNumber } from '../../../../lib/format';
import type { ExcelSheetData } from '../../../../lib/xlsxExport';
import type { SalesReportOrder } from '../../../reports/types/salesReport.types';
import type { DashboardRange } from './dashboardPage.types';

interface DashboardExportContext {
  orders: SalesReportOrder[];
  range: DashboardRange;
  t: TFunction;
}

export function buildDashboardExportFilename(range: DashboardRange, extension: 'csv' | 'xlsx') {
  return `dms-dashboard-${range.toLowerCase()}.${extension}`;
}

function customerName(order: SalesReportOrder, t: TFunction) {
  return order.customerName || t('dashboard.attention.customerFallback', { id: order.customerId });
}

function buildDashboardExportRows({ orders, t }: DashboardExportContext): CsvRow[] {
  return [
    [
      t('dashboard.export.orderCode'),
      t('reports.table.status'),
      t('reports.table.customer'),
      t('reports.table.orderTotal'),
      t('reports.table.collected'),
      t('reports.table.remainingDebt'),
      t('reports.table.reportDate'),
    ],
    ...orders.map((order) => [
      order.code,
      t(`status.sales.${order.status}`, order.status),
      customerName(order, t),
      toNumber(order.totalAmount),
      order.receivableRecognized ? toNumber(order.collectedAmount) : '',
      order.receivableRecognized ? toNumber(order.remainingReceivable) : '',
      formatDateTime(order.reportDate),
    ]),
  ];
}

export function buildDashboardExportCsv(context: DashboardExportContext) {
  return buildExcelFriendlyCsv(buildDashboardExportRows(context));
}

export function buildDashboardExportSheet(context: DashboardExportContext): ExcelSheetData {
  const { orders, t } = context;

  return {
    name: t('dashboard.title'),
    title: t('dashboard.title'),
    subtitle: t('reports.export.generatedAt', { time: formatDateTime(new Date().toISOString()) }),
    columns: [
      { header: t('dashboard.export.orderCode'), width: 18 },
      { header: t('reports.table.status'), width: 18, type: 'status' },
      { header: t('reports.table.customer'), width: 28 },
      { header: t('reports.table.orderTotal'), width: 16, type: 'currency' },
      { header: t('reports.table.collected'), width: 16, type: 'currency' },
      { header: t('reports.table.remainingDebt'), width: 18, type: 'currency' },
      { header: t('reports.table.reportDate'), width: 22, type: 'date' },
    ],
    rows: orders.map((order) => [
      order.code,
      t(`status.sales.${order.status}`, order.status),
      customerName(order, t),
      toNumber(order.totalAmount),
      order.receivableRecognized ? toNumber(order.collectedAmount) : '',
      order.receivableRecognized ? toNumber(order.remainingReceivable) : '',
      new Date(order.reportDate),
    ]),
  };
}
