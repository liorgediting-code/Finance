import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from './useFinanceStore';
import type { MonthData, IncomeEntry, ExpenseEntry } from '../types';

interface ActiveBoardData {
  months: Record<number, MonthData>;
  recurringIncomes: IncomeEntry[];
  recurringExpenses: ExpenseEntry[];
}

export function useActiveBoardData(): ActiveBoardData {
  return useFinanceStore(useShallow((s) => {
    if (s.activeBoardId === 'personal' || s.activeBoardId === 'overall') {
      return {
        months: s.months,
        recurringIncomes: s.recurringIncomes,
        recurringExpenses: s.recurringExpenses,
      };
    }
    const board = s.extraBoards.find((b) => b.id === s.activeBoardId);
    return {
      months: board?.months ?? {},
      recurringIncomes: board?.recurringIncomes ?? [],
      recurringExpenses: board?.recurringExpenses ?? [],
    };
  }));
}
