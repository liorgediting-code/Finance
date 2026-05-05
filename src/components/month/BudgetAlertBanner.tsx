import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES } from '../../config/categories';
import { getCategoryTotal } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  monthIndex: number;
}

export default function BudgetAlertBanner({ monthIndex }: Props) {
  const { months, recurringExpenses } = useActiveBoardData();
  const monthData = months[monthIndex];
  const budget = monthData?.budget ?? {};
  // Include recurring expenses in the check so linked commitments (mortgage, debts, etc.) trigger alerts
  const expenses = [...recurringExpenses, ...(monthData?.expenses ?? [])];

  const overBudget = CATEGORIES.filter((cat) => {
    const b = budget[cat.id] ?? 0;
    if (b === 0) return false;
    return getCategoryTotal(expenses, cat.id) > b;
  }).map((cat) => {
    const b = budget[cat.id] ?? 0;
    const actual = getCategoryTotal(expenses, cat.id);
    return { name: cat.nameHe, over: actual - b };
  });

  const nearBudget = CATEGORIES.filter((cat) => {
    const b = budget[cat.id] ?? 0;
    if (b === 0) return false;
    const actual = getCategoryTotal(expenses, cat.id);
    const pct = actual / b;
    return pct >= 0.85 && pct < 1;
  }).map((cat) => {
    const b = budget[cat.id] ?? 0;
    const actual = getCategoryTotal(expenses, cat.id);
    return { name: cat.nameHe, remaining: b - actual };
  });

  if (overBudget.length === 0 && nearBudget.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {overBudget.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">🚨</span>
            <div>
              <p className="text-sm font-semibold text-red-700 mb-1">
                חריגה מתקציב ב-{overBudget.length} קטגוריות
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {overBudget.map((c) => (
                  <span key={c.name} className="text-xs text-red-600">
                    {c.name}: <span className="font-semibold">+{formatCurrency(c.over)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {nearBudget.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-1">
                קרוב לגבול התקציב ב-{nearBudget.length} קטגוריות
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                {nearBudget.map((c) => (
                  <span key={c.name} className="text-xs text-amber-700">
                    {c.name}: נותר <span className="font-semibold">{formatCurrency(c.remaining)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
