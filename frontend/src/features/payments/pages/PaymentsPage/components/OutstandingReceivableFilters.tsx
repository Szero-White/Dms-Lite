import { Button, Checkbox, DatePicker, Input, InputNumber, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReceivableDueStatus } from '../../../../../types';
import type { OutstandingPaymentFilters } from '../../../types/payment.types';
import { ALL_DUE_STATUSES } from './receivableDueStatusOptions';
import styles from '../PaymentsPage.module.css';

interface OutstandingReceivableFiltersProps {
  filters: OutstandingPaymentFilters;
  onChange: (patch: Partial<OutstandingPaymentFilters>) => void;
  onReset: () => void;
}

export function OutstandingReceivableFilters({
  filters,
  onChange,
  onReset,
}: OutstandingReceivableFiltersProps) {
  const { t } = useTranslation();
  const [datePickerResetKey, setDatePickerResetKey] = useState(0);
  const dueStatuses = filters.dueStatuses ?? ALL_DUE_STATUSES;
  const allDueStatusesSelected = dueStatuses.length === ALL_DUE_STATUSES.length;
  const hasFilters = !allDueStatusesSelected || Boolean(
    filters.search
    || filters.dueFrom
    || filters.dueTo
    || filters.minRemaining !== undefined
    || filters.maxRemaining !== undefined
  );

  function setDueStatusChecked(status: ReceivableDueStatus, checked: boolean) {
    const next = checked
      ? dueStatuses.includes(status) ? dueStatuses : [...dueStatuses, status]
      : dueStatuses.filter((value) => value !== status);
    onChange({ dueStatuses: next });
  }

  function reset() {
    setDatePickerResetKey((current) => current + 1);
    onReset();
  }

  return (
    <div className={styles.filterPanel}>
      <Input
        allowClear
        className={styles.search}
        prefix={<SearchOutlined />}
        placeholder={t('payments.outstanding.searchPlaceholder')}
        value={filters.search}
        onChange={(event) => onChange({ search: event.target.value })}
      />

      <div className={styles.filterGroup}>
        <Typography.Text strong className={styles.filterLabel}>
          {t('payments.filters.dueStatus')}
        </Typography.Text>
        <div className={styles.statusChecks}>
          <label className={`${styles.filterChip} ${allDueStatusesSelected ? styles.filterChipActive : ''}`}>
            <Checkbox
              checked={allDueStatusesSelected}
              indeterminate={dueStatuses.length > 0 && !allDueStatusesSelected}
              onChange={(event) => onChange({
                dueStatuses: event.target.checked ? ALL_DUE_STATUSES : [],
              })}
            />
            <span>{t('payments.filters.all')}</span>
          </label>
          {ALL_DUE_STATUSES.map((status) => {
            const checked = dueStatuses.includes(status);
            return (
              <label
                key={status}
                className={`${styles.filterChip} ${checked ? styles.filterChipActive : ''}`}
              >
                <Checkbox
                  checked={checked}
                  onChange={(event) => setDueStatusChecked(status, event.target.checked)}
                />
                <span>{t(`payments.filters.status.${status}`)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className={styles.advancedFilters}>
        <div className={styles.filterField}>
          <Typography.Text type="secondary">{t('payments.filters.dueDateRange')}</Typography.Text>
          <DatePicker.RangePicker
            key={`due-range-${datePickerResetKey}`}
            allowClear
            className={styles.dueDateRange}
            placeholder={[t('payments.filters.fromDate'), t('payments.filters.toDate')]}
            onChange={(values) => onChange({
              dueFrom: values?.[0]?.format('YYYY-MM-DD'),
              dueTo: values?.[1]?.format('YYYY-MM-DD'),
            })}
          />
        </div>
        <div className={styles.filterField}>
          <Typography.Text type="secondary">{t('payments.filters.remainingRange')}</Typography.Text>
          <div className={styles.amountRange}>
            <InputNumber
              min={0}
              controls={false}
              placeholder={t('payments.filters.minAmount')}
              value={filters.minRemaining}
              onChange={(value) => onChange({
                minRemaining: typeof value === 'number' ? value : undefined,
              })}
            />
            <span aria-hidden="true">–</span>
            <InputNumber
              min={0}
              controls={false}
              placeholder={t('payments.filters.maxAmount')}
              value={filters.maxRemaining}
              onChange={(value) => onChange({
                maxRemaining: typeof value === 'number' ? value : undefined,
              })}
            />
          </div>
        </div>
        <Button className={styles.resetFilters} disabled={!hasFilters} onClick={reset}>
          {t('payments.filters.reset')}
        </Button>
      </div>
    </div>
  );
}
