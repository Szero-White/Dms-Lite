import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../../components/common/PageHeader';
import { useInventoryStock } from '../../../../features/inventory';
import { toNumber } from '../../../../lib/format';
import {
  PERMISSIONS,
  canViewProductFinancials,
  hasPermission,
  useAuth,
} from '../../../auth';
import { ProductFormDrawer } from '../../components/ProductFormDrawer';
import {
  useCreateProduct,
  useDeleteProduct,
  useProductList,
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
  const deleteProduct = useDeleteProduct();
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'HEALTHY' | 'LOW_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<
    'DEFAULT' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'PRICE_DESC'
  >('DEFAULT');
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
        isLowStock: canViewInventory && stock <= product.minStock,
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
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && product.active) ||
        (statusFilter === 'INACTIVE' && !product.active);
      const matchesStock =
        !canViewInventory ||
        stockFilter === 'ALL' ||
        (stockFilter === 'HEALTHY' && !product.isLowStock) ||
        (stockFilter === 'LOW_STOCK' && product.isLowStock);

      return matchesKeyword && matchesStatus && matchesStock;
    });

    return [...filtered].sort((first, second) => {
      if (sortBy === 'NAME') {
        return first.name.localeCompare(second.name);
      }
      if (canViewInventory && sortBy === 'STOCK_ASC') {
        return first.stock - second.stock;
      }
      if (canViewInventory && sortBy === 'STOCK_DESC') {
        return second.stock - first.stock;
      }
      if (sortBy === 'PRICE_DESC') {
        return toNumber(second.sellingPrice) - toNumber(first.sellingPrice);
      }

      return first.id - second.id;
    });
  }, [canViewInventory, keyword, products, sortBy, statusFilter, stockFilter]);

  const inventoryValue = canViewInventory && showProductFinancials
    ? products.reduce(
        (total, product) => total + toNumber(product.costPrice) * product.stock,
        0,
      )
    : 0;
  const activeCount = products.filter((product) => product.active).length;
  const lowStockCount = canViewInventory
    ? products.filter((product) => product.isLowStock).length
    : 0;
  const avgMargin = showProductFinancials && products.length
    ? products.reduce((sum, product) => {
        const sellingPrice = toNumber(product.sellingPrice);

        return sum + (sellingPrice > 0
          ? ((sellingPrice - toNumber(product.costPrice)) / sellingPrice) * 100
          : 0);
      }, 0) / products.length
    : 0;

  const hasFilters = Boolean(
    keyword ||
    statusFilter !== 'ALL' ||
    (canViewInventory && stockFilter !== 'ALL') ||
    sortBy !== 'DEFAULT',
  );

  function clearFilters() {
    setKeyword('');
    setStatusFilter('ALL');
    setStockFilter('ALL');
    setSortBy('DEFAULT');
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
        onDeleteProduct={(productId) => deleteProduct.mutate(productId)}
        deletingProductId={deleteProduct.isPending ? deleteProduct.variables : undefined}
        onSortByChange={setSortBy}
        onStatusFilterChange={setStatusFilter}
        onStockFilterChange={setStockFilter}
        productsError={queryError}
        showFinancials={showProductFinancials}
        showInventory={canViewInventory}
        sortBy={sortBy}
        statusFilter={statusFilter}
        stockFilter={stockFilter}
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
