import { ExpenseEntry } from '../types';

export function sumAmounts(entries: { amount: number }[]): number {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

export function calcRemaining(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses;
}

export function calcSavingsPercent(savings: number, income: number): number {
  if (income === 0) return 0;
  return (savings / income) * 100;
}

export function calcBudgetDiff(budget: number, actual: number): number {
  return budget - actual;
}

export function getCategoryTotal(expenses: ExpenseEntry[], categoryId: string): number {
  return expenses
    .filter((expense) => expense.categoryId === categoryId)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

export function isEntryFuture(entry: { isFuture?: boolean; date: string }): boolean {
  return !!entry.isFuture && entry.date > new Date().toISOString().split('T')[0];
}
