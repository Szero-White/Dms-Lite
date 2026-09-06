import { Button, Card, List, Progress, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { SalesOrderStatusTag } from '../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import styles from './DashboardAttentionSection.module.css';

interface DashboardAttentionSectionProps {
  attentionOrders: SalesOrder[];
  customersMap: Map<number, string>;
  healthyProducts: ProductRow[];
  lowStockProducts: ProductRow[];
  onOpenInventory: () => void;
  onReviewOrders: () => void;
  onViewActivity: () => void;
  outOfStockProducts: ProductRow[];
  products: ProductRow[];
  recentOrders: SalesOrder[];
  showInventory: boolean;
  showOrders: boolean;
}

export function DashboardAttentionSection({
  attentionOrders,
  customersMap,
  healthyProducts,
  lowStockProducts,
  onOpenInventory,
  onReviewOrders,
  onViewActivity,
  outOfStockProducts,
  products,
  recentOrders,
  showInventory,
  showOrders,
}: DashboardAttentionSectionProps) {
  const { t } = useTranslation();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>{t('dashboard.attention.title')}</Typography.Title>
          <Typography.Text type="secondary">
            {t('dashboard.attention.subtitle')}
          </Typography.Text>
        </div>
      </div>
      <div className={styles.actionGrid}>
        {showInventory ? (
        <Card title={t('dashboard.attention.inventoryHealth')} className={`panel-card ${styles.actionCard}`}>
          <div className={styles.healthSummary}>
            <div>
              <span>{t('dashboard.attention.healthy')}</span>
              <strong>{healthyProducts.length}</strong>
            </div>
            <div>
              <span>{t('dashboard.attention.lowStock')}</span>
              <strong>{lowStockProducts.length}</strong>
            </div>
            <div>
              <span>{t('dashboard.attention.outOfStock')}</span>
              <strong>{outOfStockProducts.length}</strong>
            </div>
          </div>
          <Progress
            percent={
              products.length
                ? Math.round((healthyProducts.length / products.length) * 100)
                : 0
            }
            showInfo={false}
            strokeColor="var(--color-success)"
          />
          <List
            dataSource={lowStockProducts.slice(0, 3)}
            locale={{ emptyText: t('dashboard.attention.allAboveMinimum') }}
            renderItem={(product) => (
              <List.Item>
                <div className={styles.compactRow}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <Tag color="orange">{t('dashboard.attention.onHand', { count: product.stock })}</Tag>
                </div>
              </List.Item>
            )}
          />
          <Button type="link" onClick={onOpenInventory}>
            {t('dashboard.attention.openInventory')}
          </Button>
        </Card>
        ) : null}

        {showOrders ? (
        <Card title={t('dashboard.attention.ordersRequiringAttention')} className={`panel-card ${styles.actionCard}`}>
          <List
            dataSource={attentionOrders.slice(0, 4)}
            locale={{ emptyText: t('dashboard.attention.noDraftOrders') }}
            renderItem={(order) => (
              <List.Item>
                <div className={styles.compactRow}>
                  <div>
                    <strong>{order.code}</strong>
                    <span>
                      {order.customerName
                        || customersMap.get(order.customerId)
                        || '--'}
                    </span>
                  </div>
                  <Typography.Text strong>{formatCurrency(order.totalAmount)}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
          <Button type="link" onClick={onReviewOrders}>
            {t('dashboard.attention.reviewOrders')}
          </Button>
        </Card>
        ) : null}

        {showOrders ? (
        <Card title={t('dashboard.attention.recentActivity')} className={`panel-card ${styles.actionCard}`}>
          <List
            dataSource={recentOrders}
            locale={{ emptyText: t('dashboard.attention.noRecentActivity') }}
            renderItem={(order) => (
              <List.Item>
                <div className={styles.compactRow}>
                  <div>
                    <strong>{order.code}</strong>
                    <span>{formatDateTime(order.createdAt)}</span>
                  </div>
                  <SalesOrderStatusTag status={order.status} />
                </div>
              </List.Item>
            )}
          />
          <Button type="link" onClick={onViewActivity}>
            {t('dashboard.attention.viewActivity')}
          </Button>
        </Card>
        ) : null}
      </div>
    </section>
  );
}