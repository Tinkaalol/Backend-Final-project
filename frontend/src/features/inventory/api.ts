import { api } from '@/lib/api';
import type {
  ExpenseInput,
  IncomeInput,
  LowStockAlert,
  MovementHistoryQuery,
  MovementLog,
  TransferInput,
} from '@/types/inventory';
import type { ProductStock } from '@/types/product';
import type { Paginated } from '@/types/api';

export async function recordIncome(input: IncomeInput): Promise<ProductStock> {
  const { data } = await api.post<ProductStock>('/inventory/income', input);
  return data;
}

export async function recordExpense(input: ExpenseInput): Promise<ProductStock> {
  const { data } = await api.post<ProductStock>('/inventory/expense', input);
  return data;
}

export async function transferStock(input: TransferInput): Promise<{
  from: ProductStock;
  to: ProductStock;
}> {
  const { data } = await api.post<{ from: ProductStock; to: ProductStock }>(
    '/inventory/transfer',
    input,
  );
  return data;
}

export async function getMovementHistory(
  query: MovementHistoryQuery = {},
): Promise<Paginated<MovementLog>> {
  const { data } = await api.get<Paginated<MovementLog>>('/inventory/history', {
    params: query,
  });
  return data;
}

export async function getLowStockAlerts(locationId?: string): Promise<LowStockAlert[]> {
  const { data } = await api.get<{ data: LowStockAlert[] }>('/inventory/low-stock', {
    params: locationId ? { locationId } : undefined,
  });
  return data.data;
}
