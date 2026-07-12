import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getErrorMessage } from '../../../lib/format';
import {
  createProduct,
  fetchProductRows,
  updateProduct,
} from '../api/productService';
import { ProductFormValues } from '../types/product.types';

function useMutationFeedback() {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return {
    queryClient,
    message,
    onError(error: unknown) {
      message.error(getErrorMessage(error));
    },
  };
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProductRows,
  });
}

export function useCreateProduct() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: ProductFormValues) => createProduct(payload),
    onSuccess: async () => {
      message.success('Product saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
    },
    onError,
  });
}

export function useUpdateProduct() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: ({
      productId,
      payload,
    }: {
      productId: number;
      payload: ProductFormValues;
    }) => updateProduct(productId, payload),
    onSuccess: async () => {
      message.success('Product updated.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
    onError,
  });
}
