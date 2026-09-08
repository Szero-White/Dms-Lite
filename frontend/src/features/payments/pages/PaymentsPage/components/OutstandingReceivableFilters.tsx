import { FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Checkbox, DatePicker, Input, InputNumber, Popover, Typography } from 'antd';
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
    const selectedStatuses = new Set(dueStatuses);
    if (checked) {
      selectedStatuses.add(status);
    } else {
      selectedStatuses.delete(status);
    }

    onChange({
      dueStatuses: ALL_DUE_STATUSES.filter((value) => selectedStatuses.has(value)),
    });
  }

  function reset() {
    setDatePickerResetKey((current) => current + 1);
    onReset();
  }

  const dueStatusMenu = (
    <div className={styles.statusFilterMenu}>
      <Typography.Text strong>{t('payments.filters.dueStatus')}</Typography.Text>
      <Checkbox
        className={styles.statusFilterAll}
        checked={allDueStatusesSelected}
        indeterminate={dueStatuses.length > 0 && !allDueStatusesSelected}
        onChange={(event) => onChange({
          dueStatuses: event.target.checked ? ALL_DUE_STATUSES : [],
        })}
      >
        {t('payments.filters.all')}
      </Checkbox>
      <div className={styles.statusFilterOptions}>
        {ALL_DUE_STATUSES.map((status) => (
          <Checkbox
            key={status}
            checked={dueStatuses.includes(status)}
            onChange={(event) => setDueStatusChecked(status, event.target.checked)}
          >
            {t(`payments.filters.status.${status}`)}
          </Checkbox>
        ))}
      </div>
    </div>
  );

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

      <Popover content={dueStatusMenu} placement="bottomLeft" trigger="click">
        <Button className={styles.statusFilterTrigger} icon={<FilterOutlined />}>
          {t('payments.filters.dueStatus')}
          {!allDueStatusesSelected ? ` (${dueStatuses.length})` : ''}
        </Button>
      </Popover>

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

      <Button className={styles.resetFilters} disabled={!hasFilters} onClick={reset}>
        {t('payments.filters.reset')}
      </Button>
    </div>
  );
}
