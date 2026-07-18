import { Card, Empty, List, Typography } from 'antd';
import { formatCurrency } from '../../../../../lib/format';
import type { DashboardSnapshot } from '../../../types/dashboard.types';
import styles from '../DashboardPage.module.css';

interface DashboardCommercialSectionProps {
  dashboard: DashboardSnapshot;
}

export function DashboardCommercialSection({
  dashboard,
}: DashboardCommercialSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>Commercial exposure</Typography.Title>
          <Typography.Text type="secondary">
            Customers and products with the greatest current impact
          </Typography.Text>
        </div>
      </div>
      <div className={styles.insightGrid}>
        <Card title="Top Customers by Debt" className={`panel-card ${styles.panel}`}>
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
                        Outstanding receivable
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
                description="No customer debt yet"
              />
            </div>
          )}
        </Card>

        <Card title="Top Selling Products" className={`panel-card ${styles.panel}`}>
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
                        {item.totalQuantity} units sold
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
                description="No completed sales yet"
              />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
}
