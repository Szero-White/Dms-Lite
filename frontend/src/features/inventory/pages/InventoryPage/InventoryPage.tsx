import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Form, Row } from 'antd';
import { useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { QueryState } from '../../../../components/common/QueryState';
import { useProducts } from '../../../../features/products';
import {
  useInventoryHistory,
  useReceiveStock,
} from '../../hooks/useInventoryQueries';
import type { ReceiveStockPayload } from '../../types/inventory.types';
import { InventoryHistoryTable } from './components/InventoryHistoryTable';
import { InventoryOverview } from './components/InventoryOverview';
import { InventoryStockTable } from './components/InventoryStockTable';
import { InventoryWatchlist } from './components/InventoryWatchlist';
import { ReceiveStockModal } from './components/ReceiveStockModal';
import { useInventoryPageData } from './hooks/useInventoryPageData';
import type { StockFilter } from './inventoryPage.types';
import styles from './InventoryPage.module.css';

export function InventoryPage() {
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL');
  const [form] = Form.useForm<ReceiveStockPayload>();
  const selectedProductId = Form.useWatch('productId', form);
  const receivedQuantity = Form.useWatch('quantity', form);

  const productsQuery = useProducts();
  const historyQuery = useInventoryHistory();
  const receiveStockMutation = useReceiveStock();

  const products = productsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const {
    filteredProducts,
    hasFilters,
    inventoryValue,
    latestMovementByProduct,
    lowStockItems,
    projectedStock,
    selectedProduct,
    totalUnits,
  } = useInventoryPageData({
    history,
    keyword,
    products,
    receivedQuantity,
    selectedProductId,
    stockFilter,
  });

  function clearFilters() {
    setKeyword('');
    setStockFilter('ALL');
  }

  function handleOpenReceiveModal() {
    form.setFieldsValue({
      warehouseId: 1,
      quantity: 1,
      note: '',
    });

    setIsReceiveModalOpen(true);
  }

  function handleCloseReceiveModal() {
    setIsReceiveModalOpen(false);
    form.resetFields();
  }

  async function handleReceiveStock() {
    const values = await form.validateFields();

    receiveStockMutation.mutate(values, {
      onSuccess: () => {
        handleCloseReceiveModal();
      },
    });
  }

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
        emptyTitle="No inventory products yet"
        emptyDescription="Create products before receiving and monitoring inventory."
        onRetry={() => {
          void Promise.all([productsQuery.refetch(), historyQuery.refetch()]);
        }}
      >
        <div className={styles.contentStack}>
          <InventoryOverview
            inventoryValue={inventoryValue}
            lowStockItems={lowStockItems}
            products={products}
            totalUnits={totalUnits}
          />

          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} xl={16}>
              <InventoryStockTable
                clearFilters={clearFilters}
                filteredProducts={filteredProducts}
                hasFilters={hasFilters}
                keyword={keyword}
                latestMovementByProduct={latestMovementByProduct}
                onKeywordChange={setKeyword}
                onStockFilterChange={setStockFilter}
                stockFilter={stockFilter}
              />
            </Col>

            <Col xs={24} xl={8}>
              <InventoryWatchlist lowStockItems={lowStockItems} />
            </Col>
          </Row>

          <InventoryHistoryTable history={history} products={products} />
        </div>
      </QueryState>

      <ReceiveStockModal
        form={form}
        isOpen={isReceiveModalOpen}
        isSubmitting={receiveStockMutation.isPending}
        onCancel={handleCloseReceiveModal}
        onSubmit={() => {
          void handleReceiveStock();
        }}
        products={products}
        projectedStock={projectedStock}
        receivedQuantity={receivedQuantity}
        selectedProduct={selectedProduct}
      />
    </div>
  );
}
