type CsvCell = string | number | boolean | null | undefined;

const TSV_DELIMITER = '\t';
const TSV_ROW_SEPARATOR = '\r\n';
const CSV_FORMULA_PREFIX = /^[=+\-@]/;

export type CsvRow = CsvCell[];

function escapeTsvCell(value: CsvCell) {
  const text = value == null ? '' : String(value);
  const safeText = CSV_FORMULA_PREFIX.test(text) ? `'${text}` : text;

  if (/["]|\t|\r|\n/.test(safeText)) {
    return `"${safeText.replace(/"/g, '""')}"`;
  }

  return safeText;
}

function encodeUtf16Le(value: string) {
  const output = new Uint8Array(2 + value.length * 2);
  output[0] = 0xff;
  output[1] = 0xfe;

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const offset = 2 + index * 2;
    output[offset] = code & 0xff;
    output[offset + 1] = code >> 8;
  }

  return output;
}

export function buildExcelFriendlyCsv(rows: CsvRow[]) {
  const content = rows
    .map((row) => row.map(escapeTsvCell).join(TSV_DELIMITER))
    .join(TSV_ROW_SEPARATOR);

  return encodeUtf16Le(`${content}${TSV_ROW_SEPARATOR}`);
}

export function downloadCsvContent(filename: string, content: string | Uint8Array) {
  const blobPart = typeof content === 'string' ? encodeUtf16Le(content) : content;
  const blobBuffer = new ArrayBuffer(blobPart.byteLength);
  new Uint8Array(blobBuffer).set(blobPart);
  const url = URL.createObjectURL(
    new Blob([blobBuffer], { type: 'text/tab-separated-values;charset=utf-16le' }),
  );
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadCsvRows(filename: string, rows: CsvRow[]) {
  downloadCsvContent(filename, buildExcelFriendlyCsv(rows));
}