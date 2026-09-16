import { useMemo } from 'react';
import type { ProductRow } from '../../../../products';
import { toNumber } from '../../../../../lib/format';
import { newestFirst } from '../../../../../lib/tableSorting';
import type { InventoryTransaction } from '../../../types/inventory.types';
import type { StockFilter } from '../inventoryPage.types';

interface UseInventoryPageDataParams {
  history: InventoryTransaction[];
  keyword: string;
  products: ProductRow[];
  receivedQuantity?: number;
  selectedProductId?: number;
  stockFilters: StockFilter[];
}

export function useInventoryPageData({
  history,
  keyword,
  products,
  receivedQuantity,
  selectedProductId,
  stockFilters,
}: UseInventoryPageDataParams) {
  const lowStockItems = useMemo(
    () => products.filter((product) => product.isLowStock),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      newestFirst(products.filter((product) => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        const matchesKeyword =
          !normalizedKeyword ||
          [product.name, product.sku, product.barcode].some((value) =>
            value?.toLowerCase().includes(normalizedKeyword),
          );
        const stockState: StockFilter = product.isLowStock ? 'LOW' : 'HEALTHY';
        const matchesStock =
          stockFilters.length === 0 ||
          (product.active && stockFilters.includes(stockState));

        return matchesKeyword && matchesStock;
      })),
    [keyword, products, stockFilters],
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

  const hasFilters = Boolean(keyword || stockFilters.length > 0);

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
