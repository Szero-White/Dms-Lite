import { apiClient, unwrapResponse } from './apiClient';
import { InventoryTransaction, StockItem } from '../types';

export async function fetchInventoryStock() {
  return unwrapResponse<StockItem[]>(apiClient.get('/inventory/stock'));
}

export async function fetchInventoryHistory() {
  return unwrapResponse<InventoryTransaction[]>(apiClient.get('/inventory/transactions'));
}
