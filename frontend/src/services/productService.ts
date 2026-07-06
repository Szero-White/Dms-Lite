import { apiClient, unwrapResponse } from './apiClient';
import { PageResponse, Product, ProductFormValues } from '../types';

export async function fetchProducts(keyword = '') {
  return unwrapResponse<PageResponse<Product>>(apiClient.get('/products', { params: { keyword } }));
}

export async function createProduct(payload: ProductFormValues) {
  return unwrapResponse<Product>(apiClient.post('/products', payload));
}

export async function updateProduct(productId: number, payload: ProductFormValues) {
  return unwrapResponse<Product>(apiClient.put(`/products/${productId}`, payload));
}
