import { NavLink } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { formatCurrency } from '../../utils/formatters';

export default function OverviewGoalSimulatorCard() {
  const lifeGoals = useFinanceStore(useShallow((s) => s.lifeGoals));

  const nextGoal = lifeGoals
    .filter((g) => g.savedAmount < g.targetAmount && g.monthlyContribution > 0)
    .sort((a, b) => {
      const remA = a.targetAmount - a.savedAmount;
      const remB = b.targetAmount - b.savedAmount;
      const moA = a.monthlyContribution > 0 ? remA / a.monthlyContribution : Infinity;
      const moB = b.monthlyContribution > 0 ? remB / b.monthlyContribution : Infinity;
      return moA - moB;
    })[0];

  return (
    <NavLink to="/goal-simulator" className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block">
      <div className="h-1 w-full bg-[#5A9A42]" />
      <div className="p-4">
        <div className="text-2xl mb-2">🧮</div>
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">סימולטור יעדים</p>
        {nextGoal ? (
          <>
            <p className="text-sm font-bold text-[#1E1E2E] mt-1 truncate">{nextGoal.emoji} {nextGoal.name}</p>
            <p className="text-xs text-[#9090A8] mt-0.5">
              {formatCurrency(nextGoal.savedAmount)} / {formatCurrency(nextGoal.targetAmount)}
            </p>
          </>
        ) : (
          <p className="text-xs text-[#9090A8] mt-1">מתי תגיע ליעד? →</p>
        )}
      </div>
    </NavLink>
  );
}
