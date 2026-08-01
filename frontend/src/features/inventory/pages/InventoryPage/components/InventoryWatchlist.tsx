import { Card, Empty, Space, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ProductRow } from '../../../../products';
import styles from './InventoryWatchlist.module.css';
import tagStyles from '../inventoryTags.module.css';

interface InventoryWatchlistProps {
  lowStockItems: ProductRow[];
}

export function InventoryWatchlist({ lowStockItems }: InventoryWatchlistProps) {
  const { t } = useTranslation();

  return (
    <Card className={`panel-card ${styles.watchlistCard}`} title={t('inventory.watchlist.title')}>
      {lowStockItems.length ? (
        <Space direction="vertical" className={styles.watchlist}>
          {lowStockItems.map((product) => (
            <div className="alert-row" key={product.id}>
              <div>
                <Typography.Text strong>{product.name}</Typography.Text>
                <Typography.Paragraph
                  type="secondary"
                  className={styles.watchlistMeta}
                >
                  {t('inventory.watchlist.meta', {
                    sku: product.sku,
                    stock: product.stock,
                    minStock: product.minStock,
                  })}
                </Typography.Paragraph>
              </div>

              <Tag className={`${tagStyles.stockTag} ${tagStyles.lowStock}`}>
                {t('inventory.watchlist.actionNeeded')}
              </Tag>
            </div>
          ))}
        </Space>
      ) : (
        <div className="panel-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('inventory.watchlist.empty')}
          />
        </div>
      )}
    </Card>
  );
}