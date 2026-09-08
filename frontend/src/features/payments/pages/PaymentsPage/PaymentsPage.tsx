import { Tabs } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import type { OutstandingPaymentOrder, PaymentRecord } from '../../types/payment.types';
import { OutstandingReceivablesCard } from './components/OutstandingReceivablesCard';
import { PaymentDetailDrawer } from './components/PaymentDetailDrawer';
import { PaymentHistoryCard } from './components/PaymentHistoryCard';
import { PaymentsReceivablesOverview } from './components/PaymentsReceivablesOverview';
import { RecordPaymentDrawer } from './components/RecordPaymentDrawer';
import styles from './PaymentsPage.module.css';

export function PaymentsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'payment' | 'history'>('payment');
  const [selectedOrder, setSelectedOrder] = useState<OutstandingPaymentOrder | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const paymentTabActive = activeTab === 'payment';
  const historyTabActive = activeTab === 'history';

  return (
    <div className={styles.page}>
      <PageHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />

      <Tabs
        className={styles.tabs}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'payment' | 'history')}
        items={[
          {
            key: 'payment',
            label: t('payments.tabs.payment'),
            children: (
              <div className={styles.contentStack}>
                <PaymentsReceivablesOverview enabled={paymentTabActive} />
                <OutstandingReceivablesCard
                  enabled={paymentTabActive}
                  onRecordPayment={setSelectedOrder}
                />
              </div>
            ),
          },
          {
            key: 'history',
            label: t('payments.tabs.history'),
            children: (
              <PaymentHistoryCard
                enabled={historyTabActive}
                onViewPayment={setSelectedPayment}
              />
            ),
          },
        ]}
      />

      <RecordPaymentDrawer order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      <PaymentDetailDrawer payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
    </div>
  );
}
