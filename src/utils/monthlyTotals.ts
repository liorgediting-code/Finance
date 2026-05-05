import type { MonthData, IncomeEntry, ExpenseEntry } from '../types';
import { isEntryFuture } from './calculations';

export function computeMonthTotals(
  monthData: MonthData | undefined,
  recurringIncomes: IncomeEntry[],
  recurringExpenses: ExpenseEntry[],
): { totalIncome: number; totalExpenses: number; net: number } {
  const totalIncome =
    recurringIncomes.reduce((s, e) => s + e.amount, 0) +
    (monthData?.income ?? []).filter((e) => !isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  const totalExpenses =
    recurringExpenses.reduce((s, e) => s + e.amount, 0) +
    (monthData?.expenses ?? []).filter((e) => !isEntryFuture(e)).reduce((s, e) => s + e.amount, 0);
  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}
