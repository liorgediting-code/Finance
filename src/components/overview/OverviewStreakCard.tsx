import { NavLink } from 'react-router-dom';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { useFinanceStore } from '../../store/useFinanceStore';
import { HEBREW_MONTHS } from '../../config/months';
import { computeMonthTotals } from '../../utils/monthlyTotals';

function computeStreaks(
  months: ReturnType<typeof useActiveBoardData>['months'],
  recurringIncomes: ReturnType<typeof useActiveBoardData>['recurringIncomes'],
  recurringExpenses: ReturnType<typeof useActiveBoardData>['recurringExpenses'],
  upToMonth: number,
) {
  // A "green month" = income >= expenses (both > 0)
  let best = 0;
  let temp = 0;
  for (let mi = 0; mi <= upToMonth; mi++) {
    const { totalIncome, totalExpenses } = computeMonthTotals(months[mi], recurringIncomes, recurringExpenses);
    if (totalIncome > 0 && totalIncome >= totalExpenses) {
      temp++;
      if (temp > best) best = temp;
    } else {
      temp = 0;
    }
  }
  return { current: temp, best };
}

const STREAK_EMOJI: Record<number, string> = {
  0: '😐', 1: '🙂', 2: '😊', 3: '😄', 4: '🔥',
  5: '🔥', 6: '🔥🔥', 7: '🔥🔥', 8: '🔥🔥🔥',
};

function getStreakEmoji(n: number): string {
  if (n >= 8) return '🏆';
  return STREAK_EMOJI[n] ?? '🔥';
}

export default function OverviewStreakCard() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const year = useFinanceStore((s) => s.settings.year);
  const today = new Date();
  const currentMonth = today.getFullYear() === year ? today.getMonth() : 11;

  const { current, best } = computeStreaks(months, recurringIncomes, recurringExpenses, currentMonth);

  const lastGreenMonth = (() => {
    for (let mi = currentMonth; mi >= 0; mi--) {
      const { totalIncome, totalExpenses } = computeMonthTotals(months[mi], recurringIncomes, recurringExpenses);
      if (totalIncome > 0 && totalIncome >= totalExpenses) return mi;
    }
    return null;
  })();

  const hasAnyData = Object.values(months).some((m) => (m?.income?.length ?? 0) > 0 || (m?.expenses?.length ?? 0) > 0);

  return (
    <NavLink
      to="/month"
      className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#1E1E2E]">🔥 סטריק חסכוני</span>
        <span className="text-xs text-[#9090A8]">← לוח חודשי</span>
      </div>

      {!hasAnyData ? (
        <p className="text-xs text-[#9090A8]">הוסף הכנסות והוצאות כדי לעקוב</p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-3">
            <span className="text-4xl leading-none">{getStreakEmoji(current)}</span>
            <div>
              <p className="text-2xl font-black text-[#1E1E2E] leading-none">{current}</p>
              <p className="text-xs text-[#6B6B8A] mt-0.5">
                {current === 1 ? 'חודש ירוק רצוף' : 'חודשים ירוקים רצופים'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            <span className="text-xs text-[#9090A8]">שיא אישי: <span className="font-bold text-lavender-dark">{best}</span></span>
            {lastGreenMonth !== null && (
              <span className="text-[10px] text-sage-dark font-medium bg-sage-light px-2 py-0.5 rounded-full">
                ✅ {HEBREW_MONTHS[lastGreenMonth]} ירוק
              </span>
            )}
          </div>

          {current === 0 && (
            <p className="text-[10px] text-[#9090A8]">חודש ירוק = הכנסות ≥ הוצאות</p>
          )}
        </div>
      )}
    </NavLink>
  );
}
