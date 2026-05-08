import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES } from '../../config/categories';

const BENCHMARKS: Record<string, number> = {
  home: 28, food: 17, transport: 12, children: 9, health: 5,
  personal: 4, entertainment: 7, subscriptions: 2, shopping: 6,
  education: 3, pets: 1, financial: 8, savings: 10,
  investments: 5, holidays: 4, other: 2,
};

export default function OverviewBenchmarksCard() {
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();

  const catTotals: Record<string, number> = {};
  let annualIncome = 0;
  for (let mi = 0; mi < 12; mi++) {
    const md = months[mi];
    const expenses = [...recurringExpenses, ...(md?.expenses ?? [])];
    const incomes = [...recurringIncomes, ...(md?.income ?? [])];
    expenses.forEach((e) => {
      if (!e.isPending) catTotals[e.categoryId] = (catTotals[e.categoryId] ?? 0) + e.amount;
    });
    incomes.forEach((i) => { annualIncome += i.amount; });
  }

  const totalExpenses = Object.values(catTotals).reduce((s, v) => s + v, 0);
  const base = annualIncome > 0 ? annualIncome : totalExpenses || 1;

  const overCount = CATEGORIES.filter((cat) => {
    const userPct = Math.round(((catTotals[cat.id] ?? 0) / base) * 100);
    const benchPct = BENCHMARKS[cat.id] ?? 0;
    return userPct - benchPct > 3;
  }).length;

  const underCount = CATEGORIES.filter((cat) => {
    const userPct = Math.round(((catTotals[cat.id] ?? 0) / base) * 100);
    const benchPct = BENCHMARKS[cat.id] ?? 0;
    return benchPct - userPct > 3 && userPct > 0;
  }).length;

  const hasData = totalExpenses > 0;

  return (
    <NavLink
      to="/spending-benchmarks"
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">📊 ממוצע ישראלי</span>
        <span className="text-xs text-[#9090A8] hover:text-[#5B52A0] transition-colors">← פרטים</span>
      </div>

      {!hasData ? (
        <p className="text-xs text-[#9090A8]">הוסף נתונים לקבלת השוואה</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {overCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blush-dark flex-shrink-0" />
              <span className="text-xs text-[#4A4A60]">{overCount} קטגוריות מעל ממוצע ישראלי</span>
            </div>
          )}
          {underCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sage-dark flex-shrink-0" />
              <span className="text-xs text-[#4A4A60]">{underCount} קטגוריות חסכוניות מהממוצע</span>
            </div>
          )}
          {overCount === 0 && underCount === 0 && (
            <p className="text-xs text-sage-dark font-medium">✅ הוצאות קרובות לממוצע הישראלי</p>
          )}
          <p className="text-[10px] text-[#9090A8] mt-0.5">לחץ לפירוט מלא →</p>
        </div>
      )}
    </NavLink>
  );
}
