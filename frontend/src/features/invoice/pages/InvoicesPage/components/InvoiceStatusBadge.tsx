import { useTranslation } from 'react-i18next';
import type { InvoiceStatus } from '../../../types/invoice.types';
import './InvoiceStatusBadge.css';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const { t } = useTranslation();

  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case 'DRAFT':
        return { className: 'status-draft', label: t('invoice.status.draft') };
      case 'ISSUED':
        return { className: 'status-issued', label: t('invoice.status.issued') };
      case 'PAID':
        return { className: 'status-paid', label: t('invoice.status.paid') };
      case 'CANCELLED':
        return { className: 'status-cancelled', label: t('invoice.status.cancelled') };
      case 'OVERDUE':
        return { className: 'status-overdue', label: t('invoice.status.overdue') };
      default:
        return { className: 'status-unknown', label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`invoice-status-badge ${config.className}`}>
      {config.label}
    </span>
  );
}