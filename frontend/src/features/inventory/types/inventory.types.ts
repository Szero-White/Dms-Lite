export interface StockItem {
  id: number;
  warehouseId: number;
  productId: number;
  quantityOnHand: number;
}

export interface ReceiveStockPayload {
  warehouseId: number;
  productId: number;
  quantity: number;
  note?: string;
}

export interface InventoryTransaction {
  id: number;
  warehouseId: number;
  productId: number;
  sourceType: string;
  sourceId?: number;
  direction: 'IN' | 'OUT' | string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  note?: string;
  createdBy?: number;
  createdAt: string;
}
