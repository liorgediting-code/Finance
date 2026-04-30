import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { computeAchievements } from '../../utils/achievements';

export default function AchievementsPage() {
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
  const locked = achievements.filter((a) => !a.unlocked);
  const pct = achievements.length > 0 ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E1E2E] tracking-tight">הישגים</h1>
        <p className="text-sm text-[#9090A8] mt-1">מעקב אחר אבני הדרך הפיננסיים שלך</p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1E1E2E]">
            {unlocked.length} / {achievements.length} הישגים
          </span>
          <span className="text-sm font-bold text-lavender-dark">{pct}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #B0A8C8, #7B6DC8)',
            }}
          />
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
            הושגו ({unlocked.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {unlocked.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 border border-lavender"
              >
                <span className="text-2xl flex-shrink-0">{a.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#1E1E2E]">{a.title}</p>
                  <p className="text-xs text-[#9090A8] mt-0.5 leading-snug">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-[#9090A8] uppercase tracking-wider mb-3">
            עדיין לא הושגו ({locked.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locked.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 border border-gray-100 opacity-60"
              >
                <span className="text-2xl flex-shrink-0 grayscale">{a.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#9090A8]">{a.title}</p>
                  <p className="text-xs text-[#9090A8] mt-0.5 leading-snug">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
