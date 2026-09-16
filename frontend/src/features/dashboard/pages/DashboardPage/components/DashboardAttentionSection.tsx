import {
  AppstoreOutlined,
  RightOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatNumber } from '../../../../../lib/format';
import type { ProductRow } from '../../../../products';
import type { SalesOrder } from '../../../../sales';
import type { ReceivableAttention } from '../../../types/dashboard.types';
import styles from './DashboardAttentionSection.module.css';

interface DashboardAttentionSectionProps {
  attentionOrders: SalesOrder[];
  lowStockProducts: ProductRow[];
  onOpenInventory: () => void;
  onOpenReceivables?: () => void;
  onReviewOrders: () => void;
  outOfStockProducts: ProductRow[];
  receivableAttention: ReceivableAttention;
  showInventory: boolean;
  showReceivables: boolean;
  showOrders: boolean;
}

interface AttentionItem {
  key: string;
  icon: ReactNode;
  label: string;
  detail: string;
  value: string;
  tone?: 'danger';
  onClick?: () => void;
}

export function DashboardAttentionSection({
  attentionOrders,
  lowStockProducts,
  onOpenInventory,
  onOpenReceivables,
  onReviewOrders,
  outOfStockProducts,
  receivableAttention,
  showInventory,
  showReceivables,
  showOrders,
}: DashboardAttentionSectionProps) {
  const { i18n, t } = useTranslation();
  const attentionItems: AttentionItem[] = [];

  if (showReceivables && receivableAttention.overdueCount > 0) {
    attentionItems.push({
      key: 'overdue-receivables',
      icon: <WalletOutlined />,
      label: t('dashboard.attention.receivables.overdue'),
      detail: t('dashboard.attention.receivables.itemCount', {
        count: receivableAttention.overdueCount,
      }),
      value: formatCurrency(receivableAttention.overdueAmount, i18n.language),
      tone: 'danger',
      onClick: onOpenReceivables,
    });
  }

  if (showReceivables && receivableAttention.dueTodayCount > 0) {
    attentionItems.push({
      key: 'due-today-receivables',
      icon: <WalletOutlined />,
      label: t('dashboard.attention.receivables.dueToday'),
      detail: t('dashboard.attention.receivables.itemCount', {
        count: receivableAttention.dueTodayCount,
      }),
      value: formatCurrency(receivableAttention.dueTodayAmount, i18n.language),
      onClick: onOpenReceivables,
    });
  }

  if (showReceivables && receivableAttention.dueSoonCount > 0) {
    attentionItems.push({
      key: 'due-soon-receivables',
      icon: <WalletOutlined />,
      label: t('dashboard.attention.receivables.dueSoon'),
      detail: t('dashboard.attention.receivables.itemCount', {
        count: receivableAttention.dueSoonCount,
      }),
      value: formatCurrency(receivableAttention.dueSoonAmount, i18n.language),
      onClick: onOpenReceivables,
    });
  }

  if (showInventory && lowStockProducts.length > 0) {
    attentionItems.push({
      key: 'low-stock',
      icon: <AppstoreOutlined />,
      label: t('dashboard.attention.lowStock'),
      detail: t('dashboard.performance.lowStockProductsNote'),
      value: String(formatNumber(lowStockProducts.length)),
      onClick: onOpenInventory,
    });
  }

  if (showInventory && outOfStockProducts.length > 0) {
    attentionItems.push({
      key: 'out-of-stock',
      icon: <WarningOutlined />,
      label: t('dashboard.attention.outOfStock'),
      detail: t('dashboard.attention.openInventory'),
      value: String(formatNumber(outOfStockProducts.length)),
      tone: 'danger',
      onClick: onOpenInventory,
    });
  }

  if (showOrders && attentionOrders.length > 0) {
    attentionItems.push({
      key: 'draft-orders',
      icon: <ShoppingCartOutlined />,
      label: t('dashboard.performance.ordersNeedAction'),
      detail: t('dashboard.attention.reviewOrders'),
      value: String(formatNumber(attentionOrders.length)),
      onClick: onReviewOrders,
    });
  }

  if (attentionItems.length === 0) {
    return null;
  }

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

      <div className={styles.attentionPanel}>
        {attentionItems.map((item) => (
          <div
            key={item.key}
            className={`${styles.attentionItem} ${item.tone === 'danger' ? styles.dangerItem : ''}`}
          >
            <div className={styles.iconWrap}>{item.icon}</div>
            <div className={styles.itemContent}>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </div>
            <div className={styles.itemValue}>{item.value}</div>
            {item.onClick ? (
              <Button
                type="text"
                className={styles.itemAction}
                icon={<RightOutlined />}
                aria-label={item.label}
                onClick={item.onClick}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
