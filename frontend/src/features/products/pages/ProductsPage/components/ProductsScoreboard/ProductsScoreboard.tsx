import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../../../../lib/format';
import styles from './ProductsScoreboard.module.css';

interface ProductsScoreboardProps {
  activeCount: number;
  avgMargin: number;
  inventoryValue: number;
  lowStockCount: number;
  showFinancials: boolean;
  showInventory: boolean;
  totalProducts: number;
}

interface MetricItem {
  key: string;
  label: string;
  value: string | number;
  secondary?: string;
  emphasis?: 'default' | 'warning';
}

export function ProductsScoreboard({
  activeCount,
  avgMargin,
  inventoryValue,
  lowStockCount,
  showFinancials,
  showInventory,
  totalProducts,
}: ProductsScoreboardProps) {
  const { t } = useTranslation();
  const inactiveCount = totalProducts - activeCount;

  const metrics: MetricItem[] = [
    ...(showInventory ? [{
      key: 'low-stock',
      label: t('products.scoreboard.lowStockSkus'),
      value: lowStockCount,
      secondary: t('products.scoreboard.lowStockHint'),
      emphasis: 'warning' as const,
    }] : []),
    ...(showFinancials && showInventory ? [{
      key: 'inventory-value',
      label: t('products.scoreboard.inventoryValue'),
      value: formatCurrency(inventoryValue),
    }] : []),
    ...(showFinancials ? [{
      key: 'avg-margin',
      label: t('products.scoreboard.avgMargin'),
      value: `${avgMargin.toFixed(1)}%`,
    }] : []),
  ];

  return (
    <section className={styles.scoreboard} aria-label={t('products.scoreboard.summaryAria')}>
      <div className={styles.catalogPulse}>
        <div className={styles.featureMetric}>
          <span className={styles.featureKicker}>{t('products.scoreboard.totalSkus')}</span>
          <strong className={styles.featureValue}>{totalProducts}</strong>
          <span className={styles.featureSecondary}>
            {t('products.scoreboard.activeInactive', {
              active: activeCount,
              inactive: inactiveCount,
            })}
          </span>
          <div className={styles.catalogScale} aria-hidden="true">
            <span className={styles.scaleActive} style={{ flex: Math.max(activeCount, 1) }} />
            <span className={styles.scaleInactive} style={{ flex: Math.max(inactiveCount, 0.35) }} />
          </div>
        </div>

        <div className={styles.metricRail}>
          {metrics.map((metric, index) => (
            <div key={metric.key} className={styles.metricLane}>
              <span className={styles.metricIndex}>{String(index + 1).padStart(2, '0')}</span>
              <div className={styles.metricCopy}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <strong className={`${styles.metricValue} ${metric.emphasis === 'warning' ? styles.metricWarning : ''}`}>
                  {metric.value}
                </strong>
                {metric.secondary ? <span className={styles.metricSecondary}>{metric.secondary}</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
