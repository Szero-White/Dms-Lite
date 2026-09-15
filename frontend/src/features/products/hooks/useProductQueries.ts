import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  createProduct,
  deactivateProduct,
  fetchProductsContent,
  fetchProductRows,
  reactivateProduct,
  updateProduct,
} from '../api/productService';
import { ProductFormValues } from '../types/product.types';

interface QueryOptions {
  enabled?: boolean;
}

export function useProductList(options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => fetchProductsContent(),
    enabled: options.enabled ?? true,
  });
}

export function useProducts(options: QueryOptions = {}) {
  return useQuery({
    queryKey: queryKeys.productRows,
    queryFn: fetchProductRows,
    enabled: options.enabled ?? true,
  });
}

async function invalidateProductQueries(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.products }),
    queryClient.invalidateQueries({ queryKey: queryKeys.productRows }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
  ]);
}

export function useCreateProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: ProductFormValues) => createProduct(payload),
    onSuccess: async () => {
      message.success(t('toast.product.saved'));
      await invalidateProductQueries(queryClient);
    },
    onError,
  });
}

export function useUpdateProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: ProductFormValues;
    }) => updateProduct(productId, payload),
    onSuccess: async () => {
      message.success(t('toast.product.updated'));
      await invalidateProductQueries(queryClient);
    },
    onError,
  });
}

export function useDeactivateProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (productId: number) => deactivateProduct(productId),
    onSuccess: async () => {
      message.success(t('toast.product.deactivated'));
      await invalidateProductQueries(queryClient);
    },
    onError,
  });
}

export function useReactivateProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (productId: number) => reactivateProduct(productId),
    onSuccess: async () => {
      message.success(t('toast.product.reactivated'));
      await invalidateProductQueries(queryClient);
    },
    onError,
  });
}
