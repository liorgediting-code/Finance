import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';
import { CATEGORIES } from '../../config/categories';
import { formatCurrency } from '../../utils/formatters';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'danger';
  emoji: string;
  title: string;
  detail: string;
}

const BG: Record<Insight['type'], string> = {
  success: 'bg-[#EEF7EE] border-[#B8D8B8]',
  warning: 'bg-[#FFF8E6] border-[#F0D090]',
  info: 'bg-[#EEF3FA] border-[#B8CCE0]',
  danger: 'bg-[#FEF2F2] border-[#F5C0C0]',
};

const TEXT: Record<Insight['type'], string> = {
  success: 'text-[#3A7A3A]',
  warning: 'text-[#8A6A10]',
  info: 'text-[#3A5A8A]',
  danger: 'text-[#9A3A3A]',
};

export default function SmartInsightsPanel() {
  const { months, recurringIncomes, recurringExpenses } = useActiveBoardData();
  const { savingsFunds, debts, mortgages, settings } = useFinanceStore(
    useShallow((s) => ({
      savingsFunds: s.savingsFunds,
      debts: s.debts,
      mortgages: s.mortgages,
      settings: s.settings,
    }))
  );

  if ((settings.hiddenDashboardSections ?? []).includes('smart-insights')) return null;

  const currentMonth = new Date().getMonth();
  const md = months[currentMonth];
  const insights: Insight[] = [];

  const allMonthlyIncome =
    recurringIncomes.reduce((s, e) => s + e.amount, 0) +
    (md?.income ?? []).reduce((s, e) => s + e.amount, 0);
  const allMonthlyExpenses =
    recurringExpenses.reduce((s, e) => s + e.amount, 0) +
    (md?.expenses ?? []).reduce((s, e) => s + e.amount, 0);
  const net = allMonthlyIncome - allMonthlyExpenses;
  const savingsRate = allMonthlyIncome > 0 ? Math.round((net / allMonthlyIncome) * 100) : 0;

  // 1. Deficit alert
  if (allMonthlyIncome > 0 && net < 0) {
    insights.push({
      id: 'deficit',
      type: 'danger',
      emoji: '🔴',
      title: `גרעון חודשי: ${formatCurrency(Math.abs(net))}`,
      detail: 'ההוצאות עולות על ההכנסות החודש — כדאי לבדוק אילו הוצאות ניתן לצמצם',
    });
  }

  // 2. Budget overspend (find worst category)
  if (md && Object.keys(md.budget).length > 0) {
    const overBudget = CATEGORIES.map((cat) => {
      const budget = md.budget[cat.id] ?? 0;
      if (budget === 0) return null;
      const spent = [...(md.expenses ?? []), ...recurringExpenses]
        .filter((e) => e.categoryId === cat.id)
        .reduce((s, e) => s + e.amount, 0);
      const over = spent - budget;
      return over > 0 ? { cat, over, spent, budget } : null;
    }).filter(Boolean) as { cat: (typeof CATEGORIES)[number]; over: number; spent: number; budget: number }[];

    if (overBudget.length > 0) {
      overBudget.sort((a, b) => b.over - a.over);
      const worst = overBudget[0];
      insights.push({
        id: 'over-budget',
        type: 'warning',
        emoji: '⚠️',
        title: `חריגה מתקציב ב-${overBudget.length} קטגוריות`,
        detail: `${worst.cat.nameHe}: ${formatCurrency(worst.over)} מעל התקציב (${formatCurrency(worst.spent)} מתוך ${formatCurrency(worst.budget)})`,
      });
    }
  }

  // 3. Savings rate feedback
  if (allMonthlyIncome > 0 && net >= 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'savings-great',
        type: 'success',
        emoji: '🎉',
        title: `שיעור חיסכון מעולה: ${savingsRate}%`,
        detail: 'אתה חוסך מעל 20% מההכנסה — כל הכבוד!',
      });
    } else if (savingsRate < 10 && savingsRate >= 0) {
      insights.push({
        id: 'savings-low',
        type: 'warning',
        emoji: '💡',
        title: `שיעור חיסכון נמוך: ${savingsRate}%`,
        detail: 'מומלץ לשאוף לחיסכון של לפחות 10–20% מההכנסה החודשית',
      });
    }
  }

  // 4. Subscription cost check
  const subscriptionTotal = [
    ...recurringExpenses,
    ...(md?.expenses ?? []),
  ]
    .filter((e) => e.categoryId === 'subscriptions')
    .reduce((s, e) => s + e.amount, 0);
  if (subscriptionTotal > 300) {
    insights.push({
      id: 'subscriptions',
      type: 'info',
      emoji: '📱',
      title: `עלות מנויים: ${formatCurrency(subscriptionTotal)} / חודש`,
      detail: 'בדוק אם יש מנויים שלא בשימוש שאפשר לבטל',
    });
  }

  // 5. Debt ratio warning
  const debtPayments = recurringExpenses
    .filter((e) => e.linkedSourceType === 'debt' || e.linkedSourceType === 'mortgage-track')
    .reduce((s, e) => s + e.amount, 0);
  if (allMonthlyIncome > 0 && debtPayments > 0) {
    const debtRatio = Math.round((debtPayments / allMonthlyIncome) * 100);
    if (debtRatio > 35) {
      insights.push({
        id: 'debt-ratio',
        type: 'warning',
        emoji: '📊',
        title: `יחס חוב-הכנסה: ${debtRatio}%`,
        detail: 'תשלומי חוב גבוהים ביחס להכנסה — שקול תכנון מיחזור חוב',
      });
    }
  }

  // 6. Savings fund near goal
  const nearGoals = savingsFunds.filter(
    (f) => f.targetAmount > 0 && f.savedAmount / f.targetAmount >= 0.9 && f.savedAmount < f.targetAmount
  );
  if (nearGoals.length > 0) {
    const g = nearGoals[0];
    const pct = Math.round((g.savedAmount / g.targetAmount) * 100);
    insights.push({
      id: 'near-goal',
      type: 'success',
      emoji: '🎯',
      title: `${g.name}: ${pct}% מהיעד`,
      detail: `נותרו עוד ${formatCurrency(g.targetAmount - g.savedAmount)} להשלמת היעד!`,
    });
  }

  // 7. All debts paid off
  const totalDebt = debts.reduce((s, d) => s + d.balance, 0);
  const totalMortgage = mortgages.flatMap((m) => m.tracks).reduce((s, t) => s + t.balance, 0);
  if (debts.length > 0 && totalDebt === 0) {
    insights.push({
      id: 'debt-free',
      type: 'success',
      emoji: '🏆',
      title: 'כל החובות שולמו!',
      detail: 'השגת חופש מחוב — הישג מדהים!',
    });
  }

  // 8. Mortgage-only mode (no other debt)
  if (totalMortgage > 0 && totalDebt === 0 && debts.length === 0) {
    const monthsLeft = Math.min(
      ...mortgages.flatMap((m) => m.tracks).map((t) => t.remainingMonths)
    );
    if (monthsLeft > 0 && monthsLeft <= 36) {
      insights.push({
        id: 'mortgage-near',
        type: 'info',
        emoji: '🏠',
        title: `${monthsLeft} חודשים לסיום המשכנתה`,
        detail: 'אתה קרוב לסיום המשכנתה — סוף הדרך נראה באופק!',
      });
    }
  }

  const displayed = insights.slice(0, 4);

  if (displayed.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
        <span className="text-xl">✨</span>
        <div>
          <p className="text-sm font-semibold text-[#1E1E2E]">הכל נראה תקין!</p>
          <p className="text-xs text-[#9090A8]">הוסף נתונים כדי לקבל תובנות מותאמות אישית</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">✨</span>
        <span className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider">תובנות חכמות</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {displayed.map((insight) => (
          <div
            key={insight.id}
            className={`flex gap-2.5 p-3 rounded-xl border ${BG[insight.type]}`}
          >
            <span className="text-base leading-none mt-0.5 flex-shrink-0">{insight.emoji}</span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold leading-snug ${TEXT[insight.type]}`}>{insight.title}</p>
              <p className="text-[11px] text-[#6B6B8A] mt-0.5 leading-snug">{insight.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
