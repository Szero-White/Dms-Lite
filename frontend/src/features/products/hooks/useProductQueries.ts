import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  createProduct,
  deleteProduct,
  fetchProductsContent,
  fetchProductRows,
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

export function useCreateProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: ProductFormValues) => createProduct(payload),
    onSuccess: async () => {
      message.success(t('toast.product.saved'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productRows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productRows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useDeleteProduct() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onSuccess: async () => {
      message.success(t('toast.product.deleted'));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.productRows }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}
