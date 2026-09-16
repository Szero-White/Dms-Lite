import { useTranslation } from 'react-i18next';
import { SemanticStatusTag, type StatusTone } from '../../components/common/StatusTag';
import type { InvoiceStatus } from './types/invoice.types';

const TONE_BY_STATUS: Record<string, StatusTone> = {
  DRAFT: 'neutral',
  ISSUED: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
  OVERDUE: 'warning',
};

export function InvoiceStatusTag({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();

  return (
    <SemanticStatusTag tone={TONE_BY_STATUS[status] || 'neutral'}>
      {t(`status.invoice.${status}`, { defaultValue: t('status.invoice.UNKNOWN') })}
    </SemanticStatusTag>
  );
}
