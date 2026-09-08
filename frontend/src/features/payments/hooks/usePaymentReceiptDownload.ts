import { App } from 'antd';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../../lib/format';
import { downloadPaymentReceipt } from '../api/paymentService';
import type { PaymentRecord } from '../types/payment.types';

export function usePaymentReceiptDownload() {
  const { message } = App.useApp();
  const { t } = useTranslation();

  return useCallback(async (payment: PaymentRecord) => {
    try {
      const blob = await downloadPaymentReceipt(payment.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${payment.code}-receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(getErrorMessage(error, t('payments.receipt.downloadFailed')));
    }
  }, [message, t]);
}
