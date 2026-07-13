import { apiClient, unwrapResponse } from '../../../services/apiClient';
import {
  InventoryTransaction,
  ReceiveStockPayload,
  StockItem,
} from '../types/inventory.types';

export async function fetchInventoryStock() {
  return unwrapResponse<StockItem[]>(apiClient.get('/inventory/stock'));
}

export async function fetchInventoryHistory() {
  return unwrapResponse<InventoryTransaction[]>(
    apiClient.get('/inventory/transactions'),
  );
}

export async function receiveStock(
  payload: ReceiveStockPayload,
): Promise<void> {
  await apiClient.post('/inventory/receive', payload);
}
