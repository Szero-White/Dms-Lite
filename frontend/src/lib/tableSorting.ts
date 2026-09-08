export type TableSortDirection = 'ascend' | 'descend';
export type ApiSortDirection = 'ASC' | 'DESC';

/**
 * Ant Design's standard three-state cycle:
 * neutral -> ASC -> DESC -> neutral.
 *
 * Clearing the visual sorter does not make server-backed lists random:
 * their API/backend keeps its deterministic default ordering.
 */
export const TABLE_SORT_DIRECTIONS: TableSortDirection[] = [
  'ascend',
  'descend',
];

export function getTableSortOrder<Field extends string>(
  activeField: Field | null | undefined,
  activeDirection: ApiSortDirection | null | undefined,
  field: Field,
): TableSortDirection | null {
  if (activeField !== field || !activeDirection) {
    return null;
  }

  return activeDirection === 'ASC' ? 'ascend' : 'descend';
}

function normalizedText(value: unknown) {
  return String(value ?? '').trim();
}

export function compareText(first: unknown, second: unknown) {
  return normalizedText(first).localeCompare(normalizedText(second), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function compareNumber(first: unknown, second: unknown) {
  const left = Number(first ?? 0);
  const right = Number(second ?? 0);
  const safeLeft = Number.isFinite(left) ? left : 0;
  const safeRight = Number.isFinite(right) ? right : 0;
  return safeLeft - safeRight;
}

export function compareDate(first: unknown, second: unknown) {
  const left = first ? Date.parse(String(first)) : 0;
  const right = second ? Date.parse(String(second)) : 0;
  return (Number.isFinite(left) ? left : 0) - (Number.isFinite(right) ? right : 0);
}

export function compareBoolean(first: unknown, second: unknown) {
  return Number(Boolean(first)) - Number(Boolean(second));
}
