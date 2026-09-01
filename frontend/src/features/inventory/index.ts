export { fetchDefaultWarehouse, fetchInventoryHistory, fetchInventoryStock, receiveStock } from './api';
export {
  useDefaultWarehouse,
  useInventoryHistory,
  useInventoryStock,
  useReceiveStock,
} from './hooks/useInventoryQueries';
export { InventoryPage } from './pages/InventoryPage';
export type {
  InventoryTransaction,
  Warehouse,
  ReceiveStockPayload,
  StockItem,
} from './types/inventory.types';
