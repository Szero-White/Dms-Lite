import { AlertOutlined, CheckCircleOutlined, DollarOutlined, InboxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../lib/format';
import { uiPalette } from '../../../../../styles/palette';
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
      key: 'units',
      label: t('inventory.overview.totalUnits'),
      value: totalUnits.toLocaleString(numberLocale),
      icon: <InboxOutlined />,
      color: uiPalette.brand.primary,
    },
    ...(showFinancials ? [{
      key: 'value',
      label: t('inventory.overview.inventoryValue'),
      value: formatCurrency(inventoryValue),
      icon: <DollarOutlined />,
      color: uiPalette.semantic.success,
    }] : []),
    {
      key: 'skus',
      label: t('inventory.overview.totalSkus'),
      value: products.length.toString(),
      icon: <CheckCircleOutlined />,
      color: uiPalette.semantic.warning,
    },
  ];

  return (
    <div className={styles.overviewContainer}>
      <section className={styles.inventoryRail} aria-label={t('inventory.overview.totalUnits')}>
        <div className={styles.railLead}>
          <span className={styles.railEyebrow}>{t('inventory.overview.stockHealth')}</span>
          <div className={styles.healthHeadline}>
            <strong>{healthyPercent}%</strong>
            <span>{t('inventory.overview.healthy')}</span>
          </div>
          <div className={styles.healthTrack} aria-hidden="true">
            <span style={{ width: `${healthyPct * 100}%` }} />
          </div>
          <div className={styles.healthCaption}>
            <span>{healthy} {t('inventory.overview.healthy')}</span>
            <span>{lowStockItems.length} {t('inventory.overview.lowStock')}</span>
          </div>
        </div>

        <div className={styles.metricRail}>
          {metrics.map((metric) => (
            <div key={metric.key} className={styles.metricSegment}>
              <span className={styles.metricIcon} style={{ color: metric.color }}>
                {metric.icon}
              </span>
              <div className={styles.metricCopy}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <strong className={styles.metricValue}>{metric.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.healthAlertsRow}>
        <section className={styles.healthSection}>
          <div className={styles.sectionMarker} aria-hidden="true" />
          <div className={styles.sectionCopy}>
            <h3 className={styles.cardTitle}>{t('inventory.overview.stockHealth')}</h3>
            <p className={styles.sectionHint}>{t('inventory.overview.healthyPercent', { percent: healthyPercent })}</p>
          </div>
          <div className={styles.healthStatsInline}>
            <div>
              <span className={styles.healthStatLabel}>{t('inventory.overview.healthy')}</span>
              <strong className={styles.healthStatValue} style={{ color: uiPalette.semantic.success }}>{healthy}</strong>
            </div>
            <div>
              <span className={styles.healthStatLabel}>{t('inventory.overview.lowStock')}</span>
              <strong className={styles.healthStatValue} style={{ color: uiPalette.semantic.warning }}>{lowStockItems.length}</strong>
            </div>
          </div>
        </section>

        <section className={styles.alertsSection}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <AlertOutlined /> {t('inventory.overview.needsRestock')}
            </h3>
            {lowStockItems.length > 0 ? (
              <span className={styles.alertCountBadge}>{lowStockItems.length}</span>
            ) : null}
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
                            ? uiPalette.semantic.danger
                            : uiPalette.semantic.warning,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {lowStockItems.length > 5 ? (
                <div className={styles.alertMore}>
                  {t('inventory.overview.moreItems', { count: lowStockItems.length - 5 })}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
