import type { TFunction } from 'i18next';
import { downloadCsvRows, type CsvRow } from '../../../../lib/csvExport';
import { formatDateTime, toNumber } from '../../../../lib/format';
import { downloadXlsx, type ExcelSheetData } from '../../../../lib/xlsxExport';
import type { Customer } from '../../../customers';
import type { ProductRow } from '../../../products';
import type { SalesReportOrder } from '../../types/salesReport.types';

export type ReportTab = 'sales' | 'inventory' | 'receivables';
export type ReportExportFormat = 'csv' | 'xlsx';

interface ReportExportContext {
  activeTab: ReportTab;
  customers: Customer[];
  salesOrders: SalesReportOrder[];
  products: ProductRow[];
  t: TFunction;
}

function exportFilename(activeTab: ReportTab, extension: ReportExportFormat) {
  return `dms-${activeTab}-report.${extension}`;
}

function generatedAtText(t: TFunction) {
  return t('reports.export.generatedAt', { time: formatDateTime(new Date().toISOString()) });
}

function buildSalesRows({ salesOrders, t }: ReportExportContext): CsvRow[] {
  return [
    [
      t('reports.table.order'),
      t('reports.table.reportDate'),
      t('reports.table.status'),
      t('reports.table.total'),
      t('reports.table.collected'),
      t('reports.table.remainingDebt'),
    ],
    ...salesOrders.map((order) => [
      order.code,
      formatDateTime(order.reportDate),
      t(`status.sales.${order.status}`),
      toNumber(order.totalAmount),
      order.receivableRecognized ? toNumber(order.collectedAmount) : '',
      order.receivableRecognized ? toNumber(order.remainingReceivable) : '',
    ]),
  ];
}

function buildInventoryRows({ products, t }: ReportExportContext): CsvRow[] {
  return [
    [
      t('reports.table.sku'),
      t('reports.table.product'),
      t('reports.table.onHand'),
      t('reports.table.minimum'),
      t('reports.table.costPrice'),
      t('reports.table.status'),
    ],
    ...products.map((product) => [
      product.sku,
      product.name,
      product.stock,
      product.minStock,
      toNumber(product.costPrice),
      product.isLowStock ? t('status.product.lowStock') : t('inventory.status.healthy'),
    ]),
  ];
}

function buildReceivablesRows({ customers, t }: ReportExportContext): CsvRow[] {
  return [
    [
      t('reports.table.customer'),
      t('reports.table.phone'),
      t('reports.table.debtBalance'),
      t('reports.table.creditLimit'),
      t('reports.table.paymentTermDays'),
    ],
    ...customers.map((customer) => [
      customer.name,
      customer.phone ?? '',
      toNumber(customer.debtBalance),
      toNumber(customer.creditLimit),
      customer.paymentTermDays,
    ]),
  ];
}

function buildReportRows(context: ReportExportContext): CsvRow[] {
  if (context.activeTab === 'sales') {
    return buildSalesRows(context);
  }

  if (context.activeTab === 'inventory') {
    return buildInventoryRows(context);
  }

  return buildReceivablesRows(context);
}

function buildSalesSheet(context: ReportExportContext): ExcelSheetData {
  const { salesOrders, t } = context;

  return {
    name: t('reports.tabs.sales'),
    title: t('reports.export.salesTitle'),
    subtitle: generatedAtText(t),
    columns: [
      { header: t('reports.table.order'), width: 18 },
      { header: t('reports.table.reportDate'), width: 22, type: 'date' },
      { header: t('reports.table.status'), width: 18, type: 'status' },
      { header: t('reports.table.total'), width: 16, type: 'currency' },
      { header: t('reports.table.collected'), width: 16, type: 'currency' },
      { header: t('reports.table.remainingDebt'), width: 18, type: 'currency' },
    ],
    rows: salesOrders.map((order) => [
      order.code,
      new Date(order.reportDate),
      t(`status.sales.${order.status}`),
      toNumber(order.totalAmount),
      order.receivableRecognized ? toNumber(order.collectedAmount) : '',
      order.receivableRecognized ? toNumber(order.remainingReceivable) : '',
    ]),
  };
}

function buildInventorySheet(context: ReportExportContext): ExcelSheetData {
  const { products, t } = context;

  return {
    name: t('reports.tabs.inventory'),
    title: t('reports.export.inventoryTitle'),
    subtitle: generatedAtText(t),
    columns: [
      { header: t('reports.table.sku'), width: 16 },
      { header: t('reports.table.product'), width: 34 },
      { header: t('reports.table.onHand'), width: 14, type: 'number' },
      { header: t('reports.table.minimum'), width: 14, type: 'number' },
      { header: t('reports.table.costPrice'), width: 16, type: 'currency' },
      { header: t('reports.table.status'), width: 18, type: 'status' },
    ],
    rows: products.map((product) => [
      product.sku,
      product.name,
      product.stock,
      product.minStock,
      toNumber(product.costPrice),
      product.isLowStock ? t('status.product.lowStock') : t('inventory.status.healthy'),
    ]),
  };
}

function buildReceivablesSheet(context: ReportExportContext): ExcelSheetData {
  const { customers, t } = context;

  return {
    name: t('reports.tabs.receivables'),
    title: t('reports.export.receivablesTitle'),
    subtitle: generatedAtText(t),
    columns: [
      { header: t('reports.table.customer'), width: 32 },
      { header: t('reports.table.phone'), width: 18 },
      { header: t('reports.table.debtBalance'), width: 18, type: 'currency' },
      { header: t('reports.table.creditLimit'), width: 18, type: 'currency' },
      { header: t('reports.table.paymentTermDays'), width: 18, type: 'number' },
    ],
    rows: customers.map((customer) => [
      customer.name,
      customer.phone ?? '',
      toNumber(customer.debtBalance),
      toNumber(customer.creditLimit),
      customer.paymentTermDays,
    ]),
  };
}

function buildReportSheet(context: ReportExportContext): ExcelSheetData {
  if (context.activeTab === 'sales') {
    return buildSalesSheet(context);
  }

  if (context.activeTab === 'inventory') {
    return buildInventorySheet(context);
  }

  return buildReceivablesSheet(context);
}

export async function exportReport(format: ReportExportFormat, context: ReportExportContext) {
  if (format === 'csv') {
    downloadCsvRows(exportFilename(context.activeTab, 'csv'), buildReportRows(context));
    return;
  }

  await downloadXlsx(exportFilename(context.activeTab, 'xlsx'), [buildReportSheet(context)]);
}
