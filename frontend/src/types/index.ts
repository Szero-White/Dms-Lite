export type RoleCode = 'OWNER' | 'SALE_STAFF' | 'WAREHOUSE' | 'ACCOUNTANT' | string;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
