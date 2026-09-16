import { SearchOutlined } from '@ant-design/icons';
import { Button, DatePicker, Input, InputNumber } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TableMultiSelectFilter } from '../../../../../components/common/TableMultiSelectFilter';
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
  const dueStatuses = filters.dueStatuses ?? [];
  const hasFilters = dueStatuses.length > 0 || Boolean(
    filters.search
    || filters.dueFrom
    || filters.dueTo
    || filters.minRemaining !== undefined
    || filters.maxRemaining !== undefined
  );

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

      <TableMultiSelectFilter
        ariaLabel={t('payments.filters.dueStatus')}
        className={styles.statusFilterTrigger}
        value={dueStatuses}
        onChange={(values) => onChange({ dueStatuses: values })}
        placeholder={t('payments.filters.dueStatus')}
        options={ALL_DUE_STATUSES.map((status) => ({
          value: status,
          label: t(`payments.filters.status.${status}`),
        }))}
      />

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
