import { formatCurrency } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import styles from '../InventoryPage.module.css';

interface InventoryOverviewProps {
  inventoryValue: number;
  lowStockItems: ProductRow[];
  products: ProductRow[];
  totalUnits: number;
}

export function InventoryOverview({
  inventoryValue,
  lowStockItems,
  products,
  totalUnits,
}: InventoryOverviewProps) {
  const healthy = products.length - lowStockItems.length;
  const total = products.length || 1;
  const healthyPct = healthy / total;
  const circumference = 2 * Math.PI * 44;

  return (
    <div className={styles.stockDashboard}>
      <div className={styles.stockZoneUnits}>
        <div className={styles.stockZoneLabel}>Stock Overview</div>
        <div className={styles.stockBigNum}>{totalUnits.toLocaleString('vi-VN')}</div>
        <div className={styles.stockBigLabel}>total units on hand</div>
        <div className={styles.stockDivider} />
        <div className={styles.stockValueRow}>
          <span className={styles.stockValueLabel}>Inventory value</span>
          <span className={styles.stockValueNum}>{formatCurrency(inventoryValue)}</span>
        </div>
        <div className={styles.stockValueRow}>
          <span className={styles.stockValueLabel}>Total SKUs</span>
          <span className={styles.stockValueNum}>{products.length}</span>
        </div>
      </div>

      <div className={styles.stockZoneHealth}>
        <div className={styles.healthRingWrap}>
          <svg viewBox="0 0 100 100" className={styles.healthRing}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#fef2f2" strokeWidth="10" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#f97316"
              strokeWidth="10"
              strokeDasharray={`${(1 - healthyPct) * circumference} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#healthGrad)"
              strokeWidth="10"
              strokeDasharray={`${healthyPct * circumference} ${circumference}`}
              strokeDashoffset={
                circumference * 0.25 - (1 - healthyPct) * circumference
              }
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.healthRingCenter}>
            <span className={styles.healthPct}>{Math.round(healthyPct * 100)}%</span>
            <span className={styles.healthPctLabel}>healthy</span>
          </div>
        </div>

        <div className={styles.healthLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>{healthy} healthy</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#f97316' }} />
            <span>{lowStockItems.length} low stock</span>
          </div>
        </div>
      </div>

      <div className={styles.stockZoneAlerts}>
        <div className={styles.alertZoneTitle}>
          Needs Restock
          {lowStockItems.length > 0 && (
            <span className={styles.alertBadge}>{lowStockItems.length}</span>
          )}
        </div>
        {lowStockItems.length === 0 ? (
          <div className={styles.alertEmpty}>
            <span>All products healthy</span>
          </div>
        ) : (
          <div className={styles.alertList}>
            {lowStockItems.slice(0, 4).map((product) => {
              const pct =
                product.minStock > 0
                  ? Math.min(
                      Math.round((product.stock / product.minStock) * 100),
                      100,
                    )
                  : 0;

              return (
                <div key={product.id} className={styles.alertItem}>
                  <div className={styles.alertItemTop}>
                    <span className={styles.alertItemName}>{product.name}</span>
                    <span className={styles.alertItemStock}>
                      {product.stock}/{product.minStock}
                    </span>
                  </div>
                  <div className={styles.alertBar}>
                    <div
                      className={styles.alertBarFill}
                      style={{
                        width: `${pct}%`,
                        background:
                          pct < 30
                            ? 'linear-gradient(90deg,#ef4444,#f87171)'
                            : 'linear-gradient(90deg,#f97316,#fbbf24)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
