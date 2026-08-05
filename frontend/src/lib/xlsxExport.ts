export type ExcelCell = string | number | boolean | Date | null | undefined;

export type ExcelColumnType = 'text' | 'number' | 'currency' | 'date' | 'status';

export interface ExcelColumn {
  header: string;
  width?: number;
  type?: ExcelColumnType;
}

export interface ExcelSheetData {
  name: string;
  title: string;
  subtitle?: string;
  columns: ExcelColumn[];
  rows: ExcelCell[][];
}

type WriteExcelFileModule = typeof import('write-excel-file/browser');
type SheetData = import('write-excel-file/browser').SheetData;
type Sheet = import('write-excel-file/browser').Sheet<Blob>;
type Cell = import('write-excel-file/browser').Cell;

const CURRENCY_FORMAT = '#,##0';
const DATE_FORMAT = 'dd/mm/yyyy hh:mm';

function sheetName(name: string) {
  return name.replace(/[\\/*?:[\]]/g, ' ').slice(0, 31) || 'Report';
}

function toCellValue(value: ExcelCell, type: ExcelColumnType = 'text'): Cell {
  if (value == null || value === '') {
    return null;
  }

  if (type === 'currency' || type === 'number') {
    return {
      value: Number(value) || 0,
      type: Number,
      format: type === 'currency' ? CURRENCY_FORMAT : undefined,
      align: 'right',
    };
  }

  if (type === 'date') {
    const date = value instanceof Date ? value : new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return {
      value: date,
      type: Date,
      format: DATE_FORMAT,
    };
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value);
}

function titleRow(sheet: ExcelSheetData): Cell[] {
  return [
    {
      value: sheet.title,
      fontWeight: 'bold',
      fontSize: 16,
      textColor: '#111827',
      columnSpan: Math.max(sheet.columns.length, 1),
    },
  ];
}

function subtitleRow(sheet: ExcelSheetData): Cell[] {
  return [
    {
      value: sheet.subtitle ?? '',
      textColor: '#64748b',
      columnSpan: Math.max(sheet.columns.length, 1),
    },
  ];
}

function headerRow(sheet: ExcelSheetData): Cell[] {
  return sheet.columns.map((column) => ({
    value: column.header,
    fontWeight: 'bold',
    textColor: '#475569',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderStyle: 'thin',
    align: column.type === 'currency' || column.type === 'number' ? 'right' : 'left',
  }));
}

function dataRows(sheet: ExcelSheetData): Cell[][] {
  return sheet.rows.map((row) => sheet.columns.map((column, columnIndex) =>
    toCellValue(row[columnIndex], column.type),
  ));
}

function toSheetData(sheet: ExcelSheetData): SheetData {
  return [
    titleRow(sheet),
    subtitleRow(sheet),
    [],
    headerRow(sheet),
    ...dataRows(sheet),
  ];
}

function toWorkbookSheet(sheet: ExcelSheetData): Sheet {
  return {
    sheet: sheetName(sheet.name),
    data: toSheetData(sheet),
    columns: sheet.columns.map((column) => ({ width: column.width ?? 18 })),
    stickyRowsCount: 4,
  };
}

export async function downloadXlsx(filename: string, sheets: ExcelSheetData[]) {
  const { default: writeExcelFile } = await import('write-excel-file/browser') as WriteExcelFileModule;
  await writeExcelFile(sheets.map(toWorkbookSheet)).toFile(filename);
}
