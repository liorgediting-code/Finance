import { useShallow } from 'zustand/react/shallow';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useActiveBoardData } from '../../store/useActiveBoardData';

interface Tip {
  emoji: string;
  text: string;
  severity: 'info' | 'warning' | 'success';
}

function buildTips(
  savingsRate: number,
  subscriptionCost: number,
  totalIncome: number,
  totalExpenses: number,
  hasBudget: boolean,
  foodPct: number,
  transportPct: number,
  debtsCount: number,
  goalsCount: number
): Tip[] {
  const tips: Tip[] = [];

  if (savingsRate < 0) {
    tips.push({ emoji: '🚨', text: 'הוצאות עולות על ההכנסות — בדוק אילו קטגוריות ניתן לצמצם', severity: 'warning' });
  } else if (savingsRate < 10) {
    tips.push({ emoji: '⚠️', text: 'שיעור החיסכון שלך נמוך מ-10%. נסה להפריש לפחות ₪200 יותר בחודש', severity: 'warning' });
  } else if (savingsRate >= 20) {
    tips.push({ emoji: '🌟', text: `שיעור חיסכון של ${Math.round(savingsRate)}% — עבודה מצוינת! שקול להגדיל השקעות`, severity: 'success' });
  }

  if (subscriptionCost > totalIncome * 0.05 && totalIncome > 0) {
    tips.push({ emoji: '📺', text: `מנויים עולים ${Math.round((subscriptionCost / totalIncome) * 100)}% מהכנסתך. בדוק מה ניתן לבטל`, severity: 'warning' });
  }

  if (!hasBudget) {
    tips.push({ emoji: '📊', text: 'הגדר תקציב קטגוריות כדי לקבל שליטה טובה יותר על ההוצאות', severity: 'info' });
  }

  if (foodPct > 30) {
    tips.push({ emoji: '🛒', text: 'הוצאות אוכל הן מעל 30% מהתקציב — תכנן ארוחות שבועיות לחיסכון', severity: 'info' });
  }

  if (transportPct > 20) {
    tips.push({ emoji: '🚗', text: 'תחבורה מהווה נתח גדול מההוצאות — שקול תחבורה ציבורית או carpooling', severity: 'info' });
  }

  if (debtsCount > 0 && savingsRate > 15) {
    tips.push({ emoji: '💳', text: 'יש לך חובות פעילים — שקול להפנות חלק מהחיסכון לסילוק מוקדם', severity: 'info' });
  }

  if (goalsCount === 0 && savingsRate > 5) {
    tips.push({ emoji: '🎯', text: 'הגדר מטרות חיים כדי לתת מטרה לחיסכון שלך', severity: 'info' });
  }

  if (totalIncome > 0 && totalExpenses === 0) {
    tips.push({ emoji: '📝', text: 'לא נמצאו הוצאות החודש — הוסף הוצאות כדי לעקוב אחר ההתנהגות הפיננסית', severity: 'info' });
  }

  if (tips.length === 0) {
    tips.push({ emoji: '✅', text: 'הפרופיל הפיננסי שלך נראה מאוזן — המשך כך!', severity: 'success' });
  }

  return tips.slice(0, 4);
}

const severityStyle: Record<string, string> = {
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function OverviewSpendingTipsCard() {
  const debts = useFinanceStore(useShallow((s) => s.debts));
  const lifeGoals = useFinanceStore(useShallow((s) => s.lifeGoals));
  const { months, recurringExpenses, recurringIncomes } = useActiveBoardData();

  const monthIndex = new Date().getMonth();
  const md = months[monthIndex];

  const income = [...(md?.income ?? []), ...recurringIncomes];
  const expenses = [...(md?.expenses ?? []), ...recurringExpenses];
  const budget = md?.budget ?? {};

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const subscriptionCost = expenses
    .filter((e) => e.categoryId === 'subscriptions')
    .reduce((s, e) => s + e.amount, 0);

  const foodCost = expenses.filter((e) => e.categoryId === 'food').reduce((s, e) => s + e.amount, 0);
  const transportCost = expenses.filter((e) => e.categoryId === 'transport').reduce((s, e) => s + e.amount, 0);

  const foodPct = totalExpenses > 0 ? (foodCost / totalExpenses) * 100 : 0;
  const transportPct = totalExpenses > 0 ? (transportCost / totalExpenses) * 100 : 0;

  const hasBudget = Object.values(budget).some((b) => b > 0);

  const tips = buildTips(
    savingsRate,
    subscriptionCost,
    totalIncome,
    totalExpenses,
    hasBudget,
    foodPct,
    transportPct,
    debts.length,
    lifeGoals.length
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" dir="rtl">
      <div className="h-1 w-full" style={{ backgroundColor: '#B0A8C8' }} />
      <div className="p-4">
        <p className="text-xs font-semibold text-[#6B6B8A] uppercase tracking-wider mb-3">
          💡 טיפים פיננסיים מותאמים אישית
        </p>

        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className={`flex gap-2.5 items-start rounded-lg border p-2.5 ${severityStyle[tip.severity]}`}
            >
              <span className="text-base flex-shrink-0">{tip.emoji}</span>
              <p className="text-xs leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
