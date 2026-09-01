import { apiClient, unwrapResponse } from '../../../services/apiClient';
import { PageResponse } from '../../../types';
import {
  InventoryTransaction,
  Warehouse,
  ReceiveStockPayload,
  StockItem,
} from '../types/inventory.types';

interface InventoryHistoryParams {
  page?: number;
  size?: number;
}

export async function fetchDefaultWarehouse() {
  return unwrapResponse<Warehouse>(apiClient.get('/inventory/default-warehouse'));
}

export async function fetchInventoryStock() {
  return unwrapResponse<StockItem[]>(apiClient.get('/inventory/stock'));
}

export async function fetchInventoryHistoryPage(params: InventoryHistoryParams = {}) {
  return unwrapResponse<PageResponse<InventoryTransaction>>(
    apiClient.get('/inventory/transactions', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 50,
      },
    }),
  );
}

export async function fetchInventoryHistory() {
  const historyPage = await fetchInventoryHistoryPage();

  return historyPage.content;
}

export async function receiveStock(
  payload: ReceiveStockPayload,
): Promise<void> {
  await apiClient.post('/inventory/receive', payload);
}
