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

interface MetricProps {
  label: string;
  value: string | number;
  secondary?: string;
}

function Metric({ label, value, secondary }: MetricProps) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={styles.metricValue}>{value}</div>
      {secondary ? <div className={styles.metricSecondary}>{secondary}</div> : null}
    </div>
  );
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

  return (
    <section className={styles.scoreboard} aria-label={t('products.scoreboard.summaryAria')}>
      <Metric
        label={t('products.scoreboard.totalSkus')}
        value={totalProducts}
        secondary={t('products.scoreboard.activeInactive', {
          active: activeCount,
          inactive: inactiveCount,
        })}
      />

      {showInventory ? (
        <Metric
          label={t('products.scoreboard.lowStockSkus')}
          value={lowStockCount}
          secondary={t('products.scoreboard.lowStockHint')}
        />
      ) : null}

      {showFinancials && showInventory ? (
        <Metric
          label={t('products.scoreboard.inventoryValue')}
          value={formatCurrency(inventoryValue)}
        />
      ) : null}

      {showFinancials ? (
        <Metric
          label={t('products.scoreboard.avgMargin')}
          value={`${avgMargin.toFixed(1)}%`}
        />
      ) : null}
    </section>
  );
}
