import { fetchInventoryStock } from '../../../features/inventory/api';
import { fetchAllPages } from '../../../lib/fetchAllPages';
import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import { Product, ProductFormValues, ProductRow } from '../types/product.types';

export async function fetchProducts(keyword = '', page = 0, size = 20) {
  return unwrapResponse<PageResponse<Product>>(
    apiClient.get('/products', { params: { keyword, page, size } }),
  );
}

export async function fetchProductsContent(keyword = '') {
  return fetchAllPages((page, size) => fetchProducts(keyword, page, size));
}

export async function fetchProductRows() {
  const [products, stockItems] = await Promise.all([
    fetchProductsContent(),
    fetchInventoryStock(),
  ]);

  const stockMap = new Map(
    stockItems.map((item) => [item.productId, item.quantityOnHand]),
  );

  return products.map((product): ProductRow => {
    const stock = stockMap.get(product.id) ?? 0;

    return {
      ...product,
      stock,
      status: product.active ? 'ACTIVE' : 'INACTIVE',
      isLowStock: product.active && stock <= product.minStock,
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

export async function deactivateProduct(productId: number) {
  return unwrapResponse<Product>(apiClient.post(`/products/${productId}/deactivate`));
}

export async function reactivateProduct(productId: number) {
  return unwrapResponse<Product>(apiClient.post(`/products/${productId}/reactivate`));
}
