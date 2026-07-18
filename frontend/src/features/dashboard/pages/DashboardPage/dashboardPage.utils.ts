import type { DashboardRange } from './dashboardPage.types';

export const rangeLabels: Record<DashboardRange, string> = {
  TODAY: 'Today',
  '7_DAYS': '7 days',
  '30_DAYS': '30 days',
  THIS_MONTH: 'This month',
};

export function getRangeStart(range: DashboardRange) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (range === 'THIS_MONTH') {
    start.setDate(1);
  } else if (range === '7_DAYS') {
    start.setDate(start.getDate() - 6);
  } else if (range === '30_DAYS') {
    start.setDate(start.getDate() - 29);
  }

  return start;
}

export function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}
