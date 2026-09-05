import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { useMutationFeedback } from '../../../lib/useMutationFeedback';
import {
  fetchDefaultWarehouse,
  fetchInventoryHistory,
  fetchInventoryStock,
  receiveStock,
} from '../api/inventoryService';
import { ReceiveStockPayload } from '../types/inventory.types';


export function useDefaultWarehouse() {
  return useQuery({
    queryKey: queryKeys.inventoryDefaultWarehouse,
    queryFn: fetchDefaultWarehouse,
  });
}

export function useInventoryStock(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.inventoryStock,
    queryFn: fetchInventoryStock,
    enabled: options.enabled ?? true,
  });
}

export function useInventoryHistory() {
  return useQuery({
    queryKey: queryKeys.inventoryHistory,
    queryFn: fetchInventoryHistory,
  });
}

export function useReceiveStock() {
  const { queryClient, message, t, onError } = useMutationFeedback();

  return useMutation({
    mutationFn: (payload: ReceiveStockPayload) => receiveStock(payload),
    onSuccess: async () => {
      message.success(t('toast.inventory.received'));

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
