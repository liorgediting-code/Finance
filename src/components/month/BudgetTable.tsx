import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { getCategoryTotal, calcBudgetDiff } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

interface BudgetTableProps {
  monthIndex: number;
}

export default function BudgetTable({ monthIndex }: BudgetTableProps) {
  const { months } = useActiveBoardData();
  const monthData = months[monthIndex];
  const setBudget = useFinanceStore((s) => s.setBudget);
  const copyBudgetFromMonth = useFinanceStore((s) => s.copyBudgetFromMonth);
  const applySmartBudget = useFinanceStore((s) => s.applySmartBudget);
  const enabledModules = useFinanceStore((s) => s.settings.enabledModules ?? []);
  const showSmartBudget = enabledModules.includes('smart-budget');

  const budget = monthData?.budget ?? {};
  const expenses = monthData?.expenses ?? [];

  let totalBudget = 0;
  let totalActual = 0;

  const rows = CATEGORIES.map((cat) => {
    const budgetAmount = budget[cat.id] ?? 0;
    const actual = getCategoryTotal(expenses, cat.id);
    const diff = calcBudgetDiff(budgetAmount, actual);
    const pct = budgetAmount > 0 ? Math.min((actual / budgetAmount) * 100, 120) : 0;

    totalBudget += budgetAmount;
    totalActual += actual;

    return { cat, budgetAmount, actual, diff, pct };
  });

  const totalDiff = totalBudget - totalActual;

  function barColor(pct: number, budgetSet: boolean) {
    if (!budgetSet) return '#E5E7EB';
    if (pct >= 100) return '#EF4444';
    if (pct >= 75) return '#F59E0B';
    return '#22C55E';
  }

  const hasPrevMonth = monthIndex > 0 && Object.keys(months[monthIndex - 1]?.budget ?? {}).length > 0;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-700">תקציב מול ביצוע</h3>
        <div className="flex gap-2">
          {showSmartBudget && (
            <button
              onClick={() => applySmartBudget(monthIndex)}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors border border-purple-200"
              title="מחשב ממוצע הוצאות מ-3 חודשים אחרונים"
            >
              🧠 הצע תקציב חכם
            </button>
          )}
          {hasPrevMonth && (
            <button
              onClick={() => copyBudgetFromMonth(monthIndex - 1, monthIndex)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors border border-blue-200"
            >
              📋 העתק מחודש קודם
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-lavender text-gray-700">
              <th className="px-3 py-2 text-right">קטגוריה</th>
              <th className="px-3 py-2 text-right">תקציב חודשי</th>
              <th className="px-3 py-2 text-right">הוצאה בפועל</th>
              <th className="px-3 py-2 text-right w-36">ניצול</th>
              <th className="px-3 py-2 text-right">הפרש</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat, budgetAmount, actual, diff, pct }, idx) => (
              <tr
                key={cat.id}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-3 py-2 font-medium">{cat.nameHe}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={budgetAmount || ''}
                    onChange={(e) =>
                      setBudget(monthIndex, cat.id, Number(e.target.value))
                    }
                    className="border border-gray-300 rounded px-2 py-1 w-28 text-sm"
                    min={0}
                    placeholder="0"
                  />
                </td>
                <td className="px-3 py-2">{formatCurrency(actual)}</td>
                <td className="px-3 py-2">
                  {budgetAmount > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[56px]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: barColor(pct, true),
                          }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-semibold w-8 text-left shrink-0"
                        style={{ color: barColor(pct, true) }}
                      >
                        {Math.round(pct)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td
                  className={`px-3 py-2 font-semibold ${
                    diff >= 0 ? 'bg-sage-light text-green-800' : 'bg-blush-light text-red-800'
                  }`}
                >
                  {formatCurrency(diff)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-100">
              <td className="px-3 py-2">סה&quot;כ</td>
              <td className="px-3 py-2">{formatCurrency(totalBudget)}</td>
              <td className="px-3 py-2">{formatCurrency(totalActual)}</td>
              <td className="px-3 py-2">
                {totalBudget > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[56px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((totalActual / totalBudget) * 100, 100)}%`,
                          backgroundColor: barColor((totalActual / totalBudget) * 100, true),
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold w-8 text-left shrink-0 text-gray-600">
                      {Math.round((totalActual / totalBudget) * 100)}%
                    </span>
                  </div>
                )}
              </td>
              <td
                className={`px-3 py-2 ${
                  totalDiff >= 0 ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {formatCurrency(totalDiff)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
