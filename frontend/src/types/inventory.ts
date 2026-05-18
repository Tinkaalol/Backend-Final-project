import type { Product, ProductStock } from './product';
import type { Location } from './location';

export type MovementType = 'INCOME' | 'EXPENSE' | 'ADJUSTMENT' | 'WRITEOFF';

export type ExpenseReason = 'SALE' | 'DAMAGE' | 'RETURN' | 'WRITEOFF';

export interface MovementLog {
  id: string;
  stockId: string;
  userId: string;
  type: MovementType;
  quantityDelta: number;
  quantityAfter: number;
  note: string | null;
  createdAt: string;
  stock?: ProductStock & { product?: Product; location?: Location };
  user?: { id: string; email: string; role: string };
}

export interface IncomeInput {
  productId: string;
  locationId: string;
  quantity: number;
  note?: string;
}

export interface ExpenseInput {
  productId: string;
  locationId: string;
  quantity: number;
  reason: ExpenseReason;
  note?: string;
}

export interface TransferInput {
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  note?: string;
}

export interface LowStockAlert {
  product: Product;
  location: Location;
  deficit: number | null;
  triggeredAt: string;
}

export interface MovementHistoryQuery {
  cursor?: string;
  limit?: number;
  productId?: string;
  locationId?: string;
  type?: MovementType;
}
