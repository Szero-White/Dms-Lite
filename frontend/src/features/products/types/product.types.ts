export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  costPrice: string | number;
  sellingPrice: string | number;
  minStock: number;
  active: boolean;
}

export interface ProductFormValues {
  name: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  minStock: number;
}

export interface ProductRow extends Product {
  stock: number;
  status: ProductStatus;
  isLowStock: boolean;
}
