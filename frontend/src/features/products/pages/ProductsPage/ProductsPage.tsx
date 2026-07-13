import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { ProductStatusTag } from '../../../../components/common/StatusTag';
import { formatCurrency } from '../../../../lib/format';
import {
  useCreateProduct,
  useProducts,
  useUpdateProduct,
} from '../../hooks/useProductQueries';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import { ProductFormValues, ProductRow } from '../../types/product.types';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const productsQuery = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOW_STOCK'>(
    'ALL',
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return (productsQuery.data ?? []).filter((product) => {
      const matchesKeyword =
        !keyword ||
        [product.name, product.sku, product.barcode].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && product.active) ||
        (statusFilter === 'LOW_STOCK' && product.isLowStock);

      return matchesKeyword && matchesStatus;
    });
  }, [keyword, productsQuery.data, statusFilter]);

  async function handleSubmit(values: ProductFormValues) {
    if (selectedProduct) {
      await updateProduct.mutateAsync({
        productId: selectedProduct.id,
        payload: values,
      });
    } else {
      await createProduct.mutateAsync(values);
    }

    setDrawerOpen(false);
    setSelectedProduct(null);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Products"
        subtitle="Manage catalog, pricing and product availability."
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedProduct(null);
              setDrawerOpen(true);
            }}
          >
            New Product
          </Button>
        }
      />

      <Card className={`panel-card ${styles.tableCard}`}>
        <div className={styles.toolbar}>
          <Input
            allowClear
            className={styles.search}
            prefix={<SearchOutlined />}
            placeholder="Search SKU, name, barcode"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            className={styles.filter}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'ALL', label: 'All status' },
              { value: 'ACTIVE', label: 'Active only' },
              { value: 'LOW_STOCK', label: 'Low stock only' },
            ]}
          />
        </div>

        <QueryState
          isLoading={productsQuery.isLoading}
          isError={productsQuery.isError}
          error={productsQuery.error}
          hasData={filteredProducts.length > 0}
        >
          <Table
            rowKey="id"
            dataSource={filteredProducts}
            onRow={(record) => ({
              onDoubleClick: () => {
                setSelectedProduct(record);
                setDrawerOpen(true);
              },
            })}
            columns={[
              { title: 'SKU', dataIndex: 'sku', width: 140 },
              {
                title: 'Name',
                dataIndex: 'name',
                render: (_, record) => (
                  <Space direction="vertical" size={0}>
                    <Typography.Text strong>{record.name}</Typography.Text>
                    <Typography.Text type="secondary">
                      {record.barcode || 'No barcode'}
                    </Typography.Text>
                  </Space>
                ),
              },
              {
                title: 'Cost Price',
                dataIndex: 'costPrice',
                render: (value) => formatCurrency(value),
              },
              {
                title: 'Selling Price',
                dataIndex: 'sellingPrice',
                render: (value) => formatCurrency(value),
              },
              { title: 'Stock', dataIndex: 'stock' },
              { title: 'Minimum Stock', dataIndex: 'minStock' },
              {
                title: 'Status',
                render: (_, record) => (
                  <ProductStatusTag
                    isLowStock={record.isLowStock}
                    active={record.active}
                  />
                ),
              },
              {
                title: 'Action',
                render: (_, record) => (
                  <Button
                    type="link"
                    onClick={() => {
                      setSelectedProduct(record);
                      setDrawerOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        </QueryState>
      </Card>

      <ProductFormDrawer
        open={drawerOpen}
        product={selectedProduct}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleSubmit}
        submitting={createProduct.isPending || updateProduct.isPending}
      />
    </div>
  );
}
