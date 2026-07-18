import {
  AppstoreOutlined,
  DollarOutlined,
  EditOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Progress } from 'antd';
import { formatCurrency } from '../../../../../../lib/format';
import styles from './ProductsScoreboard.module.css';

interface ProductsScoreboardProps {
  activeCount: number;
  avgMargin: number;
  inventoryValue: number;
  lowStockCount: number;
  totalProducts: number;
}

export function ProductsScoreboard({
  activeCount,
  avgMargin,
  inventoryValue,
  lowStockCount,
  totalProducts,
}: ProductsScoreboardProps) {
  const total = totalProducts || 1;
  const activePct = activeCount / total;
  const circumference = 2 * Math.PI * 28;
  const healthyPct = totalProducts
    ? Math.round(((totalProducts - lowStockCount) / totalProducts) * 100)
    : 100;

  return (
    <div className={styles.scoreboard}>
      <div className={styles.scoreHero}>
        <div className={styles.scoreHeroIcon}>
          <AppstoreOutlined />
        </div>
        <div>
          <div className={styles.scoreHeroBig}>{totalProducts}</div>
          <div className={styles.scoreHeroLbl}>Total SKUs</div>
        </div>
      </div>

      <div className={styles.scoreDivider} />

      <div className={styles.scoreDonut}>
        <div className={styles.donutChart}>
          <svg viewBox="0 0 72 72" className={styles.donutSvg}>
            <circle cx="36" cy="36" r="28" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="url(#productStatusGradient)"
              strokeWidth="8"
              strokeDasharray={`${activePct * circumference} ${circumference}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="productStatusGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>
          </svg>
          <div className={styles.donutCenter}>
            <span className={styles.donutPct}>{Math.round(activePct * 100)}%</span>
          </div>
        </div>
        <div className={styles.donutLegend}>
          <span>
            <span className={styles.dot} style={{ background: '#10b981' }} />
            {activeCount} active
          </span>
          <span>
            <span className={styles.dot} style={{ background: '#e2e8f0' }} />
            {totalProducts - activeCount} inactive
          </span>
        </div>
      </div>

      <div className={styles.scoreDivider} />

      <div className={styles.scoreAlert}>
        <div className={styles.scoreAlertTop}>
          <WarningOutlined
            style={{
              color: lowStockCount > 0 ? '#f59e0b' : '#10b981',
              fontSize: 20,
            }}
          />
          <span
            className={styles.scoreAlertNum}
            style={{ color: lowStockCount > 0 ? '#f59e0b' : '#10b981' }}
          >
            {lowStockCount}
          </span>
        </div>
        <div className={styles.scoreAlertLbl}>Low-stock SKUs</div>
        <Progress
          percent={healthyPct}
          showInfo={false}
          size="small"
          strokeColor={lowStockCount > 0 ? '#f59e0b' : '#10b981'}
        />
      </div>

      <div className={styles.scoreDivider} />

      <div className={styles.scoreFinancials}>
        <div className={styles.scoreFinRow}>
          <DollarOutlined style={{ color: '#8b5cf6', fontSize: 16 }} />
          <div>
            <div className={styles.scoreFinVal}>{formatCurrency(inventoryValue)}</div>
            <div className={styles.scoreFinLbl}>Inventory value</div>
          </div>
        </div>
        <div className={styles.scoreFinRow}>
          <EditOutlined style={{ color: '#6366f1', fontSize: 16 }} />
          <div>
            <div className={styles.scoreFinVal}>{avgMargin.toFixed(1)}%</div>
            <div className={styles.scoreFinLbl}>Avg. margin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
