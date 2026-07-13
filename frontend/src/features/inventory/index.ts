export { fetchInventoryHistory, fetchInventoryStock, receiveStock } from './api';
export {
  useInventoryHistory,
  useInventoryStock,
  useReceiveStock,
} from './hooks/useInventoryQueries';
export { InventoryPage } from './pages/InventoryPage';
export type {
  InventoryTransaction,
  ReceiveStockPayload,
  StockItem,
} from './types/inventory.types';
