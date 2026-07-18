import { Card, Empty, Space, Tag, Typography } from 'antd';
import type { ProductRow } from '../../../../products';
import styles from '../InventoryPage.module.css';

interface InventoryWatchlistProps {
  lowStockItems: ProductRow[];
}

export function InventoryWatchlist({ lowStockItems }: InventoryWatchlistProps) {
  return (
    <Card className={`panel-card ${styles.watchlistCard}`} title="Low Stock Watchlist">
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
                  {product.sku} - On hand {product.stock} / Min {product.minStock}
                </Typography.Paragraph>
              </div>

              <Tag className={`${styles.stockTag} ${styles.lowStock}`}>
                Action needed
              </Tag>
            </div>
          ))}
        </Space>
      ) : (
        <div className="panel-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No low stock items"
          />
        </div>
      )}
    </Card>
  );
}
