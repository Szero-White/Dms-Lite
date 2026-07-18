import { Button, Card, List, Progress, Tag, Typography } from 'antd';
import { SalesOrderStatusTag } from '../../../../../components/common/StatusTag';
import { formatCurrency, formatDateTime } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import styles from '../DashboardPage.module.css';

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
}: DashboardAttentionSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <Typography.Title level={3}>Needs attention</Typography.Title>
          <Typography.Text type="secondary">
            Operational queues that can be acted on now
          </Typography.Text>
        </div>
      </div>
      <div className={styles.actionGrid}>
        <Card title="Inventory Health" className={`panel-card ${styles.actionCard}`}>
          <div className={styles.healthSummary}>
            <div>
              <span>Healthy</span>
              <strong>{healthyProducts.length}</strong>
            </div>
            <div>
              <span>Low stock</span>
              <strong>{lowStockProducts.length}</strong>
            </div>
            <div>
              <span>Out of stock</span>
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
            locale={{ emptyText: 'All tracked products are above minimum stock.' }}
            renderItem={(product) => (
              <List.Item>
                <div className={styles.compactRow}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <Tag color="orange">{product.stock} on hand</Tag>
                </div>
              </List.Item>
            )}
          />
          <Button type="link" onClick={onOpenInventory}>
            Open inventory
          </Button>
        </Card>

        <Card title="Orders Requiring Attention" className={`panel-card ${styles.actionCard}`}>
          <List
            dataSource={attentionOrders.slice(0, 4)}
            locale={{ emptyText: 'No draft orders in the selected range.' }}
            renderItem={(order) => (
              <List.Item>
                <div className={styles.compactRow}>
                  <div>
                    <strong>{order.code}</strong>
                    <span>
                      {customersMap.get(order.customerId) || `Customer #${order.customerId}`}
                    </span>
                  </div>
                  <Typography.Text strong>{formatCurrency(order.totalAmount)}</Typography.Text>
                </div>
              </List.Item>
            )}
          />
          <Button type="link" onClick={onReviewOrders}>
            Review orders
          </Button>
        </Card>

        <Card title="Recent Business Activity" className={`panel-card ${styles.actionCard}`}>
          <List
            dataSource={recentOrders}
            locale={{ emptyText: 'No recent order activity.' }}
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
            View activity
          </Button>
        </Card>
      </div>
    </section>
  );
}
