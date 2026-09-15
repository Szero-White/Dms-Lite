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

export const TABLE_SORTER_TOOLTIP = { target: 'full-header' } as const;

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

export interface NewestRecord {
  id?: number | string | null;
  createdAt?: string | null;
}

/**
 * Deterministic default list order used when the user has not activated a
 * column sorter. Newer business records stay at the top without lighting a
 * sorter arrow in Ant Design.
 */
export function compareNewestFirst(first: NewestRecord, second: NewestRecord) {
  const firstTime = first.createdAt ? Date.parse(first.createdAt) : Number.NaN;
  const secondTime = second.createdAt ? Date.parse(second.createdAt) : Number.NaN;

  if (Number.isFinite(firstTime) && Number.isFinite(secondTime) && firstTime !== secondTime) {
    return secondTime - firstTime;
  }

  const firstId = Number(first.id);
  const secondId = Number(second.id);
  if (Number.isFinite(firstId) && Number.isFinite(secondId) && firstId !== secondId) {
    return secondId - firstId;
  }

  return compareText(second.id, first.id);
}

export function newestFirst<RecordType extends NewestRecord>(records: readonly RecordType[]) {
  return [...records].sort(compareNewestFirst);
}
