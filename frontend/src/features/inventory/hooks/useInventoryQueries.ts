import { App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { getErrorMessage } from '../../../lib/format';
import {
  fetchInventoryHistory,
  fetchInventoryStock,
  receiveStock,
} from '../api/inventoryService';
import { ReceiveStockPayload } from '../types/inventory.types';

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

export function useInventoryStock() {
  return useQuery({
    queryKey: queryKeys.inventoryStock,
    queryFn: fetchInventoryStock,
  });
}

export function useInventoryHistory() {
  return useQuery({
    queryKey: queryKeys.inventoryHistory,
    queryFn: fetchInventoryHistory,
  });
}

export function useReceiveStock() {
  const { queryClient, message, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: ReceiveStockPayload) => receiveStock(payload),
    onSuccess: async () => {
      message.success('Stock received successfully.');

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryStock }),
        queryClient.invalidateQueries({ queryKey: queryKeys.inventoryHistory }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
      ]);
    },
    onError,
  });
}
