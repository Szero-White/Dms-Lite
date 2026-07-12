import { fetchInventoryStock } from '../../../services/inventoryService';
import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import { Product, ProductFormValues, ProductRow } from '../types/product.types';

export async function fetchProducts(keyword = '') {
  return unwrapResponse<PageResponse<Product>>(
    apiClient.get('/products', { params: { keyword } }),
  );
}

export async function fetchProductRows() {
  const [productsPage, stockItems] = await Promise.all([
    fetchProducts(),
    fetchInventoryStock(),
  ]);

  const stockMap = new Map(
    stockItems.map((item) => [item.productId, item.quantityOnHand]),
  );

  return productsPage.content.map((product): ProductRow => {
    const stock = stockMap.get(product.id) ?? 0;

    return {
      ...product,
      stock,
      status: product.active ? 'ACTIVE' : 'INACTIVE',
      isLowStock: stock <= product.minStock,
    };
  });
}

export async function createProduct(payload: ProductFormValues) {
  return unwrapResponse<Product>(apiClient.post('/products', payload));
}

export async function updateProduct(
  productId: number,
  payload: ProductFormValues,
) {
  return unwrapResponse<Product>(apiClient.put(`/products/${productId}`, payload));
}
