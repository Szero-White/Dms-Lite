import { InboxOutlined, AlertOutlined, CheckCircleOutlined, DollarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import styles from './InventoryOverview.module.css';

interface InventoryOverviewProps {
  inventoryValue: number;
  lowStockItems: ProductRow[];
  products: ProductRow[];
  showFinancials: boolean;
  totalUnits: number;
}

export function InventoryOverview({
  inventoryValue,
  lowStockItems,
  products,
  showFinancials,
  totalUnits,
}: InventoryOverviewProps) {
  const { i18n, t } = useTranslation();
  const numberLocale = i18n.resolvedLanguage === 'vi' ? 'vi-VN' : 'en-US';
  const healthy = products.length - lowStockItems.length;
  const total = products.length || 1;
  const healthyPct = healthy / total;
  const healthyPercent = Math.round(healthyPct * 100);

  const metrics = [
    {
      label: t('inventory.overview.totalUnits'),
      value: totalUnits.toLocaleString(numberLocale),
      icon: <InboxOutlined />,
      color: '#6366f1',
      bgColor: '#eef2ff',
    },
    ...(showFinancials ? [{
      label: t('inventory.overview.inventoryValue'),
      value: formatCurrency(inventoryValue),
      icon: <DollarOutlined />,
      color: '#10b981',
      bgColor: '#ecfdf5',
    }] : []),
    {
      label: t('inventory.overview.totalSkus'),
      value: products.length.toString(),
      icon: <CheckCircleOutlined />,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
  ];

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <div key={metric.label} className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ background: metric.bgColor, color: metric.color }}>
              {metric.icon}
            </div>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <span className={styles.metricValue} style={{ color: metric.color }}>{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.healthAlertsRow}>
        <div className={styles.healthCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{t('inventory.overview.stockHealth')}</h3>
            <div className={styles.healthBadge} style={{ background: healthyPct > 0.7 ? '#ecfdf5' : '#fef2f2', color: healthyPct > 0.7 ? '#059669' : '#dc2626' }}>
              {t('inventory.overview.healthyPercent', { percent: healthyPercent })}
            </div>
          </div>
          <div className={styles.healthContent}>
            <div className={styles.healthStats}>
              <div className={styles.healthStat}>
                <span className={styles.healthStatValue} style={{ color: '#10b981' }}>{healthy}</span>
                <span className={styles.healthStatLabel}>{t('inventory.overview.healthy')}</span>
              </div>
              <div className={styles.healthStatDivider} />
              <div className={styles.healthStat}>
                <span className={styles.healthStatValue} style={{ color: '#f97316' }}>{lowStockItems.length}</span>
                <span className={styles.healthStatLabel}>{t('inventory.overview.lowStock')}</span>
              </div>
            </div>
            <div className={styles.healthProgress}>
              <div className={styles.healthBar}>
                <div
                  className={styles.healthBarFill}
                  style={{
                    width: `${healthyPct * 100}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.alertsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <AlertOutlined /> {t('inventory.overview.needsRestock')}
            </h3>
            {lowStockItems.length > 0 && (
              <span className={styles.alertCountBadge}>{lowStockItems.length}</span>
            )}
          </div>
          {lowStockItems.length === 0 ? (
            <div className={styles.alertEmpty}>
              <CheckCircleOutlined className={styles.alertEmptyIcon} />
              <span>{t('inventory.overview.allProductsHealthy')}</span>
            </div>
          ) : (
            <div className={styles.alertList}>
              {lowStockItems.slice(0, 5).map((product) => {
                const pct = product.minStock > 0
                  ? Math.min(Math.round((product.stock / product.minStock) * 100), 100)
                  : 0;

                return (
                  <div key={product.id} className={styles.alertItem}>
                    <div className={styles.alertItemInfo}>
                      <span className={styles.alertItemName}>{product.name}</span>
                      <span className={styles.alertItemSku}>{product.sku}</span>
                    </div>
                    <div className={styles.alertItemStock}>
                      <span className={styles.alertStockValue}>{product.stock}</span>
                      <span className={styles.alertStockDivider}>/</span>
                      <span className={styles.alertStockMin}>{product.minStock}</span>
                    </div>
                    <div className={styles.alertBar}>
                      <div
                        className={styles.alertBarFill}
                        style={{
                          width: `${pct}%`,
                          background: pct < 30
                            ? 'linear-gradient(90deg, #ef4444, #f87171)'
                            : 'linear-gradient(90deg, #f97316, #fbbf24)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {lowStockItems.length > 5 && (
                <div className={styles.alertMore}>
                  {t('inventory.overview.moreItems', { count: lowStockItems.length - 5 })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}