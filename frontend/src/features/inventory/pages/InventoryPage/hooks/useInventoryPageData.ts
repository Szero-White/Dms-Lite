import { useMemo } from 'react';
import type { ProductRow } from '../../../../products';
import { toNumber } from '../../../../../lib/format';
import type { InventoryTransaction } from '../../../types/inventory.types';
import type { StockFilter } from '../inventoryPage.types';

interface UseInventoryPageDataParams {
  history: InventoryTransaction[];
  keyword: string;
  products: ProductRow[];
  receivedQuantity?: number;
  selectedProductId?: number;
  stockFilter: StockFilter;
}

export function useInventoryPageData({
  history,
  keyword,
  products,
  receivedQuantity,
  selectedProductId,
  stockFilter,
}: UseInventoryPageDataParams) {
  const lowStockItems = useMemo(
    () => products.filter((product) => product.isLowStock),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const matchesKeyword =
          !normalizedKeyword ||
          [product.name, product.sku, product.barcode].some((value) =>
            value?.toLowerCase().includes(normalizedKeyword),
          );
        const matchesStock =
          stockFilter === 'ALL' ||
          (stockFilter === 'LOW' && product.isLowStock) ||
          (stockFilter === 'HEALTHY' && !product.isLowStock);

        return matchesKeyword && matchesStock;
      }),
    [keyword, products, stockFilter],
  );

  const latestMovementByProduct = useMemo(() => {
    const result = new Map<number, string>();

    history.forEach((transaction) => {
      if (!result.has(transaction.productId)) {
        result.set(transaction.productId, transaction.createdAt);
      }
    });

    return result;
  }, [history]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId),
    [products, selectedProductId],
  );

  const projectedStock = selectedProduct
    ? selectedProduct.stock + toNumber(receivedQuantity)
    : 0;

  const totalUnits = useMemo(
    () => products.reduce((total, product) => total + toNumber(product.stock), 0),
    [products],
  );

  const inventoryValue = useMemo(
    () =>
      products.reduce(
        (total, product) =>
          total + toNumber(product.costPrice) * toNumber(product.stock),
        0,
      ),
    [products],
  );

  const hasFilters = Boolean(keyword || stockFilter !== 'ALL');

  return {
    filteredProducts,
    hasFilters,
    inventoryValue,
    latestMovementByProduct,
    lowStockItems,
    projectedStock,
    selectedProduct,
    totalUnits,
  };
}
