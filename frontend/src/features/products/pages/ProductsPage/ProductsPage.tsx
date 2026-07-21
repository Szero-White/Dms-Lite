import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { toNumber } from '../../../../lib/format';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import {
  useCreateProduct,
  useDeleteProduct,
  useProducts,
  useUpdateProduct,
} from '../../hooks/useProductQueries';
import type { ProductFormValues, ProductRow } from '../../types/product.types';
import { ProductsScoreboard } from './components/ProductsScoreboard/ProductsScoreboard';
import { ProductsTableCard } from './components/ProductsTableCard/ProductsTableCard';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const productsQuery = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<
    'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC'
  >('DEFAULT');
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const products = (productsQuery.data ?? []).filter((product) => {
      const matchesKeyword =
        !keyword ||
        [product.name, product.sku, product.barcode].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && product.active) ||
        (statusFilter === 'INACTIVE' && !product.active);
      const matchesStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'HEALTHY' && !product.isLowStock) ||
        (stockFilter === 'LOW_STOCK' && product.isLowStock);

      return matchesKeyword && matchesStatus && matchesStock;
    });

    return [...products].sort((first, second) => {
      if (sortBy === 'NAME') {
        return first.name.localeCompare(second.name);
      }
      if (sortBy === 'STOCK_ASC') {
        return first.stock - second.stock;
      }
      if (sortBy === 'STOCK_DESC') {
        return second.stock - first.stock;
      }
      if (sortBy === 'PRICE_DESC') {
        return toNumber(second.sellingPrice) - toNumber(first.sellingPrice);
      }

      return first.id - second.id;
    });
  }, [keyword, productsQuery.data, sortBy, statusFilter, stockFilter]);

  const products = productsQuery.data ?? [];
  const inventoryValue = products.reduce(
    (total, product) => total + toNumber(product.costPrice) * product.stock,
    0,
  );
  const activeCount = products.filter((product) => product.active).length;
  const lowStockCount = products.filter((product) => product.isLowStock).length;
  const avgMargin = products.length
    ? products.reduce((sum, product) => {
        const sellingPrice = toNumber(product.sellingPrice);

        return sum + (sellingPrice > 0
          ? ((sellingPrice - toNumber(product.costPrice)) / sellingPrice) * 100
          : 0);
      }, 0) / products.length
    : 0;

  const hasFilters = Boolean(
    keyword || statusFilter !== 'ALL' || stockFilter !== 'ALL' || sortBy !== 'DEFAULT',
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setStockFilter('ALL');
    setSortBy('DEFAULT');
  }

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

      <ProductsScoreboard
        activeCount={activeCount}
        avgMargin={avgMargin}
        inventoryValue={inventoryValue}
        lowStockCount={lowStockCount}
        totalProducts={products.length}
      />

      <ProductsTableCard
        filteredProducts={filteredProducts}
        hasFilters={hasFilters}
        isError={productsQuery.isError}
        isLoading={productsQuery.isLoading}
        keyword={keyword}
        onClearFilters={clearFilters}
        onKeywordChange={setKeyword}
        onRetry={() => {
          void productsQuery.refetch();
        }}
        onSelectProduct={setSelectedProduct}
        onSetDrawerOpen={setDrawerOpen}
        onDeleteProduct={(productId) => deleteProduct.mutate(productId)}
        deletingProductId={deleteProduct.isPending ? deleteProduct.variables : undefined}
        onSortByChange={setSortBy}
        onStatusFilterChange={setStatusFilter}
        onStockFilterChange={setStockFilter}
        productsError={productsQuery.error}
        sortBy={sortBy}
        statusFilter={statusFilter}
        stockFilter={stockFilter}
      />

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
