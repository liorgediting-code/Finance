import type { MonthData, IncomeEntry, ExpenseEntry } from '../types';

export function computeMonthTotals(
  monthData: MonthData | undefined,
  recurringIncomes: IncomeEntry[],
  recurringExpenses: ExpenseEntry[],
): { totalIncome: number; totalExpenses: number; net: number } {
  const totalIncome =
    recurringIncomes.reduce((s, e) => s + e.amount, 0) +
    (monthData?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const totalExpenses =
    recurringExpenses.reduce((s, e) => s + e.amount, 0) +
    (monthData?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  return { totalIncome, totalExpenses, net: totalIncome - totalExpenses };
}
