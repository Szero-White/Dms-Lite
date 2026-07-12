import { Bar } from '@ant-design/charts';
import { Card, Empty } from 'antd';
import type { ProductRow } from '../../../../features/products';
import styles from './InventoryStockChart.module.css';

interface InventoryStockChartProps {
  products: ProductRow[];
}

export function InventoryStockChart({
  products,
}: InventoryStockChartProps) {
  const chartData = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 10)
    .map((product) => ({
      productName: product.name,
      stock: product.stock,
      minimumStock: product.minStock,
    }));

  return (
    <Card
      title="Inventory Stock Level"
      className={`panel-card ${styles.card}`}
    >
      {chartData.length ? (
        <Bar
          data={chartData}
          xField="productName"
          yField="stock"
          height={360}
          padding="auto"
          axis={{
            x: {
              title: false,
            },
            y: {
              title: 'Quantity on hand',
            },
          }}
          label={{
            text: 'stock',
            position: 'right',
          }}
          tooltip={{
            title: 'productName',
            items: [
              {
                field: 'stock',
                name: 'On hand',
              },
              {
                field: 'minimumStock',
                name: 'Minimum stock',
              },
            ],
          }}
          style={{
            radiusTopRight: 7,
            radiusBottomRight: 7,
          }}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No inventory data"
          />
        </div>
      )}
    </Card>
  );
}
