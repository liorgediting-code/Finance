import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { NavLink } from 'react-router-dom';
import { useFinanceStore } from '../../store/useFinanceStore';
import { computeAchievements } from '../../utils/achievements';

export default function OverviewAchievementsCard() {
  const settings = useFinanceStore(useShallow((s) => s.settings));
  const months = useFinanceStore(useShallow((s) => s.months));
  const debts = useFinanceStore(useShallow((s) => s.debts));
  const lifeGoals = useFinanceStore(useShallow((s) => s.lifeGoals));
  const savingsChallenges = useFinanceStore(useShallow((s) => s.savingsChallenges));
  const recurringExpenses = useFinanceStore(useShallow((s) => s.recurringExpenses));
  const recurringIncomes = useFinanceStore(useShallow((s) => s.recurringIncomes));
  const savingsFunds = useFinanceStore(useShallow((s) => s.savingsFunds));
  const mortgages = useFinanceStore(useShallow((s) => s.mortgages));
  const savingsVehicles = useFinanceStore(useShallow((s) => s.savingsVehicles));
  const installments = useFinanceStore(useShallow((s) => s.installments));
  const familyMembers = useFinanceStore(useShallow((s) => s.familyMembers));

  const achievements = useMemo(
    () =>
      computeAchievements({
        settings,
        months,
        debts,
        lifeGoals,
        savingsChallenges,
        recurringExpenses,
        recurringIncomes,
        savingsFunds,
        mortgages,
        savingsVehicles,
        installments,
        familyMembers,
      }),
    [settings, months, debts, lifeGoals, savingsChallenges, recurringExpenses, recurringIncomes, savingsFunds, mortgages, savingsVehicles, installments, familyMembers]
  );

  const unlocked = achievements.filter((a) => a.unlocked);
  const pct = achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0;
  const recent = unlocked.slice(-3).reverse();

  return (
    <NavLink
      to="/achievements"
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="h-1 w-full bg-lavender-dark" />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">הישגים</h3>
          <span className="text-xs text-lavender-dark font-semibold">{unlocked.length}/{achievements.length}</span>
        </div>

        {/* Progress */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #B0A8C8, #7B6DC8)',
            }}
          />
        </div>

        {/* Recent unlocked */}
        {recent.length > 0 ? (
          <div className="flex items-center gap-2">
            {recent.map((a) => (
              <span key={a.id} className="text-xl" title={a.title}>{a.emoji}</span>
            ))}
            <span className="text-xs text-[#9090A8] mr-1">הושגו לאחרונה</span>
          </div>
        ) : (
          <p className="text-xs text-[#9090A8]">התחל לנהל את הפיננסים שלך כדי לפתוח הישגים</p>
        )}
      </div>
    </NavLink>
  );
}
