import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useProducts } from '../../../../features/products';
import { formatDateTime } from '../../../../lib/format';
import {
  useInventoryHistory,
  useReceiveStock,
} from '../../hooks/useInventoryQueries';
import { ReceiveStockPayload } from '../../types/inventory.types';
import styles from './InventoryPage.module.css';

export function InventoryPage() {
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [form] = Form.useForm<ReceiveStockPayload>();

  const productsQuery = useProducts();
  const historyQuery = useInventoryHistory();
  const receiveStockMutation = useReceiveStock();

  const lowStockItems = useMemo(
    () => (productsQuery.data ?? []).filter((product) => product.isLowStock),
    [productsQuery.data],
  );

  const handleOpenReceiveModal = () => {
    form.setFieldsValue({
      warehouseId: 1,
      quantity: 1,
      note: '',
    });

    setIsReceiveModalOpen(true);
  };

  const handleCloseReceiveModal = () => {
    setIsReceiveModalOpen(false);
    form.resetFields();
  };

  const handleReceiveStock = async () => {
    const values = await form.validateFields();

    receiveStockMutation.mutate(values, {
      onSuccess: () => {
        handleCloseReceiveModal();
      },
    });
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Inventory"
        subtitle="Monitor on-hand stock, low-stock warnings, and movement history."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenReceiveModal}
          >
            Receive Stock
          </Button>
        }
      />

      <QueryState
        isLoading={productsQuery.isLoading || historyQuery.isLoading}
        isError={productsQuery.isError || historyQuery.isError}
        error={productsQuery.error || historyQuery.error}
        hasData={Boolean(productsQuery.data?.length)}
      >
        <div className={styles.contentStack}>
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={16}>
            <Card className={`panel-card ${styles.stockCard}`} title="Stock by Product">
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
                      <Tag
                        className={`${styles.stockTag} ${
                          record.isLowStock ? styles.lowStock : styles.healthy
                        }`}
                      >
                        {record.isLowStock ? 'LOW STOCK' : 'HEALTHY'}
                      </Tag>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} xl={8}>
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
                          {product.sku} - On hand {product.stock} / Min{' '}
                          {product.minStock}
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
          </Col>
        </Row>

        <Card className={`panel-card ${styles.historyCard}`} title="Inventory History">
          <Table
            rowKey="id"
            dataSource={historyQuery.data ?? []}
            columns={[
              {
                title: 'Time',
                dataIndex: 'createdAt',
                render: (value) => formatDateTime(value),
              },
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
        </div>
      </QueryState>

      <Modal
        rootClassName={styles.modal}
        title="Receive Stock"
        open={isReceiveModalOpen}
        onCancel={handleCloseReceiveModal}
        onOk={handleReceiveStock}
        okText="Receive"
        cancelText="Cancel"
        confirmLoading={receiveStockMutation.isPending}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="Warehouse"
            name="warehouseId"
            rules={[
              {
                required: true,
                message: 'Please select a warehouse',
              },
            ]}
          >
            <Select
              options={[
                {
                  value: 1,
                  label: 'Main Warehouse',
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Product"
            name="productId"
            rules={[
              {
                required: true,
                message: 'Please select a product',
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="label"
              options={(productsQuery.data ?? []).map((product) => ({
                value: product.id,
                label: `${product.sku} - ${product.name}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              {
                required: true,
                message: 'Please enter quantity',
              },
            ]}
          >
            <InputNumber className={styles.fullWidth} min={1} precision={0} />
          </Form.Item>

          <Form.Item label="Note" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Example: Initial stock receipt"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
