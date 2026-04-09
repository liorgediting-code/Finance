import { useFinanceStore } from '../../store/useFinanceStore';
import { getCategoryTotal, calcBudgetDiff } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../config/categories';

interface BudgetTableProps {
  monthIndex: number;
}

export default function BudgetTable({ monthIndex }: BudgetTableProps) {
  const monthData = useFinanceStore((s) => s.months[monthIndex]);
  const setBudget = useFinanceStore((s) => s.setBudget);

  const budget = monthData?.budget ?? {};
  const expenses = monthData?.expenses ?? [];

  let totalBudget = 0;
  let totalActual = 0;

  const rows = CATEGORIES.map((cat) => {
    const budgetAmount = budget[cat.id] ?? 0;
    const actual = getCategoryTotal(expenses, cat.id);
    const diff = calcBudgetDiff(budgetAmount, actual);

    totalBudget += budgetAmount;
    totalActual += actual;

    return { cat, budgetAmount, actual, diff };
  });

  const totalDiff = totalBudget - totalActual;

  return (
    <section className="mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        תקציב מול ביצוע
      </h3>
      <div className="overflow-x-auto rounded-lg shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-lavender text-gray-700">
              <th className="px-3 py-2 text-right">קטגוריה</th>
              <th className="px-3 py-2 text-right">תקציב חודשי</th>
              <th className="px-3 py-2 text-right">הוצאה בפועל</th>
              <th className="px-3 py-2 text-right">הפרש</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ cat, budgetAmount, actual, diff }, idx) => (
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
