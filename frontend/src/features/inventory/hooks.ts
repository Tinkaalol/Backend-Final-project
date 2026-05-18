import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLowStockAlerts,
  getMovementHistory,
  recordExpense,
  recordIncome,
  transferStock,
} from './api';
import type {
  ExpenseInput,
  IncomeInput,
  MovementHistoryQuery,
  TransferInput,
} from '@/types/inventory';

function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['products'] });
  qc.invalidateQueries({ queryKey: ['product'] });
  qc.invalidateQueries({ queryKey: ['movements'] });
  qc.invalidateQueries({ queryKey: ['lowStock'] });
  qc.invalidateQueries({ queryKey: ['locations'] });
}

export function useMovementHistory(query: MovementHistoryQuery) {
  return useQuery({
    queryKey: ['movements', query],
    queryFn: () => getMovementHistory(query),
  });
}

export function useLowStock(locationId?: string) {
  return useQuery({
    queryKey: ['lowStock', locationId ?? null],
    queryFn: () => getLowStockAlerts(locationId),
  });
}

export function useRecordIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IncomeInput) => recordIncome(input),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useRecordExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) => recordExpense(input),
    onSuccess: () => invalidateInventory(qc),
  });
}

export function useTransferStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferInput) => transferStock(input),
    onSuccess: () => invalidateInventory(qc),
  });
}
