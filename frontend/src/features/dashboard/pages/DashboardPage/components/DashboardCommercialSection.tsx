import { Card, Empty, List, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../lib/format';
import type { DashboardSnapshot } from '../../../types/dashboard.types';
import styles from './DashboardCommercialSection.module.css';

interface DashboardCommercialSectionProps {
  dashboard: DashboardSnapshot;
}

export function DashboardCommercialSection({
  dashboard,
}: DashboardCommercialSectionProps) {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>{t('dashboard.commercial.title')}</Typography.Title>
          <Typography.Text type="secondary">
            {t('dashboard.commercial.subtitle')}
          </Typography.Text>
        </div>
      </div>
      <div className={styles.insightGrid}>
        <Card title={t('dashboard.commercial.topCustomersByDebt')} className={`panel-card ${styles.panel}`}>
          {dashboard.topCustomersByDebt.length ? (
            <List
              dataSource={dashboard.topCustomersByDebt}
              renderItem={(item, index) => (
                <List.Item>
                  <div className={styles.listRow}>
                    <div className={styles.rank}>{index + 1}</div>
                    <div className={styles.listContent}>
                      <Typography.Text strong>{item.customerName}</Typography.Text>
                      <Typography.Text type="secondary">
                        {t('dashboard.commercial.outstandingReceivable')}
                      </Typography.Text>
                    </div>
                    <Typography.Text strong className={styles.amount}>
                      {formatCurrency(item.debtBalance)}
                    </Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="panel-empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.commercial.noCustomerDebt')}
              />
            </div>
          )}
        </Card>

        <Card title={t('dashboard.commercial.topSellingProducts')} className={`panel-card ${styles.panel}`}>
          {dashboard.topSellingProducts.length ? (
            <List
              dataSource={dashboard.topSellingProducts}
              renderItem={(item, index) => (
                <List.Item>
                  <div className={styles.listRow}>
                    <div className={styles.rank}>{index + 1}</div>
                    <div className={styles.listContent}>
                      <Typography.Text strong>{item.productName}</Typography.Text>
                      <Typography.Text type="secondary">
                        {t('dashboard.commercial.unitsSold', { count: item.totalQuantity })}
                      </Typography.Text>
                    </div>
                    <Typography.Text strong>{formatCurrency(item.revenue)}</Typography.Text>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div className="panel-empty">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('dashboard.commercial.noCompletedSales')}
              />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
