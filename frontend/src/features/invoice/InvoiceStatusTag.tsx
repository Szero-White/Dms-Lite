import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import type { InvoiceStatus } from './types/invoice.types';

const COLOR_BY_STATUS: Record<string, string> = {
  DRAFT: 'default',
  ISSUED: 'blue',
  PAID: 'green',
  CANCELLED: 'red',
  OVERDUE: 'orange',
};

export function InvoiceStatusTag({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  return (
    <Tag color={COLOR_BY_STATUS[status]}>
      {t(`status.invoice.${status}`, { defaultValue: t('status.invoice.UNKNOWN') })}
    </Tag>
  );
}
