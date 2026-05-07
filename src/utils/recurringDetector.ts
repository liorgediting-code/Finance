import type { ExpenseEntry, MonthData } from '../types';

export interface RecurringSuggestion {
  categoryId: string;
  subcategoryId: string;
  description: string;
  averageAmount: number;
  monthsFound: number[];
  sample: ExpenseEntry;
}

/**
 * Scans months and finds non-recurring expenses that appear in 3+ consecutive
 * months with the same category and similar description/amount, suggesting
 * they should be marked as recurring.
 */
export function detectRecurringSuggestions(
  months: Record<number, MonthData>,
  recurringExpenses: ExpenseEntry[]
): RecurringSuggestion[] {
  const recurringDescs = new Set(
    recurringExpenses.map((e) => `${e.categoryId}:${normaliseDesc(e.description)}`)
  );

  // Group non-recurring expenses by (categoryId + normalisedDescription)
  const groups: Map<string, { expense: ExpenseEntry; monthIndex: number }[]> = new Map();

  for (const [rawIdx, md] of Object.entries(months)) {
    const monthIndex = Number(rawIdx);
    for (const expense of md.expenses) {
      if (expense.isRecurring || expense.linkedSourceId) continue;
      const desc = normaliseDesc(expense.description);
      const key = `${expense.categoryId}:${desc}`;
      if (recurringDescs.has(key)) continue;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ expense, monthIndex });
    }
  }

  const suggestions: RecurringSuggestion[] = [];

  for (const [, entries] of groups) {
    if (entries.length < 3) continue;

    const monthIndices = [...new Set(entries.map((e) => e.monthIndex))].sort((a, b) => a - b);
    if (monthIndices.length < 3) continue;

    // Check amounts are similar (within 30% of the average)
    const amounts = entries.map((e) => e.expense.amount);
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const allSimilar = amounts.every((a) => Math.abs(a - avg) / avg < 0.3);
    if (!allSimilar) continue;

    const sample = entries[entries.length - 1].expense;
    suggestions.push({
      categoryId: sample.categoryId,
      subcategoryId: sample.subcategoryId,
      description: sample.description,
      averageAmount: Math.round(avg),
      monthsFound: monthIndices,
      sample,
    });
  }

  return suggestions.slice(0, 5); // Show at most 5 suggestions
}

function normaliseDesc(desc: string): string {
  return desc.trim().toLowerCase().replace(/\s+/g, ' ');
}
