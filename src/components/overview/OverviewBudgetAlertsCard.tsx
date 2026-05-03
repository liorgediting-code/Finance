import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES } from '../../config/categories';

function getCatName(catId: string): string {
  return CATEGORIES.find((c) => c.id === catId)?.nameHe ?? catId;
}

export default function OverviewBudgetAlertsCard() {
  const { months } = useActiveBoardData();

  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const monthData = months[currentMonthIdx];
  const budget = monthData?.budget ?? {};
  const expenses = monthData?.expenses ?? [];

  const spentByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    spentByCategory[exp.categoryId] = (spentByCategory[exp.categoryId] ?? 0) + exp.amount;
  }

  const alerts = Object.entries(budget)
    .filter(([, budgeted]) => budgeted > 0)
    .map(([catId, budgeted]) => {
      const spent = spentByCategory[catId] ?? 0;
      const pct = (spent / budgeted) * 100;
      return { catId, pct };
    })
    .filter(({ pct }) => pct >= 75)
    .sort((a, b) => b.pct - a.pct);

  const overCount = alerts.filter((a) => a.pct >= 100).length;
  const nearCount = alerts.filter((a) => a.pct >= 75 && a.pct < 100).length;

  if (alerts.length === 0) {
    return (
      <NavLink to="/month" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
        <div className="h-1 w-full bg-sage-dark" />
        <div className="p-4">
          <div className="text-2xl mb-2">✅</div>
          <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">התראות תקציב</p>
          <p className="text-sm text-[#1E1E2E] font-medium mt-1">הכל בסדר</p>
          <p className="text-xs text-[#9090A8] mt-0.5">לא חרגת מהתקציב →</p>
        </div>
      </NavLink>
    );
  }

  return (
    <NavLink to="/month" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full" style={{ backgroundColor: overCount > 0 ? '#F2C4C4' : '#E8D060' }} />
      <div className="p-4">
        <div className="text-2xl mb-2">{overCount > 0 ? '🚨' : '⚠️'}</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">התראות תקציב</p>
        <div className="mt-1">
          {overCount > 0 && (
            <p className="text-sm font-bold text-red-600">{overCount} חרגו מהתקציב</p>
          )}
          {nearCount > 0 && (
            <p className="text-sm font-medium text-amber-600">{nearCount} קרובות למגבלה</p>
          )}
        </div>
        <div className="mt-2 space-y-1">
          {alerts.slice(0, 3).map(({ catId, pct }) => (
            <div key={catId} className="flex items-center justify-between">
              <span className="text-xs text-[#6B6B8A] truncate">{getCatName(catId)}</span>
              <span className={`text-xs font-semibold ${pct >= 100 ? 'text-red-600' : 'text-amber-600'}`}>
                {Math.round(pct)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </NavLink>
  );
}
