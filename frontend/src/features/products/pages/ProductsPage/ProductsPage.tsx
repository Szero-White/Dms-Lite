import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { useInventoryStock } from '../../../../features/inventory';
import { toNumber } from '../../../../lib/format';
import { newestFirst } from '../../../../lib/tableSorting';
import {
  PERMISSIONS,
  canViewProductFinancials,
  hasPermission,
  useAuth,
} from '../../../auth';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import {
  useCreateProduct,
  useDeactivateProduct,
  useProductList,
  useReactivateProduct,
  useUpdateProduct,
} from '../../hooks/useProductQueries';
import type { ProductFormValues, ProductRow } from '../../types/product.types';
import { ProductsScoreboard } from './components/ProductsScoreboard/ProductsScoreboard';
import { ProductsTableCard } from './components/ProductsTableCard/ProductsTableCard';
import styles from './ProductsPage.module.css';

export function ProductsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManageProducts = hasPermission(user, PERMISSIONS.PRODUCT_MANAGE);
  const canViewInventory = hasPermission(user, PERMISSIONS.INVENTORY_VIEW);
  const showProductFinancials = canViewProductFinancials(user);
  const productsQuery = useProductList();
  const stockQuery = useInventoryStock({ enabled: canViewInventory });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deactivateProduct = useDeactivateProduct();
  const reactivateProduct = useReactivateProduct();
  const [keyword, setKeyword] = useState('');
  const [statusFilters, setStatusFilters] = useState<Array<'ACTIVE' | 'INACTIVE'>>([]);
  const [stockFilters, setStockFilters] = useState<Array<'HEALTHY' | 'LOW_STOCK'>>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const products = useMemo(() => {
    const stockMap = new Map(
      (canViewInventory ? stockQuery.data ?? [] : [])
        .map((item) => [item.productId, item.quantityOnHand]),
    );

    return (productsQuery.data ?? []).map((product): ProductRow => {
      const stock = canViewInventory ? stockMap.get(product.id) ?? 0 : 0;

      return {
        ...product,
        stock,
        status: product.active ? 'ACTIVE' : 'INACTIVE',
        isLowStock: canViewInventory && product.active && stock <= product.minStock,
      };
    });
  }, [canViewInventory, productsQuery.data, stockQuery.data]);

  const filteredProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesKeyword =
        !keyword ||
        [product.name, product.sku, product.barcode].some((value) =>
          value?.toLowerCase().includes(keyword.toLowerCase()),
        );
      const productStatus = product.active ? 'ACTIVE' : 'INACTIVE';
      const stockStatus = product.active && product.isLowStock ? 'LOW_STOCK' : 'HEALTHY';
      const matchesStatus = statusFilters.length === 0 || statusFilters.includes(productStatus);
      const matchesStock =
        !canViewInventory ||
        stockFilters.length === 0 ||
        (product.active && stockFilters.includes(stockStatus));

      return matchesKeyword && matchesStatus && matchesStock;
    });

    return newestFirst(filtered);
  }, [canViewInventory, keyword, products, statusFilters, stockFilters]);

  const inventoryValue = canViewInventory && showProductFinancials
    ? products.reduce(
        (total, product) => total + toNumber(product.costPrice) * product.stock,
        0,
      )
    : 0;
  const activeProducts = products.filter((product) => product.active);
  const activeCount = activeProducts.length;
  const lowStockCount = canViewInventory
    ? activeProducts.filter((product) => product.isLowStock).length
    : 0;
  const avgMargin = showProductFinancials && activeProducts.length
    ? activeProducts.reduce((sum, product) => {
        const sellingPrice = toNumber(product.sellingPrice);

        return sum + (sellingPrice > 0
          ? ((sellingPrice - toNumber(product.costPrice)) / sellingPrice) * 100
          : 0);
      }, 0) / activeProducts.length
    : 0;

  const hasFilters = Boolean(
    keyword ||
    statusFilters.length > 0 ||
    (canViewInventory && stockFilters.length > 0)
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilters([]);
    setStockFilters([]);
  }

  async function handleSubmit(values: ProductFormValues) {
    if (!canManageProducts) {
      return;
    }

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

  const isLoading = productsQuery.isLoading || (canViewInventory && stockQuery.isLoading);
  const isError = productsQuery.isError || (canViewInventory && stockQuery.isError);
  const queryError = productsQuery.error || (canViewInventory ? stockQuery.error : null);

  return (
    <div className={styles.page}>
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        extra={canManageProducts ? (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedProduct(null);
              setDrawerOpen(true);
            }}
          >
            {t('products.action.new')}
          </Button>
        ) : null}
      />

      <ProductsScoreboard
        activeCount={activeCount}
        avgMargin={avgMargin}
        inventoryValue={inventoryValue}
        lowStockCount={lowStockCount}
        showFinancials={showProductFinancials}
        showInventory={canViewInventory}
        totalProducts={products.length}
      />

      <ProductsTableCard
        canManageProducts={canManageProducts}
        filteredProducts={filteredProducts}
        hasFilters={hasFilters}
        isError={isError}
        isLoading={isLoading}
        keyword={keyword}
        onClearFilters={clearFilters}
        onKeywordChange={setKeyword}
        onRetry={() => {
          void productsQuery.refetch();
          if (canViewInventory) {
            void stockQuery.refetch();
          }
        }}
        onSelectProduct={setSelectedProduct}
        onSetDrawerOpen={setDrawerOpen}
        onDeactivateProduct={(productId) => deactivateProduct.mutate(productId)}
        onReactivateProduct={(productId) => reactivateProduct.mutate(productId)}
        changingStatusProductId={
          deactivateProduct.isPending
            ? deactivateProduct.variables
            : reactivateProduct.isPending
              ? reactivateProduct.variables
              : undefined
        }
        onStatusFiltersChange={setStatusFilters}
        onStockFiltersChange={setStockFilters}
        productsError={queryError}
        showFinancials={showProductFinancials}
        showInventory={canViewInventory}
        statusFilters={statusFilters}
        stockFilters={stockFilters}
      />

      {canManageProducts ? (
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
      ) : null}
    </div>
  );
}
