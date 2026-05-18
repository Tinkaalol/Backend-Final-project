import type { Location } from './location';

export type Category = 'EQUIPMENT' | 'COFFEE' | 'ACCESSORIES';

export type ProductStatus =
  | 'ACTIVE'
  | 'DISPLAY_SAMPLE'
  | 'DISCONTINUED'
  | 'CRITICAL_DEADSTOCK';

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: Category;
  status: ProductStatus;
  basePrice: number;
  costPrice: number;
  discountPercent: number;
  currentPrice: number;
  daysInInventory: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  stocks?: ProductStock[];
}

export interface ProductStock {
  id: string;
  quantity: number;
  reorderThreshold: number;
  productId: string;
  locationId: string;
  updatedAt: string;
  location?: Location;
}

export interface CreateProductInput {
  sku: string;
  name: string;
  brand: string;
  category: Category;
  basePrice: number;
  costPrice: number;
}

export interface UpdateProductInput {
  name?: string;
  brand?: string;
  basePrice?: number;
  status?: Exclude<ProductStatus, 'CRITICAL_DEADSTOCK'>;
}

export interface ProductListQuery {
  cursor?: string;
  limit?: number;
  category?: Category;
  status?: ProductStatus;
  brand?: string;
  sort?: '-createdAt' | 'createdAt' | 'currentPrice' | '-currentPrice';
}
