import type { MonthData } from '../types';
import { CATEGORIES } from '../config/categories';

/**
 * Compute budget suggestions for each category based on average spending
 * over the last `lookbackMonths` months before `currentMonthIndex`,
 * adding a `bufferPct`% buffer and rounding to nearest `roundTo` shekels.
 */
export function computeBudgetSuggestions(
  months: Record<number, MonthData>,
  currentMonthIndex: number,
  lookbackMonths = 3,
  bufferPct = 10,
  roundTo = 50
): Record<string, number> {
  const suggestions: Record<string, number> = {};

  CATEGORIES.filter((c) => c.id !== 'other').forEach((cat) => {
    const totals: number[] = [];

    for (let i = 1; i <= lookbackMonths; i++) {
      const mi = ((currentMonthIndex - i) + 12) % 12;
      const monthData = months[mi];
      if (!monthData?.expenses) continue;

      const total = monthData.expenses
        .filter((e) => e.categoryId === cat.id && !e.isPending && !e.isRecurring)
        .reduce((s, e) => s + e.amount, 0);

      if (total > 0) totals.push(total);
    }

    if (totals.length > 0) {
      const avg = totals.reduce((s, v) => s + v, 0) / totals.length;
      const withBuffer = avg * (1 + bufferPct / 100);
      suggestions[cat.id] = Math.ceil(withBuffer / roundTo) * roundTo;
    }
  });

  return suggestions;
}
