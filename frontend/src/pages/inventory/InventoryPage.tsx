import { Card, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import { useMemo } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { QueryState } from '../../components/common/QueryState';
import { useInventoryHistory, useProducts } from '../../hooks/useAppQueries';
import { formatDateTime } from '../../lib/format';

export function InventoryPage() {
  const productsQuery = useProducts();
  const historyQuery = useInventoryHistory();

  const lowStockItems = useMemo(
    () => (productsQuery.data ?? []).filter((product) => product.isLowStock),
    [productsQuery.data],
  );

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <PageHeader
        title="Inventory"
        subtitle="Monitor on-hand stock, low-stock warnings, and movement history."
      />

      <QueryState
        isLoading={productsQuery.isLoading || historyQuery.isLoading}
        isError={productsQuery.isError || historyQuery.isError}
        error={productsQuery.error || historyQuery.error}
        hasData={Boolean(productsQuery.data?.length)}
      >
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={15}>
            <Card className="panel-card panel-card-stretch" title="Stock by Product">
              <Table
                rowKey="id"
                dataSource={productsQuery.data ?? []}
                pagination={false}
                columns={[
                  { title: 'SKU', dataIndex: 'sku' },
                  { title: 'Product', dataIndex: 'name' },
                  { title: 'On Hand', dataIndex: 'stock' },
                  { title: 'Minimum', dataIndex: 'minStock' },
                  {
                    title: 'Status',
                    render: (_, record) => (
                      <Tag color={record.isLowStock ? 'warning' : 'success'}>
                        {record.isLowStock ? 'LOW STOCK' : 'HEALTHY'}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} xl={9}>
            <Card className="panel-card panel-card-stretch" title="Low Stock Watchlist">
              {lowStockItems.length ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {lowStockItems.map((product) => (
                    <div className="alert-row" key={product.id}>
                      <div>
                        <Typography.Text strong>{product.name}</Typography.Text>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                          {product.sku} - On hand {product.stock} / Min {product.minStock}
                        </Typography.Paragraph>
                      </div>
                      <Tag color="warning">Action needed</Tag>
                    </div>
                  ))}
                </Space>
              ) : (
                <div className="panel-empty">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No low stock items" />
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Card className="panel-card" title="Inventory History">
          <Table
            rowKey="id"
            dataSource={historyQuery.data ?? []}
            columns={[
              { title: 'Time', dataIndex: 'createdAt', render: (value) => formatDateTime(value) },
              { title: 'Product ID', dataIndex: 'productId' },
              { title: 'Source', dataIndex: 'sourceType' },
              { title: 'Direction', dataIndex: 'direction' },
              { title: 'Qty', dataIndex: 'quantity' },
              { title: 'Before', dataIndex: 'beforeQuantity' },
              { title: 'After', dataIndex: 'afterQuantity' },
              { title: 'Note', dataIndex: 'note' },
            ]}
          />
        </Card>
      </QueryState>
    </Space>
  );
}
